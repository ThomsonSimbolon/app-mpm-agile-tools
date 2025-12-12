/**
 * Task Time Logs Component
 * Handles time tracking for tasks
 */

import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Edit2, X, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as timeLogService from "../../services/timeLogService";

export default function TaskTimeLogs({ taskId, onUpdate }) {
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    hours: "",
    minutes: "",
    description: "",
    logDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadTimeLogs();
  }, [taskId]);

  const loadTimeLogs = async () => {
    try {
      setLoading(true);
      const result = await timeLogService.getTaskTimeLogs(taskId);
      setTimeLogs(result.data || []);
    } catch (error) {
      console.error("Failed to load time logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hours = parseInt(formData.hours || 0);
    const minutes = parseInt(formData.minutes || 0);
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 0) {
      toast.error("Please enter valid time");
      return;
    }

    try {
      const payload = {
        duration: totalMinutes,
        description: formData.description,
        logDate: formData.logDate,
      };

      if (editingId) {
        await timeLogService.updateTimeLog(editingId, payload);
        toast.success("Time log updated");
      } else {
        await timeLogService.createTimeLog(taskId, payload);
        toast.success("Time logged");
      }

      loadTimeLogs();
      resetForm();
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to save time log");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this time log?")) return;

    try {
      await timeLogService.deleteTimeLog(id);
      setTimeLogs(timeLogs.filter((log) => log.id !== id));
      toast.success("Time log deleted");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to delete time log");
    }
  };

  const handleEdit = (log) => {
    const hours = Math.floor(log.duration / 60);
    const minutes = log.duration % 60;
    setFormData({
      hours: hours.toString(),
      minutes: minutes.toString(),
      description: log.description || "",
      logDate: log.logDate
        ? log.logDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setEditingId(log.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      hours: "",
      minutes: "",
      description: "",
      logDate: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getTotalTime = () => {
    return timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Clock size={16} />
          Time Tracking
          {timeLogs.length > 0 && (
            <span className="text-xs font-normal text-gray-500">
              (Total: {formatDuration(getTotalTime())})
            </span>
          )}
        </h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Log Time
        </button>
      </div>

      {/* Time Log Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 mb-4"
        >
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hours</label>
              <input
                type="number"
                min="0"
                value={formData.hours}
                onChange={(e) =>
                  setFormData({ ...formData, hours: e.target.value })
                }
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={formData.minutes}
                onChange={(e) =>
                  setFormData({ ...formData, minutes: e.target.value })
                }
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={formData.logDate}
              onChange={(e) =>
                setFormData({ ...formData, logDate: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What did you work on?"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Check size={14} />
              {editingId ? "Update" : "Log Time"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 px-4 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Time Logs List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : timeLogs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No time logged yet
        </p>
      ) : (
        <div className="space-y-2">
          {timeLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 group"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg font-semibold text-sm">
                  {formatDuration(log.duration)}
                </span>
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {log.description || "Time logged"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(log.logDate)} • {log.User?.name || "You"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(log)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
