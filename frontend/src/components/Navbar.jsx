import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  // Get current page name
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/income': return 'Income Tracker';
      case '/expenses': return 'Expense Tracker';
      case '/categories': return 'Categories Manager';
      case '/budget': return 'Budget Planner';
      case '/reports': return 'Monthly Reports';
      case '/analytics': return 'Financial Analytics';
      case '/ai-advisor': return 'AI Advisor Chat';
      case '/receipt-scanner': return 'OCR Receipt Scanner';
      case '/notifications': return 'Alerts & Notifications';
      case '/settings': return 'Account Settings';
      default: return 'SmartSpend.AI';
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [user]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
    // Update server setting in background if logged in
    axios.put('/api/auth/profile', { theme: !darkMode ? 'dark' : 'light' }).catch(() => {});
  };

  // Sync theme with user settings on initial load
  useEffect(() => {
    if (user?.theme) {
      const isDark = user.theme === 'dark';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [user]);

  // Handle Search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/expenses?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/mark-read');
      fetchNotifications();
      toast.success('All notifications marked as read');
      setShowNotifications(false);
    } catch (err) {
      toast.error('Failed to mark read');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      
      {/* Page Title / Left spacing on mobile */}
      <div className="flex items-center gap-3">
        <h1 className="font-extrabold text-xl text-slate-800 dark:text-white md:block hidden animate-fade-in pl-0">
          {getPageTitle()}
        </h1>
        {/* On mobile, title sits next to side menu trigger */}
        <h1 className="font-extrabold text-lg text-slate-800 dark:text-white md:hidden block pl-14 animate-fade-in">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search pizza, rent, UPI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 lg:w-64 bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-1.5 rounded-full text-sm border-0 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
          />
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
        </form>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger flex items-center justify-center text-[10px] font-bold text-white rounded-full ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Alerts & Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!notif.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                    >
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1.5">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-750">
                <Link 
                  to="/notifications" 
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  View all notification logs
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 hover:opacity-85 transition-opacity"
            >
              <img
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
              />
              <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <UserIcon size={16} />
                    Profile Info
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <SettingsIcon size={16} />
                    Preferences
                  </Link>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <HelpCircle size={16} />
                    Help & Support
                  </a>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 py-1 bg-red-50/50 dark:bg-red-950/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
