const { Model, DataTypes } = require("sequelize");
const { generateTaskKey } = require("../utils/helpers");

module.exports = (sequelize) => {
  class Task extends Model {
    static associate(models) {
      // Task belongs to project
      Task.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // Task belongs to sprint
      Task.belongsTo(models.Sprint, {
        foreignKey: "sprint_id",
        as: "sprint",
      });

      // Task assigned to user
      Task.belongsTo(models.User, {
        foreignKey: "assigned_to",
        as: "assignee",
      });

      // Task created by user
      Task.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });

      // Task can have parent task (for subtasks)
      Task.belongsTo(models.Task, {
        foreignKey: "parent_task_id",
        as: "parentTask",
      });

      // Task can have subtasks
      Task.hasMany(models.Task, {
        foreignKey: "parent_task_id",
        as: "subtasks",
      });

      // Task has many comments
      Task.hasMany(models.Comment, {
        foreignKey: "task_id",
        as: "comments",
      });

      // Task has many attachments
      Task.hasMany(models.Attachment, {
        foreignKey: "task_id",
        as: "attachments",
      });

      // Task has many labels
      Task.belongsToMany(models.Label, {
        through: models.TaskLabel,
        foreignKey: "task_id",
        as: "labels",
      });

      // Task has many time logs
      Task.hasMany(models.TimeLog, {
        foreignKey: "task_id",
        as: "timeLogs",
      });

      // Task has many activities
      Task.hasMany(models.ActivityLog, {
        foreignKey: "task_id",
        as: "activities",
      });

      // Task dependencies for Gantt chart (as predecessor)
      Task.hasMany(models.TaskDependency, {
        foreignKey: "predecessor_id",
        as: "successorDependencies",
      });

      // Task dependencies for Gantt chart (as successor)
      Task.hasMany(models.TaskDependency, {
        foreignKey: "successor_id",
        as: "predecessorDependencies",
      });

      // Task can have calendar events linked to it
      Task.hasMany(models.CalendarEvent, {
        foreignKey: "task_id",
        as: "calendarEvents",
      });
    }
  }

  Task.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
      },
      sprint_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "sprints",
          key: "id",
        },
      },
      parent_task_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tasks",
          key: "id",
        },
      },
      task_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "backlog",
          "todo",
          "in_progress",
          "in_review",
          "done"
        ),
        defaultValue: "backlog",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium",
      },
      story_points: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Task start date for Gantt chart",
      },
      estimated_hours: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0,
        },
        comment: "Estimated hours to complete the task",
      },
      progress_percentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
        comment: "Task progress percentage (0-100) for Gantt chart",
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Task",
      tableName: "tasks",
      hooks: {
        beforeCreate: async (task) => {
          // Generate task key
          if (!task.task_key && task.project_id) {
            const project = await sequelize.models.Project.findByPk(
              task.project_id
            );
            if (project) {
              const taskCount = await Task.count({
                where: { project_id: task.project_id },
              });
              task.task_key = generateTaskKey(project.key, taskCount + 1);
            }
          }
        },
        beforeUpdate: (task) => {
          // Set completed_at when status changes to done
          if (
            task.changed("status") &&
            task.status === "done" &&
            !task.completed_at
          ) {
            task.completed_at = new Date();
          }
        },
      },
    }
  );

  return Task;
};
