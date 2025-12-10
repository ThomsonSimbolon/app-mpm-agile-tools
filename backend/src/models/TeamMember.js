const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class TeamMember extends Model {
    static associate(models) {
      // Relasi ke Tim
      TeamMember.belongsTo(models.Team, {
        foreignKey: "team_id",
        as: "team",
      });

      // Relasi ke User
      TeamMember.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  TeamMember.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "teams",
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
          "member",
          "lead",
          "admin",
          // New Enterprise RBAC roles
          "team_admin",
          "team_lead",
          "scrum_master",
          "product_owner",
          "qa_lead"
        ),
        defaultValue: "member",
        comment: "Role dalam tim sesuai Enterprise RBAC matrix",
      },
      position: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Posisi/jabatan dalam tim",
      },
      specialization: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Spesialisasi: frontend, backend, devops, qa, etc.",
      },
      capacity_percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: "Kapasitas kerja dalam persen (0-100)",
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
      modelName: "TeamMember",
      tableName: "team_members",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["team_id", "user_id"],
          unique: true,
        },
        {
          fields: ["team_id"],
        },
        {
          fields: ["user_id"],
        },
        {
          fields: ["role"],
        },
      ],
    }
  );

  return TeamMember;
};
