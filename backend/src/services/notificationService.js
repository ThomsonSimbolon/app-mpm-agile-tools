/**
 * Real-time Notification Service
 *
 * Service untuk mengirim notifikasi real-time via Socket.IO
 */

const { emitToUser, emitToProject } = require("../config/socket");
const { Notification, User, Task, Project } = require("../models");

/**
 * Notification Types - sesuai dengan ENUM di model
 */
const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: "task_assigned",
  TASK_UPDATED: "task_updated",
  COMMENT_MENTION: "comment_mention",
  DEADLINE_REMINDER: "deadline_reminder",
  SPRINT_STARTED: "sprint_started",
  SPRINT_COMPLETED: "sprint_completed",
  PROJECT_INVITE: "project_invite",
};

/**
 * Create and send notification
 * @param {Object} options - Notification options
 * @param {number} options.userId - Target user ID
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {number} [options.taskId] - Related task ID (for link)
 * @param {number} [options.projectId] - Related project ID (for link)
 * @param {number} [options.actorId] - User who triggered the notification
 * @returns {Promise<Object>} Created notification
 */
const sendNotification = async ({
  userId,
  type,
  title,
  message,
  projectId = null,
  taskId = null,
  actorId = null,
}) => {
  try {
    // Build link based on context
    let link = null;
    if (taskId && projectId) {
      link = `/projects/${projectId}/tasks/${taskId}`;
    } else if (projectId) {
      link = `/projects/${projectId}`;
    }

    // Create notification in database
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      link,
      triggered_by: actorId,
      is_read: false,
    });

    // Get actor info if available
    let actor = null;
    if (actorId) {
      actor = await User.findByPk(actorId, {
        attributes: ["id", "username", "full_name", "avatar"],
      });
    }

    // Prepare notification payload
    const payload = {
      id: notification.id,
      type,
      title,
      message,
      link,
      actor: actor ? actor.toJSON() : null,
      isRead: false,
      createdAt: notification.createdAt,
    };

    // Emit to user via Socket.IO
    emitToUser(userId, "notification", payload);

    return notification;
  } catch (error) {
    console.error("[NotificationService] Error sending notification:", error);
    throw error;
  }
};

/**
 * Send notification to multiple users
 * @param {Array<number>} userIds - Target user IDs
 * @param {Object} options - Notification options (same as sendNotification)
 */
const sendNotificationToMany = async (userIds, options) => {
  const promises = userIds.map((userId) =>
    sendNotification({ ...options, userId })
  );
  return Promise.allSettled(promises);
};

/**
 * Notify when task is assigned
 * @param {Object} task - Task object
 * @param {Object} assignee - Assigned user
 * @param {Object} actor - User who assigned the task
 */
const notifyTaskAssigned = async (task, assignee, actor) => {
  if (!assignee || assignee.id === actor.id) return;

  await sendNotification({
    userId: assignee.id,
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    title: "Task Baru Ditugaskan",
    message: `${actor.full_name || actor.username} menugaskan task "${
      task.title
    }" kepada Anda`,
    projectId: task.project_id,
    taskId: task.id,
    actorId: actor.id,
  });
};

/**
 * Notify when task status changes
 * @param {Object} task - Task object
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {Object} actor - User who changed the status
 * @param {Array<number>} notifyUserIds - User IDs to notify
 */
const notifyTaskStatusChanged = async (
  task,
  oldStatus,
  newStatus,
  actor,
  notifyUserIds = []
) => {
  const statusLabels = {
    backlog: "Backlog",
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    done: "Done",
  };

  const message = `${actor.full_name || actor.username} mengubah status task "${
    task.title
  }" dari ${statusLabels[oldStatus] || oldStatus} ke ${
    statusLabels[newStatus] || newStatus
  }`;

  // Filter out the actor from notifications
  const recipients = notifyUserIds.filter((id) => id !== actor.id);

  if (recipients.length === 0) return;

  await sendNotificationToMany(recipients, {
    type: NOTIFICATION_TYPES.TASK_UPDATED,
    title: newStatus === "done" ? "Task Selesai" : "Task Diperbarui",
    message,
    projectId: task.project_id,
    taskId: task.id,
    actorId: actor.id,
  });

  // Also emit to project room for real-time board update
  emitToProject(task.project_id, "task:updated", {
    taskId: task.id,
    taskKey: task.task_key,
    oldStatus,
    newStatus,
    updatedBy: actor.id,
  });
};

/**
 * Notify when comment is added (mention)
 * @param {Object} comment - Comment object
 * @param {Object} task - Task object
 * @param {Object} actor - User who commented
 * @param {Array<number>} notifyUserIds - User IDs to notify
 */
const notifyTaskCommented = async (
  comment,
  task,
  actor,
  notifyUserIds = []
) => {
  const recipients = notifyUserIds.filter((id) => id !== actor.id);

  if (recipients.length === 0) return;

  const commentPreview =
    comment.content.length > 100
      ? comment.content.substring(0, 100) + "..."
      : comment.content;

  await sendNotificationToMany(recipients, {
    type: NOTIFICATION_TYPES.COMMENT_MENTION,
    title: "Komentar Baru",
    message: `${actor.full_name || actor.username} mengomentari task "${
      task.title
    }": "${commentPreview}"`,
    projectId: task.project_id,
    taskId: task.id,
    actorId: actor.id,
  });
};

/**
 * Notify when sprint starts
 * @param {Object} sprint - Sprint object
 * @param {Object} actor - User who started the sprint
 * @param {Array<number>} notifyUserIds - User IDs to notify
 */
const notifySprintStarted = async (sprint, actor, notifyUserIds = []) => {
  const recipients = notifyUserIds.filter((id) => id !== actor.id);

  if (recipients.length === 0) return;

  await sendNotificationToMany(recipients, {
    type: NOTIFICATION_TYPES.SPRINT_STARTED,
    title: "Sprint Dimulai",
    message: `${actor.full_name || actor.username} memulai sprint "${
      sprint.name
    }"`,
    projectId: sprint.project_id,
    actorId: actor.id,
  });

  // Emit to project room
  emitToProject(sprint.project_id, "sprint:started", {
    sprintId: sprint.id,
    sprintName: sprint.name,
    startedBy: actor.id,
  });
};

/**
 * Notify when sprint is completed
 * @param {Object} sprint - Sprint object
 * @param {Object} actor - User who completed the sprint
 * @param {Array<number>} notifyUserIds - User IDs to notify
 * @param {Object} stats - Sprint completion stats
 */
const notifySprintCompleted = async (
  sprint,
  actor,
  notifyUserIds = [],
  stats = {}
) => {
  const recipients = notifyUserIds.filter((id) => id !== actor.id);

  if (recipients.length === 0) return;

  await sendNotificationToMany(recipients, {
    type: NOTIFICATION_TYPES.SPRINT_COMPLETED,
    title: "Sprint Selesai",
    message: `Sprint "${sprint.name}" telah diselesaikan oleh ${
      actor.full_name || actor.username
    }`,
    projectId: sprint.project_id,
    actorId: actor.id,
  });

  // Emit to project room
  emitToProject(sprint.project_id, "sprint:completed", {
    sprintId: sprint.id,
    sprintName: sprint.name,
    completedBy: actor.id,
    stats,
  });
};

/**
 * Notify when member is added to project
 * @param {Object} project - Project object
 * @param {Object} newMember - New member user object
 * @param {Object} actor - User who added the member
 */
const notifyMemberAdded = async (project, newMember, actor) => {
  // Notify the new member
  await sendNotification({
    userId: newMember.id,
    type: NOTIFICATION_TYPES.PROJECT_INVITE,
    title: "Ditambahkan ke Project",
    message: `${
      actor.full_name || actor.username
    } menambahkan Anda ke project "${project.name}"`,
    projectId: project.id,
    actorId: actor.id,
  });
};

/**
 * Notify deadline reminder
 * @param {Object} task - Task object
 * @param {Object} user - User to notify
 * @param {number} daysUntilDue - Days until due date
 */
const notifyDeadlineReminder = async (task, user, daysUntilDue) => {
  const urgency =
    daysUntilDue <= 0 ? "sudah lewat!" : `${daysUntilDue} hari lagi`;

  await sendNotification({
    userId: user.id,
    type: NOTIFICATION_TYPES.DEADLINE_REMINDER,
    title: "Pengingat Deadline",
    message: `Task "${task.title}" deadline ${urgency}`,
    projectId: task.project_id,
    taskId: task.id,
  });
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID
 */
const markAsRead = async (notificationId, userId) => {
  await Notification.update(
    { is_read: true },
    {
      where: {
        id: notificationId,
        user_id: userId,
      },
    }
  );
};

/**
 * Mark all notifications as read for user
 * @param {number} userId - User ID
 */
const markAllAsRead = async (userId) => {
  await Notification.update(
    { is_read: true },
    {
      where: {
        user_id: userId,
        is_read: false,
      },
    }
  );
};

/**
 * Get unread notification count
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  return Notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });
};

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  const where = { user_id: userId };
  if (unreadOnly) {
    where.is_read = false;
  }

  return Notification.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "trigger",
        attributes: ["id", "username", "full_name", "avatar"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  sendNotification,
  sendNotificationToMany,
  notifyTaskAssigned,
  notifyTaskStatusChanged,
  notifyTaskCommented,
  notifySprintStarted,
  notifySprintCompleted,
  notifyMemberAdded,
  notifyDeadlineReminder,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserNotifications,
};
