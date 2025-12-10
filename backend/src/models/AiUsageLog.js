/**
 * AI Usage Log Model
 *
 * Tracks all AI API usage for monitoring and analytics
 */

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AiUsageLog = sequelize.define(
    "AiUsageLog",
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
      },
      feature: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment:
          "AI feature used: generate_task, chat, insights, suggest_sprint, search",
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "projects",
          key: "id",
        },
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tasks",
          key: "id",
        },
      },
      request_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      response_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      response_time_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("success", "error", "timeout", "rate_limited"),
        defaultValue: "success",
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cached: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "ai_usage_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false, // No updated_at for logs
      indexes: [
        { fields: ["user_id", "created_at"] },
        { fields: ["feature"] },
        { fields: ["status"] },
        { fields: ["created_at"] },
      ],
    }
  );

  // Associations
  AiUsageLog.associate = (models) => {
    AiUsageLog.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    AiUsageLog.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });
    AiUsageLog.belongsTo(models.Task, {
      foreignKey: "task_id",
      as: "task",
    });
  };

  return AiUsageLog;
};
