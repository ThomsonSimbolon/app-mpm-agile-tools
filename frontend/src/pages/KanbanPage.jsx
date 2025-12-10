import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { projectService } from "../services/projectService";
import { taskService } from "../services/taskService";
import Header from "../components/layout/Header";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import KanbanBoard from "../components/kanban/KanbanBoard";
import { Plus, ArrowLeft, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from "../contexts/SocketContext";

export default function KanbanPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const { joinProject, leaveProject, onTaskUpdate } = useSocket();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Join project room for real-time updates
  useEffect(() => {
    if (projectId) {
      joinProject(projectId);
      return () => {
        leaveProject(projectId);
      };
    }
  }, [projectId, joinProject, leaveProject]);

  // Listen for real-time task updates
  useEffect(() => {
    const unsubscribe = onTaskUpdate((data) => {
      console.log("[Kanban] Real-time task update:", data);
      // Refresh board when task is updated
      setRefreshKey((prev) => prev + 1);
    });

    return unsubscribe;
  }, [onTaskUpdate]);

  const loadProject = async () => {
    try {
      const result = await projectService.getById(projectId);
      if (result.success) {
        setProject(result.data.project);
      }
    } catch (error) {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const result = await taskService.create(projectId, formData);
      if (result.success) {
        toast.success("Task created successfully!");
        setShowCreateModal(false);
        setFormData({ title: "", description: "", priority: "medium" });
        setRefreshKey((prev) => prev + 1); // Force refresh
      }
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {project?.description || "No description"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/projects">
              <Button
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </Button>
            </Link>
            <Link to={`/projects/${projectId}/sprints`}>
              <Button
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <TrendingUp size={20} />
                <span>Sprints</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <KanbanBoard key={refreshKey} projectId={projectId} />

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Create New Task
              </h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <Input
                  label="Task Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="Enter task title"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Optional task description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <Button type="submit" variant="primary" className="flex-1">
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
