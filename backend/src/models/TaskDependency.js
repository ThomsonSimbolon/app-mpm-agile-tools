/**
 * =============================================================================
 * TASK DEPENDENCY MODEL
 * =============================================================================
 * Model untuk menyimpan dependensi antar task (untuk Gantt chart)
 *
 * Dependency Types:
 * - FS (Finish-to-Start): Task B dimulai setelah Task A selesai
 * - SS (Start-to-Start): Task B dimulai saat Task A dimulai
 * - FF (Finish-to-Finish): Task B selesai saat Task A selesai
 * - SF (Start-to-Finish): Task B selesai saat Task A dimulai
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class TaskDependency extends Model {
    static associate(models) {
      // Predecessor task
      TaskDependency.belongsTo(models.Task, {
        foreignKey: "predecessor_id",
        as: "predecessor",
      });

      // Successor task
      TaskDependency.belongsTo(models.Task, {
        foreignKey: "successor_id",
        as: "successor",
      });

      // Created by user
      TaskDependency.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });
    }
  }

  TaskDependency.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      predecessor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        comment: "Task yang harus selesai/mulai terlebih dahulu",
      },
      successor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        comment: "Task yang bergantung pada predecessor",
      },
      dependency_type: {
        type: DataTypes.ENUM("FS", "SS", "FF", "SF"),
        allowNull: false,
        defaultValue: "FS",
        comment: "Tipe dependency: FS, SS, FF, SF",
      },
      lag_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Jeda hari antara predecessor dan successor (bisa negatif)",
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang membuat dependency",
      },
    },
    {
      sequelize,
      modelName: "TaskDependency",
      tableName: "task_dependencies",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["predecessor_id"] },
        { fields: ["successor_id"] },
        {
          fields: ["predecessor_id", "successor_id"],
          unique: true,
          name: "unique_dependency",
        },
      ],
      validate: {
        notSelfReferencing() {
          if (this.predecessor_id === this.successor_id) {
            throw new Error("Task cannot depend on itself");
          }
        },
      },
    }
  );

  return TaskDependency;
};
