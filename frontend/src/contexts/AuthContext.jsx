import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { userService } from "../services/userService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.data.user);
    }
    return result;
  };

  const register = async (data) => {
    const result = await authService.register(data);
    if (result.success) {
      // Auto login after registration
      const loginResult = await authService.login(data.email, data.password);
      if (loginResult.success) {
        setUser(loginResult.data.user);
      }
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (data) => {
    if (!user) return { success: false, message: "No user logged in" };

    const result = await userService.updateProfile(user.id, data);
    if (result.success) {
      // Update local user state
      const updatedUser = { ...user, ...result.data.user };
      setUser(updatedUser);
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    return result;
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.data.user);
        localStorage.setItem("user", JSON.stringify(result.data.user));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  // Role check helpers
  const isAdmin = () => user?.role === "admin";
  const isProjectManager = () => user?.role === "project_manager";
  const isDeveloper = () => user?.role === "developer";
  const isViewer = () => user?.role === "viewer";

  // Permission helpers
  const canManageDepartments = () => isAdmin();
  const canManageTeams = () => isAdmin() || isProjectManager();
  const canEditTasks = () => !isViewer();
  const canViewOnly = () => isViewer();

  // Check if user has any of the specified roles
  const hasRole = (roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
    loading,
    // Role helpers
    isAdmin,
    isProjectManager,
    isDeveloper,
    isViewer,
    hasRole,
    // Permission helpers
    canManageDepartments,
    canManageTeams,
    canEditTasks,
    canViewOnly,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
