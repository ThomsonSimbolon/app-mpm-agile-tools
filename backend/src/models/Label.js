const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Label extends Model {
    static associate(models) {
      // Label belongs to project
      Label.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });

      // Label belongs to many tasks
      Label.belongsToMany(models.Task, {
        through: models.TaskLabel,
        foreignKey: 'label_id',
        as: 'tasks'
      });
    }
  }

  Label.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#3B82F6',
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    }
  }, {
    sequelize,
    modelName: 'Label',
    tableName: 'labels',
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'name']
      }
    ]
  });

  return Label;
};
