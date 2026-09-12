import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiInstance } from '../../App';
import { useAuthStore } from '../../store/useAuthStore';

// Format relative time (e.g. "Just now", "5m ago", "2h ago")
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function NotificationBell() {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const lastAlertedIdRef = useRef(null);

  const getRole = () => {
    if (user?.roles) return user.roles;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.roles) return payload.roles;
      } catch {
        // ignore
      }
    }
    return '';
  };

  const role = getRole();
  const userID = user?.userID || '';

  // Fetch notifications from backend
  const fetchNotifications = async (triggerToast = false) => {
    if (!token && !userID) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (userID) params.append('userID', userID);

      const res = await axios.get(`${apiInstance}/notifications?${params.toString()}`, {
        headers,
      });

      const list = res.data.notifications || [];
      const unread = res.data.unreadCount || 0;

      setNotifications(list);
      setUnreadCount(unread);

      // If there's a new unread notification, trigger React Toast!
      if (list.length > 0 && unread > 0) {
        const latest = list[0];
        if (!latest.isRead && latest._id !== lastAlertedIdRef.current) {
          lastAlertedIdRef.current = latest._id;

          // Pop up custom React toast alert
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 border border-slate-200 p-4 transition-all`}
              >
                <div className="flex-1 w-0">
                  <div className="flex items-start">
                    <div className="shrink-0 pt-0.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-lg font-bold">
                        {latest.type === 'ADVOCATE_ASSIGNED' ? '⚖' : '🔔'}
                      </span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          {latest.caseNumber || 'New Notification'}
                        </span>
                        <span className="text-[11px] text-slate-400">Just now</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {latest.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {latest.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex shrink-0 items-start">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="inline-flex rounded-md text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ),
            { duration: 6000, id: `notif_${latest._id}` }
          );
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.patch(`${apiInstance}/notifications/${id}/read`, {}, { headers });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${apiInstance}/notifications/mark-all-read`,
        { role, userID },
        { headers }
      );

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  // Initial fetch and 15-second polling interval for real-time alerts
  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [role, userID, token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        title="Notifications"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Glowing Badge for Unread Notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No notifications right now.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isAdvocateType = notif.type === 'ADVOCATE_ASSIGNED';
                const isOutreachType = notif.type === 'NEW_OUTREACH_CASE';

                return (
                  <div
                    key={notif._id}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      notif.isRead
                        ? 'bg-white hover:bg-slate-50/70'
                        : 'bg-amber-50/40 hover:bg-amber-50/70'
                    }`}
                  >
                    {/* Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-sm ${
                        isAdvocateType
                          ? 'bg-amber-100 border-amber-200 text-amber-800'
                          : isOutreachType
                          ? 'bg-cyan-100 border-cyan-200 text-cyan-800'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {isAdvocateType ? '⚖' : isOutreachType ? '📋' : '🔔'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${notif.isRead ? 'text-slate-800' : 'text-slate-900'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2">
                        {notif.caseNumber && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {notif.caseNumber}
                          </span>
                        )}
                        {!notif.isRead && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        )}
                      </div>
                    </div>

                    {/* Mark read button */}
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="text-slate-300 hover:text-emerald-600 p-1 shrink-0 transition"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              Offline alerts are dispatched via email
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
