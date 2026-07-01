import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bot, Send, User as UserIcon, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIAdvisor() {
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `👋 Hello **${user?.name}**! I am your AI Financial Advisor. I can audit your transactions, analyze budgets, and give you custom savings plans.\n\nClick **"Generate Spending Insights"** to scan this month's logs, or ask me any question below!`
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      // Check if it is a general insights command
      const isInsights = queryText.toLowerCase().includes('generate spending insights') || queryText.toLowerCase() === 'generate insights';
      
      const payload = isInsights ? {} : { customMessage: queryText };
      const res = await axios.post('/api/ai/analyze', payload);
      
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.advice }]);
    } catch (err) {
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

  // Helper to parse and render simple markdown-like text to HTML securely
  const renderMarkdown = (text) => {
    // Escape HTML tags
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace headers
    escaped = escaped.replace(/^### (.*$)/gim, '<h4 class="font-extrabold text-sm text-slate-800 dark:text-white mt-3 mb-1.5">$1</h4>');
    escaped = escaped.replace(/^#### (.*$)/gim, '<h5 class="font-bold text-xs text-slate-750 dark:text-slate-200 mt-2.5 mb-1">$1</h5>');
    
    // Replace bold
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-850 dark:text-white">$1</strong>');
    
    // Replace bullets
    escaped = escaped.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc py-0.5">$1</li>');

    // Replace linebreaks
    escaped = escaped.replace(/\n/g, '<br />');

    return { __html: escaped };
  };

  return (
    <div className="h-[80vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-premium">
      
      {/* Advisor Header Panel */}
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

        <button
          onClick={() => handleSendMessage('Generate spending insights')}
          disabled={loading}
          className="px-4 py-2 text-xs bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
        >
          <Sparkles size={12} />
          <span>Generate Spending Insights</span>
        </button>
      </div>

      {/* Chat Messages Log Panel */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar Bubble */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
              ${msg.sender === 'user' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                : 'bg-primary text-white'}
            `}>
              {msg.sender === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
            </div>

            {/* Message Bubble Body */}
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

      {/* Quick suggestions area */}
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

      {/* Input Message Panel */}
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
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-805 dark:text-white"
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
  );
}
