import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FolderOpen, 
  Target, 
  BarChart3, 
  PieChart, 
  Bot, 
  Camera, 
  Bell, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  LineChart,
  RefreshCw,
  Zap,
  Trophy,
  Users
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Income', path: '/income', icon: TrendingUp },
    { name: 'Expenses', path: '/expenses', icon: TrendingDown },
    { name: 'Categories', path: '/categories', icon: FolderOpen },
    { name: 'Budget', path: '/budget', icon: Target },
    { name: 'Savings Goals', path: '/goals', icon: Zap },
    { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
    { name: 'AI Forecast', path: '/forecast', icon: LineChart },
    { name: 'Challenges', path: '/challenges', icon: Trophy },
    { name: 'Split Bill', path: '/split-bill', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'AI Advisor', path: '/ai-advisor', icon: Bot },
    { name: 'Receipt Scanner', path: '/receipt-scanner', icon: Camera },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav link CSS helper
  const linkClass = ({ isActive }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group
    ${isActive 
      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-white'}
  `;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 hidden md:flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shrink-0">
              $
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-lg text-slate-800 dark:text-white tracking-tight whitespace-nowrap">
                SmartSpend<span className="text-primary font-bold">.AI</span>
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Card */}
        {!isCollapsed && user && (
          <div className="p-4 mx-4 mt-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center gap-3">
            <img 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D9488&color=fff`} 
              alt={user.name} 
              className="w-10 h-10 rounded-full border border-primary/20 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate capitalize">{user.currency || 'INR'} Wallet</p>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {menuItems.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path} 
              className={linkClass}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className="shrink-0 transition-transform duration-200 group-hover:scale-110" size={20} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="shrink-0" size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Triggered by Navbar Menu button) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="w-72 max-w-[80vw] h-full bg-white dark:bg-slate-900 p-5 flex flex-col animate-fade-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
              <span className="font-extrabold text-lg text-slate-800 dark:text-white">SmartSpend.AI</span>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink 
                  key={item.name} 
                  to={item.path} 
                  className={linkClass}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all mt-auto"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Button - Top Floating Trigger */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-3 left-4 z-30 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-md focus:outline-none"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Bottom Navigation Bar (as per specifications) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <LayoutDashboard size={20} />
          <span className="mt-0.5">Dashboard</span>
        </NavLink>

        <NavLink 
          to="/income" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <TrendingUp size={20} />
          <span className="mt-0.5">Income</span>
        </NavLink>

        {/* Floating Quick Expense button */}
        <div className="relative -top-5 flex flex-col items-center">
          <NavLink 
            to="/expenses" 
            state={{ openAddModal: true }}
            className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 border-4 border-background dark:border-background-dark hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </NavLink>
        </div>

        <NavLink 
          to="/expenses" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <TrendingDown size={20} />
          <span className="mt-0.5">Expenses</span>
        </NavLink>

        <NavLink 
          to="/reports" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <BarChart3 size={20} />
          <span className="mt-0.5">Reports</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <Settings size={20} />
          <span className="mt-0.5">Profile</span>
        </NavLink>
      </div>
    </>
  );
}
