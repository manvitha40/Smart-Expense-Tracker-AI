import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Tag, Utensils, Car, ShoppingBag, Activity, Home, Zap, Tv, BookOpen, Dumbbell, Dog, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ICON_MAP = {
  Tag: Tag,
  Utensils: Utensils,
  Car: Car,
  ShoppingBag: ShoppingBag,
  Activity: Activity,
  Home: Home,
  Zap: Zap,
  Tv: Tv,
  BookOpen: BookOpen,
  Dumbbell: Dumbbell,
  Dog: Dog
};

export default function Categories() {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#0D9488');
  const [icon, setIcon] = useState('Tag');

  const presetColors = [
    '#0D9488', // Teal
    '#059669', // Emerald
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#6B7280', // Slate/Others
  ];

  const presetIcons = ['Tag', 'Utensils', 'Car', 'ShoppingBag', 'Activity', 'Home', 'Zap', 'Tv', 'BookOpen', 'Dumbbell', 'Dog'];

  const fetchData = async () => {
    try {
      const [catRes, expRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/expenses')
      ]);
      setCategories(catRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      toast.error('Failed to load category information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setColor('#0D9488');
    setIcon('Tag');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setName(item.name);
    setColor(item.color || '#0D9488');
    setIcon(item.icon || 'Tag');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required');

    const payload = { name: name.trim(), color, icon };

    try {
      if (editingId) {
        await axios.put(`/api/categories/${editingId}`, payload);
        toast.success('Category updated successfully');
      } else {
        await axios.post('/api/categories', payload);
        toast.success('New category registered');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id, catName) => {
    const isSystem = ['Food', 'Travel', 'Shopping', 'Medicine', 'Rent', 'Bills', 'Subscriptions', 'Others'].includes(catName);
    if (isSystem) {
      return toast.error('Cannot delete default system categories');
    }

    if (!window.confirm(`Delete the custom category "${catName}"? This will not delete transactions under it.`)) return;

    try {
      await axios.delete(`/api/categories/${id}`);
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  // Helper: compute expense statistics client-side
  const getCategoryStats = (catName) => {
    const matchingExpenses = expenses.filter(e => e.category?.toLowerCase() === catName.toLowerCase());
    const count = matchingExpenses.length;
    const total = matchingExpenses.reduce((sum, item) => sum + item.amount, 0);
    return { count, total };
  };

  const getCurrencySymbol = (cur) => cur === 'USD' ? '$' : '₹';

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Categories Manager</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Designate custom classification folders for transaction logging</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-1.5 text-sm"
        >
          <Plus size={16} />
          <span>New Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const stats = getCategoryStats(cat.name);
            const IconComponent = ICON_MAP[cat.icon] || Tag;
            const isSystemCategory = ['Food', 'Travel', 'Shopping', 'Medicine', 'Rent', 'Bills', 'Subscriptions', 'Others'].includes(cat.name);

            return (
              <div 
                key={cat._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: cat.color || '#0D9488' }}
                    >
                      <IconComponent size={20} />
                    </div>

                    {!isSystemCategory && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id, cat.name)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 dark:text-white truncate" title={cat.name}>
                      {cat.name}
                    </h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                      {stats.count} {stats.count === 1 ? 'transaction' : 'transactions'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Total Spent</span>
                  <span className="text-lg font-black text-slate-805 dark:text-white">
                    {getCurrencySymbol(user?.currency)}{stats.total.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative animate-fade-in flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                {editingId ? 'Edit Category' : 'Create Custom Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Category Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Dog Food, Gym..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white font-semibold"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Choose Theme Color</label>
                <div className="flex flex-wrap gap-2.5">
                  {presetColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-xl border-2 transition-all shrink-0 hover:scale-105 ${color === c ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {/* Native color picker */}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Select Category Icon</label>
                <div className="flex flex-wrap gap-2.5">
                  {presetIcons.map(iconName => {
                    const PresIcon = ICON_MAP[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 hover:scale-105
                          ${icon === iconName 
                            ? 'bg-primary text-white border-primary shadow shadow-primary/20 scale-105' 
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100'}
                        `}
                      >
                        <PresIcon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              >
                {editingId ? 'Update Folder' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
