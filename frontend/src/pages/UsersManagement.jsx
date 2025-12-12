/**
 * =============================================================================
 * USERS MANAGEMENT - CRUD Users dengan Enterprise RBAC
 * =============================================================================
 * Fitur:
 * - List semua users dengan search & filter
 * - Create new user
 * - Edit user (full_name, role, system_role, institution_role)
 * - Update user status (active/inactive/suspended)
 * - Reset password
 * - Delete user
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  UserCircle,
  Edit,
  Trash2,
  Key,
  ShieldCheck,
  MoreVertical,
  X,
  Check,
  AlertTriangle,
  Users,
  UserPlus,
  Ban,
  CheckCircle,
} from "lucide-react";
import { useRbac } from "../contexts/RbacContext";
import { userService } from "../services/userService";
import Header from "../components/layout/Header";
import toast from "react-hot-toast";

// =============================================================================
// CONSTANTS - Role definitions sesuai RBAC Config
// =============================================================================
const SYSTEM_ROLES = [
  { value: "", label: "No System Role" },
  {
    value: "super_admin",
    label: "Super Admin",
    description: "Full system access",
  },
  { value: "admin", label: "Admin", description: "System administration" },
  {
    value: "security_officer",
    label: "Security Officer",
    description: "Audit & security",
  },
  { value: "ai_admin", label: "AI Admin", description: "AI configuration" },
];

const INSTITUTION_ROLES = [
  { value: "", label: "No Institution Role" },
  { value: "Superadmin", label: "Superadmin" },
  { value: "Admin Sistem", label: "Admin Sistem" },
  { value: "Manager", label: "Manager" },
  { value: "HRD", label: "HRD" },
  { value: "Kepala Divisi", label: "Kepala Divisi" },
  { value: "Project Manager", label: "Project Manager" },
  { value: "Staff", label: "Staff" },
  { value: "Instruktur", label: "Instruktur" },
];

const LEGACY_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "developer", label: "Developer" },
  { value: "viewer", label: "Viewer" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "gray" },
  { value: "suspended", label: "Suspended", color: "red" },
];

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================
const StatusBadge = ({ status }) => {
  const colors = {
    active:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        colors[status] || colors.inactive
      }`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

// =============================================================================
// ROLE BADGE COMPONENT
// =============================================================================
const RoleBadge = ({ role, type = "system" }) => {
  const colors = {
    system: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    institution:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    legacy:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  if (!role) return null;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[type]}`}>
      {role.replace(/_/g, " ")}
    </span>
  );
};

// =============================================================================
// CREATE/EDIT USER MODAL
// =============================================================================
const UserFormModal = ({ isOpen, onClose, user, onSave, loading }) => {
  const isEdit = !!user;
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "developer",
    system_role: "",
    institution_role: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        full_name: user.full_name || "",
        role: user.role || "developer",
        system_role: user.system_role || "",
        institution_role: user.institution_role || "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        full_name: "",
        role: "developer",
        system_role: "",
        institution_role: "",
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = "Username minimal 3 karakter";
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email tidak valid";
    }
    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      newErrors.password = "Password minimal 6 karakter";
    }
    if (!formData.full_name) {
      newErrors.full_name = "Nama lengkap wajib diisi";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEdit ? "Edit User" : "Create New User"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={isEdit}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600
                  ${
                    errors.username
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                placeholder="username"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white
                  ${
                    errors.email
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password - only for create */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 
                    text-gray-900 dark:text-white
                    ${
                      errors.password
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  placeholder="Minimal 6 karakter"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white
                  ${
                    errors.full_name
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                placeholder="Nama Lengkap"
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* Legacy Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role (Legacy)
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {LEGACY_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* System Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                System Role (RBAC)
              </label>
              <select
                value={formData.system_role}
                onChange={(e) =>
                  setFormData({ ...formData, system_role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {SYSTEM_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                System role memiliki akses global di seluruh aplikasi
              </p>
            </div>

            {/* Institution Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Jabatan (Institution)
              </label>
              <select
                value={formData.institution_role}
                onChange={(e) =>
                  setFormData({ ...formData, institution_role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {INSTITUTION_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Jabatan di dalam struktur organisasi/instansi
              </p>
            </div>

            {/* Warning for Super Admin */}
            {formData.system_role === "super_admin" && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Super Admin memiliki akses penuh ke seluruh sistem termasuk
                    kemampuan mengubah role admin lain.
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
                Batal
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
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {isEdit ? "Simpan Perubahan" : "Buat User"}
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

// =============================================================================
// RESET PASSWORD MODAL
// =============================================================================
const ResetPasswordModal = ({ isOpen, onClose, user, onSave, loading }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPassword("");
    setConfirmPassword("");
    setError("");
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }
    onSave(password);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reset Password
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reset password untuk user: <strong>{user.full_name}</strong> (
              {user.email})
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ketik ulang password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Mereset..." : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// USER ROW COMPONENT
// =============================================================================
const UserRow = ({
  user,
  onEdit,
  onDelete,
  onResetPassword,
  onUpdateStatus,
  currentUserId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isSelf = user.id === currentUserId;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-6 py-4 whitespace-nowrap">
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
            <p className="font-medium text-gray-900 dark:text-white">
              {user.full_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{user.username}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
          {user.system_role && (
            <RoleBadge role={user.system_role} type="system" />
          )}
          {user.institution_role && (
            <RoleBadge role={user.institution_role} type="institution" />
          )}
          {!user.system_role && !user.institution_role && (
            <RoleBadge role={user.role} type="legacy" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    onEdit(user);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit User
                </button>
                <button
                  onClick={() => {
                    onResetPassword(user);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Key className="w-4 h-4" /> Reset Password
                </button>
                {user.status === "active" ? (
                  <button
                    onClick={() => {
                      onUpdateStatus(user, "suspended");
                      setShowMenu(false);
                    }}
                    disabled={isSelf}
                    className="w-full px-4 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" /> Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateStatus(user, "active");
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Activate User
                  </button>
                )}
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    onDelete(user);
                    setShowMenu(false);
                  }}
                  disabled={isSelf}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete User
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const UsersManagement = () => {
  const navigate = useNavigate();
  const { isSystemAdmin, isSuperAdmin } = useRbac();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await userService.getAllUsers();
      if (result.success) {
        setUsers(result.data.users || result.data || []);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Gagal memuat data users");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleCreate = () => {
    setSelectedUser(null);
    setShowFormModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowFormModal(true);
  };

  const handleSaveUser = async (formData) => {
    setSaving(true);
    try {
      let result;
      if (selectedUser) {
        // Edit existing user
        result = await userService.adminUpdate(selectedUser.id, formData);
      } else {
        // Create new user
        result = await userService.create(formData);
      }

      if (result.success) {
        toast.success(
          selectedUser ? "User berhasil diupdate" : "User berhasil dibuat"
        );
        setShowFormModal(false);
        loadUsers();
      } else {
        toast.error(result.message || "Gagal menyimpan user");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Hapus user "${user.full_name}"? Tindakan ini tidak dapat dibatalkan.`
      )
    )
      return;

    try {
      const result = await userService.delete(user.id);
      if (result.success) {
        toast.success("User berhasil dihapus");
        loadUsers();
      } else {
        toast.error(result.message || "Gagal menghapus user");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus user");
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const handleSavePassword = async (newPassword) => {
    setSaving(true);
    try {
      const result = await userService.resetPassword(
        selectedUser.id,
        newPassword
      );
      if (result.success) {
        toast.success("Password berhasil direset");
        setShowResetModal(false);
      } else {
        toast.error(result.message || "Gagal reset password");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal reset password");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (user, status) => {
    try {
      const result = await userService.updateStatus(user.id, status);
      if (result.success) {
        toast.success(
          `User ${status === "active" ? "diaktifkan" : "disuspend"}`
        );
        loadUsers();
      } else {
        toast.error(result.message || "Gagal update status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal update status");
    }
  };

  // ==========================================================================
  // FILTER
  // ==========================================================================
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = !statusFilter || user.status === statusFilter;
    const matchRole =
      !roleFilter ||
      user.system_role === roleFilter ||
      user.role === roleFilter;

    return matchSearch && matchStatus && matchRole;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    withSystemRole: users.filter((u) => u.system_role).length,
  };

  // ==========================================================================
  // ACCESS CHECK
  // ==========================================================================
  if (!isSystemAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center p-4 mt-20">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Akses Ditolak
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/rbac")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Users Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Kelola users dan assign roles
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Tambah User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.active}
                </p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Ban className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.suspended}
                </p>
                <p className="text-sm text-gray-500">Suspended</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.withSystemRole}
                </p>
                <p className="text-sm text-gray-500">System Roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Semua Roles</option>
              <optgroup label="System Roles">
                {SYSTEM_ROLES.filter((r) => r.value).map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Memuat data users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada users ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onResetPassword={handleResetPassword}
                      onUpdateStatus={handleUpdateStatus}
                      currentUserId={currentUser.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <UserFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        user={selectedUser}
        onSave={handleSaveUser}
        loading={saving}
      />

      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        user={selectedUser}
        onSave={handleSavePassword}
        loading={saving}
      />
    </div>
  );
};

export default UsersManagement;
