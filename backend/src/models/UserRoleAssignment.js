/**
 * =============================================================================
 * SEQUELIZE MODEL: UserRoleAssignment
 * =============================================================================
 * Model untuk dynamic role assignment dengan validity period
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UserRoleAssignment extends Model {
    static associate(models) {
      // Assignment belongs to user
      UserRoleAssignment.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      // Assignment made by user
      UserRoleAssignment.belongsTo(models.User, {
        foreignKey: "assigned_by",
        as: "assigner",
      });
    }

    /**
     * Check if assignment is currently valid
     */
    isValid() {
      const now = new Date();
      const validFrom = this.valid_from ? new Date(this.valid_from) : null;
      const validUntil = this.valid_until ? new Date(this.valid_until) : null;

      if (!this.is_active) return false;
      if (validFrom && now < validFrom) return false;
      if (validUntil && now > validUntil) return false;

      return true;
    }

    /**
     * Check if assignment is temporary
     */
    isTemporary() {
      return this.valid_until !== null;
    }
  }

  UserRoleAssignment.init(
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
      },
      role_type: {
        type: DataTypes.ENUM("system", "division", "team", "project"),
        allowNull: false,
        comment: "Layer role: system, division, team, project",
      },
      role_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Nama role yang di-assign",
      },
      resource_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Tipe resource: department, team, project",
      },
      resource_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "ID resource terkait",
      },
      assigned_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang assign role",
      },
      valid_from: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      valid_until: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "NULL = tidak ada batas waktu",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UserRoleAssignment",
      tableName: "user_role_assignments",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["user_id"],
          name: "idx_role_assign_user",
        },
        {
          fields: ["role_type"],
          name: "idx_role_assign_type",
        },
        {
          fields: ["resource_type", "resource_id"],
          name: "idx_role_assign_resource",
        },
        {
          fields: ["is_active"],
          name: "idx_role_assign_active",
        },
        {
          fields: ["valid_from", "valid_until"],
          name: "idx_role_assign_validity",
        },
      ],
    }
  );

  return UserRoleAssignment;
};
