import React, { useState, useEffect } from 'react';
import { Zap, Bot, FileText, HardDrive, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const AIUsageCenterPage: React.FC = () => {
  const { currentPlan, setActivePage } = useAppStore();
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    api.getAIUsage().then(setUsage).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              CONSUMPTION LEDGER
            </span>
            <span className="text-xs text-slate-400">Current Plan: {usage?.plan_name || currentPlan}</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-amber-400" />
            AI Quota & Usage Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track monthly AI Copilot queries, automated engineering reports, and telemetry storage consumption.
          </p>
        </div>

        <button
          onClick={() => setActivePage('pricing')}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0"
        >
          <span>Upgrade Tier</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quota Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Copilot Queries Card */}
        <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-500/10">
              {usage?.ai_queries?.percentage || 0}% CONSUMED
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Monthly AI Copilot Queries</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-mono">
                {usage?.ai_queries?.used || 0}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {usage?.ai_queries?.limit || 15} queries
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${usage?.ai_queries?.percentage || 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">Resets on the first of each calendar month.</p>
        </div>

        {/* PDF Reports Quota Card */}
        <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">
              {usage?.reports?.percentage || 0}% CONSUMED
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">PDF Engineering Reports</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-mono">
                {usage?.reports?.used || 0}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {usage?.reports?.limit || 2} documents
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${usage?.reports?.percentage || 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">Includes ReportLab high-fidelity flight summaries.</p>
        </div>

        {/* Telemetry Storage Card */}
        <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10">
              ACTIVE
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Telemetry Cloud Storage</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-mono">
                {usage?.telemetry_storage_mb ? usage.telemetry_storage_mb.toFixed(1) : '45.2'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                MB logged
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: '15%' }} />
          </div>
          <p className="text-[11px] text-slate-500">Blackbox flight session ring buffers retained per plan.</p>
        </div>
      </div>
    </div>
  );
};
