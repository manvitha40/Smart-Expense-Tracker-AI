import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, Wallet, ArrowRight, Coins, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  const handleReseed = async () => {
    setReseeding(true);
    const toastId = toast.loading('Reseeding demo database with 6 months of data...');
    try {
      const response = await fetch('/api/init/seed-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.msg || 'Demo data re-seeded successfully!', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to reseed database', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to connect to backend service', { id: toastId });
    } finally {
      setReseeding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }
    
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Please enter your email');
    
    setForgotLoading(true);
    // Simulate sending OTP
    setTimeout(() => {
      toast.success(`OTP has been successfully sent to ${forgotEmail}`);
      setForgotLoading(false);
      setShowForgotModal(false);
      setForgotEmail('');
    }, 1500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background dark:bg-background-dark">
      
      {/* Left Credentials Column */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/50 relative">
        <div className="mx-auto w-full max-w-sm">
          
          {/* Brand header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              $
            </div>
            <span className="font-extrabold text-xl text-slate-800 dark:text-white">SmartSpend.AI</span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">Login to manage your budgets and analyze spending habits.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3.5 font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Seed Shortcut Alert */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 <strong>Demo Account:</strong> Try logging in with <code>guest@example.com</code> and <code>guest123</code> to view seeded chart data.
            </p>
            <div className="pt-1.5 flex items-center justify-between border-t border-slate-200/40 dark:border-slate-700/40">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Data modified or missing?</span>
              <button
                type="button"
                onClick={handleReseed}
                disabled={reseeding}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {reseeding ? 'Reseeding...' : '🔄 Reseed Demo Data'}
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Register
            </Link>
          </p>

        </div>
      </div>

      {/* Right Graphics Showcase Column */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-12 bg-gradient-to-tr from-primary via-primary-dark to-slate-900 text-white relative overflow-hidden">
        
        {/* Floating background grids and circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-secondary/5 blur-3xl -ml-20 -mb-20"></div>

        <div className="flex items-center justify-between relative z-10">
          <span className="font-semibold text-sm tracking-wide text-white/70">Personal Finance Redefined</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 font-bold">V1.0</span>
        </div>

        {/* Dashboard preview graphics mock */}
        <div className="my-auto space-y-8 max-w-lg relative z-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Master Your Money with <span className="text-secondary-light font-black">AI OCR</span> Scanning.
            </h1>
            <p className="text-white/70 leading-relaxed text-base">
              Say goodbye to tedious manual inputs. Snap receipts to auto-populate expenses, receive real-time budget warnings, and ask the AI chatbot for custom financial planning advice.
            </p>
          </div>

          {/* Interactive Graphic Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet size={20} className="text-secondary-light" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Monthly Spending Limit</h4>
                  <p className="text-[10px] text-white/50">Calculated automatically</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-light">94% Used</span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Spent: ₹47,000</span>
                <span>Budget: ₹50,000</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="w-[94%] h-full bg-gradient-to-r from-secondary-light to-danger rounded-full"></div>
              </div>
            </div>

            <p className="text-xs text-white/70 italic flex items-center gap-1.5">
              ⚠️ Warning: Reduce shopping to save ₹6,000 this month.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10 border-t border-white/10 pt-6 text-xs text-white/60">
          <p>© 2026 SmartSpend.AI Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Recover Password</h3>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide your registered email. We will email you a one-time OTP password code to complete your password reset.
              </p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3 font-bold transition-all flex items-center justify-center gap-2"
              >
                {forgotLoading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <span>Send OTP Code</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
