const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProjectMember extends Model {
    static associate(models) {
      // ProjectMember belongs to project
      ProjectMember.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // ProjectMember belongs to user
      ProjectMember.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  ProjectMember.init(
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
          // Legacy roles
          "owner",
          "manager",
          "developer",
          "viewer",
          // New Enterprise RBAC roles
          "project_owner",
          "project_manager",
          "tech_lead",
          "qa_tester",
          "report_viewer",
          "stakeholder"
        ),
        defaultValue: "developer",
        comment: "Role dalam project sesuai Enterprise RBAC matrix",
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Apakah anggota utama project",
      },
      allocation_percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: "Alokasi waktu untuk project ini (0-100)",
      },
      can_approve: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Dapat approve task/sprint",
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ProjectMember",
      tableName: "project_members",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["project_id", "user_id"],
        },
      ],
    }
  );

  return ProjectMember;
};
