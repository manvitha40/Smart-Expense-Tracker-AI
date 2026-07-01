import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Landmark, Coins, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      return toast.error('Please fill in all required fields');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      await register(name, email, password, monthlyBudget, currency);
      toast.success('Registration successful! Welcome to SmartSpend.AI');
      navigate('/');
    } catch (err) {
      toast.error(err || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background dark:bg-background-dark">
      
      {/* Left Graphics Showcase Column */}
      <div className="hidden lg:col-span-6 lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary-dark to-slate-900 text-white relative overflow-hidden">
        
        {/* Visual layouts */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-white/5 blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-3xl -ml-10 -mb-10"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-extrabold text-lg">
            $
          </div>
          <span className="font-extrabold text-lg tracking-tight">SmartSpend.AI</span>
        </div>

        <div className="my-auto space-y-6 max-w-md relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Take Control of Your Expenses in Seconds.
          </h1>
          <p className="text-white/70 leading-relaxed">
            Create your account today and unlock tools to automatically convert receipts into structured transactions, chart monthly averages, map custom categories, and receive AI-driven advice to maximize your monthly savings.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-bold text-lg">Instant OCR</h4>
              <p className="text-xs text-white/50">Scanner auto-fills fields</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-bold text-lg">Smart Budgets</h4>
              <p className="text-xs text-white/50">Warning alerts at 90%</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/50 relative z-10">© 2026 SmartSpend.AI Inc. All rights reserved.</p>
      </div>

      {/* Right Credentials Form Column */}
      <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-white dark:bg-slate-900 relative">
        <div className="mx-auto w-full max-w-md">
          
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Create Account</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">Enter your details to register and configure your wallet.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
                <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                </div>
              </div>
            </div>

            {/* Monthly Budget & Currency Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Monthly Budget (Optional)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="50000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                  <Landmark className="absolute left-3.5 top-3 text-slate-400" size={16} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Preferred Currency</label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <Coins className="absolute left-3.5 top-3 text-slate-400" size={16} />
                </div>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3.5 font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Login
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
