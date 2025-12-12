/**
 * =============================================================================
 * CALENDAR INTEGRATION MODEL
 * =============================================================================
 * Model untuk menyimpan koneksi ke external calendar (Google/Outlook)
 * =============================================================================
 */

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CalendarIntegration extends Model {
    static associate(models) {
      // Integration belongs to user
      CalendarIntegration.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  CalendarIntegration.init(
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
        comment: "User yang memiliki integrasi ini",
      },
      provider: {
        type: DataTypes.ENUM("google", "outlook"),
        allowNull: false,
        comment: "Provider calendar",
      },
      provider_account_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Account ID dari provider (email)",
      },
      access_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "OAuth access token (encrypted)",
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "OAuth refresh token (encrypted)",
      },
      token_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Waktu expired access token",
      },
      calendar_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Calendar ID yang di-sync",
      },
      calendar_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Nama calendar",
      },
      sync_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Apakah sync aktif",
      },
      sync_direction: {
        type: DataTypes.ENUM("import", "export", "both"),
        allowNull: false,
        defaultValue: "both",
        comment: "Arah sinkronisasi",
      },
      last_sync_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Waktu terakhir sync",
      },
      sync_status: {
        type: DataTypes.ENUM("idle", "syncing", "error"),
        allowNull: false,
        defaultValue: "idle",
        comment: "Status sync saat ini",
      },
      sync_error: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Error message jika sync gagal",
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional settings (filter, color mapping, dll)",
      },
    },
    {
      sequelize,
      modelName: "CalendarIntegration",
      tableName: "calendar_integrations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["user_id"] },
        { fields: ["provider"] },
        { fields: ["sync_enabled"] },
        {
          fields: ["user_id", "provider"],
          unique: true,
          name: "unique_user_provider",
        },
      ],
    }
  );

  return CalendarIntegration;
};
