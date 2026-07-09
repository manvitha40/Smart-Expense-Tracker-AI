import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, Plus, Trash2, UserPlus, RefreshCw, ChevronDown, Percent, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SplitBill() {
  const { user } = useContext(AuthContext);

  const [billTitle, setBillTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [members, setMembers] = useState([{ name: user?.name || 'You', share: 50 }]);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' | 'percent' | 'custom'
  const [calculated, setCalculated] = useState(null);
  const [paidBy, setPaidBy] = useState(0); // index of member who paid

  const curr = user?.currency === 'USD' ? '$' : '₹';

  const addMember = () => {
    setMembers(prev => [...prev, { name: '', share: 0 }]);
    setCalculated(null);
  };

  const removeMember = (idx) => {
    if (members.length <= 1) return toast.error('Must have at least one member');
    setMembers(prev => prev.filter((_, i) => i !== idx));
    if (paidBy >= members.length - 1) setPaidBy(0);
    setCalculated(null);
  };

  const updateMember = (idx, field, val) => {
    setMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
    setCalculated(null);
  };

  const getShares = () => {
    const total = parseFloat(totalAmount) || 0;
    const count = members.length;

    if (splitMode === 'equal') {
      const each = total / count;
      return members.map(m => ({ ...m, owes: each }));
    }

    if (splitMode === 'percent') {
      return members.map(m => ({
        ...m,
        owes: (total * (parseFloat(m.share) || 0)) / 100,
      }));
    }

    if (splitMode === 'custom') {
      return members.map(m => ({ ...m, owes: parseFloat(m.share) || 0 }));
    }

    return [];
  };

  const validateSplit = () => {
    const total = parseFloat(totalAmount);
    if (!total || total <= 0) return toast.error('Please enter a valid total amount');
    if (!billTitle.trim()) return toast.error('Please enter a bill title');
    const invalidName = members.some(m => !m.name.trim());
    if (invalidName) return toast.error('All members must have a name');

    if (splitMode === 'percent') {
      const totalShare = members.reduce((sum, m) => sum + (parseFloat(m.share) || 0), 0);
      if (Math.abs(totalShare - 100) > 0.1) {
        return toast.error(`Percentage total is ${totalShare.toFixed(1)}% — must equal 100%`);
      }
    }

    if (splitMode === 'custom') {
      const totalCustom = members.reduce((sum, m) => sum + (parseFloat(m.share) || 0), 0);
      if (Math.abs(totalCustom - total) > 1) {
        return toast.error(`Custom split totals ${curr}${totalCustom.toFixed(2)} but bill is ${curr}${total.toFixed(2)}`);
      }
    }

    return true;
  };

  const handleCalculate = () => {
    if (validateSplit() !== true) return;

    const splits = getShares();
    const payer = splits[paidBy];

    // Build a ledger: who owes whom
    const ledger = splits.map((m, idx) => {
      if (idx === paidBy) {
        // Payer receives from everyone else
        const totalReceivable = splits.reduce((sum, s, i) => i !== paidBy ? sum + s.owes : sum, 0);
        return { ...m, status: 'paid', amount: m.owes, receivable: totalReceivable };
      } else {
        return { ...m, status: 'owes', amount: m.owes, to: payer.name };
      }
    });

    setCalculated({ splits, ledger, total: parseFloat(totalAmount) });
    toast.success('Split bill calculated!');
  };

  const resetAll = () => {
    setBillTitle('');
    setTotalAmount('');
    setMembers([{ name: user?.name || 'You', share: 50 }]);
    setSplitMode('equal');
    setCalculated(null);
    setPaidBy(0);
  };

  const percentTotal = members.reduce((sum, m) => sum + (parseFloat(m.share) || 0), 0);
  const customTotal = members.reduce((sum, m) => sum + (parseFloat(m.share) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Split-Bill Sandbox
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Simulate group expenses and see who owes what — instantly</p>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bill Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Bill Details</h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill / Event Name</label>
              <input
                type="text"
                placeholder="e.g. Dinner at Barbeque Nation"
                value={billTitle}
                onChange={e => setBillTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:ring-2 focus:ring-primary text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bill Amount ({curr})</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{curr}</span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  value={totalAmount}
                  onChange={e => { setTotalAmount(e.target.value); setCalculated(null); }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-8 pr-3.5 text-xs font-bold focus:ring-2 focus:ring-primary text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Split Mode */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Split Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'equal', label: '⚖️ Equal' },
                  { id: 'percent', label: '% Percent' },
                  { id: 'custom', label: `${curr} Custom` },
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => { setSplitMode(mode.id); setCalculated(null); }}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition-all
                      ${splitMode === mode.id
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary/40'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Members Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Members ({members.length})</h3>
              <button
                onClick={addMember}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
              >
                <UserPlus size={13} /> Add Person
              </button>
            </div>

            {/* Who Paid selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Who Paid?</label>
              <select
                value={paidBy}
                onChange={e => { setPaidBy(Number(e.target.value)); setCalculated(null); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer focus:ring-2 focus:ring-primary"
              >
                {members.map((m, i) => (
                  <option key={i} value={i}>{m.name || `Person ${i + 1}`}</option>
                ))}
              </select>
            </div>

            {/* Member List */}
            <div className="space-y-3">
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center shrink-0">
                    {(member.name || '?')[0]?.toUpperCase()}
                  </div>
                  <input
                    type="text"
                    placeholder={`Name ${idx + 1}`}
                    value={member.name}
                    onChange={e => updateMember(idx, 'name', e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-primary text-slate-800 dark:text-white min-w-0"
                  />
                  {splitMode !== 'equal' && (
                    <input
                      type="number"
                      placeholder={splitMode === 'percent' ? '% share' : `${curr} amount`}
                      value={member.share}
                      onChange={e => updateMember(idx, 'share', e.target.value)}
                      className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-primary text-slate-800 dark:text-white"
                    />
                  )}
                  <button
                    onClick={() => removeMember(idx)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Percentage live total */}
            {splitMode === 'percent' && (
              <div className={`text-[10px] font-bold px-3 py-1.5 rounded-lg ${Math.abs(percentTotal - 100) < 0.1 ? 'bg-secondary/10 text-secondary' : 'bg-red-50 dark:bg-red-900/10 text-red-600'}`}>
                Total: {percentTotal.toFixed(1)}% {Math.abs(percentTotal - 100) < 0.1 ? '✓ Valid' : `— needs ${(100 - percentTotal).toFixed(1)}% more`}
              </div>
            )}
            {splitMode === 'custom' && totalAmount && (
              <div className={`text-[10px] font-bold px-3 py-1.5 rounded-lg ${Math.abs(customTotal - parseFloat(totalAmount)) < 1 ? 'bg-secondary/10 text-secondary' : 'bg-red-50 dark:bg-red-900/10 text-red-600'}`}>
                Custom total: {curr}{customTotal.toFixed(2)} / Bill: {curr}{parseFloat(totalAmount || 0).toFixed(2)}
              </div>
            )}

            <button
              onClick={handleCalculate}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Users size={14} />
              Calculate Split
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-5">
          {!calculated ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-premium">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-primary/30" />
              </div>
              <p className="text-sm font-bold text-slate-350 dark:text-slate-600">Fill in the details and click "Calculate Split"</p>
              <p className="text-xs text-slate-300 dark:text-slate-700 mt-1">The debt ledger will appear here</p>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">💳 {billTitle || 'Bill Split'}</h3>
                  <span className="text-base font-black text-primary">{curr}{calculated.total.toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  {calculated.ledger.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-xl border text-xs font-bold
                        ${m.status === 'paid'
                          ? 'bg-secondary/5 border-secondary/20 dark:border-secondary/10'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                          {m.name[0]?.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-white">{m.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {m.status === 'paid'
                              ? `Paid the bill · Receives ${curr}${m.receivable.toFixed(2)} total`
                              : `Owes → ${m.to}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${m.status === 'paid' ? 'text-secondary' : 'text-red-600 dark:text-red-400'}`}>
                          {m.status === 'paid' ? `+${curr}${m.receivable.toFixed(2)}` : `-${curr}${m.amount.toFixed(2)}`}
                        </p>
                        <p className="text-[9px] text-slate-400">{m.status === 'paid' ? 'net receivable' : 'owes'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual share breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-4">Share Breakdown</h3>
                <div className="space-y-3">
                  {calculated.splits.map((m, idx) => {
                    const pct = calculated.total > 0 ? Math.round((m.owes / calculated.total) * 100) : 0;
                    const colors = ['bg-primary', 'bg-secondary', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span>{m.name || `Person ${idx + 1}`}</span>
                          <span>{curr}{m.owes.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${colors[idx % colors.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tip */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-400">
                <span className="text-lg shrink-0">💡</span>
                <p><strong>Tip:</strong> Share this breakdown with your group via UPI or WhatsApp. Use UPI request links with exact amounts to settle debts instantly.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
