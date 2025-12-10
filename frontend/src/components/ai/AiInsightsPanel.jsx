/**
 * AiInsightsPanel Component
 *
 * Panel untuk menampilkan AI insights tentang project
 */

import React, { useState, useEffect } from "react";
import AiButton from "./AiButton";
import { getProjectInsights } from "../../services/aiService";

const AiInsightsPanel = ({ projectId, projectName, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);

  const fetchInsights = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getProjectInsights(projectId);
      if (response.success) {
        setInsights(response.data);
      } else {
        throw new Error(response.message || "Failed to get insights");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal mendapatkan insights"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [projectId]);

  const InsightCard = ({ title, icon, children, color = "purple" }) => {
    const colorClasses = {
      purple:
        "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
      blue: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      green:
        "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      yellow:
        "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
      red: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    };

    return (
      <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h4 className="font-medium text-gray-800 dark:text-gray-200">
            {title}
          </h4>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L13.09 8.26L19 9L13.91 11.74L15 18L12 13.5L9 18L10.09 11.74L5 9L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-semibold">AI Project Insights</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {projectName && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Project:</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {projectName}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Menganalisis project...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
            <AiButton onClick={fetchInsights}>Coba Lagi</AiButton>
          </div>
        )}

        {insights && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            {insights.summary && (
              <InsightCard
                title="Ringkasan Project"
                icon={
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
              >
                <p className="whitespace-pre-wrap">{insights.summary}</p>
              </InsightCard>
            )}

            {/* Health Score */}
            {insights.healthScore !== undefined && (
              <InsightCard
                title="Health Score"
                color={
                  insights.healthScore >= 80
                    ? "green"
                    : insights.healthScore >= 60
                    ? "yellow"
                    : "red"
                }
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">
                    {insights.healthScore}%
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-600">
                      <div
                        className={`h-2 rounded-full ${
                          insights.healthScore >= 80
                            ? "bg-green-500"
                            : insights.healthScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${insights.healthScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </InsightCard>
            )}

            {/* Risks */}
            {insights.risks && insights.risks.length > 0 && (
              <InsightCard
                title="Potensi Risiko"
                color="red"
                icon={
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                }
              >
                <ul className="list-disc list-inside space-y-1">
                  {insights.risks.map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </InsightCard>
            )}

            {/* Recommendations */}
            {insights.recommendations &&
              insights.recommendations.length > 0 && (
                <InsightCard
                  title="Rekomendasi"
                  color="blue"
                  icon={
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  }
                >
                  <ul className="list-disc list-inside space-y-1">
                    {insights.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </InsightCard>
              )}

            {/* Bottlenecks */}
            {insights.bottlenecks && insights.bottlenecks.length > 0 && (
              <InsightCard
                title="Bottlenecks"
                color="yellow"
                icon={
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              >
                <ul className="list-disc list-inside space-y-1">
                  {insights.bottlenecks.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </InsightCard>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {insights && !loading && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <button
            onClick={fetchInsights}
            className="w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          >
            Refresh Insights
          </button>
        </div>
      )}
    </div>
  );
};

export default AiInsightsPanel;
