/**
 * Redis Configuration
 *
 * Configuration for Redis connection (used by Bull queue)
 */

const config = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,

  // Connection options
  options: {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    retryDelayOnFailover: 100,
    retryDelayOnClusterDown: 100,
    retryDelayOnTryAgain: 100,
  },
};

/**
 * Get Redis connection URL
 */
const getRedisUrl = () => {
  const auth = config.password ? `:${config.password}@` : "";
  return `redis://${auth}${config.host}:${config.port}`;
};

/**
 * Get Redis connection config for Bull
 */
const getBullRedisConfig = () => {
  return {
    redis: {
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      ...config.options,
    },
  };
};

module.exports = {
  ...config,
  getRedisUrl,
  getBullRedisConfig,
};
