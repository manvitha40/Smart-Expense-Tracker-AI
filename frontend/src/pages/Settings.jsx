import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User as UserIcon, Mail, Coins, ShieldAlert, Key, Trash2, Camera, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile, logout } = useContext(AuthContext);

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Preference state
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState('light');
  const [colorTheme, setColorTheme] = useState(localStorage.getItem('colorTheme') || 'teal');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Initial Sync
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfileImage(user.profileImage || '');
      setCurrency(user.currency || 'INR');
      setTheme(user.theme || 'light');
      setColorTheme(localStorage.getItem('colorTheme') || 'teal');
      setBudgetAlerts(user.notifications?.budgetAlerts ?? true);
      setEmailAlerts(user.notifications?.emailAlerts ?? true);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return toast.error('Name and Email are required');
    }

    try {
      localStorage.setItem('colorTheme', colorTheme);
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        profileImage: profileImage.trim(),
        currency,
        notifications: {
          budgetAlerts,
          emailAlerts
        }
      });
      toast.success('Settings profile updated successfully');
    } catch (err) {
      toast.error('Failed to save profile changes');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password) return toast.error('Please enter a new password');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    try {
      await updateProfile({ password });
      toast.success('Password changed successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to change password');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('⚠️ CRITICAL WARNING: Are you sure you want to permanently delete your account? This action is irreversible and will erase all transaction logs and custom categories.')) {
      if (window.confirm('Final Confirmation: Type "DELETE" (or press OK) to finalize deleting this account.')) {
        toast.success('Account deleted successfully');
        logout();
      }
    }
  };

  const getCurrencySymbol = (cur) => cur === 'USD' ? '$' : '₹';

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Account Settings</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">Manage profile data, password verification, and currency configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: General profile & Wallet preferences */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Form wrapper */}
          <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium space-y-5">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <UserIcon size={18} className="text-primary" />
              <span>Personal Specifications</span>
            </h3>

            {/* Avatar image input */}
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <img
                src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4F46E5&color=fff`}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full border border-slate-200 object-cover shadow"
              />
              <div className="space-y-1.5 w-full flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avatar Photo URL</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                  />
                  <Camera className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                </div>
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                  />
                  <UserIcon className="absolute left-3.5 top-3 text-slate-400" size={14} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                  />
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={14} />
                </div>
              </div>
            </div>

            {/* Wallet Currency */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preferred Wallet Currency</label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary text-slate-700 dark:text-slate-350 cursor-pointer appearance-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <Coins className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
              </div>
            </div>

            {/* Visual Color Skin Theme Selector */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">UI Theme Accent</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'teal', name: 'Default Teal', color: 'bg-teal-500' },
                  { id: 'emerald', name: 'Forest Emerald', color: 'bg-emerald-500' },
                  { id: 'neon', name: 'Cyberpunk Neon', color: 'bg-pink-500' },
                  { id: 'lavender', name: 'Glassmorphic Lavender', color: 'bg-indigo-500' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setColorTheme(t.id);
                      document.body.classList.remove('theme-emerald', 'theme-neon', 'theme-lavender');
                      if (t.id !== 'teal') {
                        document.body.classList.add(`theme-${t.id}`);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all duration-200
                      ${colorTheme === t.id 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${t.color} shrink-0 shadow-sm`} />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-app & Email notification checkboxes */}
            <div className="space-y-3.5 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Configurations</h4>
              
              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <span>Enable In-App Budget warnings (triggered at 90% usage)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <span>Dispatches daily summaries and subscription renewal reminders to email</span>
              </label>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-xs"
            >
              Save Profile Changes
            </button>
          </form>

          {/* Dangerous Zone Account Deletion */}
          <div className="bg-white dark:bg-slate-900 border border-red-200/50 dark:border-red-950/20 rounded-3xl p-6 shadow-premium space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-red-650 flex items-center gap-2">
                <Trash2 size={18} />
                <span>Deactivate Account</span>
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Erase transaction records, categories, and settings permanently.</p>
            </div>
            
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-2.5 bg-danger hover:bg-danger-dark text-white rounded-xl font-bold shadow-lg shadow-danger/10 hover:shadow-danger/20 transition-all text-xs"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Right Column: Password security updates */}
        <div className="lg:col-span-4">
          <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium space-y-4">
            <h3 className="font-extrabold text-base text-slate-808 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Key size={18} className="text-primary" />
              <span>Modify Password</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-10 text-xs focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                />
                <Key className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-10 text-xs focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                />
                <Key className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold shadow-md transition-all text-xs"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
