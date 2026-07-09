import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Loader, BarChart3, RefreshCw, Sparkles, BrainCircuit, HelpCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Forecast() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sandbox State
  const [incomeGrowth, setIncomeGrowth] = useState(10); // % growth
  const [investmentYield, setInvestmentYield] = useState(12); // % annual yield
  const [savingsRate, setSavingsRate] = useState(40); // % of income saved
  const [customEmi, setCustomEmi] = useState(0); // custom monthly deduction (e.g. EMI)

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get('/api/ai/forecast', { headers });
      setData(res);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForecast(); }, []);

  const curr = user?.currency === 'USD' ? '$' : '₹';

  // Projection math (5 Years = 60 Months)
  const generateProjections = () => {
    if (!data) return [];
    const projections = [];
    let currentBalance = data.avgIncome * 1.5; // assume a starting net worth fallback
    const baseIncome = data.avgIncome;
    
    for (let m = 1; m <= 60; m++) {
      const year = Math.ceil(m / 12);
      // Income increases each year by the incomeGrowth rate
      const growthFactor = Math.pow(1 + incomeGrowth / 100, year - 1);
      const projectedIncome = baseIncome * growthFactor;
      const amountSaved = projectedIncome * (savingsRate / 100);
      const netSavings = amountSaved - customEmi;
      
      // Add compound interest on previous month balance
      const monthlyInterestRate = (investmentYield / 100) / 12;
      currentBalance = currentBalance * (1 + monthlyInterestRate) + netSavings;
      
      if (m % 3 === 0 || m === 1) { // sample every 3 months for cleaner chart
        projections.push({
          month: `M${m}`,
          year: `Yr ${year}`,
          NetWorth: Math.max(0, Math.round(currentBalance)),
          Savings: Math.max(0, Math.round(amountSaved * m)),
        });
      }
    }
    return projections;
  };

  const projections = generateProjections();
  const finalNetWorth = projections[projections.length - 1]?.NetWorth || 0;
  
  // Calculate milestone months
  const getMilestoneMonths = (target) => {
    if (!data) return 'N/A';
    let currentBalance = data.avgIncome * 1.5;
    const baseIncome = data.avgIncome;
    for (let m = 1; m <= 240; m++) {
      const year = Math.ceil(m / 12);
      const growthFactor = Math.pow(1 + incomeGrowth / 100, year - 1);
      const projectedIncome = baseIncome * growthFactor;
      const netSavings = (projectedIncome * (savingsRate / 100)) - customEmi;
      currentBalance = currentBalance * (1 + (investmentYield / 100) / 12) + netSavings;
      if (currentBalance >= target) {
        const years = (m / 12).toFixed(1);
        return `${years} years (${m} months)`;
      }
    }
    return '>20 years';
  };

  const trendIcon = data?.trend === 'increasing'
    ? <TrendingUp size={18} className="text-red-500" />
    : data?.trend === 'decreasing'
    ? <TrendingDown size={18} className="text-green-500" />
    : <Minus size={18} className="text-yellow-500" />;

  const trendColor = data?.trend === 'increasing' ? 'text-red-500' : data?.trend === 'decreasing' ? 'text-green-500' : 'text-yellow-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <span>Predictive AI Net Worth Sandbox</span>
            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-primary rounded-full uppercase tracking-wider animate-pulse">PRO</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">ML-powered cashflow prediction + long-term wealth simulation</p>
        </div>
        <button
          onClick={fetchForecast}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 animate-pulse">Running AI analysis on your data…</p>
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-slate-400 space-y-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-premium">
          <p className="text-base font-bold">No historical data found</p>
          <p className="text-xs">Add salary credits and expense items to enable AI wealth simulation.</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── AI Next-Month Forecast Panel ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <BrainCircuit size={18} className="text-primary" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Next Month AI Prediction</h3>
              <span className="ml-auto px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/10 rounded-full">Linear Regression Model</span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Avg. Monthly Income</p>
                <p className="text-xl font-extrabold text-blue-700 dark:text-blue-300">{curr}{data.avgIncome.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-xl border ${data.willExceed ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-red-100 dark:border-red-900/30' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-100 dark:border-orange-900/30'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${data.willExceed ? 'text-red-500' : 'text-orange-500'}`}>Predicted Expense</p>
                <p className={`text-xl font-extrabold ${data.willExceed ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>{curr}{data.forecastedExpense.toLocaleString()}</p>
                {data.willExceed && <p className="text-[10px] text-red-500 mt-1 font-bold">⚠ Exceeds budget by {curr}{data.excessAmount.toLocaleString()}</p>}
              </div>
              <div className={`p-4 rounded-xl border ${data.forecastedSavings >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-red-100 dark:border-red-900/30'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${data.forecastedSavings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>Projected Savings</p>
                <p className={`text-xl font-extrabold ${data.forecastedSavings >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{curr}{data.forecastedSavings.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 border border-violet-100 dark:border-violet-900/30">
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1">Expense Trend</p>
                <div className="flex items-center gap-1.5 mt-1">{trendIcon}<p className={`text-lg font-extrabold capitalize ${trendColor}`}>{data.trend}</p></div>
                <p className="text-[10px] text-slate-400 mt-0.5">{curr}{data.slopeAmount}/mo change rate</p>
              </div>
            </div>

            {/* Top categories */}
            {data.topCategories?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">Top Spending Categories (3-month avg)</p>
                <div className="flex flex-wrap gap-2">
                  {data.topCategories.map((cat, i) => (
                    <span key={cat.name} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${i === 0 ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : i === 1 ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400' : 'bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'}`}>
                      #{i+1} {cat.name} · {curr}{cat.avgMonthly.toLocaleString()}/mo
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gemini AI explanation */}
            {data.explanation && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-primary" />
                  <p className="text-xs font-bold text-primary">Gemini AI Analysis</p>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
                  {data.explanation}
                </div>
              </div>
            )}
          </div>

          {/* ── Sandbox Panel ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sliders Panel */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium space-y-6">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Sparkles size={16} className="text-primary" />
                <span>Simulation Controls</span>
              </h3>

              {/* Income Growth */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Annual Salary Hike</span>
                  <span className="text-primary">{incomeGrowth}%</span>
                </div>
                <input
                  type="range" min="0" max="30" step="1"
                  value={incomeGrowth} onChange={e => setIncomeGrowth(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Savings Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Savings Target</span>
                  <span className="text-primary">{savingsRate}% of income</span>
                </div>
                <input
                  type="range" min="5" max="80" step="5"
                  value={savingsRate} onChange={e => setSavingsRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Investment Returns */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Annual Investment ROI</span>
                  <span className="text-primary">{investmentYield}%</span>
                </div>
                <input
                  type="range" min="0" max="25" step="1"
                  value={investmentYield} onChange={e => setInvestmentYield(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Custom EMI */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Monthly EMIs / Deductions</span>
                  <span className="text-primary">{curr}{customEmi.toLocaleString()}</span>
                </div>
                <input
                  type="range" min="0" max="40000" step="1000"
                  value={customEmi} onChange={e => setCustomEmi(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Summary statistics */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/30 text-xs leading-relaxed space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-350">Monthly Forecast Model</p>
                <p className="text-slate-400">
                  Starting Net Worth: <strong>{curr}{(data.avgIncome * 1.5).toLocaleString()}</strong><br />
                  Net Monthly savings: <strong>{curr}{Math.max(0, Math.round((data.avgIncome * (savingsRate/100)) - customEmi)).toLocaleString()}</strong>
                </p>
              </div>
            </div>

            {/* Forecast Area Chart Panel */}
            <div className="lg:col-span-8 space-y-6">
              {/* Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">5-Year Projected Net Worth</h3>
                    <p className="text-[11px] text-slate-400">Assuming compounding returns &amp; salary growth</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">Value in 5 Years</span>
                    <span className="text-lg font-black text-secondary">{curr}{finalNetWorth.toLocaleString()}</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={projections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #0D9488)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-primary, #0D9488)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={v => `${curr}${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(val) => [`${curr}${val.toLocaleString('en-IN')}`, 'Net Worth']} labelFormatter={(l, items) => items[0]?.payload?.year || l} />
                    <Area type="monotone" dataKey="NetWorth" stroke="var(--color-primary, #0D9488)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNetWorth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Milestones grid card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Milestone Estimator</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { target: 500000, label: `₹5 Lakhs (${curr}5,00,000)` },
                    { target: 1000000, label: `₹10 Lakhs (${curr}10,00,000)` },
                    { target: 2500000, label: `₹25 Lakhs (${curr}25,00,000)` },
                  ].map(item => (
                    <div key={item.target} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                        {getMilestoneMonths(item.target)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
