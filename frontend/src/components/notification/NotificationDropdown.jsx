import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  MessageCircle,
  Users,
  Zap,
  Calendar,
  Trash2,
} from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import api from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    setInitialNotifications,
    requestNotificationPermission,
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconProps = { className: "w-4 h-4" };
    switch (type) {
      case "task_assigned":
        return <Users {...iconProps} className="w-4 h-4 text-blue-500" />;
      case "task_updated":
        return <Zap {...iconProps} className="w-4 h-4 text-yellow-500" />;
      case "comment_mention":
        return (
          <MessageCircle {...iconProps} className="w-4 h-4 text-green-500" />
        );
      case "deadline_reminder":
        return <Clock {...iconProps} className="w-4 h-4 text-red-500" />;
      case "sprint_started":
        return <Zap {...iconProps} className="w-4 h-4 text-purple-500" />;
      case "sprint_completed":
        return <CheckCheck {...iconProps} className="w-4 h-4 text-green-500" />;
      case "project_invite":
        return <Users {...iconProps} className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell {...iconProps} className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: idLocale,
      });
    } catch {
      return "";
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications", {
        params: { limit: 20 },
      });

      if (response.data.success) {
        const notifData = response.data.data?.data || response.data.data || [];
        const notifs = Array.isArray(notifData)
          ? notifData.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              link: n.link,
              isRead: n.is_read,
              createdAt: n.created_at,
              actor: n.trigger,
            }))
          : [];
        setInitialNotifications(notifs, response.data.data?.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
    // Request browser notification permission
    requestNotificationPermission();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        markNotificationRead(notification.id);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to link if exists
    if (notification.link) {
      window.location.href = notification.link;
    }

    setIsOpen(false);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      markAllNotificationsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);
      // Remove from local state
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-semibold text-white bg-red-500 rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifikasi
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Tandai dibaca
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-border cursor-pointer
                      transition-colors relative group
                      ${
                        !notification.isRead
                          ? "bg-primary-50/50 dark:bg-primary-900/10"
                          : ""
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p
                            className={`text-sm ${
                              !notification.isRead ? "font-semibold" : ""
                            } text-gray-900 dark:text-white line-clamp-1`}
                          >
                            {notification.title}
                          </p>

                          {/* Unread indicator */}
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full ml-2 mt-1.5"></span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Delete button (on hover) */}
                      <button
                        onClick={(e) =>
                          handleDeleteNotification(e, notification.id)
                        }
                        className="hidden group-hover:flex flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 dark:border-dark-border px-4 py-2">
              <a
                href="/notifications"
                className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Lihat semua notifikasi
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
