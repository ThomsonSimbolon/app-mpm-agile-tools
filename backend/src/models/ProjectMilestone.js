/**
 * =============================================================================
 * PROJECT MILESTONE MODEL
 * =============================================================================
 * Model untuk menyimpan milestone project (untuk Gantt chart)
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProjectMilestone extends Model {
    static associate(models) {
      // Milestone belongs to project
      ProjectMilestone.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // Milestone created by user
      ProjectMilestone.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });
    }
  }

  ProjectMilestone.init(
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
        comment: "Project yang memiliki milestone ini",
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Nama milestone",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Deskripsi milestone",
      },
      target_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Tanggal target milestone",
      },
      completed_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Tanggal milestone tercapai",
      },
      status: {
        type: DataTypes.ENUM("pending", "in_progress", "completed", "overdue"),
        allowNull: false,
        defaultValue: "pending",
        comment: "Status milestone",
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: "#9c27b0",
        comment: "Warna untuk tampilan (hex)",
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Urutan tampilan milestone",
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang membuat milestone",
      },
    },
    {
      sequelize,
      modelName: "ProjectMilestone",
      tableName: "project_milestones",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["project_id"] },
        { fields: ["target_date"] },
        { fields: ["status"] },
        { fields: ["sort_order"] },
      ],
      hooks: {
        beforeUpdate: (milestone) => {
          // Update status based on dates
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (milestone.completed_date) {
            milestone.status = "completed";
          } else if (new Date(milestone.target_date) < today) {
            milestone.status = "overdue";
          }
        },
      },
    }
  );

  return ProjectMilestone;
};
