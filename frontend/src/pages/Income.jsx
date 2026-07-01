import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Calendar, FileText, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const fetchIncomes = async () => {
    try {
      const res = await axios.get('/api/income');
      setIncomes(res.data);
    } catch (err) {
      toast.error('Failed to load income records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

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
        toast.success('Income record updated');
      } else {
        await axios.post('/api/income', payload);
        toast.success('Income record created successfully');
      }
      setShowModal(false);
      fetchIncomes();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income log?')) return;
    try {
      await axios.delete(`/api/income/${id}`);
      toast.success('Income record deleted');
      fetchIncomes();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  // Pagination math
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = incomes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(incomes.length / itemsPerPage);

  const getCurrencySymbol = (cur) => cur === 'INR' ? '₹' : '$';

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Income Streams</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Record wages, freelance earnings, or cash gifts</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 transition-transform flex items-center gap-1.5 text-sm"
        >
          <Plus size={16} />
          <span>Add Income</span>
        </button>
      </div>

      {/* Income Records List Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : incomes.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <p className="text-base font-bold">No income logged yet</p>
            <p className="text-xs">Get started by tapping the "+ Add Income" button above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Source</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {currentItems.map((item) => (
                    <tr key={item._id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs shrink-0">
                            IN
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-white">{item.source}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500 max-w-[200px] truncate">
                        {item.description || <span className="text-slate-300 dark:text-slate-700 italic">No notes</span>}
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-green-600 dark:text-green-400 text-sm">
                        +{getCurrencySymbol(user?.currency)}{item.amount.toLocaleString()}
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

      {/* Add / Edit Income Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative animate-fade-in flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                {editingId ? 'Edit Income Record' : 'Record New Income'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Amount field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Amount ({getCurrencySymbol(user?.currency)})</label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white font-bold"
                />
              </div>

              {/* Source Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Income Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white font-semibold cursor-pointer"
                >
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Business">Business</option>
                  <option value="Gift">Gift</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Date of Credit</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>

              {/* Description Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Description / Notes</label>
                <textarea
                  placeholder="Bonus payment, freelance project X details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white resize-none"
                />
              </div>

              {/* Action save buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl font-bold shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all duration-200"
              >
                {editingId ? 'Update Record' : 'Save Income'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
