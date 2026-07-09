import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Download, TrendingUp, TrendingDown, PiggyBank, Calendar, Trophy, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Reports() {
  const { user } = useContext(AuthContext);
  const reportRef = useRef(null);
  
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Month & Year filter state
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2026, 2025, 2024];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/reports', {
        params: { period, month, year }
      });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to compile report stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, month, year]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    const toastId = toast.loading('Compiling print-ready PDF statement...');

    try {
      const element = reportRef.current;
      
      // Setup canvas settings for high resolution print
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0F172A' : '#F8FAFC'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Handle multi-page canvas overflow
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`SmartSpend_${period}_report_${months[month]}_${year}.pdf`);
      toast.success('PDF report statement exported successfully', { id: toastId });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF document', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpense = 0,
    savings = 0,
    highestExpenseCategory = 'N/A',
    highestExpenseCategoryAmount = 0,
    mostExpensiveDay = 'N/A',
    mostExpensiveDayAmount = 0,
    averageDailySpending = 0,
    averageWeeklySpending = 0,
    categoryBreakdown = [],
    transactionsCount = 0
  } = data || {};

  const getCurrencySymbol = (cur) => cur === 'USD' ? '$' : '₹';
  const COLORS = ['#0D9488', '#059669', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#6B7280'];

  return (
    <div className="space-y-6">
      
      {/* Control Tabs Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        
        {/* Period Selector Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
                ${period === p 
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
              `}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Date Filters & Download trigger */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {period === 'monthly' && (
            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs font-bold rounded-xl py-2 px-3 text-slate-700 dark:text-slate-300"
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs font-bold rounded-xl py-2 px-3 text-slate-700 dark:text-slate-300"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-1.5 text-xs ml-auto sm:ml-0"
          >
            <Download size={14} />
            <span>{exporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Print Container Wrapper */}
      <div ref={reportRef} className="p-1 space-y-6">
        
        {/* Printable Header */}
        <div className="hidden border-b border-slate-200 pb-4 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-800">SmartSpend.AI</h1>
            <p className="text-xs text-slate-500">Financial Audit Statement — {period.toUpperCase()}</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p>User: {user?.name}</p>
          </div>
        </div>

        {/* Row 1: Key aggregations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Period Income</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">
                {getCurrencySymbol(user?.currency)}{totalIncome.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Period Expenses</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">
                {getCurrencySymbol(user?.currency)}{totalExpense.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Period Savings</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {getCurrencySymbol(user?.currency)}{savings.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Highest Category</span>
              <span className="text-2xl font-black text-slate-805 dark:text-white mt-1 block truncate max-w-[140px]">
                {highestExpenseCategory}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
              <Trophy size={20} />
            </div>
          </div>

        </div>

        {/* Row 2: Secondary Calculations & Averages */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          <div className="space-y-1.5 pb-4 md:pb-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Most Expensive Day</span>
            <h4 className="text-lg font-black text-slate-800 dark:text-white">{mostExpensiveDay}</h4>
            <p className="text-xs text-slate-500">
              Total Spent: {getCurrencySymbol(user?.currency)}{mostExpensiveDayAmount.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Daily Spending</span>
            <h4 className="text-lg font-black text-slate-800 dark:text-white animate-fade-in">
              {getCurrencySymbol(user?.currency)}{averageDailySpending.toLocaleString()}
            </h4>
            <p className="text-xs text-slate-500">Calculated over selected period</p>
          </div>

          <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Weekly Spending</span>
            <h4 className="text-lg font-black text-slate-800 dark:text-white">
              {getCurrencySymbol(user?.currency)}{averageWeeklySpending.toLocaleString()}
            </h4>
            <p className="text-xs text-slate-500">7-day rolling spending average</p>
          </div>

        </div>

        {/* Row 3: Charts Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Chart: Recharts Bar Chart */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white mb-4">Category Expenditures</h3>
            <div className="h-64 w-full text-xs font-semibold">
              {categoryBreakdown.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">No chart data logged</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                    <XAxis dataKey="name" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip formatter={(value) => `${getCurrencySymbol(user?.currency)}${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#0D9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right Chart: Recharts Pie Chart & breakdown list */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
            <h3 className="font-extrabold text-base text-slate-805 dark:text-white mb-4">Allocation Shares</h3>
            
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="h-36 w-full relative flex items-center justify-center text-xs font-bold">
                {categoryBreakdown.length === 0 ? (
                  <div className="text-slate-400">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Table breakdown list */}
              <div className="space-y-2 overflow-y-auto max-h-40 scrollbar-thin">
                {categoryBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-slate-850 dark:text-white">
                      {item.percentage}% ({getCurrencySymbol(user?.currency)}{item.amount.toLocaleString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
