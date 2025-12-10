/**
 * AI Settings Model
 *
 * Stores AI configuration settings
 */

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AiSetting = sequelize.define(
    "AiSetting",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      setting_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "ai_settings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Associations
  AiSetting.associate = (models) => {
    AiSetting.belongsTo(models.User, {
      foreignKey: "updated_by",
      as: "updatedByUser",
    });
  };

  /**
   * Get setting value
   */
  AiSetting.getValue = async (key, defaultValue = null) => {
    const setting = await AiSetting.findOne({
      where: { setting_key: key },
    });
    return setting ? setting.setting_value : defaultValue;
  };

  /**
   * Set setting value
   */
  AiSetting.setValue = async (
    key,
    value,
    description = null,
    userId = null
  ) => {
    const [setting] = await AiSetting.upsert({
      setting_key: key,
      setting_value: value,
      description,
      updated_by: userId,
    });
    return setting;
  };

  /**
   * Get all settings as object
   */
  AiSetting.getAllSettings = async () => {
    const settings = await AiSetting.findAll();
    return settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});
  };

  /**
   * Initialize default settings
   */
  AiSetting.initDefaults = async () => {
    const defaults = [
      {
        key: "ai_enabled",
        value: "true",
        description: "Master toggle for AI features",
      },
      {
        key: "daily_token_limit",
        value: "100000",
        description: "Daily token limit across all users",
      },
      {
        key: "user_daily_limit",
        value: "100",
        description: "Daily request limit per user",
      },
      {
        key: "cache_ttl_hours",
        value: "24",
        description: "Cache expiration in hours",
      },
      {
        key: "queue_concurrency",
        value: "5",
        description: "Concurrent AI requests",
      },
    ];

    for (const { key, value, description } of defaults) {
      const existing = await AiSetting.findOne({ where: { setting_key: key } });
      if (!existing) {
        await AiSetting.create({
          setting_key: key,
          setting_value: value,
          description,
        });
      }
    }
  };

  return AiSetting;
};
