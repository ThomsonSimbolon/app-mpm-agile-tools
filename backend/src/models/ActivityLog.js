const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ActivityLog extends Model {
    static associate(models) {
      // Activity belongs to user
      ActivityLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Activity belongs to project
      ActivityLog.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });

      // Activity belongs to task
      ActivityLog.belongsTo(models.Task, {
        foreignKey: 'task_id',
        as: 'task'
      });
    }
  }

  ActivityLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM(
        'created', 
        'updated', 
        'deleted', 
        'status_changed', 
        'assigned', 
        'commented', 
        'uploaded'
      ),
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    old_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_logs',
    updatedAt: false
  });

  return ActivityLog;
};
