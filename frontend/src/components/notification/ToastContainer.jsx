import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  MessageCircle,
} from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";

/**
 * Toast types
 */
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50 dark:bg-green-900/30",
    borderColor: "border-green-400 dark:border-green-600",
    iconColor: "text-green-500",
    progressColor: "bg-green-500",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-50 dark:bg-red-900/30",
    borderColor: "border-red-400 dark:border-red-600",
    iconColor: "text-red-500",
    progressColor: "bg-red-500",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    borderColor: "border-blue-400 dark:border-blue-600",
    iconColor: "text-blue-500",
    progressColor: "bg-blue-500",
  },
  notification: {
    icon: Bell,
    bgColor: "bg-primary-50 dark:bg-primary-900/30",
    borderColor: "border-primary-400 dark:border-primary-600",
    iconColor: "text-primary-500",
    progressColor: "bg-primary-500",
  },
  comment: {
    icon: MessageCircle,
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
    borderColor: "border-purple-400 dark:border-purple-600",
    iconColor: "text-purple-500",
    progressColor: "bg-purple-500",
  },
};

/**
 * Single Toast Component
 */
const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const Icon = config.icon;
  const duration = toast.duration || 5000;

  useEffect(() => {
    if (duration === Infinity) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 50);
        return Math.max(0, newProgress);
      });
    }, 50);

    const timeout = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [duration]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 rounded-lg shadow-lg border
        ${config.bgColor} ${config.borderColor}
        transform transition-all duration-300 ease-out
        ${
          isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
        }
        max-w-sm w-full
      `}
      role="alert"
    >
      {/* Icon */}
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {toast.message}
        </p>

        {/* Action button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick();
              handleClose();
            }}
            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>

      {/* Progress bar */}
      {duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div
            className={`h-full ${config.progressColor} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Toast Container Component
 */
const ToastContainer = () => {
  const { notifications } = useSocket();
  const [toasts, setToasts] = useState([]);

  // Listen for new notifications and create toasts
  useEffect(() => {
    if (notifications.length === 0) return;

    const latestNotification = notifications[0];

    // Check if we already have a toast for this notification
    const existingToast = toasts.find(
      (t) => t.notificationId === latestNotification.id
    );
    if (existingToast) return;

    // Map notification type to toast type
    const getToastType = (notifType) => {
      switch (notifType) {
        case "comment_mention":
          return "comment";
        case "task_assigned":
        case "project_invite":
          return "info";
        case "task_updated":
        case "sprint_started":
        case "sprint_completed":
          return "success";
        case "deadline_reminder":
          return "error";
        default:
          return "notification";
      }
    };

    // Create toast for notification
    const newToast = {
      id: `toast-${Date.now()}-${latestNotification.id}`,
      notificationId: latestNotification.id,
      type: getToastType(latestNotification.type),
      title: latestNotification.title,
      message: latestNotification.message,
      duration: 5000,
      action: latestNotification.link
        ? {
            label: "Lihat",
            onClick: () => {
              window.location.href = latestNotification.link;
            },
          }
        : undefined,
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts
  }, [notifications]);

  // Remove toast
  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // Add toast programmatically
  const addToast = useCallback((toast) => {
    const newToast = {
      id: `toast-${Date.now()}`,
      duration: 5000,
      ...toast,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    return newToast.id;
  }, []);

  // Expose addToast globally
  useEffect(() => {
    window.addToast = addToast;
    return () => {
      delete window.addToast;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for using toast programmatically
 */
export const useToast = () => {
  const showToast = useCallback((options) => {
    if (window.addToast) {
      return window.addToast(options);
    }
    console.warn("Toast container not mounted");
    return null;
  }, []);

  const showSuccess = useCallback(
    (message, title) => {
      return showToast({ type: "success", message, title });
    },
    [showToast]
  );

  const showError = useCallback(
    (message, title) => {
      return showToast({ type: "error", message, title });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message, title) => {
      return showToast({ type: "info", message, title });
    },
    [showToast]
  );

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
  };
};

export default ToastContainer;
