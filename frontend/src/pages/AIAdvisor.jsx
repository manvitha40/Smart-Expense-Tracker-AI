import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bot, Send, User as UserIcon, Sparkles, RefreshCw, AlertCircle, FileDown, CheckCircle, TrendingUp, TrendingDown, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function AIAdvisor() {
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  const auditReportRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `👋 Hello **${user?.name}**! I am your AI Financial Advisor. I can audit your transactions, analyze budgets, and give you custom savings plans.\n\nClick **"Generate Spending Insights"** to scan this month's logs, or ask me any question below!`
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [auditData, setAuditData] = useState(null);

  const quickSuggestions = [
    'Generate spending insights',
    'How can I save more money?',
    'Analyze my shopping expenses',
    'Tips to budget better'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load audit data in background to be ready for PDF report
  const loadAuditData = async () => {
    try {
      const [dbRes, goalRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/goals')
      ]);
      setAuditData({
        stats: dbRes.data.stats,
        recent: dbRes.data.recentTransactions,
        goals: goalRes.data,
        currency: dbRes.data.currency || 'INR'
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => { loadAuditData(); }, [user]);

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const isInsights = queryText.toLowerCase().includes('generate spending insights') || queryText.toLowerCase() === 'generate insights';
      const payload = isInsights ? {} : { customMessage: queryText };
      const res = await axios.post('/api/ai/analyze', payload);
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.advice }]);
    } catch {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: '❌ Sorry, I encountered an issue analyzing your request. Please check your network connection or verify that a `GEMINI_API_KEY` is set in your backend `.env` file.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  // Compile PDF report statement using HTML to canvas
  const handleExportPDF = async () => {
    if (!auditData) return toast.error('Loading audit logs, please try again in a moment');
    setExporting(true);
    const toastId = toast.loading('Compiling print-ready AI Financial Audit Document...');

    try {
      const element = auditReportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF' // force white background for printing
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`SmartSpend_AI_Financial_Audit_${user?.name?.replace(/\s+/g, '_')}.pdf`);
      toast.success('AI Audit Document downloaded!', { id: toastId });
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF audit report', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const renderMarkdown = (text) => {
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    escaped = escaped.replace(/^### (.*$)/gim, '<h4 class="font-extrabold text-sm text-slate-800 dark:text-white mt-3 mb-1.5">$1</h4>');
    escaped = escaped.replace(/^#### (.*$)/gim, '<h5 class="font-bold text-xs text-slate-750 dark:text-slate-200 mt-2.5 mb-1">$1</h5>');
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-850 dark:text-white">$1</strong>');
    escaped = escaped.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc py-0.5">$1</li>');
    escaped = escaped.replace(/\n/g, '<br />');

    return { __html: escaped };
  };

  const curr = auditData?.currency === 'USD' ? '$' : '₹';

  return (
    <div className="space-y-6">
      {/* Hidden print-ready PDF template layout */}
      {auditData && (
        <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '800px', zIndex: -10 }}>
          <div ref={auditReportRef} className="p-10 bg-white text-slate-800 font-sans space-y-8" style={{ width: '800px' }}>
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-teal-500 pb-5">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">SmartSpend<span className="text-teal-600">.AI</span></h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Autonomous Financial Audit & Optimization Report</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Prepared for: {user?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Overall rating */}
            <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-teal-850">Financial Health Rating</h3>
                <p className="text-xs text-teal-700 mt-1 leading-relaxed">
                  Your budget spending is currently at <strong>{auditData.stats.budgetUsagePercent}%</strong>.
                  {auditData.stats.budgetUsagePercent > 100 
                    ? ' Warning: You have exceeded your monthly limit. Act immediately to pause secondary expenses.' 
                    : ' Your finances are in a safe configuration. Continue compound saving.'}
                </p>
              </div>
              <span className="text-4xl font-black text-teal-600">{auditData.stats.budgetUsagePercent > 100 ? 'B-' : 'A+'}</span>
            </div>

            {/* KPI statistics cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Monthly Income', val: `${curr}${auditData.stats.totalIncome.toLocaleString()}` },
                { label: 'Monthly Spent', val: `${curr}${auditData.stats.totalExpense.toLocaleString()}` },
                { label: 'Remaining Budget', val: `${curr}${auditData.stats.budgetRemaining.toLocaleString()}` },
                { label: 'Savings Rate', val: auditData.stats.totalIncome > 0 ? `${Math.round((auditData.stats.savings / auditData.stats.totalIncome) * 100)}%` : '0%' },
              ].map(c => (
                <div key={c.label} className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">{c.label}</span>
                  <span className="text-base font-black text-slate-800 mt-1 block">{c.val}</span>
                </div>
              ))}
            </div>

            {/* Savings Goals progress summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Savings Goals Milestones</h3>
              <div className="space-y-3">
                {auditData.goals.map((g, i) => {
                  const pct = Math.round((g.savedAmount / g.targetAmount) * 100);
                  return (
                    <div key={i} className="p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span>{g.icon} {g.title}</span>
                        <span>{pct}% ({curr}{g.savedAmount.toLocaleString()} / {curr}{g.targetAmount.toLocaleString()})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer stamp */}
            <div className="border-t border-slate-100 pt-5 text-center text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              SmartSpend.AI Auditor Stamp · Secure & Encrypted Report
            </div>
          </div>
        </div>
      )}

      {/* Main chat window container */}
      <div className="h-[80vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-premium">
        
        {/* Header Panel */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/20 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
              <Bot size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">SmartSpend AI Advisor</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Powered by Gemini 1.5 Flash</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting || !auditData}
              className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <FileDown size={13} />
              <span>Download PDF Audit</span>
            </button>
            <button
              onClick={() => handleSendMessage('Generate spending insights')}
              disabled={loading}
              className="px-4 py-2 text-xs bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={12} />
              <span>Generate Insights</span>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                ${msg.sender === 'user' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                  : 'bg-primary text-white'}
              `}>
                {msg.sender === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>

              <div className="space-y-1">
                <div 
                  className={`p-4 rounded-2xl text-xs leading-relaxed
                    ${msg.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-205/10 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none'}
                  `}
                  dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[75%]">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-205/10 dark:border-slate-800 p-4 rounded-2xl text-xs text-slate-400 dark:text-slate-500 rounded-tl-none flex items-center gap-2">
                <RefreshCw className="animate-spin" size={14} />
                <span>Analyzing spending records and formulating financial advice...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-6 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {quickSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-550 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Form Input */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3"
        >
          <input
            type="text"
            placeholder="Ask AI anything (e.g. 'Evaluate my food spending', 'Give me saving actions')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-805 dark:text-white font-semibold"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 inline-flex items-center justify-center shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
