import { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Plus, Trash2, PlusCircle, X, TrendingUp, Clock, CheckCircle2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const GOAL_EMOJIS = ['🎯','🏠','✈️','🚗','💻','📱','🎓','💍','🌴','🎮','💰','🏋️'];
const GOAL_COLORS = ['#0D9488','#059669','#3B82F6','#8B5CF6','#EC4899','#EF4444','#F59E0B','#6B7280'];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContribute, setShowContribute] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [form, setForm] = useState({ title: '', targetAmount: '', deadline: '', icon: '🎯', color: '#0D9488' });

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/goals', { headers });
      setGoals(data);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/goals', form, { headers });
      setGoals(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ title: '', targetAmount: '', deadline: '', icon: '🎯', color: '#0D9488' });
      toast.success('Goal created! 🎯');
    } catch { toast.error('Failed to create goal'); }
  };

  const handleContribute = async (goalId) => {
    const amt = Number(contributeAmount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    try {
      const { data } = await axios.put(`/api/goals/${goalId}/contribute`, { amount: amt }, { headers });
      setGoals(prev => prev.map(g => g._id === goalId ? data : g));
      setShowContribute(null);
      setContributeAmount('');
      if (data.savedAmount >= data.targetAmount) toast.success('🎉 Goal completed! Amazing!');
      else toast.success(`Added ₹${amt.toLocaleString()} to goal!`);
    } catch { toast.error('Failed to add contribution'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await axios.delete(`/api/goals/${id}`, { headers });
      setGoals(prev => prev.filter(g => g._id !== id));
      toast.success('Goal deleted');
    } catch { toast.error('Failed to delete goal'); }
  };

  const getProgress = (g) => Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completed = goals.filter(g => g.savedAmount >= g.targetAmount).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your financial milestones</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus size={18} /> New Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Saved', value: `₹${totalSaved.toLocaleString()}`, icon: '💰', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
          { label: 'Total Target', value: `₹${totalTarget.toLocaleString()}`, icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Goals Completed', value: `${completed} / ${goals.length}`, icon: '✅', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-premium">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader size={32} className="animate-spin text-primary" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <Target size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No goals yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Create a goal to start tracking your savings</p>
          <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map(goal => {
            const pct = getProgress(goal);
            const daysLeft = getDaysLeft(goal.deadline);
            const isCompleted = goal.savedAmount >= goal.targetAmount;

            return (
              <div key={goal._id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-premium hover:shadow-premium-hover transition-all duration-300 flex flex-col gap-4">
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: goal.color + '20' }}>
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{goal.title}</h3>
                      {daysLeft !== null && (
                        <span className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${daysLeft < 7 ? 'text-red-500' : 'text-slate-400'}`}>
                          <Clock size={11} /> {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isCompleted && <CheckCircle2 size={18} className="text-emerald-500" />}
                    <button onClick={() => handleDelete(goal._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">₹{goal.savedAmount.toLocaleString()}</span>
                    <span className="text-slate-400">₹{goal.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#059669' : goal.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{pct}% complete</span>
                    <span>₹{(goal.targetAmount - goal.savedAmount).toLocaleString()} remaining</span>
                  </div>
                </div>

                {/* Contribute */}
                {!isCompleted && (
                  showContribute === goal._id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={contributeAmount}
                        onChange={(e) => setContributeAmount(e.target.value)}
                        placeholder="Amount"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                      <button onClick={() => handleContribute(goal._id)} className="px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">Add</button>
                      <button onClick={() => { setShowContribute(null); setContributeAmount(''); }} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowContribute(goal._id)}
                      className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all font-medium"
                    >
                      <PlusCircle size={16} /> Add Savings
                    </button>
                  )
                )}

                {isCompleted && (
                  <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    🎉 Goal Achieved!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Savings Goal</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Goal Title</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. New Laptop, Vacation Fund"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Target Amount (₹)</label>
                <input
                  required
                  type="number"
                  value={form.targetAmount}
                  onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))}
                  placeholder="50000"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Target Date (Optional)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, icon: em }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === em ? 'bg-primary/20 ring-2 ring-primary' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm">
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
