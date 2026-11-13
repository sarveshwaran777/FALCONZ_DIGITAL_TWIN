import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';

export const PaymentHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getPaymentHistory().then((data) => {
      if (Array.isArray(data)) setHistory(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            TRANSACTION AUDIT LEDGER
          </span>
          <span className="text-xs text-slate-400">Total: {history.length} Transactions</span>
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <History className="w-6 h-6 text-purple-400" />
          Razorpay Payment History
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically signed payment transaction records, order IDs, and payment verification timestamps.
        </p>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Razorpay Order ID</th>
                <th className="px-4 py-3.5">Payment ID</th>
                <th className="px-4 py-3.5">Plan Tier</th>
                <th className="px-4 py-3.5">Cycle</th>
                <th className="px-4 py-3.5">Amount (INR)</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {history.map((t) => {
                const isSuccess = t.status === 'SUCCESS';
                return (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">{t.order_id || 'N/A'}</td>
                    <td className="px-4 py-4 text-purple-300">{t.payment_id || 'PENDING'}</td>
                    <td className="px-4 py-4 text-slate-300 font-sans font-semibold">{t.plan_code}</td>
                    <td className="px-4 py-4 text-slate-400">{t.billing_cycle}</td>
                    <td className="px-4 py-4 text-white font-bold">₹{t.amount_inr?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 uppercase text-slate-400 text-[10px]">{t.payment_method || 'UPI'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
