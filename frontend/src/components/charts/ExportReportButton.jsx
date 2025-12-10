/**
 * ExportReportButton Component
 *
 * Tombol untuk export report ke PDF atau Excel
 */

import React, { useState } from "react";
import {
  exportProjectPDF,
  exportProjectExcel,
  exportSprintPDF,
  exportSprintExcel,
} from "../../services/reportService";

const ExportReportButton = ({
  projectId,
  sprintId,
  projectName,
  sprintName,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const handleExport = async (type, format) => {
    setLoading(true);
    setLoadingType(`${type}-${format}`);

    try {
      if (type === "project" && projectId) {
        if (format === "pdf") {
          await exportProjectPDF(projectId);
        } else {
          await exportProjectExcel(projectId);
        }
      } else if (type === "sprint" && sprintId) {
        if (format === "pdf") {
          await exportSprintPDF(sprintId);
        } else {
          await exportSprintExcel(sprintId);
        }
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Gagal mengexport report. Silakan coba lagi.");
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export Report
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            {/* Project Export */}
            {projectId && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <p className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Project Report
                </p>
                <p className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {projectName || `Project #${projectId}`}
                </p>
                <div className="flex gap-2 px-2 py-2">
                  <button
                    onClick={() => handleExport("project", "pdf")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingType === "project-pdf" ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 17H8v-2h1.5v2zm0-3H8v-2h1.5v2zm0-3H8V9h1.5v2zm3.5 6h-2v-2h2v2zm0-3h-2v-2h2v2zm0-3h-2V9h2v2zm2.5 0h-1V9h1v2z" />
                      </svg>
                    )}
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("project", "excel")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingType === "project-excel" ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 13h-2v2H9v-2H7v-2h2v-2h2v2h2v2zm0-6V3.5L18.5 9H13z" />
                      </svg>
                    )}
                    Excel
                  </button>
                </div>
              </div>
            )}

            {/* Sprint Export */}
            {sprintId && (
              <div className="p-2">
                <p className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Sprint Report
                </p>
                <p className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {sprintName || `Sprint #${sprintId}`}
                </p>
                <div className="flex gap-2 px-2 py-2">
                  <button
                    onClick={() => handleExport("sprint", "pdf")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingType === "sprint-pdf" ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 17H8v-2h1.5v2zm0-3H8v-2h1.5v2zm0-3H8V9h1.5v2zm3.5 6h-2v-2h2v2zm0-3h-2v-2h2v2zm0-3h-2V9h2v2zm2.5 0h-1V9h1v2z" />
                      </svg>
                    )}
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("sprint", "excel")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingType === "sprint-excel" ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 13h-2v2H9v-2H7v-2h2v-2h2v2h2v2zm0-6V3.5L18.5 9H13z" />
                      </svg>
                    )}
                    Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportReportButton;
