import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Loader, BarChart3, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Forecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get('/api/ai/forecast', { headers });
      setData(res);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForecast(); }, []);

  const curr = (data?.currency === 'USD') ? '$' : '₹';

  const TrendIcon = ({ trend }) => {
    if (trend === 'increasing') return <TrendingUp size={20} className="text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown size={20} className="text-emerald-500" />;
    return <Minus size={20} className="text-slate-400" />;
  };

  const trendColor = (trend) => {
    if (trend === 'increasing') return 'text-red-600 dark:text-red-400';
    if (trend === 'decreasing') return 'text-emerald-600 dark:text-emerald-400';
    return 'text-slate-500';
  };

  const trendBg = (trend) => {
    if (trend === 'increasing') return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30';
    if (trend === 'decreasing') return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30';
    return 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
  };

  const monthLabels = ['3 months ago', '2 months ago', 'Last month'];

  const chartData = data?.historicalMonths?.map((m, i) => ({
    name: monthLabels[i] || `Month ${i + 1}`,
    expense: m.totalExpense,
    income: m.totalIncome,
  })) || [];

  // Add forecast bar
  if (data) {
    chartData.push({
      name: 'Next Month',
      expense: data.forecastedExpense,
      income: data.avgIncome,
      isForecast: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Cashflow Forecast</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Predictive spending analysis based on your transaction history
          </p>
        </div>
        <button
          onClick={fetchForecast}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader size={32} className="animate-spin text-primary" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <BarChart3 size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Not enough data for forecast</p>
          <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Add at least 2 months of transactions to enable AI forecasting.</p>
        </div>
      ) : (
        <>
          {/* Budget Warning / Celebration */}
          {data.willExceed ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-2xl p-5 flex gap-4 items-center">
              <AlertTriangle size={36} className="text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-700 dark:text-red-400 text-lg">⚠️ Budget Overrun Predicted</p>
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                  Forecasted spending is <strong>{curr}{data.excessAmount.toLocaleString()}</strong> above your monthly budget.
                  Consider reducing spending in {data.topCategories?.[0]?.name || 'high-spend categories'}.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-5 flex gap-4 items-center">
              <CheckCircle size={36} className="text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">✅ You're on track!</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                  Forecasted spending is within your budget. Keep it up and you'll save approximately <strong>{curr}{Math.max(0, data.forecastedSavings).toLocaleString()}</strong> next month.
                </p>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Forecasted Expense',
                value: `${curr}${data.forecastedExpense.toLocaleString()}`,
                sub: 'Next month projection',
                icon: '📊',
                color: 'text-red-600 dark:text-red-400',
                bg: 'bg-red-50 dark:bg-red-900/20',
              },
              {
                label: 'Avg Monthly Income',
                value: `${curr}${data.avgIncome.toLocaleString()}`,
                sub: 'Based on past 3 months',
                icon: '💵',
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
              },
              {
                label: 'Projected Savings',
                value: `${curr}${Math.max(0, data.forecastedSavings).toLocaleString()}`,
                sub: 'Income minus expenses',
                icon: '💰',
                color: 'text-teal-600 dark:text-teal-400',
                bg: 'bg-teal-50 dark:bg-teal-900/20',
              },
            ].map(card => (
              <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-premium">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
                <p className="text-xs text-slate-400 font-medium">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Spending Trend */}
          <div className={`rounded-2xl p-5 border ${trendBg(data.trend)} flex items-center gap-4`}>
            <TrendIcon trend={data.trend} />
            <div>
              <p className={`font-semibold ${trendColor(data.trend)}`}>
                Spending is {data.trend === 'stable' ? 'stable' : `${data.trend} by ~${curr}${data.slopeAmount.toLocaleString()}/month`}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.trend === 'increasing' && 'Your expenses are growing month over month. Time to review your spending habits.'}
                {data.trend === 'decreasing' && 'Great job! Your spending is reducing. Keep the momentum going.'}
                {data.trend === 'stable' && 'Your spending pattern is consistent. Consider saving more of your income.'}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-premium">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Historical vs Forecast</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${curr}${val.toLocaleString()}`} />
                <Bar dataKey="expense" name="Expense" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.isForecast ? '#F59E0B' : '#EF4444'} fillOpacity={entry.isForecast ? 0.7 : 1} />
                  ))}
                </Bar>
                <Bar dataKey="income" name="Income" radius={[6, 6, 0, 0]} fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 text-center mt-3">
              🟡 Amber bar = AI Forecasted next month &nbsp;·&nbsp; 🔴 Red = Historical expense &nbsp;·&nbsp; 🟢 Green = Income
            </p>
          </div>

          {/* Top Categories */}
          {data.topCategories?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-premium">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Top Spending Categories (avg/mo)</h2>
              <div className="space-y-3">
                {data.topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400">
                        {i + 1}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{curr}{cat.avgMonthly.toLocaleString()}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
