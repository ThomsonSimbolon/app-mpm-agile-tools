/**
 * =============================================================================
 * SEQUELIZE MODEL: DepartmentMember
 * =============================================================================
 * Model untuk anggota departemen dengan role division-level
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class DepartmentMember extends Model {
    static associate(models) {
      // Relasi ke Department
      DepartmentMember.belongsTo(models.Department, {
        foreignKey: "department_id",
        as: "department",
      });

      // Relasi ke User
      DepartmentMember.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }

    /**
     * Check if user is department head
     */
    isHead() {
      return this.is_head || this.role === "division_head";
    }

    /**
     * Check if user can manage department
     */
    canManage() {
      return ["division_head", "division_manager"].includes(this.role);
    }
  }

  DepartmentMember.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "departments",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      role: {
        type: DataTypes.ENUM(
          "division_head",
          "division_manager",
          "division_viewer",
          "hr_reviewer"
        ),
        defaultValue: "division_viewer",
        allowNull: false,
        comment: "Role dalam departemen sesuai RBAC matrix",
      },
      position: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Posisi/jabatan dalam departemen",
      },
      is_head: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Apakah kepala departemen",
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "DepartmentMember",
      tableName: "department_members",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["department_id", "user_id"],
          unique: true,
          name: "unique_dept_user",
        },
        {
          fields: ["department_id"],
          name: "idx_dept_members_dept",
        },
        {
          fields: ["user_id"],
          name: "idx_dept_members_user",
        },
        {
          fields: ["role"],
          name: "idx_dept_members_role",
        },
        {
          fields: ["is_active"],
          name: "idx_dept_members_active",
        },
      ],
    }
  );

  return DepartmentMember;
};
