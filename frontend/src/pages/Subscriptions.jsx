import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { RefreshCw, AlertTriangle, Clock, CheckCircle, Loader, Zap, Calendar as CalendarIcon, List } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  Subscriptions: '📺',
  Bills: '⚡',
  Food: '🍕',
  Shopping: '🛒',
  Travel: '✈️',
  Others: '📦',
};

const PAYMENT_ICONS = { UPI: '📱', 'Credit Card': '💳', Cash: '💵', NetBanking: '🏦', Others: '🔗' };

export default function Subscriptions() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get('/api/subscriptions', { headers });
      setData(res);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubs(); }, []);

  const curr = user?.currency === 'USD' ? '$' : '₹';

  const urgencyColor = (days) => {
    if (days <= 3) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
    if (days <= 7) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50';
    return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50';
  };

  const urgencyLabel = (days) => {
    if (days === 0) return 'Due today!';
    if (days === 1) return 'Due tomorrow!';
    if (days <= 3) return `${days}d — Act soon`;
    if (days <= 7) return `${days}d — This week`;
    return `${days} days`;
  };

  // Calendar Math
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-IN', { month: 'long' });
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
  const totalDays = new Date(year, month + 1, 0).getDate(); // Days in month
  
  const calendarCells = [];
  // Fill initial empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Fill day numbers
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push(i);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Subscription Radar</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Track and forecast your recurring bills & streaming plans</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded-xl flex items-center border border-slate-200/30">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all
                ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={13} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all
                ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <CalendarIcon size={13} />
              <span>Calendar</span>
            </button>
          </div>
          
          <button
            onClick={fetchSubs}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.subscriptions.length === 0 ? (
        <div className="py-20 text-center text-slate-400 space-y-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-premium">
          <p className="text-base font-bold">No recurring subscriptions detected</p>
          <p className="text-xs">Add duplicate expense entries (same merchant, recurring monthly dates) to auto-detect.</p>
        </div>
      ) : (
        <>
          {/* Summary overhead card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl flex items-center justify-center text-xl shrink-0">
                <Zap size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monthly Subscription Overhead</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                  {curr}{data.totalMonthlyOverhead.toLocaleString()}
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium"> / month</span>
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-slate-450 dark:text-slate-550">
              Total active plans detected: <span className="text-primary text-sm">{data.subscriptions.length}</span>
            </div>
          </div>

          {/* Views switcher */}
          {viewMode === 'list' ? (
            /* List View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.subscriptions.map((sub, i) => {
                const days = sub.daysUntilRenewal;
                const icon = CATEGORY_ICONS[sub.category] || '💳';
                return (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex flex-col justify-between hover:shadow-premium-hover transition-all duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-100 dark:border-slate-800">{icon}</span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-slate-800 dark:text-white truncate capitalize">{sub.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{sub.occurrences} transactions detected</p>
                        </div>
                      </div>
                      <span className="text-base font-black text-slate-850 dark:text-white whitespace-nowrap">{curr}{sub.avgAmount.toLocaleString()}</span>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/40 pt-4">
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${urgencyColor(days)}`}>
                        <span>{urgencyLabel(days)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Next: {new Date(sub.nextRenewal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Calendar View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Renewal Calendar</h3>
                  <p className="text-[10px] text-slate-400 capitalize">Subscription due dates for {currentMonthName} {year}</p>
                </div>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide pb-3 border-b border-slate-100 dark:border-slate-800">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d}>{d}</span>)}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2 mt-2">
                {calendarCells.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="h-16 bg-slate-50/20 dark:bg-slate-800/10 rounded-xl" />;
                  
                  // Check if any subscriptions are due on this date number
                  const dueSubs = data.subscriptions.filter(sub => {
                    const d = new Date(sub.nextRenewal);
                    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                  });

                  return (
                    <div
                      key={`day-${day}`}
                      className={`h-16 p-1.5 rounded-xl border relative flex flex-col justify-between
                        ${dueSubs.length > 0 
                          ? 'bg-red-50/20 border-red-200 dark:border-red-950/20 dark:bg-red-950/5' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/50'}`}
                    >
                      <span className="text-[10px] font-black text-slate-400">{day}</span>
                      
                      {dueSubs.length > 0 && (
                        <div className="space-y-0.5">
                          {dueSubs.slice(0, 2).map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              className="px-1 py-0.5 text-[8px] font-extrabold bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded flex items-center justify-between truncate"
                              title={`${sub.name}: ${curr}${sub.avgAmount}`}
                            >
                              <span className="truncate">{sub.name}</span>
                              <span className="shrink-0">{curr}{sub.avgAmount}</span>
                            </div>
                          ))}
                          {dueSubs.length > 2 && (
                            <div className="text-[7px] text-slate-400 text-center font-bold">
                              +{dueSubs.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI tips panel */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 font-bold">Recurring Audit Tip</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                You're spending <strong>{curr}{data.totalMonthlyOverhead.toLocaleString()}/month</strong> on recurring bills and subscriptions. 
                Identify services you haven't accessed in the last 30 days and cancel them to instantly increase your monthly savings margin.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
