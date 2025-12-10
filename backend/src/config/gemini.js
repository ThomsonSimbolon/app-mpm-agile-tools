/**
 * Gemini AI Configuration
 *
 * Configuration for Google Gemini 1.5 Flash API
 */

const config = {
  // API Key from environment
  apiKey: process.env.GEMINI_API_KEY,

  // Model configuration
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash",

  // Generation settings
  generationConfig: {
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 2048,
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    topP: 0.95,
    topK: 40,
  },

  // Safety settings (adjust as needed)
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],

  // Feature toggle
  enabled: process.env.AI_ENABLED === "true",

  // Rate limiting
  rateLimiting: {
    perUser: parseInt(process.env.AI_RATE_LIMIT_PER_USER) || 50,
    windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 3600000, // 1 hour
    dailyTokenLimit: parseInt(process.env.AI_DAILY_TOKEN_LIMIT) || 100000,
    userDailyLimit: parseInt(process.env.AI_USER_DAILY_LIMIT) || 100,
  },

  // Queue settings
  queue: {
    concurrency: parseInt(process.env.AI_QUEUE_CONCURRENCY) || 5,
  },

  // Cache settings
  cache: {
    ttl: parseInt(process.env.AI_CACHE_TTL) || 86400, // 24 hours in seconds
  },
};

/**
 * Validate configuration
 */
const validateConfig = () => {
  const errors = [];

  if (!config.apiKey || config.apiKey === "your-gemini-api-key-here") {
    errors.push("GEMINI_API_KEY is not configured");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if AI is available
 */
const isAiAvailable = () => {
  const validation = validateConfig();
  return config.enabled && validation.valid;
};

module.exports = {
  ...config,
  validateConfig,
  isAiAvailable,
};
