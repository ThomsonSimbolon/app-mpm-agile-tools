/**
 * AI Cache Model
 *
 * Caches AI responses to reduce API calls and costs
 */

const { DataTypes } = require("sequelize");
const crypto = require("crypto");

module.exports = (sequelize) => {
  const AiCache = sequelize.define(
    "AiCache",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cache_key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      feature: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      request_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: "SHA256 hash of the request",
      },
      response_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      tokens_saved: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      hit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "ai_cache",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["cache_key"], unique: true },
        { fields: ["expires_at"] },
        { fields: ["feature"] },
      ],
    }
  );

  /**
   * Generate cache key from feature and request data
   */
  AiCache.generateCacheKey = (feature, requestData) => {
    const dataString = JSON.stringify(requestData);
    const hash = crypto.createHash("sha256").update(dataString).digest("hex");
    return `${feature}:${hash.substring(0, 16)}`;
  };

  /**
   * Generate request hash
   */
  AiCache.generateRequestHash = (requestData) => {
    const dataString = JSON.stringify(requestData);
    return crypto.createHash("sha256").update(dataString).digest("hex");
  };

  /**
   * Get cached response
   */
  AiCache.getCached = async (feature, requestData) => {
    const cacheKey = AiCache.generateCacheKey(feature, requestData);

    const cached = await AiCache.findOne({
      where: {
        cache_key: cacheKey,
        expires_at: {
          [require("sequelize").Op.gt]: new Date(),
        },
      },
    });

    if (cached) {
      // Increment hit count
      await cached.increment("hit_count");
      return cached.response_data;
    }

    return null;
  };

  /**
   * Set cache entry
   */
  AiCache.setCache = async (
    feature,
    requestData,
    responseData,
    ttlSeconds = 86400
  ) => {
    const cacheKey = AiCache.generateCacheKey(feature, requestData);
    const requestHash = AiCache.generateRequestHash(requestData);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await AiCache.upsert({
      cache_key: cacheKey,
      feature,
      request_hash: requestHash,
      response_data: responseData,
      tokens_saved: responseData.tokensUsed?.total || 0,
      expires_at: expiresAt,
    });
  };

  /**
   * Clear expired cache entries
   */
  AiCache.clearExpired = async () => {
    const result = await AiCache.destroy({
      where: {
        expires_at: {
          [require("sequelize").Op.lt]: new Date(),
        },
      },
    });
    return result;
  };

  /**
   * Clear all cache
   */
  AiCache.clearAll = async () => {
    const result = await AiCache.destroy({ where: {} });
    return result;
  };

  /**
   * Get cache statistics
   */
  AiCache.getStats = async () => {
    const [totalEntries, totalHits, totalTokensSaved] = await Promise.all([
      AiCache.count(),
      AiCache.sum("hit_count"),
      AiCache.sum("tokens_saved"),
    ]);

    return {
      totalEntries: totalEntries || 0,
      totalHits: totalHits || 0,
      totalTokensSaved: totalTokensSaved || 0,
    };
  };

  return AiCache;
};
