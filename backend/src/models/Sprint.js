const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Sprint extends Model {
    static associate(models) {
      // Sprint belongs to project
      Sprint.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });

      // Sprint has many tasks
      Sprint.hasMany(models.Task, {
        foreignKey: 'sprint_id',
        as: 'tasks'
      });
    }
  }

  Sprint.init({
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
      type: DataTypes.STRING(100),
      allowNull: false
    },
    goal: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStartDate(value) {
          if (this.start_date && value <= this.start_date) {
            throw new Error('End date must be after start date');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('planning', 'active', 'completed'),
      defaultValue: 'planning'
    }
  }, {
    sequelize,
    modelName: 'Sprint',
    tableName: 'sprints'
  });

  return Sprint;
};
