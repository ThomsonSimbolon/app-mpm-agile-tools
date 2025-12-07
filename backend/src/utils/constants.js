// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  DEVELOPER: 'developer',
  VIEWER: 'viewer'
};

// User status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

// Project status
const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

// Project member roles
const PROJECT_MEMBER_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  VIEWER: 'viewer'
};

// Sprint status
const SPRINT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// Task status
const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done'
};

// Task priority
const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Activity actions
const ACTIVITY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'status_changed',
  ASSIGNED: 'assigned',
  COMMENTED: 'commented',
  UPLOADED: 'uploaded'
};

// Notification types
const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  COMMENT_MENTION: 'comment_mention',
  DEADLINE_REMINDER: 'deadline_reminder',
  SPRINT_STARTED: 'sprint_started',
  SPRINT_COMPLETED: 'sprint_completed',
  PROJECT_INVITE: 'project_invite'
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  PROJECT_STATUS,
  PROJECT_MEMBER_ROLES,
  SPRINT_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  ACTIVITY_ACTIONS,
  NOTIFICATION_TYPES
};
