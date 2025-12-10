/**
 * =============================================================================
 * USER ROLE MANAGEMENT - Assign roles to users
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  UserCircle,
  ShieldCheck,
  Building2,
  Users,
  Folder,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useRbac } from "../contexts/RbacContext";
import rbacService from "../services/rbacService";
import { userService } from "../services/userService";
import Header from "../components/layout/Header";

// Role Badge Component
const RoleBadge = ({ type, role, onRemove }) => {
  const colorClasses = {
    system: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    division:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    team: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    project:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const labels = {
    system: "System",
    division: "Division",
    team: "Team",
    project: "Project",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${colorClasses[type]}`}
    >
      {labels[type]}: {role}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// User Card Component
const UserCard = ({ user, onSelect, selected }) => {
  const hasSystemRole = user.system_role;

  return (
    <div
      onClick={() => onSelect(user)}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-center gap-3">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {user.full_name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
        {hasSystemRole && (
          <ShieldCheck className="w-5 h-5 text-red-500 flex-shrink-0" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {user.system_role && (
          <RoleBadge type="system" role={user.system_role} />
        )}
        {user.institution_role && (
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
            {user.institution_role}
          </span>
        )}
      </div>
    </div>
  );
};

// Role Assignment Modal
const RoleAssignmentModal = ({
  isOpen,
  onClose,
  user,
  roleDefinitions,
  onSave,
  loading,
}) => {
  const [formData, setFormData] = useState({
    system_role: "",
    institution_role: "",
    reason: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        system_role: user.system_role || "",
        institution_role: user.institution_role || "",
        reason: "",
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user.full_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* System Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                System Role
              </label>
              <select
                value={formData.system_role}
                onChange={(e) =>
                  setFormData({ ...formData, system_role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">No System Role</option>
                {roleDefinitions?.system_roles &&
                  Object.entries(roleDefinitions.system_roles).map(
                    ([key, value]) => (
                      <option key={key} value={key}>
                        {key.replace(/_/g, " ").toUpperCase()}
                      </option>
                    )
                  )}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                System roles have global permissions across the entire
                application
              </p>
            </div>

            {/* Institution Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Institution Role
              </label>
              <input
                type="text"
                value={formData.institution_role}
                onChange={(e) =>
                  setFormData({ ...formData, institution_role: e.target.value })
                }
                placeholder="e.g., Superadmin, Manager, HRD, Project Manager, Staff"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The user's role within the institution hierarchy
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for Change
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                rows={2}
                placeholder="Provide a reason for this role change..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Warning */}
            {formData.system_role === "super_admin" && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Super Admin has full access to all features including the
                    ability to modify other admin roles. Assign with caution.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// User Details Panel
const UserDetailsPanel = ({ user, userRoles, onClose, onEditSystemRole }) => {
  if (!user) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          User Details
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4 mb-6">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <UserCircle className="w-10 h-10 text-gray-500" />
          </div>
        )}
        <div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            {user.full_name}
          </h4>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            @{user.username}
          </p>
        </div>
      </div>

      {/* Roles Section */}
      <div className="space-y-4">
        {/* System Role */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                System Role
              </span>
            </div>
            <button
              onClick={onEditSystemRole}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.system_role ? (
              <RoleBadge type="system" role={user.system_role} />
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                No system role
              </span>
            )}
          </div>
        </div>

        {/* Institution Role */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Institution Role
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {user.institution_role || (
              <span className="text-gray-500">Not assigned</span>
            )}
          </p>
        </div>

        {/* Division Roles */}
        {userRoles?.division && userRoles.division.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Division Roles
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRoles.division.map((role, i) => (
                <RoleBadge key={i} type="division" role={role.role || role} />
              ))}
            </div>
          </div>
        )}

        {/* Team Roles */}
        {userRoles?.team && userRoles.team.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Team Roles
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRoles.team.map((role, i) => (
                <RoleBadge key={i} type="team" role={role.role || role} />
              ))}
            </div>
          </div>
        )}

        {/* Project Roles */}
        {userRoles?.project && userRoles.project.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Project Roles
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRoles.project.map((role, i) => (
                <RoleBadge key={i} type="project" role={role.role || role} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const UserRoleManagement = () => {
  const navigate = useNavigate();
  const { isSystemAdmin, roleDefinitions } = useRbac();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await userService.getAllUsers();
      if (result.success) {
        setUsers(result.data.users || result.data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async (userId) => {
    try {
      const result = await rbacService.getUserRoles(userId);
      if (result.success) {
        setUserRoles(result.data.roles);
      }
    } catch (error) {
      console.error("Failed to load user roles:", error);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    await loadUserRoles(user.id);
  };

  const handleSaveSystemRole = async (formData) => {
    setSaving(true);
    try {
      const result = await rbacService.updateUserSystemRole(
        selectedUser.id,
        formData
      );
      if (result.success) {
        setMessage({
          type: "success",
          text: "System role updated successfully",
        });
        setShowModal(false);

        // Refresh user data
        await loadUsers();
        const updatedUser = users.find((u) => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser({
            ...updatedUser,
            system_role: formData.system_role || null,
            institution_role: formData.institution_role || null,
          });
        }
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to update role",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update role",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Access check
  if (!isSystemAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center p-4 mt-20">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              You don't have permission to manage user roles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/rbac")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Role Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Assign and manage user roles across the system
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Users Grid */}
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onSelect={handleSelectUser}
                        selected={selectedUser?.id === user.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <UserDetailsPanel
                user={selectedUser}
                userRoles={userRoles}
                onClose={() => {
                  setSelectedUser(null);
                  setUserRoles(null);
                }}
                onEditSystemRole={() => setShowModal(true)}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <UserCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select a user to view and manage their roles
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={selectedUser}
        roleDefinitions={roleDefinitions}
        onSave={handleSaveSystemRole}
        loading={saving}
      />
    </div>
  );
};

export default UserRoleManagement;
