import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

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
    if (!user) return { success: false, message: 'No user logged in' };
    
    const result = await userService.updateProfile(user.id, data);
    if (result.success) {
      // Update local user state
      const updatedUser = { ...user, ...result.data.user };
      setUser(updatedUser);
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return result;
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.data.user);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

