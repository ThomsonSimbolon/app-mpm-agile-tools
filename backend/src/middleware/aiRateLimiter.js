/**
 * AI Rate Limiter Middleware
 *
 * Rate limiting specifically for AI endpoints
 */

const { AiUsageLog } = require("../models");
const geminiConfig = require("../config/gemini");
const { formatResponse } = require("../utils/helpers");
const { Op } = require("sequelize");

/**
 * Check user's AI request count within window
 */
const getUserRequestCount = async (userId, windowMs) => {
  const windowStart = new Date(Date.now() - windowMs);

  const count = await AiUsageLog.count({
    where: {
      user_id: userId,
      created_at: { [Op.gte]: windowStart },
    },
  });

  return count;
};

/**
 * Check user's daily request count
 */
const getUserDailyCount = async (userId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = await AiUsageLog.count({
    where: {
      user_id: userId,
      created_at: { [Op.gte]: todayStart },
    },
  });

  return count;
};

/**
 * Check total daily token usage
 */
const getTotalDailyTokens = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const total = await AiUsageLog.sum("total_tokens", {
    where: {
      created_at: { [Op.gte]: todayStart },
    },
  });

  return total || 0;
};

/**
 * AI Rate Limiter Middleware
 */
const aiRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json(formatResponse(false, "Authentication required"));
    }

    const { rateLimiting } = geminiConfig;

    // Check requests per window
    const windowCount = await getUserRequestCount(
      userId,
      rateLimiting.windowMs
    );
    if (windowCount >= rateLimiting.perUser) {
      // Log rate limited request
      await AiUsageLog.create({
        user_id: userId,
        feature: "rate_limited",
        status: "rate_limited",
      });

      return res.status(429).json(
        formatResponse(
          false,
          "AI rate limit exceeded. Please try again later.",
          {
            retryAfter: Math.ceil(rateLimiting.windowMs / 1000),
            limit: rateLimiting.perUser,
            current: windowCount,
          }
        )
      );
    }

    // Check daily limit
    const dailyCount = await getUserDailyCount(userId);
    if (dailyCount >= rateLimiting.userDailyLimit) {
      return res.status(429).json(
        formatResponse(
          false,
          "Daily AI request limit reached. Try again tomorrow.",
          {
            limit: rateLimiting.userDailyLimit,
            current: dailyCount,
          }
        )
      );
    }

    // Check total daily token limit
    const totalTokens = await getTotalDailyTokens();
    if (
      rateLimiting.dailyTokenLimit > 0 &&
      totalTokens >= rateLimiting.dailyTokenLimit
    ) {
      return res.status(429).json(
        formatResponse(false, "Daily AI token limit reached for the system.", {
          limit: rateLimiting.dailyTokenLimit,
          current: totalTokens,
        })
      );
    }

    // Add rate limit info to request
    req.aiRateLimit = {
      windowCount,
      dailyCount,
      totalTokens,
      remaining: {
        window: rateLimiting.perUser - windowCount,
        daily: rateLimiting.userDailyLimit - dailyCount,
      },
    };

    next();
  } catch (error) {
    console.error("[AI Rate Limiter] Error:", error.message);
    // Don't block on rate limiter errors
    next();
  }
};

/**
 * Check AI availability middleware
 */
const checkAiAvailability = (req, res, next) => {
  if (!geminiConfig.enabled) {
    return res
      .status(503)
      .json(formatResponse(false, "AI features are currently disabled"));
  }

  const validation = geminiConfig.validateConfig();
  if (!validation.valid) {
    return res.status(503).json(
      formatResponse(false, "AI service is not properly configured", {
        errors: validation.errors,
      })
    );
  }

  next();
};

module.exports = {
  aiRateLimiter,
  checkAiAvailability,
};
