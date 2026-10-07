import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  setNotifications: () => {},
  setUnreadCount: () => {},
  setTotal: () => {},
  setLoading: () => {},
  clearNotifications: () => {},
  refreshNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setTotal(0);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      total,
      loading,
      setNotifications,
      setUnreadCount,
      setTotal,
      setLoading,
      clearNotifications,
    }),
    [notifications, unreadCount, total, loading, clearNotifications],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
