/**
 * NotificationSystem — Toast notifications push-style
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from './i18n';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const timers = useRef(new Set());
  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach(clearTimeout);
  }, []);

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
    timers.current.add(timer);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, notify, removeNotification };
}

export function NotificationContainer({ notifications, onDismiss }) {
  const { t } = useI18n();
  if (!notifications.length) return null;
  return (
    <div className="notification-container" role="status" aria-live="polite" aria-atomic="true">
      {notifications.map(n => (
        <div key={n.id} className={`notification-toast ${n.type}`}>
          <span className="notification-msg">{n.message}</span>
          <button type="button" className="notification-close" aria-label={t('dismissNotification')} onClick={() => onDismiss(n.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
