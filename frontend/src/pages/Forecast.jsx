import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Loader, BarChart3, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const headers = { 'x-auth-token': token };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <span>Predictive AI Net Worth Sandbox</span>
            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-primary rounded-full uppercase tracking-wider animate-pulse">PRO</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Simulate long-term wealth growth, EMIs, and savings milestones</p>
        </div>
        <button
          onClick={fetchForecast}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Base Data
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-slate-400 space-y-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-premium">
          <p className="text-base font-bold">No historical data found</p>
          <p className="text-xs">Add salary credits and expense items to enable wealth simulation.</p>
        </div>
      ) : (
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
                  <p className="text-[11px] text-slate-400">Assuming compounding returns & salary growth</p>
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
      )}
    </div>
  );
}
