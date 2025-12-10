/**
 * Report Controller
 *
 * Handles all reporting and dashboard analytics API requests
 */

const { Op, fn, col, literal } = require("sequelize");
const {
  Project,
  Sprint,
  Task,
  User,
  ProjectMember,
  TimeLog,
  ActivityLog,
  sequelize,
} = require("../models");
const { formatResponse, getPagination } = require("../utils/helpers");

/**
 * Get Burndown Chart Data
 * GET /api/reports/projects/:projectId/burndown
 * GET /api/reports/sprints/:sprintId/burndown
 */
exports.getBurndownData = async (req, res, next) => {
  try {
    const { projectId, sprintId } = req.params;

    let sprint;
    if (sprintId) {
      sprint = await Sprint.findByPk(sprintId, {
        include: [{ model: Task, as: "tasks" }],
      });
    } else if (projectId) {
      // Get active sprint for project
      sprint = await Sprint.findOne({
        where: {
          project_id: projectId,
          status: "active",
        },
        include: [{ model: Task, as: "tasks" }],
      });
    }

    if (!sprint) {
      return res.status(404).json(
        formatResponse(false, "No active sprint found", {
          burndownData: [],
          idealBurndown: [],
        })
      );
    }

    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Calculate total story points at sprint start
    const totalPoints = sprint.tasks.reduce(
      (sum, task) => sum + (task.story_points || 0),
      0
    );

    // Get daily completion data
    const burndownData = [];
    const idealBurndown = [];

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Calculate ideal burndown (linear)
      const idealRemaining = totalPoints - (totalPoints / totalDays) * i;
      idealBurndown.push({
        date: currentDate.toISOString().split("T")[0],
        day: i,
        points: Math.max(0, Math.round(idealRemaining * 10) / 10),
      });

      // Calculate actual remaining points
      // Count completed tasks up to this date
      const completedPoints = sprint.tasks
        .filter((task) => {
          if (task.status !== "done") return false;
          const doneDate = new Date(task.updatedAt);
          return doneDate <= currentDate;
        })
        .reduce((sum, task) => sum + (task.story_points || 0), 0);

      const remainingPoints = totalPoints - completedPoints;

      // Only add actual data for past dates or today
      if (currentDate <= new Date()) {
        burndownData.push({
          date: currentDate.toISOString().split("T")[0],
          day: i,
          points: remainingPoints,
        });
      }
    }

    res.json(
      formatResponse(true, "Burndown data retrieved", {
        sprint: {
          id: sprint.id,
          name: sprint.name,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          status: sprint.status,
        },
        totalPoints,
        totalDays,
        burndownData,
        idealBurndown,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Velocity Chart Data
 * GET /api/reports/projects/:projectId/velocity
 */
exports.getVelocityData = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 10 } = req.query;

    // Get completed sprints
    const sprints = await Sprint.findAll({
      where: {
        project_id: projectId,
        status: "completed",
      },
      include: [
        {
          model: Task,
          as: "tasks",
          where: { status: "done" },
          required: false,
        },
      ],
      order: [["end_date", "DESC"]],
      limit: parseInt(limit),
    });

    // Calculate velocity per sprint
    const velocityData = sprints
      .map((sprint) => {
        const completedPoints = sprint.tasks.reduce(
          (sum, task) => sum + (task.story_points || 0),
          0
        );
        const plannedPoints = sprint.tasks.reduce(
          (sum, task) => sum + (task.story_points || 0),
          0
        );
        const completedTasks = sprint.tasks.length;

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          completedPoints,
          plannedPoints,
          completedTasks,
          velocity: completedPoints,
        };
      })
      .reverse(); // Chronological order

    // Calculate average velocity
    const totalVelocity = velocityData.reduce((sum, s) => sum + s.velocity, 0);
    const averageVelocity =
      velocityData.length > 0
        ? Math.round((totalVelocity / velocityData.length) * 10) / 10
        : 0;

    // Calculate trend (last 3 sprints vs previous 3)
    let trend = "stable";
    if (velocityData.length >= 6) {
      const recent =
        velocityData.slice(-3).reduce((s, v) => s + v.velocity, 0) / 3;
      const previous =
        velocityData.slice(-6, -3).reduce((s, v) => s + v.velocity, 0) / 3;
      if (recent > previous * 1.1) trend = "increasing";
      else if (recent < previous * 0.9) trend = "decreasing";
    }

    res.json(
      formatResponse(true, "Velocity data retrieved", {
        velocityData,
        averageVelocity,
        trend,
        totalSprints: velocityData.length,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Workload Distribution
 * GET /api/reports/projects/:projectId/workload
 */
exports.getWorkloadDistribution = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Get all project members
    const members = await ProjectMember.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name", "avatar"],
        },
      ],
    });

    // Get tasks with assignees
    const tasks = await Task.findAll({
      where: {
        project_id: projectId,
        status: { [Op.ne]: "done" },
      },
      attributes: ["id", "assigned_to", "story_points", "status", "priority"],
    });

    // Calculate workload per member
    const workloadData = members.map((member) => {
      const memberTasks = tasks.filter((t) => t.assigned_to === member.user.id);
      const totalPoints = memberTasks.reduce(
        (sum, t) => sum + (t.story_points || 0),
        0
      );
      const taskCount = memberTasks.length;

      // Group by status
      const byStatus = {
        todo: memberTasks.filter((t) => t.status === "todo").length,
        in_progress: memberTasks.filter((t) => t.status === "in_progress")
          .length,
        in_review: memberTasks.filter((t) => t.status === "in_review").length,
        backlog: memberTasks.filter((t) => t.status === "backlog").length,
      };

      // Group by priority
      const byPriority = {
        critical: memberTasks.filter((t) => t.priority === "critical").length,
        high: memberTasks.filter((t) => t.priority === "high").length,
        medium: memberTasks.filter((t) => t.priority === "medium").length,
        low: memberTasks.filter((t) => t.priority === "low").length,
      };

      return {
        userId: member.user.id,
        username: member.user.username,
        fullName: member.user.full_name,
        avatar: member.user.avatar,
        role: member.role,
        taskCount,
        totalPoints,
        byStatus,
        byPriority,
      };
    });

    // Add unassigned tasks
    const unassignedTasks = tasks.filter((t) => !t.assigned_to);
    const unassignedData = {
      userId: null,
      username: "unassigned",
      fullName: "Belum Ditugaskan",
      avatar: null,
      role: null,
      taskCount: unassignedTasks.length,
      totalPoints: unassignedTasks.reduce(
        (sum, t) => sum + (t.story_points || 0),
        0
      ),
      byStatus: {
        todo: unassignedTasks.filter((t) => t.status === "todo").length,
        in_progress: unassignedTasks.filter((t) => t.status === "in_progress")
          .length,
        in_review: unassignedTasks.filter((t) => t.status === "in_review")
          .length,
        backlog: unassignedTasks.filter((t) => t.status === "backlog").length,
      },
      byPriority: {
        critical: unassignedTasks.filter((t) => t.priority === "critical")
          .length,
        high: unassignedTasks.filter((t) => t.priority === "high").length,
        medium: unassignedTasks.filter((t) => t.priority === "medium").length,
        low: unassignedTasks.filter((t) => t.priority === "low").length,
      },
    };

    // Calculate totals
    const totals = {
      totalTasks: tasks.length,
      totalPoints: tasks.reduce((sum, t) => sum + (t.story_points || 0), 0),
      assignedTasks: tasks.filter((t) => t.assigned_to).length,
      unassignedTasks: unassignedTasks.length,
    };

    res.json(
      formatResponse(true, "Workload distribution retrieved", {
        workloadData: [...workloadData, unassignedData],
        totals,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Statistics Summary
 * GET /api/reports/projects/:projectId/summary
 */
exports.getProjectSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Get project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json(formatResponse(false, "Project not found"));
    }

    // Get all tasks
    const tasks = await Task.findAll({
      where: { project_id: projectId },
    });

    // Get sprints
    const sprints = await Sprint.findAll({
      where: { project_id: projectId },
    });

    // Calculate statistics
    const tasksByStatus = {
      backlog: tasks.filter((t) => t.status === "backlog").length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      in_review: tasks.filter((t) => t.status === "in_review").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    const tasksByPriority = {
      critical: tasks.filter((t) => t.priority === "critical").length,
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    };

    const sprintsByStatus = {
      planning: sprints.filter((s) => s.status === "planning").length,
      active: sprints.filter((s) => s.status === "active").length,
      completed: sprints.filter((s) => s.status === "completed").length,
    };

    const totalPoints = tasks.reduce(
      (sum, t) => sum + (t.story_points || 0),
      0
    );
    const completedPoints = tasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    // Get overdue tasks
    const today = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < today && t.status !== "done"
    ).length;

    // Calculate completion rate
    const completionRate =
      tasks.length > 0
        ? Math.round((tasksByStatus.done / tasks.length) * 100)
        : 0;

    res.json(
      formatResponse(true, "Project summary retrieved", {
        project: {
          id: project.id,
          name: project.name,
          key: project.key,
        },
        overview: {
          totalTasks: tasks.length,
          completedTasks: tasksByStatus.done,
          totalPoints,
          completedPoints,
          completionRate,
          overdueTasks,
          totalSprints: sprints.length,
          activeSprints: sprintsByStatus.active,
        },
        tasksByStatus,
        tasksByPriority,
        sprintsByStatus,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Sprint Report
 * GET /api/reports/sprints/:sprintId/report
 */
exports.getSprintReport = async (req, res, next) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findByPk(sprintId, {
      include: [
        {
          model: Task,
          as: "tasks",
          include: [
            {
              model: User,
              as: "assignee",
              attributes: ["id", "username", "full_name"],
            },
          ],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key"],
        },
      ],
    });

    if (!sprint) {
      return res.status(404).json(formatResponse(false, "Sprint not found"));
    }

    // Calculate sprint metrics
    const tasks = sprint.tasks;
    const plannedPoints = tasks.reduce(
      (sum, t) => sum + (t.story_points || 0),
      0
    );
    const completedPoints = tasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    const tasksByStatus = {
      backlog: tasks.filter((t) => t.status === "backlog").length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      in_review: tasks.filter((t) => t.status === "in_review").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    // Group tasks by assignee
    const tasksByAssignee = {};
    tasks.forEach((task) => {
      const key = task.assignee ? task.assignee.full_name : "Belum Ditugaskan";
      if (!tasksByAssignee[key]) {
        tasksByAssignee[key] = {
          total: 0,
          completed: 0,
          points: 0,
          completedPoints: 0,
        };
      }
      tasksByAssignee[key].total++;
      tasksByAssignee[key].points += task.story_points || 0;
      if (task.status === "done") {
        tasksByAssignee[key].completed++;
        tasksByAssignee[key].completedPoints += task.story_points || 0;
      }
    });

    const completionRate =
      tasks.length > 0
        ? Math.round((tasksByStatus.done / tasks.length) * 100)
        : 0;

    res.json(
      formatResponse(true, "Sprint report retrieved", {
        sprint: {
          id: sprint.id,
          name: sprint.name,
          goal: sprint.goal,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          status: sprint.status,
        },
        project: sprint.project,
        metrics: {
          totalTasks: tasks.length,
          completedTasks: tasksByStatus.done,
          plannedPoints,
          completedPoints,
          completionRate,
          pointsCompletionRate:
            plannedPoints > 0
              ? Math.round((completedPoints / plannedPoints) * 100)
              : 0,
        },
        tasksByStatus,
        tasksByAssignee,
        tasks: tasks.map((t) => ({
          id: t.id,
          taskKey: t.task_key,
          title: t.title,
          status: t.status,
          priority: t.priority,
          storyPoints: t.story_points,
          assignee: t.assignee
            ? {
                id: t.assignee.id,
                name: t.assignee.full_name,
              }
            : null,
        })),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Activity Timeline
 * GET /api/reports/projects/:projectId/activity
 */
exports.getActivityTimeline = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const whereClause = { project_id: projectId };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const activities = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name", "avatar"],
        },
        {
          model: Task,
          as: "task",
          attributes: ["id", "task_key", "title"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
    });

    // Group activities by date
    const groupedActivities = {};
    activities.forEach((activity) => {
      const date = activity.createdAt.toISOString().split("T")[0];
      if (!groupedActivities[date]) {
        groupedActivities[date] = [];
      }
      groupedActivities[date].push({
        id: activity.id,
        action: activity.action,
        entityType: activity.entity_type,
        entityId: activity.entity_id,
        details: activity.details,
        user: activity.user,
        task: activity.task,
        createdAt: activity.createdAt,
      });
    });

    res.json(
      formatResponse(true, "Activity timeline retrieved", {
        activities,
        groupedByDate: groupedActivities,
        total: activities.length,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Time Tracking Report
 * GET /api/reports/projects/:projectId/time-tracking
 */
exports.getTimeTrackingReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.log_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Get time logs for project tasks
    const timeLogs = await TimeLog.findAll({
      where: whereClause,
      include: [
        {
          model: Task,
          as: "task",
          where: { project_id: projectId },
          attributes: ["id", "task_key", "title"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name"],
        },
      ],
      order: [["log_date", "DESC"]],
    });

    // Aggregate by user
    const byUser = {};
    timeLogs.forEach((log) => {
      const userId = log.user.id;
      if (!byUser[userId]) {
        byUser[userId] = {
          user: log.user,
          totalHours: 0,
          logs: [],
        };
      }
      byUser[userId].totalHours += log.hours_spent || 0;
      byUser[userId].logs.push(log);
    });

    // Aggregate by task
    const byTask = {};
    timeLogs.forEach((log) => {
      const taskId = log.task.id;
      if (!byTask[taskId]) {
        byTask[taskId] = {
          task: log.task,
          totalHours: 0,
          contributors: new Set(),
        };
      }
      byTask[taskId].totalHours += log.hours_spent || 0;
      byTask[taskId].contributors.add(log.user.full_name);
    });

    // Convert contributors Set to Array
    Object.values(byTask).forEach((t) => {
      t.contributors = Array.from(t.contributors);
    });

    const totalHours = timeLogs.reduce(
      (sum, log) => sum + (log.hours_spent || 0),
      0
    );

    res.json(
      formatResponse(true, "Time tracking report retrieved", {
        totalHours,
        totalLogs: timeLogs.length,
        byUser: Object.values(byUser),
        byTask: Object.values(byTask),
        timeLogs,
      })
    );
  } catch (error) {
    next(error);
  }
};
