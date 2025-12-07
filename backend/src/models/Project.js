const { Model, DataTypes } = require('sequelize');
const { generateProjectKey } = require('../utils/helpers');

module.exports = (sequelize) => {
  class Project extends Model {
    static associate(models) {
      // Project belongs to user (creator)
      Project.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      // Project has many members (for direct inclusion)
      Project.hasMany(models.ProjectMember, {
        foreignKey: 'project_id',
        as: 'projectMembers'
      });

      // Project has many members through ProjectMember
      Project.belongsToMany(models.User, {
        through: models.ProjectMember,
        foreignKey: 'project_id',
        as: 'members'
      });

      // Project  has many sprints
      Project.hasMany(models.Sprint, {
        foreignKey: 'project_id',
        as: 'sprints'
      });

      // Project has many tasks
      Project.hasMany(models.Task, {
        foreignKey: 'project_id',
        as: 'tasks'
      });

      // Project has many labels
      Project.hasMany(models.Label, {
        foreignKey: 'project_id',
        as: 'labels'
      });

      // Project has many activities
      Project.hasMany(models.ActivityLog, {
        foreignKey: 'project_id',
        as: 'activities'
      });
    }
  }

  Project.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'archived'),
      defaultValue: 'planning'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    hooks: {
      beforeValidate: (project) => {
        if (!project.key && project.name) {
          project.key = generateProjectKey(project.name);
        }
      }
    }
  });

  return Project;
};
