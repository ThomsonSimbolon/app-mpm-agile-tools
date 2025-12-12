/**
 * Gantt Controller
 * Handles Gantt chart data and task dependencies
 */

const {
  Task,
  TaskDependency,
  Project,
  Sprint,
  User,
  ProjectMilestone,
  ProjectMember,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

// Get Gantt chart data for a project
exports.getGanttData = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { sprint_id, include_milestones, include_sprints } = req.query;

    // Validate project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Build where clause for tasks
    const whereClause = { project_id };
    if (sprint_id) {
      whereClause.sprint_id = sprint_id;
    }

    // Get tasks with dependencies
    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Sprint,
          as: "sprint",
          attributes: ["id", "name", "start_date", "end_date"],
        },
        {
          model: TaskDependency,
          as: "predecessorDependencies",
          include: [
            {
              model: Task,
              as: "predecessor",
              attributes: ["id", "title", "task_key"],
            },
          ],
        },
        {
          model: TaskDependency,
          as: "successorDependencies",
          include: [
            {
              model: Task,
              as: "successor",
              attributes: ["id", "title", "task_key"],
            },
          ],
        },
      ],
      order: [
        ["start_date", "ASC"],
        ["due_date", "ASC"],
        ["id", "ASC"],
      ],
    });

    // Format tasks for Gantt chart (frappe-gantt format)
    const ganttTasks = tasks.map((task) => {
      // Calculate dates
      const startDate = task.start_date || task.created_at;
      const endDate =
        task.due_date ||
        new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

      // Get dependencies
      const dependencies = task.predecessorDependencies.map(
        (dep) => dep.predecessor.task_key
      );

      return {
        id: task.task_key,
        taskId: task.id,
        name: task.title,
        start: formatDate(startDate),
        end: formatDate(endDate),
        progress: task.progress_percentage || calculateProgress(task.status),
        dependencies: dependencies.join(", "),
        custom_class: getTaskClass(task.status, task.priority),
        // Additional data for tooltips/details
        meta: {
          status: task.status,
          priority: task.priority,
          assignee: task.assignee,
          sprint: task.sprint,
          estimatedHours: task.estimated_hours,
          storyPoints: task.story_points,
        },
      };
    });

    // Optionally include milestones
    let milestones = [];
    if (include_milestones === "true") {
      const projectMilestones = await ProjectMilestone.findAll({
        where: { project_id, status: { [Op.ne]: "cancelled" } },
        order: [["target_date", "ASC"]],
      });

      milestones = projectMilestones.map((m) => ({
        id: `milestone-${m.id}`,
        milestoneId: m.id,
        name: `🎯 ${m.name}`,
        start: formatDate(m.target_date),
        end: formatDate(m.target_date),
        progress: m.status === "completed" ? 100 : 0,
        custom_class: `milestone ${m.status}`,
        isMilestone: true,
        meta: {
          status: m.status,
          description: m.description,
          completedDate: m.completed_date,
        },
      }));
    }

    // Optionally include sprints as summary bars
    let sprints = [];
    if (include_sprints === "true") {
      const projectSprints = await Sprint.findAll({
        where: { project_id },
        order: [["start_date", "ASC"]],
      });

      sprints = projectSprints.map((s) => ({
        id: `sprint-${s.id}`,
        sprintId: s.id,
        name: `🏃 ${s.name}`,
        start: formatDate(s.start_date),
        end: formatDate(s.end_date),
        progress: 0,
        custom_class: `sprint ${s.status}`,
        isSprint: true,
        meta: {
          status: s.status,
          goal: s.goal,
        },
      }));
    }

    // Calculate project timeline
    const allItems = [...ganttTasks, ...milestones, ...sprints];
    const dates = allItems.map((item) => ({
      start: new Date(item.start),
      end: new Date(item.end),
    }));

    const projectStart =
      dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.start)))
        : new Date();
    const projectEnd =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.end)))
        : new Date();

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          key: project.key,
          start: formatDate(projectStart),
          end: formatDate(projectEnd),
        },
        tasks: ganttTasks,
        milestones,
        sprints,
        summary: {
          totalTasks: ganttTasks.length,
          completedTasks: ganttTasks.filter((t) => t.meta.status === "done")
            .length,
          milestonesCount: milestones.length,
          sprintsCount: sprints.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching Gantt data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Gantt data",
      error: error.message,
    });
  }
};

// Get task dependencies
exports.getDependencies = async (req, res) => {
  try {
    const { project_id } = req.params;

    // Get all tasks for project
    const tasks = await Task.findAll({
      where: { project_id },
      attributes: ["id", "task_key"],
    });

    const taskIds = tasks.map((t) => t.id);

    // Get all dependencies for these tasks
    const dependencies = await TaskDependency.findAll({
      where: {
        [Op.or]: [{ predecessor_id: taskIds }, { successor_id: taskIds }],
      },
      include: [
        {
          model: Task,
          as: "predecessor",
          attributes: ["id", "title", "task_key", "status"],
        },
        {
          model: Task,
          as: "successor",
          attributes: ["id", "title", "task_key", "status"],
        },
      ],
    });

    res.json({
      success: true,
      data: dependencies.map((dep) => ({
        id: dep.id,
        predecessor: dep.predecessor,
        successor: dep.successor,
        dependencyType: dep.dependency_type,
        lagDays: dep.lag_days,
      })),
    });
  } catch (error) {
    console.error("Error fetching dependencies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dependencies",
      error: error.message,
    });
  }
};

// Create task dependency
exports.createDependency = async (req, res) => {
  try {
    const { predecessor_id, successor_id, dependency_type, lag_days } =
      req.body;

    // Validate required fields
    if (!predecessor_id || !successor_id) {
      return res.status(400).json({
        success: false,
        message: "Predecessor and successor task IDs are required",
      });
    }

    // Validate tasks exist
    const predecessor = await Task.findByPk(predecessor_id);
    const successor = await Task.findByPk(successor_id);

    if (!predecessor) {
      return res.status(404).json({
        success: false,
        message: "Predecessor task not found",
      });
    }

    if (!successor) {
      return res.status(404).json({
        success: false,
        message: "Successor task not found",
      });
    }

    // Validate both tasks are from same project
    if (predecessor.project_id !== successor.project_id) {
      return res.status(400).json({
        success: false,
        message: "Both tasks must be from the same project",
      });
    }

    // Prevent self-dependency
    if (predecessor_id === successor_id) {
      return res.status(400).json({
        success: false,
        message: "Task cannot depend on itself",
      });
    }

    // Check for circular dependency
    const isCircular = await checkCircularDependency(
      successor_id,
      predecessor_id
    );
    if (isCircular) {
      return res.status(400).json({
        success: false,
        message: "This would create a circular dependency",
      });
    }

    // Check if dependency already exists
    const existing = await TaskDependency.findOne({
      where: { predecessor_id, successor_id },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This dependency already exists",
      });
    }

    const dependency = await TaskDependency.create({
      predecessor_id,
      successor_id,
      dependency_type: dependency_type || "FS",
      lag_days: lag_days || 0,
    });

    // Reload with associations
    const createdDependency = await TaskDependency.findByPk(dependency.id, {
      include: [
        {
          model: Task,
          as: "predecessor",
          attributes: ["id", "title", "task_key"],
        },
        {
          model: Task,
          as: "successor",
          attributes: ["id", "title", "task_key"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Task dependency created successfully",
      data: createdDependency,
    });
  } catch (error) {
    console.error("Error creating dependency:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create dependency",
      error: error.message,
    });
  }
};

// Update task dependency
exports.updateDependency = async (req, res) => {
  try {
    const { id } = req.params;
    const { dependency_type, lag_days } = req.body;

    const dependency = await TaskDependency.findByPk(id);

    if (!dependency) {
      return res.status(404).json({
        success: false,
        message: "Dependency not found",
      });
    }

    await dependency.update({
      dependency_type: dependency_type || dependency.dependency_type,
      lag_days: lag_days ?? dependency.lag_days,
    });

    // Reload with associations
    const updatedDependency = await TaskDependency.findByPk(id, {
      include: [
        {
          model: Task,
          as: "predecessor",
          attributes: ["id", "title", "task_key"],
        },
        {
          model: Task,
          as: "successor",
          attributes: ["id", "title", "task_key"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Dependency updated successfully",
      data: updatedDependency,
    });
  } catch (error) {
    console.error("Error updating dependency:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update dependency",
      error: error.message,
    });
  }
};

// Delete task dependency
exports.deleteDependency = async (req, res) => {
  try {
    const { id } = req.params;

    const dependency = await TaskDependency.findByPk(id);

    if (!dependency) {
      return res.status(404).json({
        success: false,
        message: "Dependency not found",
      });
    }

    await dependency.destroy();

    res.json({
      success: true,
      message: "Dependency deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dependency:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete dependency",
      error: error.message,
    });
  }
};

// Update task dates from Gantt drag
exports.updateTaskDates = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { start_date, due_date, progress_percentage } = req.body;
    const userId = req.user.id;

    const task = await Task.findByPk(task_id, {
      include: [{ model: Project, as: "project" }],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check user has access
    const isMember = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: userId },
    });

    if (
      !isMember &&
      task.project.owner_id !== userId &&
      task.assigned_to !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to update this task",
      });
    }

    // Update task
    await task.update({
      start_date: start_date ? new Date(start_date) : task.start_date,
      due_date: due_date ? new Date(due_date) : task.due_date,
      progress_percentage: progress_percentage ?? task.progress_percentage,
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      data: {
        id: task.id,
        task_key: task.task_key,
        start_date: task.start_date,
        due_date: task.due_date,
        progress_percentage: task.progress_percentage,
      },
    });
  } catch (error) {
    console.error("Error updating task dates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task dates",
      error: error.message,
    });
  }
};

// Bulk update tasks from Gantt
exports.bulkUpdateTasks = async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, start_date, due_date, progress_percentage }
    const userId = req.user.id;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: "Tasks array is required",
      });
    }

    const results = [];
    const errors = [];

    await sequelize.transaction(async (t) => {
      for (const taskUpdate of tasks) {
        try {
          const task = await Task.findByPk(taskUpdate.id, { transaction: t });

          if (!task) {
            errors.push({ id: taskUpdate.id, error: "Task not found" });
            continue;
          }

          await task.update(
            {
              start_date: taskUpdate.start_date
                ? new Date(taskUpdate.start_date)
                : task.start_date,
              due_date: taskUpdate.due_date
                ? new Date(taskUpdate.due_date)
                : task.due_date,
              progress_percentage:
                taskUpdate.progress_percentage ?? task.progress_percentage,
            },
            { transaction: t }
          );

          results.push({
            id: task.id,
            task_key: task.task_key,
            start_date: task.start_date,
            due_date: task.due_date,
            progress_percentage: task.progress_percentage,
          });
        } catch (error) {
          errors.push({ id: taskUpdate.id, error: error.message });
        }
      }
    });

    res.json({
      success: true,
      message: `Updated ${results.length} tasks`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk updating tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update tasks",
      error: error.message,
    });
  }
};

// Calculate critical path
exports.getCriticalPath = async (req, res) => {
  try {
    const { project_id } = req.params;

    // Get all tasks with dependencies
    const tasks = await Task.findAll({
      where: { project_id },
      include: [
        {
          model: TaskDependency,
          as: "predecessorDependencies",
        },
      ],
    });

    // Build dependency graph
    const taskMap = new Map();
    const graph = new Map();

    tasks.forEach((task) => {
      taskMap.set(task.id, task);
      graph.set(task.id, {
        task,
        predecessors: task.predecessorDependencies.map((d) => d.predecessor_id),
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: Infinity,
        latestFinish: Infinity,
        slack: 0,
      });
    });

    // Forward pass - calculate earliest start and finish
    const calculateEarliestTimes = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return graph.get(taskId).earliestFinish;
      visited.add(taskId);

      const node = graph.get(taskId);
      if (!node) return 0;

      const task = node.task;
      const duration = calculateDuration(task);

      if (node.predecessors.length === 0) {
        node.earliestStart = 0;
      } else {
        node.earliestStart = Math.max(
          ...node.predecessors.map((predId) =>
            calculateEarliestTimes(predId, visited)
          )
        );
      }

      node.earliestFinish = node.earliestStart + duration;
      return node.earliestFinish;
    };

    // Calculate for all tasks
    tasks.forEach((task) => calculateEarliestTimes(task.id, new Set()));

    // Find project end time
    const projectEnd = Math.max(
      ...Array.from(graph.values()).map((n) => n.earliestFinish)
    );

    // Backward pass - calculate latest start and finish
    const calculateLatestTimes = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return graph.get(taskId).latestStart;
      visited.add(taskId);

      const node = graph.get(taskId);
      if (!node) return projectEnd;

      const task = node.task;
      const duration = calculateDuration(task);

      // Find successors
      const successors = tasks.filter((t) =>
        graph.get(t.id)?.predecessors.includes(taskId)
      );

      if (successors.length === 0) {
        node.latestFinish = projectEnd;
      } else {
        node.latestFinish = Math.min(
          ...successors.map((succ) => calculateLatestTimes(succ.id, visited))
        );
      }

      node.latestStart = node.latestFinish - duration;
      node.slack = node.latestStart - node.earliestStart;

      return node.latestStart;
    };

    // Calculate for all tasks
    tasks.forEach((task) => calculateLatestTimes(task.id, new Set()));

    // Critical path = tasks with zero slack
    const criticalPath = Array.from(graph.values())
      .filter((node) => node.slack === 0)
      .map((node) => ({
        id: node.task.id,
        taskKey: node.task.task_key,
        title: node.task.title,
        earliestStart: node.earliestStart,
        earliestFinish: node.earliestFinish,
        latestStart: node.latestStart,
        latestFinish: node.latestFinish,
        slack: node.slack,
      }));

    res.json({
      success: true,
      data: {
        criticalPath,
        projectDuration: projectEnd,
        allTasks: Array.from(graph.values()).map((node) => ({
          id: node.task.id,
          taskKey: node.task.task_key,
          title: node.task.title,
          earliestStart: node.earliestStart,
          earliestFinish: node.earliestFinish,
          latestStart: node.latestStart,
          latestFinish: node.latestFinish,
          slack: node.slack,
          isCritical: node.slack === 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error calculating critical path:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate critical path",
      error: error.message,
    });
  }
};

// Helper Functions

// Format date for Gantt (YYYY-MM-DD)
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

// Calculate progress from status
function calculateProgress(status) {
  const progressMap = {
    backlog: 0,
    todo: 0,
    in_progress: 50,
    in_review: 75,
    done: 100,
  };
  return progressMap[status] || 0;
}

// Get CSS class for task based on status and priority
function getTaskClass(status, priority) {
  let className = status.replace("_", "-");
  if (priority === "critical") className += " critical";
  if (priority === "high") className += " high-priority";
  return className;
}

// Calculate task duration in days
function calculateDuration(task) {
  if (task.start_date && task.due_date) {
    const start = new Date(task.start_date);
    const end = new Date(task.due_date);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
  }
  if (task.estimated_hours) {
    return Math.ceil(task.estimated_hours / 8); // 8 hours per day
  }
  return 1; // Default 1 day
}

// Check for circular dependency
async function checkCircularDependency(startTaskId, targetTaskId) {
  const visited = new Set();
  const queue = [startTaskId];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (currentId === targetTaskId) {
      return true; // Circular dependency detected
    }

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Get successors of current task
    const successors = await TaskDependency.findAll({
      where: { predecessor_id: currentId },
      attributes: ["successor_id"],
    });

    successors.forEach((dep) => {
      if (!visited.has(dep.successor_id)) {
        queue.push(dep.successor_id);
      }
    });
  }

  return false;
}
