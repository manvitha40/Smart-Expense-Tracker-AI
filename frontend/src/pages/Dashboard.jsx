import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Target, 
  Calendar, 
  ArrowUpRight,
  Eye, 
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { currency, stats, recentTransactions, charts } = data || {
    currency: 'INR',
    stats: { totalIncome: 0, totalExpense: 0, balance: 0, savings: 0, monthlyBudget: 0, budgetRemaining: 0, budgetUsagePercent: 0 },
    recentTransactions: [],
    charts: { categoryDistribution: [], monthlyTrend: [] }
  };

  const getCurrencySymbol = (cur) => cur === 'USD' ? '$' : '₹';

  // Pie chart colors
  const COLORS = ['#0D9488', '#059669', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#6B7280'];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-6 rounded-3xl border border-primary/15 dark:border-primary/5">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
            Hello, {user?.name}! 👋
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome to your financial command center. Here is your current standing.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/receipt-scanner"
            className="px-4 py-2 text-sm bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-1.5"
          >
            <ImageIcon size={16} />
            <span>Scan Receipt</span>
          </Link>
          <button
            onClick={() => navigate('/expenses', { state: { openAddModal: true } })}
            className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Row 1: Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={stats.balance}
          currency={currency}
          icon={Wallet}
          colorClass="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
          trend={{ type: 'neutral', value: 'All-time remaining funds' }}
        />
        <StatCard
          label="Monthly Income"
          value={stats.totalIncome}
          currency={currency}
          icon={TrendingUp}
          colorClass="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
          trend={{ type: 'up', value: `This month's earnings` }}
        />
        <StatCard
          label="Monthly Expenses"
          value={stats.totalExpense}
          currency={currency}
          icon={TrendingDown}
          colorClass="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
          trend={{ 
            type: stats.totalExpense > stats.monthlyBudget && stats.monthlyBudget > 0 ? 'down' : 'neutral', 
            value: stats.monthlyBudget > 0 ? `${stats.budgetUsagePercent}% of budget used` : 'No budget set' 
          }}
        />
        <StatCard
          label="Monthly Savings"
          value={stats.savings}
          currency={currency}
          icon={PiggyBank}
          colorClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
          trend={{ 
            type: stats.savings > 0 ? 'up' : 'neutral', 
            value: stats.totalIncome > 0 ? `${Math.round((stats.savings / stats.totalIncome) * 100)}% savings rate` : 'No savings yet' 
          }}
        />
      </div>

      {/* Row 2: Charts (Expense Trend + Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Monthly Expenses Area Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Cashflow Trend</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">6-month summary of earnings & expenses</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>Income</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span>Expense</span>
            </div>
          </div>
          
          <div className="h-72 w-full text-xs font-medium">
            {charts.monthlyTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No chart data logged</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                      borderRadius: '12px',
                      color: '#fff',
                      border: '0px'
                    }} 
                  />
                  <Area type="monotone" dataKey="income" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="expense" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Pie Chart Category Distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium flex flex-col">
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white mb-1">Expense Breakdown</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Distribution for the current month</p>
          
          <div className="h-44 w-full relative flex items-center justify-center text-xs font-semibold">
            {charts.categoryDistribution.length === 0 ? (
              <div className="text-slate-400">No expenses this month</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${getCurrencySymbol(currency)}${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center label (absolute layout) */}
            {charts.categoryDistribution.length > 0 && (
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Spent</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">
                  {getCurrencySymbol(currency)}{stats.totalExpense.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Legend / Category List breakdown */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 max-h-40 scrollbar-thin">
            {charts.categoryDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No categories recorded</p>
            ) : (
              charts.categoryDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></span>
                    <span className="truncate max-w-[120px]">{entry.name}</span>
                  </div>
                  <span className="text-slate-800 dark:text-white">
                    {getCurrencySymbol(currency)}{entry.value.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Monthly Budget Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Monthly Budget Planner</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Track and monitor your monthly spending cap</p>
          </div>

          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><Target size={14} /> Spent</span>
              <span>Limit: {getCurrencySymbol(currency)}{stats.monthlyBudget.toLocaleString()}</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-slate-800 dark:text-white">
                {getCurrencySymbol(currency)}{stats.totalExpense.toLocaleString()}
              </h4>
              
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.budgetUsagePercent > 100 
                      ? 'bg-danger' 
                      : stats.budgetUsagePercent > 85 
                        ? 'bg-amber-500' 
                        : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, stats.budgetUsagePercent)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>{stats.budgetUsagePercent}% consumed</span>
                <span>{getCurrencySymbol(currency)}{stats.budgetRemaining.toLocaleString()} remaining</span>
              </div>
            </div>
          </div>

          {/* Budget Warnings Panel */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-800/30">
            {stats.monthlyBudget === 0 ? (
              <p className="text-xs text-slate-500 text-center">
                No budget limit set. Set a budget inside the <Link to="/budget" className="text-primary hover:underline font-bold">Budget Planner</Link> to start monitoring alerts.
              </p>
            ) : stats.totalExpense > stats.monthlyBudget ? (
              <div className="flex gap-3 text-danger">
                <AlertTriangle className="shrink-0" size={18} />
                <p className="text-xs font-semibold leading-relaxed">
                  Budget Exceeded! You have spent {getCurrencySymbol(currency)}{(stats.totalExpense - stats.monthlyBudget).toLocaleString()} over your monthly allocation. Reduce shopping/dining immediately.
                </p>
              </div>
            ) : stats.budgetUsagePercent >= 90 ? (
              <div className="flex gap-3 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="shrink-0" size={18} />
                <p className="text-xs font-semibold leading-relaxed">
                  Warning! Only {stats.budgetUsagePercent}% remains of your total allocation. Try cutting out secondary luxury expenses.
                </p>
              </div>
            ) : (
              <p className="text-xs text-secondary-dark dark:text-secondary-light font-semibold text-center">
                🎉 Spot on! You are currently keeping within your monthly spending limits.
              </p>
            )}
          </div>
        </div>

        {/* Right: Recent Transactions Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Latest earnings and payments ledger</p>
            </div>
            <Link 
              to="/expenses" 
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>View ledger</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Details</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      No transactions logged. Add expenses to populate the ledger.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx._id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                            tx.type === 'income' 
                              ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' 
                              : 'bg-indigo-50 dark:bg-indigo-950/20 text-primary dark:text-primary-light'
                          }`}>
                            {tx.category.slice(0,2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate max-w-[140px]">{tx.merchant}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{tx.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 max-w-[100px] truncate">{tx.paymentMethod}</td>
                      <td className="py-3.5 text-slate-400 dark:text-slate-500">
                        {new Date(tx.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </td>
                      <td className={`py-3.5 text-right font-bold text-sm ${
                        tx.type === 'income' ? 'text-secondary-dark dark:text-secondary-light' : 'text-slate-800 dark:text-white'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{getCurrencySymbol(currency)}{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center">
                        {tx.receiptImage ? (
                          <button
                            onClick={() => setActiveReceipt(tx.receiptImage)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors inline-flex justify-center items-center"
                            title="View receipt attachment"
                          >
                            <Eye size={14} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-700 font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Full Screen Receipt Preview Overlay Modal */}
      {activeReceipt && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveReceipt(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" />
                <span>Receipt Attachment Preview</span>
              </h3>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
              >
                Close
              </button>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl p-2 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={activeReceipt}
                alt="Receipt Attachment"
                className="max-h-[50vh] max-w-full rounded-lg object-contain shadow"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
