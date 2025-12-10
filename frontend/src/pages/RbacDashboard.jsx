/**
 * =============================================================================
 * RBAC DASHBOARD - Enterprise Role-Based Access Control Management
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Building2,
  UserCircle,
  Folder,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  Settings,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useRbac, AdminGate } from "../contexts/RbacContext";
import rbacService from "../services/rbacService";
import Header from "../components/layout/Header";

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    indigo:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Role Distribution Chart
const RoleDistributionChart = ({ data }) => {
  const roleColors = {
    super_admin: "bg-red-500",
    admin: "bg-orange-500",
    security_officer: "bg-blue-500",
    ai_admin: "bg-purple-500",
  };

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    security_officer: "Security Officer",
    ai_admin: "AI Admin",
  };

  const total = data.reduce((sum, item) => sum + parseInt(item.count), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        System Role Distribution
      </h3>
      <div className="space-y-4">
        {data.map((item) => {
          const percentage =
            total > 0 ? ((parseInt(item.count) / total) * 100).toFixed(1) : 0;
          return (
            <div key={item.system_role}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">
                  {roleLabels[item.system_role] || item.system_role}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.count} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    roleColors[item.system_role] || "bg-gray-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            No system roles assigned yet
          </p>
        )}
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = ({ onAction }) => {
  const actions = [
    {
      title: "Manage Permissions",
      description: "View and edit permission definitions",
      icon: ClipboardList,
      action: "permissions",
      color: "bg-blue-500",
    },
    {
      title: "User Roles",
      description: "Assign roles to users",
      icon: Users,
      action: "users",
      color: "bg-green-500",
    },
    {
      title: "Role Mappings",
      description: "Configure role-permission mappings",
      icon: Settings,
      action: "mappings",
      color: "bg-purple-500",
    },
    {
      title: "Audit Logs",
      description: "View permission change history",
      icon: BarChart3,
      action: "audit",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.action}
            onClick={() => onAction(action.action)}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 
              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div
              className={`p-2 rounded-lg ${action.color} text-white flex-shrink-0`}
            >
              <action.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {action.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// My Permissions Component
const MyPermissions = () => {
  const { permissions, roles, loading } = useRbac();

  const categoryLabels = {
    system: "System",
    ai: "AI",
    division: "Division",
    team: "Team",
    project: "Project",
    task: "Task",
    common: "Common",
  };

  // Group permissions by category (assuming permission codes follow pattern)
  const groupedPermissions = permissions.reduce((acc, perm) => {
    // Try to determine category from permission code
    let category = "common";
    if (
      perm.startsWith("manage_all") ||
      perm.includes("system") ||
      perm.includes("audit")
    ) {
      category = "system";
    } else if (perm.includes("ai")) {
      category = "ai";
    } else if (perm.includes("division")) {
      category = "division";
    } else if (perm.includes("team")) {
      category = "team";
    } else if (perm.includes("project")) {
      category = "project";
    } else if (perm.includes("task") || perm.includes("sprint")) {
      category = "task";
    }

    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          My Permissions
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {permissions.length} total
        </span>
      </div>

      {/* Current Roles */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Your Roles:
        </p>
        <div className="flex flex-wrap gap-2">
          {roles.system && (
            <span
              className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 
                text-xs font-medium rounded-full"
            >
              System: {roles.system}
            </span>
          )}
          {roles.division && (
            <span
              className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 
                text-xs font-medium rounded-full"
            >
              Division: {roles.division}
            </span>
          )}
          {roles.team && (
            <span
              className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 
                text-xs font-medium rounded-full"
            >
              Team: {roles.team}
            </span>
          )}
          {roles.project && (
            <span
              className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 
                text-xs font-medium rounded-full"
            >
              Project: {roles.project}
            </span>
          )}
          {!roles.system &&
            !roles.division &&
            !roles.team &&
            !roles.project && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                No roles assigned
              </span>
            )}
        </div>
      </div>

      {/* Permissions by Category */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
              {categoryLabels[category] || category}
            </p>
            <div className="flex flex-wrap gap-1">
              {perms.map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                    text-xs rounded"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        ))}
        {permissions.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            No permissions assigned
          </p>
        )}
      </div>
    </div>
  );
};

// Main RBAC Dashboard Component
const RbacDashboard = () => {
  const navigate = useNavigate();
  const { isSystemAdmin, isSuperAdmin, loadPermissions } = useRbac();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await rbacService.getDashboardStats();
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "permissions":
        navigate("/rbac/permissions");
        break;
      case "users":
        navigate("/rbac/users");
        break;
      case "mappings":
        navigate("/rbac/mappings");
        break;
      case "audit":
        navigate("/rbac/audit-logs");
        break;
      default:
        break;
    }
  };

  const handleRefresh = () => {
    loadDashboardStats();
    loadPermissions();
  };

  // Access denied for non-admins
  if (!isSystemAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center p-4 mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg max-w-md text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You don't have permission to access the RBAC Dashboard. Please
              contact your administrator.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                RBAC Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Enterprise Role-Based Access Control Management
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 
              text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 
              transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
              >
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats?.overview?.totalUsers || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="System Admins"
                value={stats?.overview?.usersWithSystemRole || 0}
                icon={ShieldCheck}
                color="purple"
              />
              <StatCard
                title="Departments"
                value={stats?.overview?.totalDepartments || 0}
                icon={Building2}
                color="green"
              />
              <StatCard
                title="Teams"
                value={stats?.overview?.totalTeams || 0}
                icon={UserCircle}
                color="orange"
              />
              <StatCard
                title="Projects"
                value={stats?.overview?.totalProjects || 0}
                icon={Folder}
                color="pink"
              />
              <StatCard
                title="Permissions"
                value={stats?.overview?.totalPermissions || 0}
                icon={ClipboardList}
                color="indigo"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                <QuickActions onAction={handleQuickAction} />
                <RoleDistributionChart
                  data={stats?.systemRoleDistribution || []}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <MyPermissions />

                {/* Recent Audit Logs Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => handleQuickAction("audit")}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>
                      {stats?.overview?.recentAuditLogs || 0} changes in the
                      last 7 days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default RbacDashboard;
