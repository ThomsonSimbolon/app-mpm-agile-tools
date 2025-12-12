/**
 * Task Activity Feed Component
 * Displays activity history for a task
 */

import { useState, useEffect } from "react";
import {
  Activity,
  Loader2,
  RefreshCw,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  Tag,
  GitBranch,
} from "lucide-react";
import * as activityService from "../../services/activityService";

export default function TaskActivityFeed({ taskId, projectId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [projectId, taskId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Load project activities and filter by task if needed
      const result = await activityService.getProjectActivities(projectId);
      // Filter activities related to this task
      const taskActivities = (result.data || []).filter(
        (activity) => activity.taskId === taskId || activity.entityId === taskId
      );
      setActivities(taskActivities);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      comment: MessageSquare,
      attachment: Paperclip,
      label: Tag,
      status: GitBranch,
      assign: User,
      create: Activity,
      update: Activity,
      delete: Activity,
    };
    const Icon = iconMap[type?.toLowerCase()] || Activity;
    return <Icon size={14} />;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      comment: "bg-blue-100 text-blue-600",
      attachment: "bg-purple-100 text-purple-600",
      label: "bg-yellow-100 text-yellow-600",
      status: "bg-green-100 text-green-600",
      assign: "bg-orange-100 text-orange-600",
      create: "bg-teal-100 text-teal-600",
      update: "bg-indigo-100 text-indigo-600",
      delete: "bg-red-100 text-red-600",
    };
    return colorMap[type?.toLowerCase()] || "bg-gray-100 text-gray-600";
  };

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Activity size={16} />
          Activity
        </h4>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6">
          <Activity size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No activity yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={activity.id || index}
                className="relative flex gap-3 pl-1"
              >
                {/* Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getActivityColor(
                    activity.action || activity.type
                  )}`}
                >
                  {getActivityIcon(activity.action || activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-medium">
                      {activity.User?.name || activity.userName || "Someone"}
                    </span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">
                      {activity.description ||
                        activity.action ||
                        "performed an action"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {formatTimeAgo(activity.createdAt)}
                  </p>

                  {/* Additional details */}
                  {activity.details && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      {typeof activity.details === "string"
                        ? activity.details
                        : JSON.stringify(activity.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
