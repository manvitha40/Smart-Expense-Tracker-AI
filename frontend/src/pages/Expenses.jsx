import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Plus, Search, Edit2, Trash2, Eye, Image as ImageIcon,
  ChevronLeft, ChevronRight, X, Upload, Calendar, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  Food: '#EF4444', Travel: '#3B82F6', Shopping: '#EC4899',
  Medicine: '#10B981', Rent: '#F59E0B', Bills: '#8B5CF6',
  Subscriptions: '#6366F1', Others: '#6B7280',
};
const CATEGORY_ICONS = {
  Food: '🍕', Travel: '✈️', Shopping: '🛒', Medicine: '💊',
  Rent: '🏠', Bills: '⚡', Subscriptions: '📺', Others: '📦',
};
const PAYMENT_ICONS = { UPI: '📱', 'Credit Card': '💳', Cash: '💵', NetBanking: '🏦', Others: '🔗' };

export default function Expenses() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const curr = user?.currency === 'USD' ? '$' : '₹';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sp = params.get('search');
    if (sp) setSearchQuery(sp);
  }, [location.search]);

  useEffect(() => {
    if (location.state?.openAddModal) {
      openAddModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        axios.get('/api/expenses'),
        axios.get('/api/categories')
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => {
    setEditingId(null); setAmount(''); setMerchant('');
    setCategory(categories[0]?.name || 'Food'); setDescription('');
    setPaymentMethod('UPI'); setDate(new Date().toISOString().split('T')[0]);
    setReceiptFile(null); setReceiptPreviewUrl(''); setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id); setAmount(item.amount); setMerchant(item.merchant || '');
    setCategory(item.category); setDescription(item.description || '');
    setPaymentMethod(item.paymentMethod);
    setDate(new Date(item.date).toISOString().split('T')[0]);
    setReceiptFile(null); setReceiptPreviewUrl(item.receiptImage || ''); setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
      setReceiptFile(file);
      setReceiptPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Please enter a valid amount');
    if (!merchant) return toast.error('Please specify a merchant');

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('merchant', merchant);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('paymentMethod', paymentMethod);
    formData.append('date', date);
    if (receiptFile) formData.append('receipt', receiptFile);
    else if (editingId && receiptPreviewUrl) formData.append('receiptImage', receiptPreviewUrl);

    try {
      if (editingId) {
        await axios.put(`/api/expenses/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Expense updated!');
      } else {
        await axios.post('/api/expenses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Expense recorded!');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      toast.success('Expense deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  // Stats
  const now = new Date();
  const thisMonthExp = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalThisMonth = thisMonthExp.reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const budget = user?.monthlyBudget || 0;
  const budgetUsed = budget > 0 ? Math.round((totalThisMonth / budget) * 100) : 0;

  // Category breakdown this month
  const catMap = {};
  thisMonthExp.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Filter & sort
  const filtered = expenses.filter(exp => {
    const ms = exp.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const mc = filterCategory === '' || exp.category === filterCategory;
    const mp = filterPayment === '' || exp.paymentMethod === filterPayment;
    return ms && mc && mp;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'highest') return b.amount - a.amount;
    if (sortBy === 'lowest') return a.amount - b.amount;
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    return 0;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = sorted.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expense Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor and control your spending</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'This Month', value: `${curr}${totalThisMonth.toLocaleString('en-IN')}`, sub: `${thisMonthExp.length} transactions`, icon: '📊', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Budget Used', value: `${budgetUsed}%`, sub: budget > 0 ? `of ${curr}${budget.toLocaleString('en-IN')}` : 'No budget set', icon: '🎯', color: budgetUsed > 90 ? 'text-red-600' : 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'All Time', value: `${curr}${totalAll.toLocaleString('en-IN')}`, sub: `${expenses.length} total records`, icon: '💳', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Top Category', value: topCats[0]?.[0] || 'N/A', sub: topCats[0] ? `${curr}${topCats[0][1].toLocaleString('en-IN')} this month` : 'No data', icon: topCats[0] ? (CATEGORY_ICONS[topCats[0][0]] || '📦') : '📦', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-premium hover:shadow-premium-hover transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{card.label}</p>
            <p className={`text-xl font-black mt-0.5 ${card.color}`}>{card.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {topCats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-premium">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5">This Month by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {topCats.map(([cat, amt]) => {
              const pct = totalThisMonth > 0 ? Math.round((amt / totalThisMonth) * 100) : 0;
              const col = CATEGORY_COLORS[cat] || '#6B7280';
              return (
                <div key={cat} className="rounded-xl p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{CATEGORY_ICONS[cat] || '📦'}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                  </div>
                  <p className="text-base font-black text-slate-900 dark:text-white">{curr}{amt.toLocaleString('en-IN')}</p>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: col }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{pct}% of spending</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-premium">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" placeholder="Search merchant or notes..."
              value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/30 outline-none transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all
              ${showFilters ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'}`}>
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
            </select>
            <select value={filterPayment} onChange={e => { setFilterPayment(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="">All Payment Methods</option>
              {['UPI','Credit Card','Cash','NetBanking','Others'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
              <option value="category">Category A–Z</option>
            </select>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-premium overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Transactions</h3>
          <span className="text-xs text-slate-400 font-medium">{sorted.length} records</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-4xl">🧾</p>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {searchQuery || filterCategory || filterPayment ? 'No results match your filters' : 'No expenses yet'}
            </p>
            <p className="text-sm text-slate-400">
              {searchQuery || filterCategory || filterPayment ? 'Try adjusting your search or filters' : 'Click "Add Expense" to record your first transaction'}
            </p>
            {!searchQuery && !filterCategory && !filterPayment && (
              <button onClick={openAddModal} className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">Add Expense</button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pt-2 px-6">Merchant</th>
                    <th className="pb-3 pt-2">Category</th>
                    <th className="pb-3 pt-2">Payment</th>
                    <th className="pb-3 pt-2">Date</th>
                    <th className="pb-3 pt-2 text-right">Amount</th>
                    <th className="pb-3 pt-2 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {currentItems.map(item => {
                    const catColor = CATEGORY_COLORS[item.category] || '#6B7280';
                    const catIcon = CATEGORY_ICONS[item.category] || '📦';
                    const payIcon = PAYMENT_ICONS[item.paymentMethod] || '🔗';
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: catColor + '20' }}>
                              <span className="text-base">{catIcon}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[130px]">{item.merchant}</p>
                              {item.description && <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{item.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                            style={{ color: catColor, backgroundColor: catColor + '15', borderColor: catColor + '30' }}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                          <span className="flex items-center gap-1.5">{payIcon} {item.paymentMethod}</span>
                        </td>
                        <td className="py-3.5 text-slate-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={11} />
                            {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="text-base font-black text-red-600 dark:text-red-400">
                            -{curr}{item.amount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.receiptImage && (
                              <button onClick={() => setActiveReceipt(item.receiptImage)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary/10 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors" title="View Receipt">
                                <Eye size={13} />
                              </button>
                            )}
                            <button onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary/10 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors" title="Edit">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(item._id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 px-6 py-3">
                <span className="text-xs text-slate-400 font-medium">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Expense' : 'Record Expense'}
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
                  <input type="number" required placeholder="499" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all" />
                </div>
              </div>

              {/* Merchant */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Merchant / Payee</label>
                <input type="text" required placeholder="Swiggy, Amazon, Petrol Pump..." value={merchant} onChange={e => setMerchant(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all" />
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map(cat => (
                    <button type="button" key={cat._id} onClick={() => setCategory(cat.name)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5
                        ${category === cat.name ? 'text-white border-transparent shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'}`}
                      style={category === cat.name ? { backgroundColor: CATEGORY_COLORS[cat.name] || '#0D9488', borderColor: 'transparent' } : {}}>
                      <span className="text-base">{CATEGORY_ICONS[cat.name] || '📦'}</span>
                      <span className="text-[10px]">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-5 gap-2">
                  {['UPI','Credit Card','Cash','NetBanking','Others'].map(m => (
                    <button type="button" key={m} onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-0.5
                        ${paymentMethod === m ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <span className="text-base">{PAYMENT_ICONS[m]}</span>
                      <span>{m.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Date</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all" />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Notes (Optional)</label>
                <textarea placeholder="Lunch with team, weekend groceries..." value={description} onChange={e => setDescription(e.target.value)} rows="2"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none" />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Receipt (Optional)</label>
                <label className="cursor-pointer flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary/50 transition-all">
                  <Upload size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-400">{receiptPreviewUrl ? 'Change image' : 'Attach receipt image'}</span>
                  {receiptPreviewUrl && <img src={receiptPreviewUrl} alt="receipt" className="w-8 h-8 rounded-lg object-cover ml-auto" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                {editingId ? 'Update Expense' : '+ Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Lightbox */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveReceipt(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ImageIcon size={18} className="text-primary" /> Receipt</h3>
              <button onClick={() => setActiveReceipt(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white">Close</button>
            </div>
            <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-2 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img src={activeReceipt} alt="Receipt" className="max-h-[55vh] max-w-full rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
