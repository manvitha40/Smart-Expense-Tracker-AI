import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Loader, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  Subscriptions: '📺',
  Bills: '⚡',
  Food: '🍕',
  Shopping: '🛒',
  Travel: '✈️',
  Others: '📦',
};

export default function Subscriptions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const urgencyIcon = (days) => {
    if (days <= 3) return <AlertTriangle size={14} />;
    if (days <= 7) return <Clock size={14} />;
    return <CheckCircle size={14} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Auto-detected recurring payments from your transaction history
          </p>
        </div>
        <button
          onClick={fetchSubs}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader size={32} className="animate-spin text-primary" />
        </div>
      ) : !data || data.subscriptions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No recurring payments detected</p>
          <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Add more expense transactions to enable detection.</p>
        </div>
      ) : (
        <>
          {/* Summary Banner */}
          <div className="bg-gradient-to-br from-primary/10 via-teal-50/50 to-transparent dark:from-primary/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl p-6 border border-teal-100 dark:border-teal-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 mb-1">
                <Zap size={18} />
                <span className="font-semibold text-sm">Monthly Subscription Overhead</span>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white">
                ₹{data.totalMonthlyOverhead.toLocaleString()}
                <span className="text-lg font-medium text-slate-400 dark:text-slate-500">/mo</span>
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold text-primary text-lg">{data.subscriptions.length}</span> recurring services detected
            </div>
          </div>

          {/* Subscription Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.subscriptions.map((sub, i) => {
              const days = sub.daysUntilRenewal;
              const icon = CATEGORY_ICONS[sub.category] || '💳';

              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-premium hover:shadow-premium-hover transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center text-2xl">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate capitalize">{sub.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{sub.category} · {sub.occurrences}× detected</p>
                    </div>
                    <span className="text-lg font-black text-teal-700 dark:text-teal-400 whitespace-nowrap">
                      ₹{sub.avgAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Renewal Badge */}
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border w-fit ${urgencyColor(days)}`}>
                    {urgencyIcon(days)}
                    <span>Renews in {urgencyLabel(days)}</span>
                  </div>

                  {/* Renewal Date */}
                  <p className="text-xs text-slate-400 mt-3">
                    Next renewal: {new Date(sub.nextRenewal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Smart Tip</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                You're spending <strong>₹{data.totalMonthlyOverhead.toLocaleString()}/month</strong> on recurring services.
                Review each subscription and cancel ones you don't actively use — it could free up significant monthly cash.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
