import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { sprintService } from "../services/sprintService";
import { projectService } from "../services/projectService";
import Header from "../components/layout/Header";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { Plus, ArrowLeft, Play, CheckCircle, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function SprintPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectResult, sprintsResult] = await Promise.all([
        projectService.getById(projectId),
        sprintService.getByProject(projectId),
      ]);

      if (projectResult.success) {
        setProject(projectResult.data.project);
      }
      if (sprintsResult.success) {
        setSprints(sprintsResult.data.sprints || []);
      }
    } catch (error) {
      toast.error("Failed to load sprints");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await sprintService.create(projectId, formData);
      if (result.success) {
        toast.success("Sprint created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", goal: "", start_date: "", end_date: "" });
        loadData();
      }
    } catch (error) {
      toast.error("Failed to create sprint");
    }
  };

  const handleStart = async (sprintId) => {
    try {
      const result = await sprintService.start(sprintId);
      if (result.success) {
        toast.success("Sprint started!");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to start sprint");
    }
  };

  const handleComplete = async (sprintId) => {
    try {
      const result = await sprintService.complete(sprintId);
      if (result.success) {
        toast.success("Sprint completed!");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to complete sprint");
    }
  };

  const statusColors = {
    planning: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sprints - {project?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your sprint cycles
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link to={`/projects/${projectId}/kanban`}>
              <Button
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <ArrowLeft size={20} />
                <span>Back to Kanban</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>New Sprint</span>
            </Button>
          </div>
        </div>

        {/* Sprints List */}
        {sprints.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <TrendingUp className="mx-auto text-gray-400" size={64} />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No sprints yet
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Get started by creating your first sprint
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
              >
                Create Sprint
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <Card key={sprint.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {sprint.name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[sprint.status]
                        }`}
                      >
                        {sprint.status}
                      </span>
                    </div>

                    {sprint.goal && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Goal: {sprint.goal}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        Start:{" "}
                        {new Date(sprint.start_date).toLocaleDateString()}
                      </span>
                      <span>
                        End: {new Date(sprint.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {sprint.status === "planning" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStart(sprint.id)}
                        className="flex items-center gap-2"
                      >
                        <Play size={16} />
                        <span>Start</span>
                      </Button>
                    )}
                    {sprint.status === "active" && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleComplete(sprint.id)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        <span>Complete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Create New Sprint
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Sprint Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Sprint 1"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Goal (Optional)
                  </label>
                  <textarea
                    value={formData.goal}
                    onChange={(e) =>
                      setFormData({ ...formData, goal: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Sprint goal"
                  />
                </div>
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  required
                />
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
