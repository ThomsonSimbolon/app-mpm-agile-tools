/**
 * AI Dashboard Page
 *
 * Admin dashboard untuk monitoring AI usage dan settings
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAiStatus, getAiUsageStats } from "../services/aiService";
import { AiButton, AiChatPanelStream } from "../components/ai";
import Card from "../components/common/Card";
import toast from "react-hot-toast";

const AiDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState("7d"); // 7d, 30d, 90d
  const [showChatDemo, setShowChatDemo] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statusRes, statsRes] = await Promise.all([
        getAiStatus(),
        getAiUsageStats({ range: dateRange }),
      ]);

      if (statusRes.success) {
        setStatus(statusRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      toast.error("Failed to load AI dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color = "purple" }) => {
    const colorClasses = {
      purple: "from-purple-500 to-indigo-600",
      blue: "from-blue-500 to-cyan-600",
      green: "from-green-500 to-emerald-600",
      orange: "from-orange-500 to-red-600",
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${colorClasses[color]}`}></div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {title}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <div
              className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color]} text-white`}
            >
              {icon}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <svg
                className="w-8 h-8 text-purple-600"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L13.09 8.26L19 9L13.91 11.74L15 18L12 13.5L9 18L10.09 11.74L5 9L10.91 8.26L12 2Z"
                  fill="currentColor"
                />
              </svg>
              AI Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Monitor dan kelola fitur AI
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <AiButton onClick={loadDashboardData}>Refresh</AiButton>
          </div>
        </div>

        {/* Status Banner */}
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            status?.available
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              status?.available ? "bg-green-500" : "bg-red-500"
            } animate-pulse`}
          ></div>
          <span className="font-medium">
            AI Service: {status?.available ? "Online" : "Offline"}
          </span>
          {status?.model && (
            <span className="text-sm opacity-75">| Model: {status.model}</span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Requests"
            value={stats?.totalRequests?.toLocaleString() || "0"}
            subtitle={`${
              dateRange === "7d"
                ? "Last 7 days"
                : dateRange === "30d"
                ? "Last 30 days"
                : "Last 90 days"
            }`}
            color="purple"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          />

          <StatCard
            title="Total Tokens Used"
            value={stats?.totalTokens?.toLocaleString() || "0"}
            subtitle="Prompt + Response"
            color="blue"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            }
          />

          <StatCard
            title="Cache Hit Rate"
            value={`${stats?.cacheHitRate?.toFixed(1) || "0"}%`}
            subtitle="Tokens saved from cache"
            color="green"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            }
          />

          <StatCard
            title="Avg Response Time"
            value={`${stats?.avgResponseTime?.toFixed(0) || "0"}ms`}
            subtitle="Average latency"
            color="orange"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Usage by Feature */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Usage by Feature
            </h3>
            <div className="space-y-4">
              {stats?.byFeature?.map((feature, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.name}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {feature.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                      style={{
                        width: `${
                          (feature.count / (stats?.totalRequests || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No usage data available
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Users
            </h3>
            <div className="space-y-3">
              {stats?.topUsers?.map((userStat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium">
                      {index + 1}
                    </div>
                    <span className="text-gray-900 dark:text-white">
                      {userStat.username}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {userStat.requests.toLocaleString()} requests
                  </span>
                </div>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No user data available
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Error Rate & Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Request Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.successCount?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Success
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats?.errorCount?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats?.timeoutCount?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Timeouts
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats?.rateLimitedCount?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Rate Limited
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Configuration
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Model</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {status?.model || "gemini-1.5-flash"}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">
                  Rate Limit
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {status?.rateLimit?.perMinute || "15"} req/min
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">
                  Queue Status
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {status?.queueEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">
                  Cache TTL
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {status?.cacheTTL || "1 hour"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Chat Demo Section */}
        <div className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Chat Demo (Streaming)
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Test fitur streaming chat dengan AI
                </p>
              </div>
              <AiButton
                onClick={() => setShowChatDemo(!showChatDemo)}
                variant={showChatDemo ? "primary" : "secondary"}
              >
                {showChatDemo ? "Tutup Chat" : "Buka Chat Demo"}
              </AiButton>
            </div>
            {showChatDemo && (
              <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <AiChatPanelStream onClose={() => setShowChatDemo(false)} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiDashboard;
