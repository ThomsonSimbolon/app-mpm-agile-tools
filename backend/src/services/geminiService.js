/**
 * Gemini AI Service
 *
 * Wrapper for Google Gemini 1.5 Flash API
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const geminiConfig = require("../config/gemini");

// Initialize Gemini client (lazy initialization)
let genAI = null;
let model = null;

/**
 * Initialize Gemini client
 */
const initialize = () => {
  if (
    !geminiConfig.apiKey ||
    geminiConfig.apiKey === "your-gemini-api-key-here"
  ) {
    throw new Error("Gemini API key is not configured");
  }

  genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
  model = genAI.getGenerativeModel({
    model: geminiConfig.model,
    generationConfig: geminiConfig.generationConfig,
    safetySettings: geminiConfig.safetySettings,
  });

  return model;
};

/**
 * Get initialized model
 */
const getModel = () => {
  if (!model) {
    initialize();
  }
  return model;
};

/**
 * Generate content from prompt
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} options - Additional options
 * @returns {Promise<{text: string, tokensUsed: object}>}
 */
const generateContent = async (prompt, options = {}) => {
  const startTime = Date.now();

  try {
    const currentModel = getModel();

    const result = await currentModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Get token usage (if available)
    const usageMetadata = response.usageMetadata || {};

    return {
      success: true,
      text,
      tokensUsed: {
        prompt: usageMetadata.promptTokenCount || 0,
        completion: usageMetadata.candidatesTokenCount || 0,
        total: usageMetadata.totalTokenCount || 0,
      },
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[Gemini] Error generating content:", error.message);

    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime,
    };
  }
};

/**
 * Generate content with chat history
 * @param {string} message - Current message
 * @param {Array} history - Chat history
 * @returns {Promise<object>}
 */
const chat = async (message, history = []) => {
  const startTime = Date.now();

  try {
    const currentModel = getModel();

    // Convert history to Gemini format
    const geminiHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = currentModel.startChat({
      history: geminiHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    const usageMetadata = response.usageMetadata || {};

    return {
      success: true,
      text,
      tokensUsed: {
        prompt: usageMetadata.promptTokenCount || 0,
        completion: usageMetadata.candidatesTokenCount || 0,
        total: usageMetadata.totalTokenCount || 0,
      },
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[Gemini] Error in chat:", error.message);

    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime,
    };
  }
};

/**
 * Generate task description from title
 * @param {string} title - Task title
 * @param {object} projectContext - Project information
 * @returns {Promise<object>}
 */
const generateTaskDescription = async (title, projectContext = {}) => {
  const prompt = `You are a project management assistant for agile/scrum teams. Generate a comprehensive task description.

Project Name: ${projectContext.name || "Not specified"}
Project Description: ${projectContext.description || "Not specified"}
Task Title: ${title}

Please generate:
1. A detailed description (2-3 paragraphs explaining what needs to be done)
2. Acceptance criteria (3-5 bullet points)
3. Suggested priority (low, medium, high, or critical)
4. Estimated story points (use fibonacci: 1, 2, 3, 5, 8, 13)
5. Suggested labels (2-3 relevant tags)

IMPORTANT: Respond in the same language as the task title.
Format your response as JSON with this structure:
{
  "description": "detailed description here",
  "acceptanceCriteria": ["criteria 1", "criteria 2", ...],
  "suggestedPriority": "medium",
  "estimatedPoints": 5,
  "suggestedLabels": ["label1", "label2"]
}`;

  const result = await generateContent(prompt);

  if (!result.success) {
    return result;
  }

  // Parse JSON from response
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = result.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText.trim());

    return {
      success: true,
      data: parsed,
      tokensUsed: result.tokensUsed,
      responseTime: result.responseTime,
    };
  } catch (parseError) {
    // Return raw text if JSON parsing fails
    return {
      success: true,
      data: {
        description: result.text,
        acceptanceCriteria: [],
        suggestedPriority: "medium",
        estimatedPoints: 3,
        suggestedLabels: [],
      },
      tokensUsed: result.tokensUsed,
      responseTime: result.responseTime,
      parseWarning: "Could not parse structured response",
    };
  }
};

/**
 * Suggest tasks for sprint
 * @param {Array} backlogTasks - Available tasks in backlog
 * @param {number} capacity - Sprint capacity in story points
 * @param {object} preferences - User preferences
 * @returns {Promise<object>}
 */
const suggestSprintTasks = async (backlogTasks, capacity, preferences = {}) => {
  const tasksInfo = backlogTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description?.substring(0, 100) || "",
    priority: t.priority,
    points: t.story_points || 0,
    assignee: t.assignee?.full_name || "Unassigned",
  }));

  const prompt = `You are a sprint planning assistant. Suggest the best tasks for the upcoming sprint.

Sprint Capacity: ${capacity} story points
Available Tasks: ${JSON.stringify(tasksInfo, null, 2)}

Preferences:
- Prioritize high priority tasks: ${
    preferences.prioritizeHighPriority !== false
  }
- Balance workload: ${preferences.balanceWorkload !== false}

Please suggest which tasks should be included in the sprint to maximize value while staying within capacity.

Format your response as JSON:
{
  "suggestions": [
    {
      "taskId": 1,
      "reason": "Brief reason for including this task"
    }
  ],
  "totalPoints": 38,
  "analysis": "Brief analysis of the sprint composition"
}`;

  const result = await generateContent(prompt);

  if (!result.success) {
    return result;
  }

  try {
    let jsonText = result.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText.trim());

    return {
      success: true,
      data: parsed,
      tokensUsed: result.tokensUsed,
      responseTime: result.responseTime,
    };
  } catch (parseError) {
    return {
      success: false,
      error: "Failed to parse AI response",
      responseTime: result.responseTime,
    };
  }
};

/**
 * Generate project insights
 * @param {object} projectData - Project statistics and data
 * @returns {Promise<object>}
 */
const generateProjectInsights = async (projectData) => {
  const prompt = `You are a project analytics assistant. Analyze this project data and provide insights.

Project: ${projectData.name}
Description: ${projectData.description || "Not specified"}

Statistics:
- Total Tasks: ${projectData.totalTasks}
- Completed Tasks: ${projectData.completedTasks}
- In Progress: ${projectData.inProgressTasks}
- Overdue Tasks: ${projectData.overdueTasks || 0}
- Active Sprint: ${projectData.activeSprint?.name || "None"}
- Sprint Progress: ${projectData.sprintProgress || 0}%
- Team Size: ${projectData.teamSize || 1}

Recent Activity:
${projectData.recentActivity || "No recent activity"}

Please provide:
1. Progress summary
2. Potential risks or blockers
3. Recommendations for improvement
4. Team workload assessment

Respond in a format suitable for a dashboard card. Use markdown formatting.
Keep it concise but actionable.`;

  const result = await generateContent(prompt);

  return {
    success: result.success,
    data: result.success ? { insights: result.text } : null,
    error: result.error,
    tokensUsed: result.tokensUsed,
    responseTime: result.responseTime,
  };
};

/**
 * Chat about a task
 * @param {object} taskContext - Task information
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {Promise<object>}
 */
const chatAboutTask = async (taskContext, message, history = []) => {
  // Build system context as initial user message
  const systemContext = `Saya ingin membahas task berikut:

Task: ${taskContext.title}
Status: ${taskContext.status}
Priority: ${taskContext.priority}
Description: ${taskContext.description || "No description"}
Assignee: ${taskContext.assignee?.full_name || "Unassigned"}
Story Points: ${taskContext.story_points || "Not estimated"}
Project: ${taskContext.project?.name || "Unknown"}

Tolong bantu saya dengan pertanyaan tentang task ini.`;

  // History harus selalu dimulai dengan role "user"
  // Format: user -> assistant -> user -> assistant ...
  const fullHistory =
    history.length === 0
      ? [
          { role: "user", content: systemContext },
          {
            role: "assistant",
            content:
              "Baik, saya sudah memahami task tersebut. Silakan ajukan pertanyaan atau minta bantuan terkait task ini.",
          },
        ]
      : [
          // Prepend system context di awal history yang sudah ada
          { role: "user", content: systemContext },
          {
            role: "assistant",
            content:
              "Baik, saya sudah memahami task tersebut. Mari kita lanjutkan diskusi.",
          },
          ...history,
        ];

  return chat(message, fullHistory);
};

/**
 * Check Gemini service health
 */
const healthCheck = async () => {
  try {
    const result = await generateContent('Say "OK" if you are working.');
    return {
      available: result.success,
      model: geminiConfig.model,
      responseTime: result.responseTime,
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
};

/**
 * Chat with streaming response (SSE)
 * @param {object} taskContext - Task information
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @param {Function} onChunk - Callback function for each chunk
 * @param {Function} onComplete - Callback function when streaming is complete
 * @param {Function} onError - Callback function for errors
 * @returns {Promise<void>}
 */
const chatStreamAboutTask = async (
  taskContext,
  message,
  history = [],
  onChunk,
  onComplete,
  onError
) => {
  const startTime = Date.now();

  try {
    const currentModel = getModel();

    // Build system context
    const systemContext = `Saya ingin membahas task berikut:

Task: ${taskContext.title}
Status: ${taskContext.status}
Priority: ${taskContext.priority}
Description: ${taskContext.description || "No description"}
Assignee: ${taskContext.assignee?.full_name || "Unassigned"}
Story Points: ${taskContext.story_points || "Not estimated"}
Project: ${taskContext.project?.name || "Unknown"}

Tolong bantu saya dengan pertanyaan tentang task ini. Jawab dalam bahasa yang sama dengan pertanyaan user.`;

    // Build history for Gemini
    const fullHistory =
      history.length === 0
        ? [
            { role: "user", content: systemContext },
            {
              role: "assistant",
              content:
                "Baik, saya sudah memahami task tersebut. Silakan ajukan pertanyaan atau minta bantuan terkait task ini.",
            },
          ]
        : [
            { role: "user", content: systemContext },
            {
              role: "assistant",
              content:
                "Baik, saya sudah memahami task tersebut. Mari kita lanjutkan diskusi.",
            },
            ...history,
          ];

    // Convert history to Gemini format
    const geminiHistory = fullHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chatSession = currentModel.startChat({
      history: geminiHistory,
    });

    // Use streaming
    const result = await chatSession.sendMessageStream(message);

    let fullText = "";
    let tokensUsed = {
      prompt: 0,
      completion: 0,
      total: 0,
    };

    // Process stream chunks
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    // Get final response for token usage
    const response = await result.response;
    const usageMetadata = response.usageMetadata || {};
    tokensUsed = {
      prompt: usageMetadata.promptTokenCount || 0,
      completion: usageMetadata.candidatesTokenCount || 0,
      total: usageMetadata.totalTokenCount || 0,
    };

    onComplete({
      success: true,
      text: fullText,
      tokensUsed,
      responseTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error("[Gemini] Error in streaming chat:", error.message);
    onError({
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime,
    });
  }
};

/**
 * Simple streaming chat without task context
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @param {Function} onChunk - Callback function for each chunk
 * @param {Function} onComplete - Callback function when streaming is complete
 * @param {Function} onError - Callback function for errors
 * @returns {Promise<void>}
 */
const chatStream = async (
  message,
  history = [],
  onChunk,
  onComplete,
  onError
) => {
  const startTime = Date.now();

  try {
    const currentModel = getModel();

    // Convert history to Gemini format
    const geminiHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chatSession = currentModel.startChat({
      history: geminiHistory,
    });

    // Use streaming
    const result = await chatSession.sendMessageStream(message);

    let fullText = "";
    let tokensUsed = {
      prompt: 0,
      completion: 0,
      total: 0,
    };

    // Process stream chunks
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    // Get final response for token usage
    const response = await result.response;
    const usageMetadata = response.usageMetadata || {};
    tokensUsed = {
      prompt: usageMetadata.promptTokenCount || 0,
      completion: usageMetadata.candidatesTokenCount || 0,
      total: usageMetadata.totalTokenCount || 0,
    };

    onComplete({
      success: true,
      text: fullText,
      tokensUsed,
      responseTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error("[Gemini] Error in streaming chat:", error.message);
    onError({
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime,
    });
  }
};

module.exports = {
  initialize,
  generateContent,
  chat,
  generateTaskDescription,
  suggestSprintTasks,
  generateProjectInsights,
  chatAboutTask,
  healthCheck,
  chatStreamAboutTask,
  chatStream,
};
