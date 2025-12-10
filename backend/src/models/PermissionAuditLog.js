/**
 * =============================================================================
 * SEQUELIZE MODEL: PermissionAuditLog
 * =============================================================================
 * Model untuk audit log perubahan permission dan role
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PermissionAuditLog extends Model {
    static associate(models) {
      // Audit log belongs to user who made the change
      PermissionAuditLog.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "actor",
      });

      // Audit log belongs to target user
      PermissionAuditLog.belongsTo(models.User, {
        foreignKey: "target_user_id",
        as: "targetUser",
      });
    }
  }

  PermissionAuditLog.init(
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
        comment: "User yang melakukan perubahan",
      },
      target_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang rolenya diubah",
      },
      action: {
        type: DataTypes.ENUM("grant", "revoke", "modify"),
        allowNull: false,
      },
      role_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      role_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      resource_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      resource_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      old_role: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      new_role: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PermissionAuditLog",
      tableName: "permission_audit_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      underscored: true,
      indexes: [
        {
          fields: ["user_id"],
          name: "idx_perm_audit_user",
        },
        {
          fields: ["target_user_id"],
          name: "idx_perm_audit_target",
        },
        {
          fields: ["action"],
          name: "idx_perm_audit_action",
        },
        {
          fields: ["created_at"],
          name: "idx_perm_audit_created",
        },
      ],
    }
  );

  return PermissionAuditLog;
};
