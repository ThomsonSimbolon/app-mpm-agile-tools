const { Sequelize } = require("sequelize");
const config = require("../config/database");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Import models
const User = require("./User")(sequelize);
const Project = require("./Project")(sequelize);
const ProjectMember = require("./ProjectMember")(sequelize);
const Sprint = require("./Sprint")(sequelize);
const Task = require("./Task")(sequelize);
const Comment = require("./Comment")(sequelize);
const Attachment = require("./Attachment")(sequelize);
const ActivityLog = require("./ActivityLog")(sequelize);
const Label = require("./Label")(sequelize);
const TaskLabel = require("./TaskLabel")(sequelize);
const TimeLog = require("./TimeLog")(sequelize);
const Notification = require("./Notification")(sequelize);

// AI Models
const AiUsageLog = require("./AiUsageLog")(sequelize);
const AiCache = require("./AiCache")(sequelize);
const AiSetting = require("./AiSetting")(sequelize);

// Team & Organization Models
const Department = require("./Department")(sequelize);
const Team = require("./Team")(sequelize);
const TeamMember = require("./TeamMember")(sequelize);

// RBAC Models (Enterprise Role-Based Access Control)
const DepartmentMember = require("./DepartmentMember")(sequelize);
const RbacPermission = require("./RbacPermission")(sequelize);
const RolePermission = require("./RolePermission")(sequelize);
const UserRoleAssignment = require("./UserRoleAssignment")(sequelize);
const PermissionAuditLog = require("./PermissionAuditLog")(sequelize);

// Create models object
const models = {
  User,
  Project,
  ProjectMember,
  Sprint,
  Task,
  Comment,
  Attachment,
  ActivityLog,
  Label,
  TaskLabel,
  TimeLog,
  Notification,
  // AI Models
  AiUsageLog,
  AiCache,
  AiSetting,
  // Team & Organization Models
  Department,
  Team,
  TeamMember,
  // RBAC Models
  DepartmentMember,
  RbacPermission,
  RolePermission,
  UserRoleAssignment,
  PermissionAuditLog,
  sequelize,
  Sequelize,
};

// Setup associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
