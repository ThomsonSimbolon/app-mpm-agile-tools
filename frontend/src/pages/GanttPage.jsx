/**
 * Gantt Chart Page
 * Project timeline visualization with task dependencies
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Gantt from "frappe-gantt";
import {
  BarChart3,
  Plus,
  Filter,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Link as LinkIcon,
  Unlink,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import * as calendarService from "../services/calendarService";
import { projectService } from "../services/projectService";

export default function GanttPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const ganttRef = useRef(null);
  const ganttInstance = useRef(null);

  // State
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("Week");
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Dependency form
  const [dependencyForm, setDependencyForm] = useState({
    predecessor_id: "",
    successor_id: "",
    dependency_type: "FS",
    lag_days: 0,
  });

  // Milestone form
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    description: "",
    target_date: "",
    color: "#10B981",
  });

  // Load data
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Initialize Gantt chart when data is loaded
  useEffect(() => {
    if (!loading && tasks.length > 0 && ganttRef.current) {
      initGantt();
    }
  }, [loading, tasks, viewMode]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      // Load project details
      const projectRes = await projectService.getById(projectId);
      setProject(projectRes.data);

      // Load Gantt data (tasks with dates)
      const ganttRes = await calendarService.getGanttData(projectId);
      setTasks(ganttRes.data?.tasks || []);
      setDependencies(ganttRes.data?.dependencies || []);

      // Load milestones
      const milestonesRes = await calendarService.getProjectMilestones(
        projectId
      );
      setMilestones(milestonesRes.data || []);
    } catch (error) {
      console.error("Error loading project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const initGantt = () => {
    // Clear existing Gantt
    if (ganttInstance.current) {
      ganttRef.current.innerHTML = "";
    }

    // Transform tasks to Gantt format
    const ganttTasks = tasks.map((task) => ({
      id: task.id.toString(),
      name: `${task.task_key}: ${task.title}`,
      start:
        task.start_date ||
        task.due_date ||
        new Date().toISOString().split("T")[0],
      end:
        task.due_date ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      progress: task.progress_percentage || 0,
      dependencies: getDependencyString(task.id),
      custom_class: getTaskClass(task.status),
    }));

    // Add milestones
    milestones.forEach((milestone) => {
      ganttTasks.push({
        id: `milestone-${milestone.id}`,
        name: `🎯 ${milestone.name}`,
        start: milestone.target_date,
        end: milestone.target_date,
        progress: milestone.status === "completed" ? 100 : 0,
        custom_class: "milestone",
      });
    });

    if (ganttTasks.length === 0) {
      return;
    }

    try {
      ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: viewMode,
        date_format: "YYYY-MM-DD",
        popup_trigger: "click",
        custom_popup_html: (task) => {
          return `
            <div class="gantt-popup">
              <h5 class="font-semibold">${task.name}</h5>
              <p class="text-sm text-gray-600">
                ${new Date(task.start).toLocaleDateString()} - ${new Date(
            task.end
          ).toLocaleDateString()}
              </p>
              <p class="text-sm">Progress: ${task.progress}%</p>
            </div>
          `;
        },
        on_click: (task) => {
          if (task.id.startsWith("milestone-")) {
            // Handle milestone click
            const milestoneId = task.id.replace("milestone-", "");
            const milestone = milestones.find(
              (m) => m.id.toString() === milestoneId
            );
            if (milestone) {
              toast.info(`Milestone: ${milestone.name}`);
            }
          } else {
            setSelectedTask(tasks.find((t) => t.id.toString() === task.id));
          }
        },
        on_date_change: async (task, start, end) => {
          if (task.id.startsWith("milestone-")) {
            return;
          }

          try {
            await calendarService.updateTaskDates(task.id, {
              start_date: start.toISOString().split("T")[0],
              due_date: end.toISOString().split("T")[0],
            });
            toast.success("Task dates updated");
            loadProjectData();
          } catch (error) {
            toast.error("Failed to update task dates");
          }
        },
        on_progress_change: async (task, progress) => {
          if (task.id.startsWith("milestone-")) {
            return;
          }

          try {
            await calendarService.updateTaskProgress(task.id, progress);
            toast.success("Progress updated");
          } catch (error) {
            toast.error("Failed to update progress");
          }
        },
      });
    } catch (error) {
      console.error("Error initializing Gantt:", error);
    }
  };

  const getDependencyString = (taskId) => {
    const deps = dependencies
      .filter((d) => d.successor_id === taskId)
      .map((d) => d.predecessor_id.toString());
    return deps.join(", ");
  };

  const getTaskClass = (status) => {
    const classes = {
      backlog: "gantt-backlog",
      todo: "gantt-todo",
      in_progress: "gantt-progress",
      in_review: "gantt-review",
      done: "gantt-done",
    };
    return classes[status] || "";
  };

  const handleCreateDependency = async (e) => {
    e.preventDefault();

    if (dependencyForm.predecessor_id === dependencyForm.successor_id) {
      toast.error("Cannot create self-dependency");
      return;
    }

    try {
      await calendarService.createTaskDependency(dependencyForm);
      toast.success("Dependency created");
      setShowDependencyModal(false);
      setDependencyForm({
        predecessor_id: "",
        successor_id: "",
        dependency_type: "FS",
        lag_days: 0,
      });
      loadProjectData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create dependency"
      );
    }
  };

  const handleDeleteDependency = async (id) => {
    if (!confirm("Remove this dependency?")) return;

    try {
      await calendarService.deleteTaskDependency(id);
      toast.success("Dependency removed");
      loadProjectData();
    } catch (error) {
      toast.error("Failed to remove dependency");
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();

    try {
      await calendarService.createMilestone({
        ...milestoneForm,
        project_id: projectId,
      });
      toast.success("Milestone created");
      setShowMilestoneModal(false);
      setMilestoneForm({
        name: "",
        description: "",
        target_date: "",
        color: "#10B981",
      });
      loadProjectData();
    } catch (error) {
      toast.error("Failed to create milestone");
    }
  };

  const handleZoom = (direction) => {
    const modes = ["Day", "Week", "Month", "Year"];
    const currentIndex = modes.indexOf(viewMode);
    const newIndex =
      direction === "in"
        ? Math.max(0, currentIndex - 1)
        : Math.min(modes.length - 1, currentIndex + 1);
    setViewMode(modes[newIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gantt Chart</h1>
              <p className="text-sm text-gray-500">
                {project?.name || "Project Timeline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Selector */}
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
              <option value="Year">Year</option>
            </select>

            {/* Zoom Controls */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => handleZoom("in")}
                className="p-2 hover:bg-gray-100 border-r"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom("out")}
                className="p-2 hover:bg-gray-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* Add Milestone */}
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Target className="w-4 h-4" />
              Add Milestone
            </button>

            {/* Add Dependency */}
            <button
              onClick={() => setShowDependencyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Add Dependency
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-400" />
            <span className="text-sm text-gray-600">Backlog</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-sm text-gray-600">To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-sm text-gray-600">In Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-sm text-gray-600">Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-600">Milestone</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No tasks with dates found</p>
              <p className="text-sm">
                Add start/due dates to your tasks to see them in the Gantt chart
              </p>
            </div>
          ) : (
            <div ref={ganttRef} className="gantt-container" />
          )}
        </div>

        {/* Dependencies List */}
        {dependencies.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Dependencies</h3>
            <div className="space-y-2">
              {dependencies.map((dep) => {
                const predecessor = tasks.find(
                  (t) => t.id === dep.predecessor_id
                );
                const successor = tasks.find((t) => t.id === dep.successor_id);
                return (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {predecessor?.task_key || "Task"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {successor?.task_key || "Task"}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {dep.dependency_type}
                      </span>
                      {dep.lag_days !== 0 && (
                        <span className="text-xs text-gray-500">
                          +{dep.lag_days} days
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDependency(dep.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Milestones List */}
        {milestones.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Milestones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="p-4 border rounded-lg"
                  style={{
                    borderLeftColor: milestone.color,
                    borderLeftWidth: 4,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{milestone.name}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        milestone.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : milestone.status === "overdue"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {milestone.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(milestone.target_date).toLocaleDateString()}
                  </p>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {milestone.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dependency Modal */}
      {showDependencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Dependency</h2>
              <button
                onClick={() => setShowDependencyModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDependency} className="p-4 space-y-4">
              {/* Predecessor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Predecessor Task (must finish first)
                </label>
                <select
                  value={dependencyForm.predecessor_id}
                  onChange={(e) =>
                    setDependencyForm((prev) => ({
                      ...prev,
                      predecessor_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select task...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.task_key}: {task.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Successor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Successor Task (depends on predecessor)
                </label>
                <select
                  value={dependencyForm.successor_id}
                  onChange={(e) =>
                    setDependencyForm((prev) => ({
                      ...prev,
                      successor_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select task...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.task_key}: {task.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dependency Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dependency Type
                </label>
                <select
                  value={dependencyForm.dependency_type}
                  onChange={(e) =>
                    setDependencyForm((prev) => ({
                      ...prev,
                      dependency_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FS">Finish-to-Start (FS)</option>
                  <option value="SS">Start-to-Start (SS)</option>
                  <option value="FF">Finish-to-Finish (FF)</option>
                  <option value="SF">Start-to-Finish (SF)</option>
                </select>
              </div>

              {/* Lag Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lag Days (delay between tasks)
                </label>
                <input
                  type="number"
                  value={dependencyForm.lag_days}
                  onChange={(e) =>
                    setDependencyForm((prev) => ({
                      ...prev,
                      lag_days: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowDependencyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Dependency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Milestone</h2>
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestone Name *
                </label>
                <input
                  type="text"
                  value={milestoneForm.name}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Phase 1 Complete"
                  required
                />
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={milestoneForm.target_date}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      target_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Milestone description..."
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={milestoneForm.color}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Gantt Styles */}
      <style>{`
        .gantt-container {
          min-height: 400px;
        }
        .gantt .bar-wrapper .bar {
          border-radius: 4px;
        }
        .gantt .bar-wrapper .bar-label {
          font-size: 12px;
        }
        .gantt-backlog .bar {
          fill: #9CA3AF !important;
        }
        .gantt-todo .bar {
          fill: #3B82F6 !important;
        }
        .gantt-progress .bar {
          fill: #F59E0B !important;
        }
        .gantt-review .bar {
          fill: #8B5CF6 !important;
        }
        .gantt-done .bar {
          fill: #10B981 !important;
        }
        .milestone .bar {
          fill: #10B981 !important;
          rx: 50%;
          ry: 50%;
        }
        .gantt-popup {
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
}
