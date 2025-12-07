const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TimeLog extends Model {
    static associate(models) {
      // TimeLog belongs to task
      TimeLog.belongsTo(models.Task, {
        foreignKey: 'task_id',
        as: 'task'
      });

      // TimeLog belongs to user
      TimeLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  TimeLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    hours_spent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 999.99
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logged_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'TimeLog',
    tableName: 'time_logs'
  });

  return TimeLog;
};
