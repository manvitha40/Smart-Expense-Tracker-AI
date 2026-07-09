import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Users, TrendingUp, TrendingDown, Activity, ShieldAlert, BarChart3,
  RefreshCw, Trash2, Crown, UserCheck, AlertCircle, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

export default function Admin() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers }),
        axios.get('/api/admin/users', { headers })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" and all their data?`)) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers });
      toast.success('User deleted');
      fetchStats();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    try {
      const { data } = await axios.put(`/api/admin/users/${id}/role`, {}, { headers });
      toast.success(`Role updated to ${data.role}`);
      fetchStats();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const curr = user?.currency === 'USD' ? '$' : '₹';

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 animate-pulse">Loading admin dashboard…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-20 text-center space-y-3">
        <ShieldAlert size={40} className="mx-auto text-red-400" />
        <p className="font-bold text-slate-700 dark:text-white">Admin Access Required</p>
        <p className="text-sm text-slate-400">Your account doesn't have admin privileges.</p>
      </div>
    );
  }

  const overviewCards = [
    { label: 'Total Users', value: stats.overview.totalUsers, icon: Users, color: 'blue', bg: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10', border: 'border-blue-100 dark:border-blue-900/30', text: 'text-blue-700 dark:text-blue-300', sub: 'text-blue-500' },
    { label: 'Total Transactions', value: stats.overview.totalTransactions, icon: Activity, color: 'violet', bg: 'from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10', border: 'border-violet-100 dark:border-violet-900/30', text: 'text-violet-700 dark:text-violet-300', sub: 'text-violet-500' },
    { label: 'Platform Income', value: `${curr}${stats.overview.totalIncomes.toLocaleString()}`, icon: TrendingUp, color: 'emerald', bg: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10', border: 'border-emerald-100 dark:border-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', sub: 'text-emerald-500' },
    { label: 'Platform Expenses', value: `${curr}${stats.overview.totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'red', bg: 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10', border: 'border-red-100 dark:border-red-900/30', text: 'text-red-700 dark:text-red-300', sub: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-primary" />
            Admin Dashboard
            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full uppercase tracking-wider">ADMIN</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Platform-wide management and analytics</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-1.5 shadow-premium w-fit">
        {['overview', 'users', 'categories'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewCards.map(card => (
              <div key={card.label} className={`p-5 rounded-2xl bg-gradient-to-br ${card.bg} border ${card.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${card.sub}`}>{card.label}</p>
                  <card.icon size={18} className={card.sub} />
                </div>
                <p className={`text-2xl font-extrabold ${card.text}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly Trends Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2 mb-5">
              <BarChart3 size={16} className="text-primary" /> Platform Monthly Trends (6 months)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.monthlyTrends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="label" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={v => `${curr}${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val, name) => [`${curr}${val.toLocaleString()}`, name]} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Users + Top Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Recent Signups</h3>
              <div className="space-y-3">
                {stats.recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <img src={u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D9488&color=fff`} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{u.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Top Spending Categories</h3>
              <div className="space-y-3">
                {stats.topCategories.map((cat, i) => {
                  const maxVal = stats.topCategories[0]?.total || 1;
                  const pct = Math.round((cat.total / maxVal) * 100);
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        <span>{cat.name}</span>
                        <span>{curr}{cat.total.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6'][i] || '#0D9488'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">All Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wide">User</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Role</th>
                  <th className="text-left py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wide hidden md:table-cell">Joined</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <img src={u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=7C3AED&color=fff`} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[100px]">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell truncate max-w-[160px]">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {u.role === 'admin' ? '👑 admin' : 'user'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-400 hidden md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleRole(u._id, u.role)}
                          title="Toggle admin role"
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors"
                        >
                          <Crown size={14} />
                        </button>
                        {String(u._id) !== req?.user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            title="Delete user"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Categories Tab ── */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Category Breakdown (All Users)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topCategories.map((cat, i) => {
              const colors = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6'];
              return (
                <div key={cat.name} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colors[i] || '#0D9488' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{cat.name}</p>
                    <p className="text-xs text-slate-400">{curr}{cat.total.toLocaleString()} total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
