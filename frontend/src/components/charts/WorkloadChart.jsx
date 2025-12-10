/**
 * WorkloadChart Component
 *
 * Menampilkan distribusi beban kerja per anggota tim
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
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { getWorkloadDistribution } from "../../services/reportService";

const COLORS = [
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#6366F1", // indigo
  "#14B8A6", // teal
];

const WorkloadChart = ({ projectId, className = "" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("bar"); // "bar" or "pie"

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getWorkloadDistribution(projectId);
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || "Gagal memuat data workload");
        }
      } catch (err) {
        setError(err.message || "Gagal memuat data workload");
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
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          👥 Workload Distribution
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>{error || "Tidak ada data"}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data (exclude unassigned if empty)
  const chartData = data.workloadData
    .filter((member) => member.taskCount > 0 || member.userId !== null)
    .map((member, index) => ({
      name:
        member.fullName.length > 12
          ? member.fullName.substring(0, 10) + "..."
          : member.fullName,
      fullName: member.fullName,
      tasks: member.taskCount,
      points: member.totalPoints,
      color: COLORS[index % COLORS.length],
      inProgress: member.byStatus?.in_progress || 0,
      todo: member.byStatus?.todo || 0,
      review: member.byStatus?.in_review || 0,
    }));

  const pieData = chartData.map((item, index) => ({
    name: item.fullName,
    value: item.tasks,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800 dark:text-white mb-2">
            {data.fullName}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-purple-600 dark:text-purple-400">
              Total Tasks: {data.tasks}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Story Points: {data.points}
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
              <p className="text-yellow-600">To Do: {data.todo}</p>
              <p className="text-blue-600">In Progress: {data.inProgress}</p>
              <p className="text-orange-600">In Review: {data.review}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            {payload[0].value} tasks
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
          👥 Workload Distribution
        </h3>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode("bar")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === "bar"
                ? "bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setViewMode("pie")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === "pie"
                ? "bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Pie
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Total Tasks
          </p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">
            {data.totals.totalTasks}
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-xs">Assigned</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {data.totals.assignedTasks}
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-xs">Unassigned</p>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {data.totals.unassignedTasks}
          </p>
        </div>
      </div>

      <div className="h-64">
        {viewMode === "bar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="tasks" name="Tasks" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 1 }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default WorkloadChart;
