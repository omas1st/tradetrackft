import React, { useContext, useState, useRef, useEffect } from "react";
import { DataContext } from "../../context/DataContext";
import "./NotificationBanner.css";

const NotificationBanner = () => {
  const { notifications, markNotificationAsRead } = useContext(DataContext);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!notifications || notifications.length === 0) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (id) => {
    markNotificationAsRead(id);
    // optionally close dropdown after a click
    // setOpen(false);
  };

  return (
    <div className="notification-banner" ref={dropdownRef}>
      <button
        className="notification-icon-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <span>Notifications</span>
          </div>
          <ul className="notification-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notification-item ${n.type} ${n.read ? "read" : ""}`}
                onClick={() => handleNotificationClick(n.id)}
              >
                <div className={`notification-dot ${n.type}`} />
                <p className="notification-message">{n.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBanner;