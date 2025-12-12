/**
 * =============================================================================
 * TASK APPROVAL MODEL
 * =============================================================================
 * Model untuk mengelola approval workflow pada task
 *
 * Flow:
 * 1. Task dibuat dengan requires_approval = true
 * 2. Sistem menentukan approver berdasarkan hierarki/role
 * 3. Approver menerima notifikasi
 * 4. Approver approve/reject dengan komentar
 * 5. Task berlanjut atau dikembalikan ke creator
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class TaskApproval extends Model {
    static associate(models) {
      // Approval belongs to task
      TaskApproval.belongsTo(models.Task, {
        foreignKey: "task_id",
        as: "task",
      });

      // Approval requested by user
      TaskApproval.belongsTo(models.User, {
        foreignKey: "requested_by",
        as: "requester",
      });

      // Approval assigned to approver
      TaskApproval.belongsTo(models.User, {
        foreignKey: "approver_id",
        as: "approver",
      });
    }
  }

  TaskApproval.init(
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
        comment: "Task yang membutuhkan approval",
      },
      requested_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang request approval (biasanya task creator)",
      },
      approver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang harus approve (ditentukan berdasarkan hierarki)",
      },
      approval_type: {
        type: DataTypes.ENUM(
          "task_creation",
          "status_change",
          "priority_change",
          "assignment_change",
          "sprint_move",
          "qa_review"
        ),
        allowNull: false,
        defaultValue: "task_creation",
        comment: "Jenis approval yang dibutuhkan",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
        comment: "Status approval",
      },
      priority: {
        type: DataTypes.ENUM("low", "normal", "high", "urgent"),
        allowNull: false,
        defaultValue: "normal",
        comment: "Prioritas approval request",
      },
      request_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Pesan dari requester",
      },
      response_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Pesan response dari approver",
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Waktu request dibuat",
      },
      responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Waktu response diberikan",
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Deadline untuk approval (optional)",
      },
      auto_approve_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Waktu auto-approve jika tidak ada response (optional)",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Data tambahan (old_value, new_value, etc)",
      },
    },
    {
      sequelize,
      tableName: "task_approvals",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["task_id"] },
        { fields: ["approver_id"] },
        { fields: ["requested_by"] },
        { fields: ["status"] },
        { fields: ["approval_type"] },
      ],
    }
  );

  return TaskApproval;
};
