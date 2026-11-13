import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const SubscriptionBillingPage: React.FC = () => {
  const { setActivePage, showToast } = useAppStore();
  const [subData, setSubData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [s, invs] = await Promise.all([
        api.getCurrentSubscription(),
        api.getInvoices()
      ]);
      setSubData(s);
      if (Array.isArray(invs)) setInvoices(invs);
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel subscription auto-renewal?')) return;
    setCancelling(true);
    try {
      const res = await api.cancelSubscription();
      showToast(res.message, 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error cancelling subscription', 'error');
    }
    setCancelling(false);
  };

  const plan = subData?.plan;
  const sub = subData?.subscription;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              ACCOUNT & BILLING
            </span>
            <span className="text-xs text-slate-400">Org: {subData?.organization?.name || 'AeroPropulsion Labs'}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text)' }}>
            <CreditCard className="w-6 h-6 text-purple-500" />
            Subscription & Invoices
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Manage your commercial SaaS subscription, billing cycles, payment methods, and GST tax invoices.
          </p>
        </div>

        <button
          onClick={() => setActivePage('pricing')}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0"
        >
          <span>Change Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Current Subscription Card */}
      <div className="p-6 rounded-2xl border space-y-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Active Membership</span>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{plan?.name || 'FalconZ Free'}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {sub?.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Billing Cadence: <b style={{ color: 'var(--text)' }}>{sub?.billing_cycle || 'MONTHLY'}</b>
            </p>
          </div>

          {sub?.status === 'ACTIVE' && plan?.code !== 'FREE' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Auto-Renewal'}
            </button>
          )}
        </div>

        {/* Subscription Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-slate-500 block text-[10px] uppercase">Plan Code</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{plan?.code || 'FREE'}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-slate-500 block text-[10px] uppercase">Fleet Capacity</span>
            <span className="font-bold text-white text-sm mt-0.5 block">Up to {plan?.max_drones || 1} Drones</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-slate-500 block text-[10px] uppercase">AI Copilot Limit</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{plan?.ai_queries_limit || 15} queries/mo</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-slate-500 block text-[10px] uppercase">History Retention</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{plan?.history_retention_days || 7} Days</span>
          </div>
        </div>
      </div>

      {/* Tax Invoices Archive */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-white flex items-center justify-between">
          <span>Billing History & GST Tax Invoices</span>
          <span className="text-xs font-mono text-slate-500 font-normal">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Plan / Description</th>
                <th className="px-4 py-3.5">Amount (INR)</th>
                <th className="px-4 py-3.5">18% GST</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-semibold text-purple-300">{inv.invoice_number}</td>
                  <td className="px-4 py-4 text-white font-sans">{inv.plan_name}</td>
                  <td className="px-4 py-4 text-white font-bold">₹{inv.amount_inr.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-slate-400">₹{inv.tax_amount_inr?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-400">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

