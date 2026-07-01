import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  Image as ImageIcon,
  ChevronLeft, 
  ChevronRight, 
  X, 
  Upload,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  // Filters & Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Read query params if routed from search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  // Read state to open modal automatically (e.g. from mobile bottom floating button)
  useEffect(() => {
    if (location.state?.openAddModal) {
      openAddModal();
      // Clear state so it doesn't open again on navigation
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
    } catch (err) {
      toast.error('Failed to load expense logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setAmount('');
    setMerchant('');
    setCategory(categories[0]?.name || 'Food');
    setDescription('');
    setPaymentMethod('UPI');
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptFile(null);
    setReceiptPreviewUrl('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setAmount(item.amount);
    setMerchant(item.merchant || '');
    setCategory(item.category);
    setDescription(item.description || '');
    setPaymentMethod(item.paymentMethod);
    setDate(new Date(item.date).toISOString().split('T')[0]);
    setReceiptFile(null);
    setReceiptPreviewUrl(item.receiptImage || '');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return toast.error('Please upload an image file (PNG/JPG)');
      }
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
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    } else if (editingId && receiptPreviewUrl) {
      // Keep old image
      formData.append('receiptImage', receiptPreviewUrl);
    }

    try {
      if (editingId) {
        await axios.put(`/api/expenses/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Expense record updated');
      } else {
        await axios.post('/api/expenses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Expense created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      toast.success('Expense deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete expense record');
    }
  };

  // Filter & Sort Logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === '' || exp.category === filterCategory;
    const matchesPayment = filterPayment === '' || exp.paymentMethod === filterPayment;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'highest') return b.amount - a.amount;
    if (sortBy === 'lowest') return a.amount - b.amount;
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    return 0;
  });

  // Pagination math
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);

  const getCurrencySymbol = (cur) => cur === 'INR' ? '₹' : '$';

  return (
    <div className="space-y-6">
      
      {/* Top Banner Control Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Expense Tracker</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Track expenditures, upload receipt scans, and control budgets</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-1.5 text-sm"
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <input
            type="text"
            placeholder="Search merchant or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-10 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
          />
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        </div>

        {/* Filter Category */}
        <div className="lg:col-span-2.5 relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Payment Method */}
        <div className="lg:col-span-2.5 relative">
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
          >
            <option value="">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="NetBanking">NetBanking</option>
            <option value="Others">Others</option>
          </select>
        </div>

        {/* Sorting Profile */}
        <div className="lg:col-span-3 relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
            <option value="category">Category (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedExpenses.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <p className="text-base font-bold">No expenses found</p>
            <p className="text-xs">Adjust your filters or add a new expense transaction.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Merchant</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Receipt</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {currentItems.map((item) => (
                    <tr key={item._id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-primary dark:text-primary-light flex items-center justify-center font-bold text-xs shrink-0">
                            EX
                          </span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-850 dark:text-white truncate max-w-[150px]">{item.merchant}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[150px]">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-450 border border-slate-200/20">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{item.paymentMethod}</td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-855 dark:text-white text-sm">
                        -{getCurrencySymbol(user?.currency)}{item.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center">
                        {item.receiptImage ? (
                          <button
                            onClick={() => setActiveReceipt(item.receiptImage)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 text-slate-500 hover:text-primary transition-colors inline-flex justify-center items-center"
                            title="View Receipt Image"
                          >
                            <Eye size={13} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary/10 dark:bg-slate-800 dark:hover:bg-primary/20 text-slate-500 hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-xs text-slate-400 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Expense Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative animate-fade-in flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                {editingId ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Amount ({getCurrencySymbol(user?.currency)})</label>
                <input
                  type="number"
                  required
                  placeholder="420"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white font-bold"
                />
              </div>

              {/* Merchant */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Merchant / Payee</label>
                <input
                  type="text"
                  required
                  placeholder="Domino's Pizza, Amazon..."
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white font-semibold"
                />
              </div>

              {/* Category & Payment Method Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary text-slate-800 dark:text-white font-semibold cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary text-slate-800 dark:text-white font-semibold cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="NetBanking">NetBanking</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Date of Transaction</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Description / Notes</label>
                <textarea
                  placeholder="Pizza Hut lunch with coworkers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white resize-none"
                />
              </div>

              {/* Upload Receipt File */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Receipt Image Attachment</label>
                
                <div className="flex gap-4 items-center">
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors shrink-0">
                    <Upload size={14} />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <div className="min-w-0 flex-1">
                    {receiptPreviewUrl ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={receiptPreviewUrl} 
                          alt="Receipt Preview" 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <span className="text-[10px] text-slate-500 truncate">
                          {receiptFile ? receiptFile.name : 'attached_receipt.png'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">No image attached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              >
                {editingId ? 'Update Record' : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Lightbox Receipt Image Overlay Modal */}
      {activeReceipt && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveReceipt(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative flex flex-col gap-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" />
                <span>Receipt Attachment Preview</span>
              </h3>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-450 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
              >
                Close
              </button>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl p-2 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={activeReceipt}
                alt="Receipt Attachment"
                className="max-h-[50vh] max-w-full rounded-lg object-contain shadow"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
