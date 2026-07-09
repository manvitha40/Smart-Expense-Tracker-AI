import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Coins, 
  Compass, 
  Flame, 
  ArrowUpRight, 
  ArrowDownRight,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

export default function Analytics() {
  const { user } = useContext(AuthContext);
  
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      const [expRes, incRes] = await Promise.all([
        axios.get('/api/expenses'),
        axios.get('/api/income')
      ]);
      setExpenses(expRes.data);
      setIncomes(incRes.data);
    } catch (err) {
      toast.error('Failed to load raw analytics logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getCurrencySymbol = (cur) => cur === 'USD' ? '$' : '₹';

  // Math variables
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;

  // Filter current and last month expenses
  const curMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  });

  const prevMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const curMonthIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  });

  const prevMonthIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const curMonthSpent = curMonthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const prevMonthSpent = prevMonthExpenses.reduce((sum, item) => sum + item.amount, 0);
  
  const curMonthEarned = curMonthIncomes.reduce((sum, item) => sum + item.amount, 0);
  const prevMonthEarned = prevMonthIncomes.reduce((sum, item) => sum + item.amount, 0);

  // 1. Highest Spending Category
  const categoryMap = {};
  curMonthExpenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  let highestCategory = 'N/A';
  let highestCategoryAmount = 0;
  for (let cat in categoryMap) {
    if (categoryMap[cat] > highestCategoryAmount) {
      highestCategory = cat;
      highestCategoryAmount = categoryMap[cat];
    }
  }

  // 2. Most Used Payment Method
  const paymentMap = {};
  expenses.forEach(e => {
    paymentMap[e.paymentMethod] = (paymentMap[e.paymentMethod] || 0) + 1;
  });
  let mostUsedPayment = 'N/A';
  let maxPaymentCount = 0;
  for (let pay in paymentMap) {
    if (paymentMap[pay] > maxPaymentCount) {
      mostUsedPayment = pay;
      maxPaymentCount = paymentMap[pay];
    }
  }

  // 3. Average Daily Spending
  const daysInCurMonth = now.getDate(); // current day number of the month
  const averageDailySpend = Math.round(curMonthSpent / daysInCurMonth) || 0;

  // 4. Biggest Expense (All time)
  let biggestExpense = { merchant: 'N/A', amount: 0 };
  if (expenses.length > 0) {
    const sorted = [...expenses].sort((a, b) => b.amount - a.amount);
    biggestExpense = { merchant: sorted[0].merchant, amount: sorted[0].amount };
  }

  // Weekly Trend Chart Data (group current month expenses by week number)
  const weeklyData = [
    { week: 'Week 1', amount: 0 },
    { week: 'Week 2', amount: 0 },
    { week: 'Week 3', amount: 0 },
    { week: 'Week 4', amount: 0 },
    { week: 'Week 5', amount: 0 }
  ];

  curMonthExpenses.forEach(exp => {
    const expDate = new Date(exp.date);
    const day = expDate.getDate();
    if (day <= 7) weeklyData[0].amount += exp.amount;
    else if (day <= 14) weeklyData[1].amount += exp.amount;
    else if (day <= 21) weeklyData[2].amount += exp.amount;
    else if (day <= 28) weeklyData[3].amount += exp.amount;
    else weeklyData[4].amount += exp.amount;
  });

  // Current Month vs Last Month Comparison Chart Data
  const comparisonData = [
    { name: 'Income', 'Last Month': prevMonthEarned, 'Current Month': curMonthEarned },
    { name: 'Expense', 'Last Month': prevMonthSpent, 'Current Month': curMonthSpent }
  ];

  const spendingDiff = curMonthSpent - prevMonthSpent;
  const spendingShiftPct = prevMonthSpent > 0 ? Math.round((spendingDiff / prevMonthSpent) * 100) : 0;

  // ── Spending Heatmap: day-of-week × week-of-month ─────────────────────────
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapGrid = Array.from({ length: 5 }, () => Array(7).fill(0)); // [week][day]
  curMonthExpenses.forEach(e => {
    const d = new Date(e.date);
    const week = Math.floor((d.getDate() - 1) / 7);
    const day = d.getDay();
    if (week < 5) heatmapGrid[week][day] += e.amount;
  });
  const heatmapMax = Math.max(...heatmapGrid.flat(), 1);

  // ── 6-Month Category Trend ─────────────────────────────────────────────────
  const sixMonthData = [];
  const topCats = Object.entries(categoryMap).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([n])=>n);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const label = d.toLocaleString('default', { month: 'short' });
    const row = { label };
    topCats.forEach(cat => {
      row[cat] = expenses
        .filter(e => { const ed = new Date(e.date); return ed.getMonth()===m && ed.getFullYear()===y && e.category===cat; })
        .reduce((s,e) => s + e.amount, 0);
    });
    sixMonthData.push(row);
  }
  const catColors = ['#0D9488','#7C3AED','#F97316','#EF4444'];

  return (
    <div className="space-y-6">
      
      {/* Top Title Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">Financial Analytics</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">Perform calculations, audit cash flow variables, and track performance shifts</p>
      </div>

      {/* Row 1: Key analytical statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Highest Spending Category */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Highest Spending Category</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-white truncate max-w-[130px]">{highestCategory}</h3>
            <p className="text-xs text-slate-500">
              Total Spent: {getCurrencySymbol(user?.currency)}{highestCategoryAmount.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-primary flex items-center justify-center shrink-0">
            <Flame size={20} />
          </div>
        </div>

        {/* Card 2: Most Used Payment Method */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Most Used Payment</span>
            <h3 className="text-xl font-black text-slate-805 dark:text-white">{mostUsedPayment}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Used in {maxPaymentCount} transactions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard size={20} />
          </div>
        </div>

        {/* Card 3: Average Daily Spending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Avg Daily Spending</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              {getCurrencySymbol(user?.currency)}{averageDailySpend.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500">Computed over current month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <Coins size={20} />
          </div>
        </div>

        {/* Card 4: Biggest Single Expense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Biggest Single Expense</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-white truncate max-w-[130px]">{biggestExpense.merchant}</h3>
            <p className="text-xs text-slate-500">
              Value: {getCurrencySymbol(user?.currency)}{biggestExpense.amount.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Compass size={20} />
          </div>
        </div>

      </div>

      {/* Row 2: Charts Layout (Linechart + Comparative analysis) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Weekly Spending Trend Line Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium">
          <div className="space-y-1 mb-6">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Weekly Spend Meter</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Fluctuation curve of expenses across the current month</p>
          </div>
          
          <div className="h-72 w-full text-xs font-semibold">
            {curMonthExpenses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No transactions recorded this month</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                  <XAxis dataKey="week" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip formatter={(value) => `${getCurrencySymbol(user?.currency)}${value.toLocaleString()}`} />
                  <Line type="monotone" dataKey="amount" stroke="#0D9488" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Comparative analysis (Current Month vs Last Month) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Comparative Audit</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Current vs last month earnings & expenses</p>
          </div>

          {/* Bar Chart representation */}
          <div className="h-48 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip formatter={(value) => `${getCurrencySymbol(user?.currency)}${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Last Month" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current Month" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Numeric Indicators */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Month-on-Month shift</span>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold mt-1">
                {spendingDiff > 0 ? (
                  <span className="text-danger flex items-center gap-1">
                    <ArrowUpRight size={14} />
                    <span>+{spendingShiftPct}% increase in spending</span>
                  </span>
                ) : spendingDiff < 0 ? (
                  <span className="text-secondary-dark dark:text-secondary-light flex items-center gap-1">
                    <ArrowDownRight size={14} />
                    <span>{spendingShiftPct}% decrease in spending</span>
                  </span>
                ) : (
                  <span className="text-slate-500">No net change in spending</span>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Spending Heatmap ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
        <div className="mb-4">
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Daily Spending Heatmap</h3>
          <p className="text-xs text-slate-400">Intensity of spending by day-of-week this month — darker = higher spend</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</div>)}
            </div>
            {/* Weeks */}
            {heatmapGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5 mb-1.5">
                {week.map((val, di) => {
                  const intensity = val / heatmapMax;
                  const opacity = val === 0 ? 0.06 : 0.15 + intensity * 0.85;
                  return (
                    <div
                      key={di}
                      title={val > 0 ? `${getCurrencySymbol(user?.currency)}${Math.round(val).toLocaleString()}` : 'No spending'}
                      className="aspect-square rounded-lg cursor-default transition-transform hover:scale-110"
                      style={{ background: `rgba(13, 148, 136, ${opacity})` }}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px] text-slate-400">Low</span>
              {[0.06,0.25,0.45,0.65,0.85].map(o => <div key={o} className="w-4 h-4 rounded" style={{background:`rgba(13,148,136,${o})`}} />)}
              <span className="text-[10px] text-slate-400">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6-Month Category Trends ── */}
      {sixMonthData.length > 0 && topCats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-premium">
          <div className="mb-5">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white">6-Month Category Trends</h3>
            <p className="text-xs text-slate-400">How your top spending categories have evolved over 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sixMonthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey="label" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={v => `${getCurrencySymbol(user?.currency)}${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(val, name) => [`${getCurrencySymbol(user?.currency)}${val.toLocaleString()}`, name]} />
              <Legend />
              {topCats.map((cat, i) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={catColors[i]} radius={i === topCats.length-1 ? [4,4,0,0] : [0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
