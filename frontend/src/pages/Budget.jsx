import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Target, TrendingDown, Landmark, ShieldAlert, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Budget() {
  const { user, updateProfile } = useContext(AuthContext);
  
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [budgetHistory, setBudgetHistory] = useState([]);

  const fetchBudgetDetails = async () => {
    try {
      // Calculate current month spent from expenses
      const res = await axios.get('/api/expenses');
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyExpenses = res.data.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const spentSum = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalSpent(spentSum);
      setNewBudget(user?.monthlyBudget || '');

      // Create dummy budget history list for reports
      const dummyHistory = [
        { month: 'May 2026', limit: user?.monthlyBudget || 50000, spent: Math.round(spentSum * 0.9) },
        { month: 'Apr 2026', limit: user?.monthlyBudget || 50000, spent: Math.round(spentSum * 0.85) },
        { month: 'Mar 2026', limit: user?.monthlyBudget || 50000, spent: Math.round(spentSum * 1.05) },
      ];
      setBudgetHistory(dummyHistory);
    } catch (err) {
      console.error('Error loading budget summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetDetails();
  }, [user]);

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (!newBudget || Number(newBudget) <= 0) {
      return toast.error('Please enter a valid budget amount');
    }

    try {
      await updateProfile({ monthlyBudget: Number(newBudget) });
      toast.success('Monthly budget updated successfully');
      setShowUpdateModal(false);
    } catch (err) {
      toast.error('Failed to update budget');
    }
  };

  const getCurrencySymbol = (cur) => cur === 'INR' ? '₹' : '$';

  const budgetLimit = user?.monthlyBudget || 0;
  const remaining = Math.max(0, budgetLimit - totalSpent);
  const spentPct = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  // Progress Bar styling helper
  const getProgressColor = (pct) => {
    if (pct > 100) return 'bg-danger';
    if (pct >= 85) return 'bg-amber-500';
    return 'bg-primary';
  };

  const getPercentageColorText = (pct) => {
    if (pct > 100) return 'text-danger';
    if (pct >= 85) return 'text-amber-500';
    return 'text-primary';
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Budget Planner</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Plan monthly targets and manage warning thresholds</p>
        </div>
        <button
          onClick={() => setShowUpdateModal(true)}
          className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-sm"
        >
          Update Budget
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Planner Progress Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium space-y-6">
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Current Month Standings</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Limit</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">
                {getCurrencySymbol(user?.currency)}{budgetLimit.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
              <span className={`text-xl font-black mt-1 block ${getProgressColor(spentPct) === 'bg-danger' ? 'text-danger' : 'text-slate-800 dark:text-white'}`}>
                {getCurrencySymbol(user?.currency)}{totalSpent.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
              <span className="text-xl font-black text-secondary-dark dark:text-secondary-light mt-1 block">
                {getCurrencySymbol(user?.currency)}{remaining.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 py-4">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>PROGRESS METER</span>
              <span className={`font-black ${getPercentageColorText(spentPct)}`}>{Math.round(spentPct)}% USED</span>
            </div>
            
            <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(spentPct)}`}
                style={{ width: `${Math.min(100, spentPct)}%` }}
              ></div>
            </div>
          </div>

          {/* Budget warning triggers detail text */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 text-slate-500 leading-relaxed text-xs">
            <ShieldAlert size={20} className="text-primary shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-200">Alert Automation Rules</p>
              <p>1. When total spending hits **90%** of budget limit, the system dispatches an orange Warning Notification.</p>
              <p>2. If spending exceeds **100%**, a red Budget Exceeded alert notifies you to cease secondary transactions.</p>
            </div>
          </div>
        </div>

        {/* Right Info: Advice & History cards */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Advice card */}
          <div className="bg-gradient-to-tr from-primary to-slate-900 text-white rounded-3xl p-6 shadow-premium space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-xl -mr-10 -mt-10"></div>
            
            <div className="flex gap-2 items-center">
              <Sparkles size={18} className="text-secondary-light" />
              <h4 className="font-bold text-sm uppercase tracking-wider text-white/80">AI Budget Tip</h4>
            </div>

            <p className="text-sm leading-relaxed text-white/80">
              Implementing the **50/30/20 rule** is highly recommended. Allocate 50% of your earnings to Needs (Rent, Bills), 30% to Wants (Shopping, Dining), and 20% directly to Savings.
            </p>

            <div className="text-xs text-white/60">
              👉 Tip: You are currently saving **{user?.monthlyBudget && totalSpent < user.monthlyBudget ? Math.round(((user.monthlyBudget - totalSpent) / user.monthlyBudget) * 100) : 0}%** of your target this month.
            </div>
          </div>

          {/* Historical Budgets list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium">
            <h4 className="font-extrabold text-sm text-slate-805 dark:text-white mb-4">Historical Performance</h4>
            
            <div className="space-y-3.5">
              {budgetHistory.map((h, idx) => {
                const hPct = (h.spent / h.limit) * 100;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                    <div>
                      <p className="font-bold text-slate-850 dark:text-white">{h.month}</p>
                      <p className="text-[10px] text-slate-400">Limit: {getCurrencySymbol(user?.currency)}{h.limit.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 dark:text-white">
                        Spent: {getCurrencySymbol(user?.currency)}{h.spent.toLocaleString()}
                      </p>
                      <p className={`text-[10px] font-bold ${hPct > 100 ? 'text-danger' : 'text-slate-400'}`}>
                        {Math.round(hPct)}% used
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Update Budget Dialog Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative animate-fade-in flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Modify Budget Limit</h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  New Monthly Target ({getCurrencySymbol(user?.currency)})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white font-bold"
                  />
                  <Landmark className="absolute left-3.5 top-3 text-slate-400" size={16} />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              >
                Apply Budget Limit
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
