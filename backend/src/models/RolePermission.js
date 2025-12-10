/**
 * =============================================================================
 * SEQUELIZE MODEL: RolePermission
 * =============================================================================
 * Model untuk mapping role ke permission
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class RolePermission extends Model {
    static associate(models) {
      // Role permission belongs to permission
      RolePermission.belongsTo(models.RbacPermission, {
        foreignKey: "permission_id",
        as: "permission",
      });
    }

    /**
     * Get condition config as object
     */
    getConditionConfig() {
      if (!this.condition_config) return null;
      try {
        return typeof this.condition_config === "string"
          ? JSON.parse(this.condition_config)
          : this.condition_config;
      } catch (e) {
        return null;
      }
    }
  }

  RolePermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_type: {
        type: DataTypes.ENUM("system", "division", "team", "project"),
        allowNull: false,
        comment: "Layer role: system, division, team, project",
      },
      role_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Nama role sesuai config",
      },
      permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "rbac_permissions",
          key: "id",
        },
      },
      is_conditional: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Apakah permission memiliki kondisi khusus",
      },
      condition_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Tipe kondisi: own_only, partial, qa_fields_only",
      },
      condition_config: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Konfigurasi kondisi dalam format JSON",
      },
    },
    {
      sequelize,
      modelName: "RolePermission",
      tableName: "role_permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      underscored: true,
      indexes: [
        {
          fields: ["role_type", "role_name", "permission_id"],
          unique: true,
          name: "unique_role_permission",
        },
        {
          fields: ["role_type"],
          name: "idx_role_perms_type",
        },
        {
          fields: ["role_name"],
          name: "idx_role_perms_name",
        },
        {
          fields: ["permission_id"],
          name: "idx_role_perms_permission",
        },
      ],
    }
  );

  return RolePermission;
};
