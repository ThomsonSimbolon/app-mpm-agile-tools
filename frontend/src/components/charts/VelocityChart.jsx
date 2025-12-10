/**
 * VelocityChart Component
 *
 * Menampilkan velocity chart untuk tracking produktivitas tim per sprint
 */

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getVelocityData } from "../../services/reportService";

const VelocityChart = ({ projectId, limit = 10, className = "" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getVelocityData(projectId, limit);
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || "Gagal memuat data velocity");
        }
      } catch (err) {
        setError(err.message || "Gagal memuat data velocity");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, limit]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.velocityData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          📊 Velocity Chart
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p>{error || "Belum ada sprint yang selesai"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.velocityData.map((sprint) => ({
    name:
      sprint.sprintName.length > 15
        ? sprint.sprintName.substring(0, 12) + "..."
        : sprint.sprintName,
    fullName: sprint.sprintName,
    velocity: sprint.velocity,
    tasks: sprint.completedTasks,
  }));

  const getTrendIcon = () => {
    switch (data.trend) {
      case "increasing":
        return (
          <span className="text-green-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Meningkat
          </span>
        );
      case "decreasing":
        return (
          <span className="text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Menurun
          </span>
        );
      default:
        return (
          <span className="text-gray-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Stabil
          </span>
        );
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800 dark:text-white mb-1">
            {data.fullName}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Velocity: {data.velocity} pts
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tasks: {data.tasks}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          📊 Velocity Chart
        </h3>
        <div className="text-sm">{getTrendIcon()}</div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Avg Velocity</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {data.averageVelocity} pts
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Sprints</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            {data.totalSprints}
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine
              y={data.averageVelocity}
              stroke="#9CA3AF"
              strokeDasharray="5 5"
              label={{
                value: "Avg",
                position: "right",
                fill: "#9CA3AF",
                fontSize: 10,
              }}
            />
            <Bar
              dataKey="velocity"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
              name="Story Points"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VelocityChart;
