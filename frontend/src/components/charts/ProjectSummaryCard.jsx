/**
 * ProjectSummaryCard Component
 *
 * Menampilkan ringkasan statistik project
 */

import React, { useState, useEffect } from "react";
import { getProjectSummary } from "../../services/reportService";

const ProjectSummaryCard = ({ projectId, className = "" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getProjectSummary(projectId);
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || "Gagal memuat summary");
        }
      } catch (err) {
        setError(err.message || "Gagal memuat summary");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          {error || "Tidak ada data"}
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Tasks",
      value: data.overview.totalTasks,
      icon: "📋",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Completed",
      value: data.overview.completedTasks,
      icon: "✅",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Completion Rate",
      value: `${data.overview.completionRate}%`,
      icon: "📈",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Overdue",
      value: data.overview.overdueTasks,
      icon: "⚠️",
      color:
        data.overview.overdueTasks > 0
          ? "text-red-600 dark:text-red-400"
          : "text-gray-600 dark:text-gray-400",
      bgColor:
        data.overview.overdueTasks > 0
          ? "bg-red-50 dark:bg-red-900/20"
          : "bg-gray-50 dark:bg-gray-700/50",
    },
  ];

  const statusColors = {
    backlog: "bg-gray-200 dark:bg-gray-600",
    todo: "bg-yellow-400 dark:bg-yellow-500",
    in_progress: "bg-blue-400 dark:bg-blue-500",
    in_review: "bg-orange-400 dark:bg-orange-500",
    done: "bg-green-400 dark:bg-green-500",
  };

  const priorityColors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        📊 Project Summary
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-lg p-4 text-center`}
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tasks by Status
          </h4>
          <div className="space-y-2">
            {Object.entries(data.tasksByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-24 capitalize">
                  {status.replace("_", " ")}
                </span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColors[status]} transition-all duration-500`}
                    style={{
                      width: `${
                        data.overview.totalTasks > 0
                          ? (count / data.overview.totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Priority */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tasks by Priority
          </h4>
          <div className="space-y-2">
            {Object.entries(data.tasksByPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-24 capitalize">
                  {priority}
                </span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${priorityColors[priority]} transition-all duration-500`}
                    style={{
                      width: `${
                        data.overview.totalTasks > 0
                          ? (count / data.overview.totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Points */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Story Points Progress
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {data.overview.completedPoints} / {data.overview.totalPoints} pts
          </span>
        </div>
        <div className="mt-2 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
            style={{
              width: `${
                data.overview.totalPoints > 0
                  ? (data.overview.completedPoints /
                      data.overview.totalPoints) *
                    100
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummaryCard;
