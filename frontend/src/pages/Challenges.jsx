import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Trophy, Flame, Star, Lock, CheckCircle, Zap, Target, TrendingUp, Award, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const CHALLENGES = [
  {
    id: 'no_eating_out_week',
    title: 'No Dining Out — 7 Days',
    description: 'Avoid all restaurant and food delivery expenses for a full week.',
    icon: '🍱',
    streakTarget: 7,
    points: 150,
    category: 'Food',
    tip: 'Cook at home — save approx ₹3,000–₹6,000 in a week!',
  },
  {
    id: 'save_20_percent',
    title: 'Save 20% of Income',
    description: 'Save at least 20% of your monthly income this month.',
    icon: '💰',
    streakTarget: 30,
    points: 300,
    category: 'Savings',
    tip: 'Set up an auto-debit savings rule on pay day.',
  },
  {
    id: 'no_impulse_buy',
    title: 'No Impulse Purchases — 5 Days',
    description: 'Avoid any unplanned shopping purchases for 5 days straight.',
    icon: '🛍️',
    streakTarget: 5,
    points: 100,
    category: 'Shopping',
    tip: 'Use a 24-hour delay rule before any purchase above ₹500.',
  },
  {
    id: 'cancel_1_sub',
    title: 'Cancel 1 Unused Subscription',
    description: 'Identify and cancel at least one subscription you haven\'t used this month.',
    icon: '✂️',
    streakTarget: 1,
    points: 80,
    category: 'Subscriptions',
    tip: 'Check your Subscription Radar page to spot unused services.',
  },
  {
    id: 'track_every_expense',
    title: 'Log Every Expense — 7 Days',
    description: 'Add every single expense into SmartSpend for 7 consecutive days.',
    icon: '📋',
    streakTarget: 7,
    points: 120,
    category: 'Habits',
    tip: 'Log expenses right when you pay using the receipt scanner.',
  },
  {
    id: 'public_transport',
    title: 'Use Public Transport — 5 Days',
    description: 'Commute via public transport (metro, bus, shared auto) for 5 days in a row.',
    icon: '🚌',
    streakTarget: 5,
    points: 90,
    category: 'Transport',
    tip: 'Public transport can save ₹1,500–₹4,000/month vs. cab rides.',
  },
];

const BADGES = [
  { icon: '🥉', label: 'Beginner Saver', minPoints: 0 },
  { icon: '🥈', label: 'Smart Spender', minPoints: 100 },
  { icon: '🥇', label: 'Budget Champion', minPoints: 300 },
  { icon: '💎', label: 'Wealth Builder', minPoints: 600 },
  { icon: '🏆', label: 'Financial Master', minPoints: 900 },
];

export default function Challenges() {
  const { user } = useContext(AuthContext);
  // Load from localStorage so it persists across navigation
  const [progress, setProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('challenges_progress') || '{}');
    } catch { return {}; }
  });

  const saveProgress = (updated) => {
    localStorage.setItem('challenges_progress', JSON.stringify(updated));
    setProgress(updated);
  };

  const totalPoints = Object.entries(progress).reduce((acc, [id, p]) => {
    const challenge = CHALLENGES.find(c => c.id === id);
    if (!challenge) return acc;
    const completed = p.streak >= challenge.streakTarget;
    return acc + (completed ? challenge.points : 0);
  }, 0);

  const currentBadge = [...BADGES].reverse().find(b => totalPoints >= b.minPoints) || BADGES[0];
  const nextBadge = BADGES.find(b => b.minPoints > totalPoints);

  const handleIncrement = (challenge) => {
    const existing = progress[challenge.id] || { streak: 0, lastCheck: null };
    const newStreak = Math.min(existing.streak + 1, challenge.streakTarget);
    const updated = {
      ...progress,
      [challenge.id]: { streak: newStreak, lastCheck: new Date().toISOString() }
    };
    saveProgress(updated);
    if (newStreak >= challenge.streakTarget) {
      toast.success(`🏆 Challenge complete! +${challenge.points} points earned!`);
    } else {
      toast.success(`🔥 Day ${newStreak}/${challenge.streakTarget} logged!`);
    }
  };

  const handleReset = (challenge) => {
    const updated = { ...progress, [challenge.id]: { streak: 0, lastCheck: null } };
    saveProgress(updated);
    toast('Challenge reset.', { icon: '↺' });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Trophy size={26} />
              Savings Challenges
            </h2>
            <p className="text-sm text-white/70 mt-1">Complete challenges, build streaks, and earn achievement points</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-black">{totalPoints}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Total Points</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl">{currentBadge.icon}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-bold">{currentBadge.label}</p>
            </div>
          </div>
        </div>

        {/* Progress toward next badge */}
        {nextBadge && (
          <div className="relative z-10 mt-5">
            <div className="flex justify-between text-[10px] text-white/60 font-bold mb-1.5">
              <span>Progress to {nextBadge.icon} {nextBadge.label}</span>
              <span>{totalPoints} / {nextBadge.minPoints} pts</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (totalPoints / nextBadge.minPoints) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* All Badges row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Achievement Badges</h3>
        <div className="flex flex-wrap gap-3">
          {BADGES.map(badge => {
            const unlocked = totalPoints >= badge.minPoints;
            return (
              <div key={badge.label} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all
                ${unlocked ? 'border-primary/30 bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 opacity-60'}`}>
                <span className={unlocked ? '' : 'grayscale opacity-40'}>{badge.icon}</span>
                <span>{badge.label}</span>
                {unlocked && <CheckCircle size={12} className="text-primary ml-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {CHALLENGES.map(challenge => {
          const p = progress[challenge.id] || { streak: 0 };
          const streakVal = p.streak || 0;
          const isComplete = streakVal >= challenge.streakTarget;
          const pct = Math.min(100, Math.round((streakVal / challenge.streakTarget) * 100));

          return (
            <div
              key={challenge.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-premium flex flex-col justify-between hover:shadow-premium-hover transition-all duration-300
                ${isComplete ? 'border-secondary/30 dark:border-secondary/20' : 'border-slate-200/50 dark:border-slate-800/50'}`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 bg-slate-50 dark:bg-slate-800 text-2xl flex items-center justify-center rounded-xl border border-slate-100 dark:border-slate-700/50">
                      {challenge.icon}
                    </span>
                    <div>
                      <p className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">{challenge.title}</p>
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{challenge.category}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap
                    ${isComplete ? 'bg-secondary/10 text-secondary' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-600'}`}>
                    +{challenge.points} pts
                  </span>
                </div>

                <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed mb-4">
                  {challenge.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Flame size={10} className="text-orange-500" />
                      Streak: {streakVal}/{challenge.streakTarget} days
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-secondary' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Tip */}
                <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-slate-50/60 dark:bg-slate-800/30 rounded-lg px-3 py-2">
                  <Zap size={10} className="text-amber-500 mt-0.5 shrink-0" />
                  <span>{challenge.tip}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                {isComplete ? (
                  <div className="flex-1 flex items-center justify-center gap-1.5 bg-secondary/10 text-secondary py-2.5 rounded-xl text-xs font-bold">
                    <CheckCircle size={13} />
                    <span>Completed! 🎉</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleIncrement(challenge)}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Flame size={13} />
                    <span>Log Today ({streakVal + 1}/{challenge.streakTarget})</span>
                  </button>
                )}
                {streakVal > 0 && (
                  <button
                    onClick={() => handleReset(challenge)}
                    title="Reset streak"
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-xs font-bold transition-all"
                  >
                    ↺
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
