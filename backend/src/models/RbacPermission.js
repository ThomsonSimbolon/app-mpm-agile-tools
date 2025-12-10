/**
 * =============================================================================
 * SEQUELIZE MODEL: RbacPermission
 * =============================================================================
 * Model untuk definisi permission dalam sistem RBAC
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class RbacPermission extends Model {
    static associate(models) {
      // Permission has many role mappings
      RbacPermission.hasMany(models.RolePermission, {
        foreignKey: "permission_id",
        as: "rolePermissions",
      });
    }
  }

  RbacPermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: "Kode permission tidak boleh kosong" },
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Nama permission tidak boleh kosong" },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM("system", "division", "team", "project", "common"),
        defaultValue: "common",
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "RbacPermission",
      tableName: "rbac_permissions",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["code"],
          name: "idx_permissions_code",
        },
        {
          fields: ["category"],
          name: "idx_permissions_category",
        },
        {
          fields: ["is_active"],
          name: "idx_permissions_active",
        },
      ],
    }
  );

  return RbacPermission;
};
