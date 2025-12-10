/**
 * AI Service
 *
 * Service untuk berkomunikasi dengan AI API endpoints
 */

import api from "./api";

const AI_BASE_URL = "/ai";

/**
 * Get AI service status
 * @returns {Promise<Object>} AI status
 */
export const getAiStatus = async () => {
  try {
    const response = await api.get(`${AI_BASE_URL}/status`);
    return response.data;
  } catch (error) {
    console.error("Error getting AI status:", error);
    throw error;
  }
};

/**
 * Generate task description from title
 * @param {Object} params - Parameters
 * @param {string} params.title - Task title
 * @param {string} params.projectContext - Project context/description
 * @param {string} [params.language] - Response language (auto-detect if not provided)
 * @returns {Promise<Object>} Generated description
 */
export const generateTaskDescription = async ({
  title,
  projectContext,
  language,
}) => {
  try {
    const response = await api.post(`${AI_BASE_URL}/generate-task`, {
      title,
      projectContext,
      language,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating task description:", error);
    throw error;
  }
};

/**
 * Estimate story points for a task
 * @param {Object} params - Parameters
 * @param {string} params.title - Task title
 * @param {string} params.description - Task description
 * @param {Array} [params.historicalData] - Historical task data for reference
 * @returns {Promise<Object>} Estimated story points
 */
export const estimateStoryPoints = async ({
  title,
  description,
  historicalData,
}) => {
  try {
    const response = await api.post(`${AI_BASE_URL}/estimate-task`, {
      title,
      description,
      historicalData,
    });
    return response.data;
  } catch (error) {
    console.error("Error estimating story points:", error);
    throw error;
  }
};

/**
 * Get AI suggestions for sprint tasks
 * @param {Object} params - Parameters
 * @param {number} params.sprintId - Sprint ID
 * @param {number} params.targetPoints - Target story points for sprint
 * @param {Array} params.availableTasks - Available tasks in backlog
 * @param {Array} [params.teamCapacity] - Team member capacity info
 * @returns {Promise<Object>} Sprint suggestions
 */
export const suggestSprintTasks = async ({
  sprintId,
  targetPoints,
  availableTasks,
  teamCapacity,
}) => {
  try {
    const response = await api.post(`${AI_BASE_URL}/suggest-sprint-tasks`, {
      sprintId,
      targetPoints,
      availableTasks,
      teamCapacity,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting sprint suggestions:", error);
    throw error;
  }
};

/**
 * Chat with AI about a task
 * @param {Object} params - Parameters
 * @param {number} params.taskId - Task ID
 * @param {string} params.message - User message
 * @param {Array} [params.history] - Chat history
 * @returns {Promise<Object>} AI response
 */
export const chatWithAi = async ({ taskId, message, history }) => {
  try {
    const response = await api.post(`${AI_BASE_URL}/chat`, {
      taskId,
      message,
      history,
    });
    return response.data;
  } catch (error) {
    console.error("Error chatting with AI:", error);
    throw error;
  }
};

/**
 * Get AI-generated project insights
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Project insights
 */
export const getProjectInsights = async (projectId) => {
  try {
    const response = await api.post(`${AI_BASE_URL}/project-insights`, {
      projectId,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting project insights:", error);
    throw error;
  }
};

/**
 * Smart search across tasks using AI
 * @param {Object} params - Parameters
 * @param {string} params.query - Search query
 * @param {number} [params.projectId] - Optional project ID to scope search
 * @returns {Promise<Object>} Search results
 */
export const smartSearch = async ({ query, projectId }) => {
  try {
    const response = await api.post(`${AI_BASE_URL}/search`, {
      query,
      projectId,
    });
    return response.data;
  } catch (error) {
    console.error("Error performing smart search:", error);
    throw error;
  }
};

/**
 * Get AI usage statistics (admin only)
 * @param {Object} [params] - Parameters
 * @param {string} [params.startDate] - Start date filter
 * @param {string} [params.endDate] - End date filter
 * @returns {Promise<Object>} Usage statistics
 */
export const getAiUsageStats = async (params = {}) => {
  try {
    const response = await api.get(`${AI_BASE_URL}/admin/usage`, { params });
    return response.data;
  } catch (error) {
    console.error("Error getting AI usage stats:", error);
    throw error;
  }
};

/**
 * Update AI settings (admin only)
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
export const updateAiSettings = async (settings) => {
  try {
    const response = await api.put(`${AI_BASE_URL}/admin/settings`, settings);
    return response.data;
  } catch (error) {
    console.error("Error updating AI settings:", error);
    throw error;
  }
};

/**
 * Clear AI cache (admin only)
 * @returns {Promise<Object>} Result
 */
export const clearAiCache = async () => {
  try {
    const response = await api.delete(`${AI_BASE_URL}/admin/cache`);
    return response.data;
  } catch (error) {
    console.error("Error clearing AI cache:", error);
    throw error;
  }
};

/**
 * Chat with AI using streaming response (SSE)
 * @param {Object} params - Parameters
 * @param {number} [params.taskId] - Task ID (optional)
 * @param {string} params.message - User message
 * @param {Array} [params.history] - Chat history
 * @param {Function} params.onChunk - Callback for each text chunk
 * @param {Function} [params.onComplete] - Callback when streaming is complete
 * @param {Function} [params.onError] - Callback for errors
 * @returns {Function} Cleanup function to abort the stream
 */
export const chatWithAiStream = ({
  taskId,
  message,
  history = [],
  onChunk,
  onComplete,
  onError,
}) => {
  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Create AbortController for cleanup
  const abortController = new AbortController();

  // Use fetch with streaming for POST request with body
  const fetchStream = async () => {
    try {
      const response = await fetch(`${baseUrl}${AI_BASE_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          message,
          history,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            // Check for completion signal
            if (data === "[DONE]") {
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                if (onError) {
                  onError(parsed.error);
                }
                return;
              }

              if (parsed.text) {
                onChunk(parsed.text);
              }

              if (parsed.done && onComplete) {
                onComplete({
                  tokensUsed: parsed.tokensUsed,
                  responseTime: parsed.responseTime,
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete data
              console.warn("Failed to parse SSE data:", data);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Stream aborted");
        return;
      }

      console.error("Streaming error:", error);
      if (onError) {
        onError(error.message || "Streaming failed");
      }
    }
  };

  // Start streaming
  fetchStream();

  // Return cleanup function
  return () => {
    abortController.abort();
  };
};

// Export as default object
const aiService = {
  getAiStatus,
  generateTaskDescription,
  estimateStoryPoints,
  suggestSprintTasks,
  chatWithAi,
  chatWithAiStream,
  getProjectInsights,
  smartSearch,
  getAiUsageStats,
  updateAiSettings,
  clearAiCache,
};

export default aiService;
