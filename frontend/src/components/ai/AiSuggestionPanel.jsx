/**
 * AiSuggestionPanel Component
 *
 * Panel untuk menampilkan saran AI (generate description, estimate story points)
 */

import React, { useState } from "react";
import AiButton from "./AiButton";
import {
  generateTaskDescription,
  estimateStoryPoints,
} from "../../services/aiService";

// Daftar bahasa yang tersedia
const LANGUAGE_OPTIONS = [
  { code: "id", label: "Bahasa Indonesia" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
];

const AiSuggestionPanel = ({
  taskTitle,
  taskDescription,
  projectContext,
  onApplyDescription,
  onApplyStoryPoints,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("description");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("id"); // Default Bahasa Indonesia

  // Generated content
  const [generatedDescription, setGeneratedDescription] = useState(null);
  const [estimatedPoints, setEstimatedPoints] = useState(null);
  const [estimation, setEstimation] = useState(null);

  const handleGenerateDescription = async () => {
    if (!taskTitle) {
      setError("Judul task diperlukan untuk generate deskripsi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateTaskDescription({
        title: taskTitle,
        projectContext: projectContext || "",
        language: selectedLanguage,
      });

      if (response.success) {
        setGeneratedDescription(response.data.description);
      } else {
        throw new Error(response.message || "Failed to generate description");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Gagal generate deskripsi"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEstimatePoints = async () => {
    if (!taskTitle) {
      setError("Judul task diperlukan untuk estimasi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await estimateStoryPoints({
        title: taskTitle,
        description: taskDescription || generatedDescription || "",
      });

      if (response.success) {
        setEstimatedPoints(response.data.storyPoints);
        setEstimation(response.data);
      } else {
        throw new Error(response.message || "Failed to estimate story points");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal estimasi story points"
      );
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "description", label: "Generate Deskripsi" },
    { id: "estimate", label: "Estimasi Story Points" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
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
          <span className="font-semibold">AI Suggestions</span>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-purple-600 border-b-2 border-purple-600 dark:text-purple-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {activeTab === "description" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate deskripsi task otomatis berdasarkan judul dan konteks
              project.
            </p>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Bahasa Output:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Judul Task:
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {taskTitle || "(Belum ada judul)"}
              </p>
            </div>

            {!generatedDescription ? (
              <AiButton
                onClick={handleGenerateDescription}
                loading={loading}
                disabled={!taskTitle}
                className="w-full"
              >
                Generate Deskripsi
              </AiButton>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                    Deskripsi yang dihasilkan:
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {generatedDescription}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onApplyDescription?.(generatedDescription);
                      onClose?.();
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Gunakan Deskripsi Ini
                  </button>
                  <button
                    onClick={handleGenerateDescription}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "estimate" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estimasi story points berdasarkan kompleksitas task.
            </p>

            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Judul Task:
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {taskTitle || "(Belum ada judul)"}
              </p>
              {(taskDescription || generatedDescription) && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">
                    Deskripsi:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {taskDescription || generatedDescription}
                  </p>
                </>
              )}
            </div>

            {!estimatedPoints ? (
              <AiButton
                onClick={handleEstimatePoints}
                loading={loading}
                disabled={!taskTitle}
                className="w-full"
              >
                Estimasi Story Points
              </AiButton>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                    Estimasi Story Points:
                  </p>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {estimatedPoints}
                  </div>
                  {estimation?.confidence && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Confidence: {Math.round(estimation.confidence * 100)}%
                    </p>
                  )}
                </div>

                {estimation?.reasoning && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Alasan:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {estimation.reasoning}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onApplyStoryPoints?.(estimatedPoints);
                      onClose?.();
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Gunakan Estimasi Ini
                  </button>
                  <button
                    onClick={handleEstimatePoints}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Re-estimate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSuggestionPanel;
