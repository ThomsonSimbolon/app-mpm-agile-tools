/**
 * AI Queue Service
 *
 * Manages AI request queue using Bull for rate limiting and job processing
 */

const Queue = require("bull");
const redisConfig = require("../config/redis");
const geminiConfig = require("../config/gemini");
const geminiService = require("./geminiService");

// Queue instance (lazy initialization)
let aiQueue = null;
let isRedisAvailable = false;

// In-memory fallback for when Redis is not available
const pendingJobs = new Map();
let jobIdCounter = 0;

/**
 * Initialize the queue
 */
const initialize = async () => {
  try {
    aiQueue = new Queue("ai-requests", {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        maxRetriesPerRequest: 3,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
        timeout: 30000, // 30 second timeout
      },
    });

    // Test Redis connection
    await aiQueue.isReady();
    isRedisAvailable = true;

    console.log("[AI Queue] ✓ Connected to Redis");

    // Setup queue processor
    setupProcessor();

    // Setup event handlers
    setupEventHandlers();

    return true;
  } catch (error) {
    console.warn("[AI Queue] ⚠ Redis not available, using direct processing");
    isRedisAvailable = false;
    return false;
  }
};

/**
 * Setup queue processor
 */
const setupProcessor = () => {
  if (!aiQueue) return;

  const concurrency = geminiConfig.queue?.concurrency || 5;

  aiQueue.process(concurrency, async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case "generateTask":
        return geminiService.generateTaskDescription(
          data.title,
          data.projectContext
        );

      case "suggestSprint":
        return geminiService.suggestSprintTasks(
          data.tasks,
          data.capacity,
          data.preferences
        );

      case "projectInsights":
        return geminiService.generateProjectInsights(data.projectData);

      case "chat":
        return geminiService.chatAboutTask(
          data.taskContext,
          data.message,
          data.history
        );

      case "generate":
        return geminiService.generateContent(data.prompt);

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  });
};

/**
 * Setup event handlers
 */
const setupEventHandlers = () => {
  if (!aiQueue) return;

  aiQueue.on("completed", (job, result) => {
    console.log(`[AI Queue] Job ${job.id} completed`);
  });

  aiQueue.on("failed", (job, err) => {
    console.error(`[AI Queue] Job ${job.id} failed:`, err.message);
  });

  aiQueue.on("stalled", (job) => {
    console.warn(`[AI Queue] Job ${job.id} stalled`);
  });
};

/**
 * Add job to queue
 * @param {string} type - Job type
 * @param {object} data - Job data
 * @param {object} options - Job options
 * @returns {Promise<object>}
 */
const addJob = async (type, data, options = {}) => {
  // If Redis is available, use the queue
  if (isRedisAvailable && aiQueue) {
    const job = await aiQueue.add(
      { type, data },
      {
        priority: options.priority || 2,
        ...options,
      }
    );

    // Wait for job completion
    return job.finished();
  }

  // Fallback: Direct processing without queue
  return processDirectly(type, data);
};

/**
 * Process job directly (fallback when Redis is not available)
 */
const processDirectly = async (type, data) => {
  switch (type) {
    case "generateTask":
      return geminiService.generateTaskDescription(
        data.title,
        data.projectContext
      );

    case "suggestSprint":
      return geminiService.suggestSprintTasks(
        data.tasks,
        data.capacity,
        data.preferences
      );

    case "projectInsights":
      return geminiService.generateProjectInsights(data.projectData);

    case "chat":
      return geminiService.chatAboutTask(
        data.taskContext,
        data.message,
        data.history
      );

    case "generate":
      return geminiService.generateContent(data.prompt);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
};

/**
 * Get queue status
 */
const getQueueStatus = async () => {
  if (!isRedisAvailable || !aiQueue) {
    return {
      available: false,
      mode: "direct",
      message: "Queue not available, using direct processing",
    };
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      aiQueue.getWaitingCount(),
      aiQueue.getActiveCount(),
      aiQueue.getCompletedCount(),
      aiQueue.getFailedCount(),
      aiQueue.getDelayedCount(),
    ]);

    return {
      available: true,
      mode: "queue",
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
    };
  } catch (error) {
    return {
      available: false,
      mode: "direct",
      error: error.message,
    };
  }
};

/**
 * Clean old jobs
 */
const cleanOldJobs = async () => {
  if (!aiQueue) return;

  try {
    await aiQueue.clean(24 * 60 * 60 * 1000, "completed"); // 24 hours
    await aiQueue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // 7 days
    console.log("[AI Queue] Cleaned old jobs");
  } catch (error) {
    console.error("[AI Queue] Error cleaning jobs:", error.message);
  }
};

/**
 * Shutdown queue gracefully
 */
const shutdown = async () => {
  if (aiQueue) {
    await aiQueue.close();
    console.log("[AI Queue] Shutdown complete");
  }
};

// Priority levels
const PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
};

module.exports = {
  initialize,
  addJob,
  getQueueStatus,
  cleanOldJobs,
  shutdown,
  PRIORITY,
  isRedisAvailable: () => isRedisAvailable,
};
