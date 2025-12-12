/**
 * =============================================================================
 * TASK DELEGATION MODEL
 * =============================================================================
 * Model untuk tracking delegasi task saat user cuti/tidak tersedia
 *
 * Mencatat history delegasi task:
 * - Dari siapa ke siapa
 * - Kapan didelegasikan
 * - Alasan (cuti, reassignment manual, etc)
 * - Status delegasi
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class TaskDelegation extends Model {
    static associate(models) {
      // Delegation belongs to task
      TaskDelegation.belongsTo(models.Task, {
        foreignKey: "task_id",
        as: "task",
      });

      // Original assignee
      TaskDelegation.belongsTo(models.User, {
        foreignKey: "original_assignee_id",
        as: "originalAssignee",
      });

      // Delegate
      TaskDelegation.belongsTo(models.User, {
        foreignKey: "delegate_id",
        as: "delegate",
      });

      // Delegated by
      TaskDelegation.belongsTo(models.User, {
        foreignKey: "delegated_by",
        as: "delegatedBy",
      });

      // Related leave
      TaskDelegation.belongsTo(models.UserLeave, {
        foreignKey: "user_leave_id",
        as: "leave",
      });
    }
  }

  TaskDelegation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        comment: "Task yang didelegasikan",
      },
      original_assignee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User asli yang ditugaskan",
      },
      delegate_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User pengganti/delegate",
      },
      delegated_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang melakukan delegasi (bisa system atau manual)",
      },
      user_leave_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "user_leaves",
          key: "id",
        },
        comment: "Referensi ke user_leaves jika delegasi karena cuti",
      },
      delegation_type: {
        type: DataTypes.ENUM(
          "auto_leave",
          "manual",
          "workload_balance",
          "skill_based",
          "escalation"
        ),
        allowNull: false,
        defaultValue: "manual",
        comment: "Jenis delegasi",
      },
      status: {
        type: DataTypes.ENUM("active", "returned", "permanent", "cancelled"),
        allowNull: false,
        defaultValue: "active",
        comment: "Status delegasi",
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Alasan delegasi",
      },
      delegated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Waktu delegasi",
      },
      expected_return_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Perkiraan tanggal task dikembalikan",
      },
      returned_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Waktu task dikembalikan ke assignee asli",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Catatan tambahan",
      },
    },
    {
      sequelize,
      tableName: "task_delegations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["task_id"] },
        { fields: ["original_assignee_id"] },
        { fields: ["delegate_id"] },
        { fields: ["user_leave_id"] },
        { fields: ["status"] },
      ],
    }
  );

  return TaskDelegation;
};
