import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { projectService } from "../services/projectService";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { useRbac } from "../contexts/RbacContext";
import Header from "../components/layout/Header";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import {
  Plus,
  FolderKanban,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  UserPlus,
  X,
  Settings,
  BarChart3,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

// Project role options based on RBAC
const PROJECT_ROLES = [
  {
    value: "project_owner",
    label: "Project Owner",
    description: "Full control over project",
  },
  {
    value: "project_manager",
    label: "Project Manager",
    description: "Manage tasks and team",
  },
  {
    value: "tech_lead",
    label: "Tech Lead",
    description: "Technical decisions and code review",
  },
  {
    value: "qa_tester",
    label: "QA Tester",
    description: "Testing and quality assurance",
  },
  {
    value: "developer",
    label: "Developer",
    description: "Develop features and fix bugs",
  },
  {
    value: "report_viewer",
    label: "Report Viewer",
    description: "View reports only",
  },
  {
    value: "stakeholder",
    label: "Stakeholder",
    description: "View project progress",
  },
];

export default function Projects() {
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = useRbac();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
  });

  // Member management states
  const [projectMembers, setProjectMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadProjects = async () => {
    try {
      const result = await projectService.getAll();
      if (result.success) {
        setProjects(result.data.items || result.data || []);
      }
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Permission checks
  const canCreateProject = () => {
    return (
      hasAnyPermission(["create_project", "manage_all_projects"]) ||
      user?.system_role === "super_admin" ||
      user?.system_role === "admin"
    );
  };

  const canEditProject = (project) => {
    if (user?.system_role === "super_admin" || user?.system_role === "admin")
      return true;
    if (hasPermission("manage_all_projects")) return true;
    return (
      project?.owner_id === user?.id ||
      project?.Members?.some(
        (m) =>
          m.user_id === user?.id &&
          ["project_owner", "project_manager"].includes(m.role)
      )
    );
  };

  const canDeleteProject = (project) => {
    if (user?.system_role === "super_admin" || user?.system_role === "admin")
      return true;
    if (hasPermission("manage_all_projects")) return true;
    return project?.owner_id === user?.id;
  };

  const canManageMembers = (project) => {
    if (user?.system_role === "super_admin" || user?.system_role === "admin")
      return true;
    if (hasPermission("manage_all_projects")) return true;
    return (
      project?.owner_id === user?.id ||
      project?.Members?.some(
        (m) =>
          m.user_id === user?.id &&
          ["project_owner", "project_manager"].includes(m.role)
      )
    );
  };

  // CRUD Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await projectService.create(formData);
      if (result.success) {
        toast.success("Project created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", description: "", status: "active" });
        loadProjects();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const result = await projectService.update(selectedProject.id, formData);
      if (result.success) {
        toast.success("Project updated successfully!");
        setShowEditModal(false);
        setSelectedProject(null);
        setFormData({ name: "", description: "", status: "active" });
        loadProjects();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update project");
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    try {
      const result = await projectService.delete(selectedProject.id);
      if (result.success) {
        toast.success("Project deleted successfully!");
        setShowDeleteModal(false);
        setSelectedProject(null);
        loadProjects();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete project");
    }
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status || "active",
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  // Member Management
  const openMemberModal = async (project) => {
    setSelectedProject(project);
    setShowMemberModal(true);
    setActiveDropdown(null);
    await loadProjectMembers(project.id);
  };

  const loadProjectMembers = async (projectId) => {
    setLoadingMembers(true);
    try {
      // Get project with members
      const projectRes = await projectService.getById(projectId);
      if (projectRes.success) {
        setProjectMembers(
          projectRes.data?.Members || projectRes.data?.members || []
        );
      }

      // Get all users for adding new members
      const usersRes = await userService.getAllUsers({ limit: 100 });
      if (usersRes.success) {
        const allUsers =
          usersRes.data?.users || usersRes.data?.items || usersRes.data || [];
        // Filter out users already in project
        const memberIds = (projectRes.data?.Members || []).map(
          (m) => m.user_id || m.id
        );
        setAvailableUsers(allUsers.filter((u) => !memberIds.includes(u.id)));
      }
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Failed to load project members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async (userId) => {
    if (!selectedProject) return;

    try {
      const result = await projectService.addMember(
        selectedProject.id,
        userId,
        "developer"
      );
      if (result.success) {
        toast.success("Member added successfully!");
        await loadProjectMembers(selectedProject.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedProject) return;

    try {
      const result = await projectService.removeMember(
        selectedProject.id,
        userId
      );
      if (result.success) {
        toast.success("Member removed successfully!");
        await loadProjectMembers(selectedProject.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    if (!selectedProject) return;

    try {
      // Remove and re-add with new role
      await projectService.removeMember(selectedProject.id, userId);
      await projectService.addMember(selectedProject.id, userId, newRole);
      toast.success("Role updated successfully!");
      await loadProjectMembers(selectedProject.id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableUsers = availableUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(memberSearch.toLowerCase())
  );

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your agile projects
            </p>
          </div>
          {canCreateProject() && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>New Project</span>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FolderKanban className="mx-auto text-gray-400" size={64} />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No projects found
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "Try a different search query"
                  : "Get started by creating a new project"}
              </p>
              {!searchQuery && canCreateProject() && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4"
                >
                  Create Project
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="relative">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {/* Action Menu */}
                  {(canEditProject(project) ||
                    canManageMembers(project) ||
                    canDeleteProject(project)) && (
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveDropdown(
                            activeDropdown === project.id ? null : project.id
                          );
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <MoreVertical size={20} className="text-gray-500" />
                      </button>

                      {activeDropdown === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                          {canEditProject(project) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openEditModal(project);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            >
                              <Edit size={16} className="mr-2" /> Edit Project
                            </button>
                          )}
                          {canManageMembers(project) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openMemberModal(project);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            >
                              <Users size={16} className="mr-2" /> Manage
                              Members
                            </button>
                          )}
                          {canDeleteProject(project) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openDeleteModal(project);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                            >
                              <Trash2 size={16} className="mr-2" /> Delete
                              Project
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Link to={`/projects/${project.id}/kanban`} className="block">
                    <div className="flex items-start justify-between mb-4 pr-8">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          project.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : project.status === "completed"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {project.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/projects/${project.id}/gantt`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Gantt Chart"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BarChart3 size={14} />
                        </Link>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {project.key}
                        </span>
                        {project.Members?.length > 0 && (
                          <span className="flex items-center text-xs text-gray-500">
                            <Users size={12} className="mr-1" />
                            {project.Members.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Project
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Project Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Enter project name"
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
                    placeholder="Optional project description"
                  />
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

        {/* Edit Modal */}
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Project
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProject(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Project Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Enter project name"
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
                    placeholder="Optional project description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <Button type="submit" variant="primary" className="flex-1">
                    Update
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProject(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete Project
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete "{selectedProject.name}"? This
                  action cannot be undone and will remove all tasks, sprints,
                  and data associated with this project.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedProject(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Management Modal */}
        {showMemberModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Manage Members
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedProject.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMemberModal(false);
                    setSelectedProject(null);
                    setMemberSearch("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Members */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Users size={16} className="mr-2" />
                      Project Members ({projectMembers.length})
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {projectMembers.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No members yet
                        </p>
                      ) : (
                        projectMembers.map((member) => (
                          <div
                            key={member.user_id || member.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                  {(member.user?.name || member.name || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {member.user?.name || member.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  @{member.user?.username || member.username}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <select
                                value={member.role || "developer"}
                                onChange={(e) =>
                                  handleUpdateMemberRole(
                                    member.user_id || member.id,
                                    e.target.value
                                  )
                                }
                                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600"
                              >
                                {PROJECT_ROLES.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  handleRemoveMember(
                                    member.user_id || member.id
                                  )
                                }
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Remove member"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Members */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <UserPlus size={16} className="mr-2" />
                      Add Members
                    </h3>
                    <div className="relative mb-3">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredAvailableUsers.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          {memberSearch
                            ? "No users found"
                            : "All users are already members"}
                        </p>
                      ) : (
                        filteredAvailableUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  {(user.name || "U").charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAddMember(user.id)}
                              className="flex items-center"
                            >
                              <Plus size={14} className="mr-1" />
                              Add
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Role Legend */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Project Roles (RBAC)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {PROJECT_ROLES.map((role) => (
                    <div
                      key={role.value}
                      className="text-gray-500 dark:text-gray-400"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {role.label}:
                      </span>{" "}
                      {role.description}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
