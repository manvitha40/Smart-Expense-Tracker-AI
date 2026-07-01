import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bell, Trash2, CheckCircle2, ShieldAlert, Zap, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      toast.error('Failed to load notifications logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/mark-read');
      toast.success('All alerts marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      toast.success('Notification removed');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'budget_exceed':
        return <AlertTriangle size={18} className="text-danger" />;
      case 'budget_warn':
        return <ShieldAlert size={18} className="text-amber-500" />;
      case 'system':
      default:
        return <Info size={18} className="text-primary" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Alerts & Notifications</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">View budget limits status updates and general notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 size={14} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2 flex flex-col items-center">
            <Bell size={24} className="text-slate-300 dark:text-slate-700" />
            <p className="text-base font-bold">No active notifications</p>
            <p className="text-xs">Your budget is clean and no limits have been triggered.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-w-4xl">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`py-4 flex items-start gap-4 transition-colors relative group
                  ${!notif.read ? 'bg-primary/5 dark:bg-primary/10 -mx-6 px-6 rounded-2xl' : ''}
                `}
              >
                {/* Icon Circle */}
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/30 dark:border-slate-800">
                  {getAlertIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <p className={`text-xs leading-relaxed text-slate-750 dark:text-slate-300 ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold'}`}>
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1.5">
                    {new Date(notif.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Delete Button (revealed on hover) */}
                <button
                  onClick={() => handleDelete(notif._id)}
                  className="absolute right-2 top-4 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Remove notification log"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
