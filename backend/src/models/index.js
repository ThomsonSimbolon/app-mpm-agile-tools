const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Import models
const User = require('./User')(sequelize);
const Project = require('./Project')(sequelize);
const ProjectMember = require('./ProjectMember')(sequelize);
const Sprint = require('./Sprint')(sequelize);
const Task = require('./Task')(sequelize);
const Comment = require('./Comment')(sequelize);
const Attachment = require('./Attachment')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);
const Label = require('./Label')(sequelize);
const TaskLabel = require('./TaskLabel')(sequelize);
const TimeLog = require('./TimeLog')(sequelize);
const Notification = require('./Notification')(sequelize);

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
  sequelize,
  Sequelize
};

// Setup associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
