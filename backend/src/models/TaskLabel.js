const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TaskLabel extends Model {
    static associate(models) {
      // TaskLabel belongs to task
      TaskLabel.belongsTo(models.Task, {
        foreignKey: 'task_id',
        as: 'task'
      });

      // TaskLabel belongs to label
      TaskLabel.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });
    }
  }

  TaskLabel.init({
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
    label_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'labels',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'TaskLabel',
    tableName: 'task_labels',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['task_id', 'label_id']
      }
    ]
  });

  return TaskLabel;
};
