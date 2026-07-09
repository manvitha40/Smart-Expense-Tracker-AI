import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, TrendingUp, IndianRupee, Calendar, ArrowUpRight, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SOURCE_ICONS = {
  Salary: '💼',
  Freelance: '💻',
  Business: '🏢',
  Gift: '🎁',
  Investment: '📈',
  Bonus: '🎯',
  Other: '💰',
};

export default function Income() {
  const { user } = useContext(AuthContext);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const curr = user?.currency === 'INR' ? '₹' : '$';

  const fetchIncomes = async () => {
    try {
      const res = await axios.get('/api/income');
      setIncomes(res.data);
    } catch {
      toast.error('Failed to load income records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncomes(); }, []);

  const openAddModal = () => {
    setEditingId(null);
    setAmount('');
    setSource('Salary');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setAmount(item.amount);
    setSource(item.source);
    setDescription(item.description);
    setDate(new Date(item.date).toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Please enter a valid amount');
    if (!source) return toast.error('Please select an income source');
    const payload = { amount, source, description, date };
    try {
      if (editingId) {
        await axios.put(`/api/income/${editingId}`, payload);
        toast.success('Income updated!');
      } else {
        await axios.post('/api/income', payload);
        toast.success('Income recorded! 💰');
      }
      setShowModal(false);
      fetchIncomes();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await axios.delete(`/api/income/${id}`);
      toast.success('Record deleted');
      fetchIncomes();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  // Stats
  const now = new Date();
  const thisMonthIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonthIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const totalThisMonth = thisMonthIncomes.reduce((s, i) => s + i.amount, 0);
  const totalLastMonth = lastMonthIncomes.reduce((s, i) => s + i.amount, 0);
  const totalAllTime = incomes.reduce((s, i) => s + i.amount, 0);
  const avgPerMonth = incomes.length > 0 ? Math.round(totalAllTime / Math.max(1, new Set(incomes.map(i => {
    const d = new Date(i.date); return `${d.getFullYear()}-${d.getMonth()}`;
  })).size)) : 0;

  const monthChange = totalLastMonth > 0 ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100) : 0;

  // Chart: last 6 months
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const total = incomes
      .filter(inc => { const id = new Date(inc.date); return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear(); })
      .reduce((s, inc) => s + inc.amount, 0);
    return { month: months[d.getMonth()], amount: total };
  });

  // Source breakdown
  const sourceMap = {};
  incomes.forEach(i => { sourceMap[i.source] = (sourceMap[i.source] || 0) + i.amount; });
  const topSources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Pagination
  const sortedIncomes = [...incomes].sort((a, b) => new Date(b.date) - new Date(a.date));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedIncomes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedIncomes.length / itemsPerPage);

  const statCards = [
    {
      label: 'This Month',
      value: `${curr}${totalThisMonth.toLocaleString('en-IN')}`,
      sub: monthChange >= 0 ? `▲ ${monthChange}% vs last month` : `▼ ${Math.abs(monthChange)}% vs last month`,
      subColor: monthChange >= 0 ? 'text-emerald-500' : 'text-red-500',
      icon: '💼',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      label: 'Last Month',
      value: `${curr}${totalLastMonth.toLocaleString('en-IN')}`,
      sub: `${lastMonthIncomes.length} transactions`,
      subColor: 'text-slate-400',
      icon: '📅',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'All Time Total',
      value: `${curr}${totalAllTime.toLocaleString('en-IN')}`,
      sub: `${incomes.length} records`,
      subColor: 'text-slate-400',
      icon: '💰',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Avg / Month',
      value: `${curr}${avgPerMonth.toLocaleString('en-IN')}`,
      sub: 'Monthly average',
      subColor: 'text-slate-400',
      icon: '📊',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Income Streams</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track all your earnings and revenue sources</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
        >
          <Plus size={18} /> Add Income
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-premium hover:shadow-premium-hover transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{card.label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{card.value}</p>
            <p className={`text-[11px] font-semibold mt-1 ${card.subColor}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-premium">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5">6-Month Income Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={v => `${curr}${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(val) => [`${curr}${val.toLocaleString('en-IN')}`, 'Income']} />
              <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-premium">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5">By Source</h3>
          {topSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="space-y-4">
              {topSources.map(([src, amt]) => {
                const pct = totalAllTime > 0 ? Math.round((amt / totalAllTime) * 100) : 0;
                return (
                  <div key={src}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{SOURCE_ICONS[src] || '💰'}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{src}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{curr}{amt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-right">{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-premium overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">All Transactions</h3>
          <span className="text-xs text-slate-400 font-medium">{incomes.length} records</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : incomes.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-4xl">💸</p>
            <p className="font-bold text-slate-700 dark:text-slate-300">No income recorded yet</p>
            <p className="text-sm text-slate-400">Click "Add Income" to record your first entry</p>
            <button onClick={openAddModal} className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">Add Income</button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pt-2 px-6">Source</th>
                    <th className="pb-3 pt-2">Description</th>
                    <th className="pb-3 pt-2">Date</th>
                    <th className="pb-3 pt-2 text-right">Amount</th>
                    <th className="pb-3 pt-2 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {currentItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-lg shrink-0">
                            {SOURCE_ICONS[item.source] || '💰'}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{item.source}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate">
                        {item.description || <span className="text-slate-300 dark:text-slate-700 italic">No notes</span>}
                      </td>
                      <td className="py-3.5 text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          +{curr}{item.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary/10 dark:bg-slate-800 dark:hover:bg-primary/20 text-slate-400 hover:text-primary transition-colors" title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 px-6 py-3">
                <span className="text-xs text-slate-400 font-medium">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Income' : 'Record Income'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">All amounts in Indian Rupees (₹)</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number" required placeholder="75000"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Income Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Salary','Freelance','Business','Bonus','Investment','Other'].map(s => (
                    <button type="button" key={s} onClick={() => setSource(s)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5
                        ${source === s ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'}`}
                    >
                      <span>{SOURCE_ICONS[s] || '💰'}</span> {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Date of Credit</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all" />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Notes (Optional)</label>
                <textarea placeholder="Bonus from Q2 appraisal..." value={description} onChange={e => setDescription(e.target.value)} rows="2"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none" />
              </div>

              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                {editingId ? 'Update Record' : '+ Save Income'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
