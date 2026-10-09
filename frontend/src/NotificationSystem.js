/**
 * NotificationSystem — Toast notifications push-style
 */
import React, { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, notify, removeNotification };
}

export function NotificationContainer({ notifications, onDismiss }) {
  if (!notifications.length) return null;
  return (
    <div className="notification-container">
      {notifications.map(n => (
        <div key={n.id} className={`notification-toast ${n.type}`} onClick={() => onDismiss(n.id)}>
          <span className="notification-msg">{n.message}</span>
          <button className="notification-close">×</button>
        </div>
      ))}
    </div>
  );
}
