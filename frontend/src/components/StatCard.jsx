import React from 'react';

export default function StatCard({ 
  label, 
  value, 
  currency = 'INR', 
  icon: Icon, 
  colorClass = 'bg-primary/10 text-primary', 
  trend 
}) {
  const getCurrencySymbol = (cur) => {
    return cur === 'USD' ? '$' : '₹';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium hover:shadow-premium-hover transition-all duration-300 flex items-center justify-between group overflow-hidden relative">
      {/* Decorative background visual effect */}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/20 group-hover:scale-125 transition-transform duration-500 -z-0"></div>

      <div className="space-y-1.5 relative z-10">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {label}
        </span>
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          {getCurrencySymbol(currency)}{typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        {trend && (
          <p className={`text-xs font-semibold flex items-center gap-1 mt-1 ${trend.type === 'up' ? 'text-secondary-dark dark:text-secondary-light' : trend.type === 'down' ? 'text-danger-dark dark:text-danger-light' : 'text-slate-500'}`}>
            <span>{trend.value}</span>
          </p>
        )}
      </div>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 relative z-10 ${colorClass}`}>
        <Icon size={22} className="stroke-[2.2]" />
      </div>
    </div>
  );
}
