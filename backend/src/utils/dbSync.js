/**
 * Database Synchronization Utility
 *
 * This utility handles automatic database schema synchronization
 * based on environment configuration.
 *
 * Environment Variables:
 * - DB_AUTO_SYNC: 'true' or 'false' - Enable/disable auto sync
 * - DB_SYNC_MODE: 'alter', 'force', or 'safe' - Sync strategy
 */

const chalk = require("chalk") || {
  green: (text) => text,
  yellow: (text) => text,
  red: (text) => text,
  cyan: (text) => text,
  gray: (text) => text,
  bold: (text) => text,
};

// ANSI color codes for console output (fallback if chalk not available)
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

/**
 * Log with color and prefix
 */
const log = {
  info: (msg) => console.log(`${colors.cyan}[Database]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(
      `${colors.green}[Database]${colors.reset} ${colors.green}✓${colors.reset} ${msg}`
    ),
  warn: (msg) =>
    console.log(
      `${colors.yellow}[Database]${colors.reset} ${colors.yellow}⚠${colors.reset} ${msg}`
    ),
  error: (msg) =>
    console.log(
      `${colors.red}[Database]${colors.reset} ${colors.red}✗${colors.reset} ${msg}`
    ),
  skip: (msg) =>
    console.log(
      `${colors.gray}[Database]${colors.reset} ${colors.gray}⏭${colors.reset} ${msg}`
    ),
};

/**
 * Parse boolean from environment variable
 * @param {string} value - Environment variable value
 * @param {boolean} defaultValue - Default value if not set
 * @returns {boolean}
 */
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return value.toLowerCase() === "true" || value === "1";
};

/**
 * Get sync options based on DB_SYNC_MODE
 * @param {string} mode - Sync mode ('alter', 'force', 'safe')
 * @returns {object} Sequelize sync options
 */
const getSyncOptions = (mode) => {
  switch (mode?.toLowerCase()) {
    case "force":
      return {
        force: true,
        alter: false,
      };
    case "alter":
      return {
        force: false,
        alter: true,
      };
    case "safe":
    default:
      return {
        force: false,
        alter: false,
      };
  }
};

/**
 * Get sync mode description for logging
 * @param {string} mode - Sync mode
 * @returns {string} Description
 */
const getSyncModeDescription = (mode) => {
  switch (mode?.toLowerCase()) {
    case "force":
      return "force (DROP & CREATE - data will be lost!)";
    case "alter":
      return "alter (update schema, preserve data)";
    case "safe":
      return "safe (create new tables only)";
    default:
      return "safe (default)";
  }
};

/**
 * Synchronize database based on environment configuration
 * @param {object} sequelize - Sequelize instance
 * @returns {Promise<{synced: boolean, mode: string|null, duration: number}>}
 */
const syncDatabase = async (sequelize) => {
  const startTime = Date.now();
  const autoSync = parseBoolean(process.env.DB_AUTO_SYNC, true);
  const syncMode = process.env.DB_SYNC_MODE || "safe";

  if (!autoSync) {
    log.skip("Auto-sync disabled (DB_AUTO_SYNC=false)");
    log.skip("Using existing database schema");
    return {
      synced: false,
      mode: null,
      duration: Date.now() - startTime,
    };
  }

  log.info(`Auto-sync enabled (mode: ${getSyncModeDescription(syncMode)})`);

  // Warning for force mode
  if (syncMode.toLowerCase() === "force") {
    log.warn("");
    log.warn("⚠️  WARNING: Force sync will DROP ALL TABLES and recreate them!");
    log.warn(
      "⚠️  ALL DATA WILL BE LOST! This should only be used in development."
    );
    log.warn("");

    // In production, prevent force sync
    if (process.env.NODE_ENV === "production") {
      log.error("Force sync is not allowed in production environment!");
      log.error('Change DB_SYNC_MODE to "alter" or "safe"');
      throw new Error("Force sync not allowed in production");
    }
  }

  const syncOptions = getSyncOptions(syncMode);

  try {
    log.info("Synchronizing database schema...");

    // Perform sync
    await sequelize.sync(syncOptions);

    const duration = Date.now() - startTime;
    log.success(`Database synchronized successfully in ${duration}ms`);

    return {
      synced: true,
      mode: syncMode,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`Database sync failed: ${error.message}`);
    throw error;
  }
};

/**
 * Test database connection
 * @param {object} sequelize - Sequelize instance
 * @returns {Promise<boolean>}
 */
const testConnection = async (sequelize) => {
  try {
    await sequelize.authenticate();
    log.success("Database connection established successfully");
    return true;
  } catch (error) {
    log.error(`Unable to connect to database: ${error.message}`);
    throw error;
  }
};

/**
 * Initialize database (test connection + optional sync)
 * @param {object} sequelize - Sequelize instance
 * @returns {Promise<{connected: boolean, synced: boolean, mode: string|null}>}
 */
const initializeDatabase = async (sequelize) => {
  // Test connection first
  await testConnection(sequelize);

  // Then sync if enabled
  const syncResult = await syncDatabase(sequelize);

  return {
    connected: true,
    synced: syncResult.synced,
    mode: syncResult.mode,
    duration: syncResult.duration,
  };
};

module.exports = {
  syncDatabase,
  testConnection,
  initializeDatabase,
  parseBoolean,
  getSyncOptions,
  log,
};
