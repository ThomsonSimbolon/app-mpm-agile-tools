/**
 * =============================================================================
 * CALENDAR EVENT MODEL
 * =============================================================================
 * Model untuk menyimpan event kalender (meeting, reminder, deadline, dll)
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CalendarEvent extends Model {
    static associate(models) {
      // Event belongs to creator
      CalendarEvent.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });

      // Event can be linked to a project
      CalendarEvent.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // Event can be linked to a task
      CalendarEvent.belongsTo(models.Task, {
        foreignKey: "task_id",
        as: "task",
      });
    }
  }

  CalendarEvent.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "Judul event",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Deskripsi event",
      },
      event_type: {
        type: DataTypes.ENUM(
          "meeting",
          "reminder",
          "deadline",
          "milestone",
          "leave",
          "holiday",
          "other"
        ),
        allowNull: false,
        defaultValue: "other",
        comment: "Tipe event",
      },
      start_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "Waktu mulai event",
      },
      end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Waktu selesai event (null untuk event tanpa durasi)",
      },
      all_day: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Apakah event berlangsung sepanjang hari",
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Lokasi event (fisik atau virtual)",
      },
      meeting_link: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: "Link meeting (Zoom, Google Meet, Teams, dll)",
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: "#3788d8",
        comment: "Warna event untuk tampilan kalender (hex)",
      },
      reminder_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 30,
        comment: "Reminder sebelum event dalam menit",
      },
      recurrence_rule: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "RRULE untuk recurring events (RFC 5545)",
      },
      recurrence_end: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Tanggal akhir recurring",
      },
      attendees: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Array of { user_id, status: pending/accepted/declined }",
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "projects",
          key: "id",
        },
        comment: "Link ke project (optional)",
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tasks",
          key: "id",
        },
        comment: "Link ke task (optional)",
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User yang membuat event",
      },
      external_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "ID dari external calendar (Google/Outlook)",
      },
      external_source: {
        type: DataTypes.ENUM("internal", "google", "outlook"),
        allowNull: false,
        defaultValue: "internal",
        comment: "Sumber event",
      },
      is_private: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Apakah event private (hanya creator yang bisa lihat)",
      },
      status: {
        type: DataTypes.ENUM("scheduled", "cancelled", "completed"),
        allowNull: false,
        defaultValue: "scheduled",
        comment: "Status event",
      },
    },
    {
      sequelize,
      modelName: "CalendarEvent",
      tableName: "calendar_events",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["created_by"] },
        { fields: ["project_id"] },
        { fields: ["task_id"] },
        { fields: ["event_type"] },
        { fields: ["start_datetime"] },
        { fields: ["end_datetime"] },
        { fields: ["external_id"] },
        { fields: ["status"] },
      ],
    }
  );

  return CalendarEvent;
};
