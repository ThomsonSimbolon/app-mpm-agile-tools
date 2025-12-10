import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SocketProvider } from "./contexts/SocketContext";
import { RbacProvider } from "./contexts/RbacContext";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "./components/notification";
import PrivateRoute from "./components/auth/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import KanbanPage from "./pages/KanbanPage";
import SprintPage from "./pages/SprintPage";
import Profile from "./pages/Profile";
import AiDashboard from "./pages/AiDashboard";
import ReportDashboard from "./pages/ReportDashboard";
import TeamManagement from "./pages/TeamManagement";
import RbacDashboard from "./pages/RbacDashboard";
import UserRoleManagement from "./pages/UserRoleManagement";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RbacProvider>
          <SocketProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/projects"
                    element={
                      <PrivateRoute>
                        <Projects />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/projects/:projectId/kanban"
                    element={
                      <PrivateRoute>
                        <KanbanPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/projects/:projectId/sprints"
                    element={
                      <PrivateRoute>
                        <SprintPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/ai-dashboard"
                    element={
                      <PrivateRoute>
                        <AiDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/projects/:projectId/reports"
                    element={
                      <PrivateRoute>
                        <ReportDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/teams"
                    element={
                      <PrivateRoute>
                        <TeamManagement />
                      </PrivateRoute>
                    }
                  />

                  {/* RBAC Management Routes */}
                  <Route
                    path="/rbac"
                    element={
                      <PrivateRoute>
                        <RbacDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/rbac/users"
                    element={
                      <PrivateRoute>
                        <UserRoleManagement />
                      </PrivateRoute>
                    }
                  />

                  {/* Redirect root to dashboard */}
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* 404 Fallback */}
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>

                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#fff",
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                      },
                    },
                  }}
                />

                {/* Real-time Toast Notifications */}
                <ToastContainer />
              </div>
            </BrowserRouter>
          </SocketProvider>
        </RbacProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
