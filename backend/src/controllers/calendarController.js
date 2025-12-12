/**
 * Calendar Controller
 * Handles calendar events CRUD operations
 */

const {
  CalendarEvent,
  Project,
  Task,
  User,
  Sprint,
  UserLeave,
  ProjectMilestone,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, error: "Invalid start date" };
  }
  if (endDate && isNaN(end.getTime())) {
    return { valid: false, error: "Invalid end date" };
  }
  if (endDate && start > end) {
    return { valid: false, error: "Start date must be before end date" };
  }

  return { valid: true };
};

// Get all calendar events for date range
exports.getEvents = async (req, res) => {
  try {
    const {
      start,
      end,
      project_id,
      event_type,
      include_tasks,
      include_sprints,
      include_leaves,
      include_milestones,
    } = req.query;
    const userId = req.user.id;

    // Validate date range
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Start and end dates are required",
      });
    }

    const validation = validateDateRange(start, end);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Build where clause for calendar events
    const whereClause = {
      [Op.and]: [
        {
          [Op.or]: [
            // Events that start within range
            { start_datetime: { [Op.between]: [startDate, endDate] } },
            // Events that end within range
            { end_datetime: { [Op.between]: [startDate, endDate] } },
            // Events that span the entire range
            {
              start_datetime: { [Op.lte]: startDate },
              end_datetime: { [Op.gte]: endDate },
            },
          ],
        },
        {
          [Op.or]: [
            { created_by: userId },
            { is_private: false },
            sequelize.literal(`JSON_CONTAINS(attendees, '${userId}', '$')`),
          ],
        },
        { status: { [Op.ne]: "cancelled" } },
      ],
    };

    // Filter by project if specified
    if (project_id) {
      whereClause.project_id = project_id;
    }

    // Filter by event type if specified
    if (event_type) {
      whereClause.event_type = event_type;
    }

    // Get calendar events
    const calendarEvents = await CalendarEvent.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
        {
          model: Task,
          as: "task",
          attributes: ["id", "title", "task_key", "status"],
        },
      ],
      order: [["start_datetime", "ASC"]],
    });

    // Format events for calendar
    const events = calendarEvents.map((event) => ({
      id: `event-${event.id}`,
      type: "calendar_event",
      title: event.title,
      description: event.description,
      start: event.start_datetime,
      end: event.end_datetime,
      allDay: event.all_day,
      color: event.color,
      eventType: event.event_type,
      location: event.location,
      meetingLink: event.meeting_link,
      project: event.project,
      task: event.task,
      creator: event.creator,
      isPrivate: event.is_private,
      status: event.status,
      extendedProps: {
        sourceType: "calendar_event",
        sourceId: event.id,
        attendees: event.attendees,
        reminderMinutes: event.reminder_minutes,
      },
    }));

    // Optionally include tasks as events
    if (include_tasks === "true") {
      const tasks = await Task.findAll({
        where: {
          [Op.or]: [
            { due_date: { [Op.between]: [startDate, endDate] } },
            { start_date: { [Op.between]: [startDate, endDate] } },
          ],
          [Op.or]: [{ assigned_to: userId }, { created_by: userId }],
        },
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name", "key", "color"],
          },
        ],
      });

      tasks.forEach((task) => {
        events.push({
          id: `task-${task.id}`,
          type: "task",
          title: `📋 ${task.task_key}: ${task.title}`,
          start: task.start_date || task.due_date,
          end: task.due_date,
          allDay: true,
          color:
            task.status === "done"
              ? "#10B981"
              : task.project?.color || "#6366F1",
          eventType: "task",
          project: task.project,
          status: task.status,
          extendedProps: {
            sourceType: "task",
            sourceId: task.id,
            taskKey: task.task_key,
            priority: task.priority,
            progress: task.progress_percentage,
          },
        });
      });
    }

    // Optionally include sprints as events
    if (include_sprints === "true") {
      const sprintWhere = {
        [Op.or]: [
          { start_date: { [Op.between]: [startDate, endDate] } },
          { end_date: { [Op.between]: [startDate, endDate] } },
          {
            start_date: { [Op.lte]: startDate },
            end_date: { [Op.gte]: endDate },
          },
        ],
      };

      if (project_id) {
        sprintWhere.project_id = project_id;
      }

      const sprints = await Sprint.findAll({
        where: sprintWhere,
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name", "key", "color"],
          },
        ],
      });

      sprints.forEach((sprint) => {
        events.push({
          id: `sprint-${sprint.id}`,
          type: "sprint",
          title: `🏃 ${sprint.name}`,
          start: sprint.start_date,
          end: sprint.end_date,
          allDay: true,
          color: sprint.status === "active" ? "#F59E0B" : "#6B7280",
          eventType: "sprint",
          project: sprint.project,
          status: sprint.status,
          extendedProps: {
            sourceType: "sprint",
            sourceId: sprint.id,
            goal: sprint.goal,
          },
        });
      });
    }

    // Optionally include user leaves
    if (include_leaves === "true") {
      const leaves = await UserLeave.findAll({
        where: {
          user_id: userId,
          status: "approved",
          [Op.or]: [
            { start_date: { [Op.between]: [startDate, endDate] } },
            { end_date: { [Op.between]: [startDate, endDate] } },
          ],
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "email", "avatar"],
          },
        ],
      });

      leaves.forEach((leave) => {
        events.push({
          id: `leave-${leave.id}`,
          type: "leave",
          title: `🏖️ ${leave.leave_type}: ${leave.user?.username}`,
          start: leave.start_date,
          end: leave.end_date,
          allDay: true,
          color: "#EF4444",
          eventType: "leave",
          extendedProps: {
            sourceType: "leave",
            sourceId: leave.id,
            leaveType: leave.leave_type,
            reason: leave.reason,
          },
        });
      });
    }

    // Optionally include project milestones
    if (include_milestones === "true") {
      const milestoneWhere = {
        target_date: { [Op.between]: [startDate, endDate] },
        status: { [Op.ne]: "cancelled" },
      };

      if (project_id) {
        milestoneWhere.project_id = project_id;
      }

      const milestones = await ProjectMilestone.findAll({
        where: milestoneWhere,
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name", "key", "color"],
          },
        ],
      });

      milestones.forEach((milestone) => {
        events.push({
          id: `milestone-${milestone.id}`,
          type: "milestone",
          title: `🎯 ${milestone.name}`,
          start: milestone.target_date,
          end: milestone.target_date,
          allDay: true,
          color: milestone.color || "#10B981",
          eventType: "milestone",
          project: milestone.project,
          status: milestone.status,
          extendedProps: {
            sourceType: "milestone",
            sourceId: milestone.id,
            description: milestone.description,
            completedDate: milestone.completed_date,
          },
        });
      });
    }

    // Sort all events by start date
    events.sort((a, b) => new Date(a.start) - new Date(b.start));

    res.json({
      success: true,
      data: events,
      meta: {
        total: events.length,
        range: { start: startDate, end: endDate },
      },
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch calendar events",
      error: error.message,
    });
  }
};

// Get single calendar event
exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await CalendarEvent.findOne({
      where: {
        id,
        [Op.or]: [
          { created_by: userId },
          { is_private: false },
          sequelize.literal(`JSON_CONTAINS(attendees, '${userId}', '$')`),
        ],
      },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
        {
          model: Task,
          as: "task",
          attributes: ["id", "title", "task_key", "status"],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Get attendee details
    let attendeeDetails = [];
    if (event.attendees && event.attendees.length > 0) {
      attendeeDetails = await User.findAll({
        where: { id: event.attendees },
        attributes: ["id", "username", "email", "avatar"],
      });
    }

    res.json({
      success: true,
      data: {
        ...event.toJSON(),
        attendeeDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching calendar event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch calendar event",
      error: error.message,
    });
  }
};

// Create new calendar event
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      event_type,
      start_datetime,
      end_datetime,
      all_day,
      location,
      meeting_link,
      recurrence_rule,
      recurrence_end_date,
      color,
      reminder_minutes,
      project_id,
      task_id,
      attendees,
      is_private,
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!title || !start_datetime) {
      return res.status(400).json({
        success: false,
        message: "Title and start datetime are required",
      });
    }

    // Validate date range
    if (end_datetime) {
      const validation = validateDateRange(start_datetime, end_datetime);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
    }

    // Validate project exists if provided
    if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
    }

    // Validate task exists if provided
    if (task_id) {
      const task = await Task.findByPk(task_id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }
    }

    const event = await CalendarEvent.create({
      title,
      description,
      event_type: event_type || "other",
      start_datetime: new Date(start_datetime),
      end_datetime: end_datetime ? new Date(end_datetime) : null,
      all_day: all_day || false,
      location,
      meeting_link,
      recurrence_rule,
      recurrence_end_date,
      color: color || "#3B82F6",
      reminder_minutes: reminder_minutes || 30,
      project_id,
      task_id,
      created_by: userId,
      attendees: attendees || [],
      is_private: is_private || false,
    });

    // Reload with associations
    const createdEvent = await CalendarEvent.findByPk(event.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Calendar event created successfully",
      data: createdEvent,
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create calendar event",
      error: error.message,
    });
  }
};

// Update calendar event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const event = await CalendarEvent.findOne({
      where: {
        id,
        created_by: userId,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you don't have permission to edit it",
      });
    }

    // Validate date range if both dates provided
    if (updateData.start_datetime && updateData.end_datetime) {
      const validation = validateDateRange(
        updateData.start_datetime,
        updateData.end_datetime
      );
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
    }

    // Update event
    await event.update({
      ...updateData,
      start_datetime: updateData.start_datetime
        ? new Date(updateData.start_datetime)
        : event.start_datetime,
      end_datetime: updateData.end_datetime
        ? new Date(updateData.end_datetime)
        : event.end_datetime,
    });

    // Reload with associations
    const updatedEvent = await CalendarEvent.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Calendar event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update calendar event",
      error: error.message,
    });
  }
};

// Delete calendar event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await CalendarEvent.findOne({
      where: {
        id,
        created_by: userId,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you don't have permission to delete it",
      });
    }

    await event.destroy();

    res.json({
      success: true,
      message: "Calendar event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete calendar event",
      error: error.message,
    });
  }
};

// Cancel calendar event (soft delete)
exports.cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await CalendarEvent.findOne({
      where: {
        id,
        created_by: userId,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you don't have permission to cancel it",
      });
    }

    await event.update({ status: "cancelled" });

    res.json({
      success: true,
      message: "Calendar event cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling calendar event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel calendar event",
      error: error.message,
    });
  }
};

// Get upcoming events for dashboard widget
exports.getUpcomingEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5, days = 7 } = req.query;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const events = await CalendarEvent.findAll({
      where: {
        start_datetime: { [Op.between]: [now, futureDate] },
        status: "scheduled",
        [Op.or]: [
          { created_by: userId },
          { is_private: false },
          sequelize.literal(`JSON_CONTAINS(attendees, '${userId}', '$')`),
        ],
      },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
      order: [["start_datetime", "ASC"]],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming events",
      error: error.message,
    });
  }
};

// Get today's events
exports.getTodayEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await CalendarEvent.findAll({
      where: {
        [Op.or]: [
          { start_datetime: { [Op.between]: [today, tomorrow] } },
          {
            start_datetime: { [Op.lte]: today },
            end_datetime: { [Op.gte]: today },
          },
        ],
        status: "scheduled",
        [Op.or]: [
          { created_by: userId },
          { is_private: false },
          sequelize.literal(`JSON_CONTAINS(attendees, '${userId}', '$')`),
        ],
      },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
      order: [["start_datetime", "ASC"]],
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching today's events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's events",
      error: error.message,
    });
  }
};

// Quick create meeting
exports.createQuickMeeting = async (req, res) => {
  try {
    const {
      title,
      start_datetime,
      duration_minutes = 60,
      attendees = [],
      project_id,
    } = req.body;
    const userId = req.user.id;

    if (!title || !start_datetime) {
      return res.status(400).json({
        success: false,
        message: "Title and start time are required",
      });
    }

    const startDate = new Date(start_datetime);
    const endDate = new Date(startDate.getTime() + duration_minutes * 60000);

    const event = await CalendarEvent.create({
      title,
      event_type: "meeting",
      start_datetime: startDate,
      end_datetime: endDate,
      all_day: false,
      color: "#8B5CF6",
      reminder_minutes: 15,
      project_id,
      created_by: userId,
      attendees,
      is_private: false,
    });

    const createdEvent = await CalendarEvent.findByPk(event.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: createdEvent,
    });
  } catch (error) {
    console.error("Error creating quick meeting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create meeting",
      error: error.message,
    });
  }
};
