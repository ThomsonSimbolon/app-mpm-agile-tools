/**
 * =============================================================================
 * USER LEAVE MODEL
 * =============================================================================
 * Model untuk mengelola status cuti/ketidaktersediaan user
 *
 * Flow:
 * 1. User mengajukan cuti dengan tanggal mulai & selesai
 * 2. User menentukan delegate (pengganti)
 * 3. Sistem otomatis reassign task ke delegate saat cuti aktif
 * 4. Notifikasi dikirim ke delegate
 * 5. Setelah cuti selesai, task bisa dikembalikan atau tetap
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UserLeave extends Model {
    static associate(models) {
      // Leave belongs to user
      UserLeave.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      // Leave has delegate
      UserLeave.belongsTo(models.User, {
        foreignKey: "delegate_id",
        as: "delegate",
      });

      // Leave approved by
      UserLeave.belongsTo(models.User, {
        foreignKey: "approved_by",
        as: "approvedBy",
      });

      // Leave has many delegations
      UserLeave.hasMany(models.TaskDelegation, {
        foreignKey: "user_leave_id",
        as: "delegations",
      });
    }
  }

  UserLeave.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang cuti",
      },
      delegate_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User pengganti selama cuti",
      },
      leave_type: {
        type: DataTypes.ENUM(
          "annual",
          "sick",
          "personal",
          "maternity",
          "paternity",
          "unpaid",
          "remote",
          "training",
          "other"
        ),
        allowNull: false,
        defaultValue: "annual",
        comment: "Jenis cuti",
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Tanggal mulai cuti",
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Tanggal selesai cuti",
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "approved",
          "rejected",
          "active",
          "completed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
        comment: "Status cuti",
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Alasan cuti",
      },
      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang approve cuti (biasanya manager/HR)",
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Waktu approval",
      },
      auto_delegate_tasks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Apakah task otomatis didelegasikan",
      },
      return_tasks_after: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Apakah task dikembalikan setelah cuti selesai",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Catatan tambahan",
      },
      contact_info: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Kontak darurat selama cuti (optional)",
      },
    },
    {
      sequelize,
      tableName: "user_leaves",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["user_id"] },
        { fields: ["delegate_id"] },
        { fields: ["status"] },
        { fields: ["start_date", "end_date"] },
      ],
    }
  );

  return UserLeave;
};
