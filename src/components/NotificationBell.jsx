import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notifications.api";
import { formatRelativeTime } from "../lib/dateUtils";

export default function NotificationBell() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // טעינת התראות
  useEffect(() => {
    if (!userProfile?.uid) return;

    loadNotifications();

    // רענון כל 30 שניות
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const loadNotifications = async () => {
    if (!userProfile?.uid) return;

    try {
      const notifs = await getUserNotifications(userProfile.uid, 20);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(userProfile.uid, notification.id);
        loadNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead(userProfile.uid);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.type === "like_artwork" || notification.type === "comment_artwork") {
      return `/artwork/${notification.targetId}`;
    }
    if (notification.type === "like_post" || notification.type === "comment_post") {
      return `/post/${notification.targetId}`;
    }
    if (notification.type === "follow") {
      return `/u/${notification.fromUsername}`;
    }
    if (notification.type === "message") {
      return `/messages/${notification.fromUserId}`;
    }
    return "#";
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "like_artwork":
        return `נתן לייק ליצירה שלך "${notification.targetTitle}"`;
      case "comment_artwork":
        return `הגיב על יצירה שלך "${notification.targetTitle}"`;
      case "like_post":
        return `נתן לייק לפוסט שלך "${notification.targetTitle}"`;
      case "comment_post":
        return `הגיב על פוסט שלך "${notification.targetTitle}"`;
      case "follow":
        return `עוקב אחריך`;
      case "message":
        return `שלח לך הודעה`;
      default:
        return "התראה חדשה";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like_artwork":
      case "like_post":
        return "❤️";
      case "comment_artwork":
      case "comment_post":
        return "💬";
      case "follow":
        return "👤";
      case "message":
        return "✉️";
      default:
        return "🔔";
    }
  };

  if (!userProfile) return null;

  return (
    <div className="position-relative">
      {/* Bell Button */}
      <button
        className="btn btn-link position-relative p-2"
        onClick={handleToggle}
        style={{ fontSize: "1.5rem", textDecoration: "none" }}
        title="התראות"
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.7rem" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 1040 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div
            className="position-absolute top-100 end-0 bg-white border rounded shadow-lg"
            style={{
              width: "400px",
              maxWidth: "90vw",
              maxHeight: "500px",
              overflowY: "auto",
              zIndex: 1050,
              marginTop: "0.5rem",
            }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h6 className="mb-0">התראות</h6>
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                >
                  {loading ? "⏳" : "סמן הכל כנקרא"}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div>
              {notifications.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div style={{ fontSize: "3rem" }}>🔕</div>
                  <p className="mb-0">אין התראות</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={getNotificationLink(notification)}
                    className="text-decoration-none"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={`p-3 border-bottom ${
                        !notification.read ? "bg-light" : ""
                      }`}
                      style={{
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (notification.read) {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (notification.read) {
                          e.currentTarget.style.backgroundColor = "white";
                        }
                      }}
                    >
                      <div className="d-flex gap-2">
                        <div style={{ fontSize: "1.5rem" }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <img
                              src={
                                notification.fromUserAvatar ||
                                "https://placehold.co/30x30?text=👤"
                              }
                              alt={notification.fromUsername}
                              className="rounded-circle"
                              style={{
                                width: "30px",
                                height: "30px",
                                objectFit: "cover",
                              }}
                            />
                            <strong className="text-dark">
                              @{notification.fromUsername}
                            </strong>
                          </div>
                          <p className="mb-1 small text-dark">
                            {getNotificationText(notification)}
                          </p>
                          {notification.commentText && (
                            <p className="mb-1 small text-muted fst-italic">
                              "{notification.commentText}..."
                            </p>
                          )}
                          <small className="text-muted">
                            {formatRelativeTime(notification.createdAt)}
                          </small>
                        </div>
                        {!notification.read && (
                          <div>
                            <span
                              className="badge bg-primary rounded-pill"
                              style={{ fontSize: "0.6rem" }}
                            >
                              ●
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
