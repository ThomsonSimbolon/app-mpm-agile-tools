const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Team extends Model {
    static associate(models) {
      // Tim dalam departemen
      Team.belongsTo(models.Department, {
        foreignKey: "department_id",
        as: "department",
      });

      // Team lead
      Team.belongsTo(models.User, {
        foreignKey: "lead_user_id",
        as: "lead",
      });

      // Anggota tim (melalui TeamMember)
      Team.belongsToMany(models.User, {
        through: models.TeamMember,
        foreignKey: "team_id",
        otherKey: "user_id",
        as: "members",
      });

      // Relasi langsung ke TeamMember
      Team.hasMany(models.TeamMember, {
        foreignKey: "team_id",
        as: "teamMembers",
      });

      // Project yang di-assign ke tim
      Team.belongsToMany(models.Project, {
        through: "project_teams",
        foreignKey: "team_id",
        otherKey: "project_id",
        as: "projects",
      });
    }

    // Get member count
    async getMemberCount() {
      const TeamMember = this.sequelize.models.TeamMember;
      return TeamMember.count({ where: { team_id: this.id } });
    }
  }

  Team.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Nama tim tidak boleh kosong" },
          len: {
            args: [2, 100],
            msg: "Nama tim harus 2-100 karakter",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "departments",
          key: "id",
        },
      },
      lead_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: "#3B82F6",
        comment: "Warna identitas tim (hex)",
      },
      max_members: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Batas maksimal anggota tim",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Team",
      tableName: "teams",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["department_id"],
        },
        {
          fields: ["lead_user_id"],
        },
        {
          fields: ["is_active"],
        },
      ],
    }
  );

  return Team;
};
