import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) {
      // Cleanup if user logged out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection with auth
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("[Socket] Connected:", newSocket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
      reconnectAttempts.current += 1;

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error("[Socket] Max reconnection attempts reached");
        newSocket.disconnect();
      }
    });

    // Authentication error
    newSocket.on("unauthorized", (error) => {
      console.error("[Socket] Unauthorized:", error.message);
      newSocket.disconnect();
    });

    setSocket(newSocket);

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, token]);

  // Listen for notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      console.log("[Socket] New notification:", notification);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/images/logo/logo-icon.png",
        });
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  // Join project room
  const joinProject = useCallback(
    (projectId) => {
      if (socket && isConnected) {
        socket.emit("join:project", projectId);
        console.log("[Socket] Joining project room:", projectId);
      }
    },
    [socket, isConnected]
  );

  // Leave project room
  const leaveProject = useCallback(
    (projectId) => {
      if (socket && isConnected) {
        socket.emit("leave:project", projectId);
        console.log("[Socket] Leaving project room:", projectId);
      }
    },
    [socket, isConnected]
  );

  // Listen for task updates in project
  const onTaskUpdate = useCallback(
    (callback) => {
      if (!socket) return () => {};

      socket.on("task:updated", callback);
      socket.on("task:created", callback);

      return () => {
        socket.off("task:updated", callback);
        socket.off("task:created", callback);
      };
    },
    [socket]
  );

  // Listen for sprint updates
  const onSprintUpdate = useCallback(
    (callback) => {
      if (!socket) return () => {};

      socket.on("sprint:started", callback);
      socket.on("sprint:completed", callback);

      return () => {
        socket.off("sprint:started", callback);
        socket.off("sprint:completed", callback);
      };
    },
    [socket]
  );

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Set initial notifications (from API)
  const setInitialNotifications = useCallback((notifs, count) => {
    setNotifications(notifs);
    setUnreadCount(count);
  }, []);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    joinProject,
    leaveProject,
    onTaskUpdate,
    onSprintUpdate,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    setInitialNotifications,
    requestNotificationPermission,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
