const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      // Notification belongs to user
      Notification.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Notification triggered by user
      Notification.belongsTo(models.User, {
        foreignKey: 'triggered_by',
        as: 'trigger'
      });
    }
  }

  Notification.init({
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
    triggered_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'task_assigned',
        'task_updated',
        'comment_mention',
        'deadline_reminder',
        'sprint_started',
        'sprint_completed',
        'project_invite'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    updatedAt: false
  });

  return Notification;
};
