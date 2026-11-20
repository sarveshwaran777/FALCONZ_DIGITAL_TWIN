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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border bg-[#09090b] border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30">
              CONSUMPTION LEDGER
            </span>
            <span className="text-xs text-zinc-400 font-mono">Current Plan: {usage?.plan_name || currentPlan}</span>
          </div>
          <h1 className="text-2xl font-black flex items-center gap-2.5 text-white">
            <Zap className="w-6 h-6 text-red-500" />
            AI Quota & Usage Center
          </h1>
          <p className="text-xs text-zinc-300 mt-1 font-medium">
            Track monthly AI Copilot queries, automated engineering reports, and telemetry storage consumption.
          </p>
        </div>

        <button
          onClick={() => setActivePage('pricing')}
          className="px-4 py-2.5 rounded-xl font-black text-xs bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all shrink-0 cursor-pointer"
        >
          <span>Upgrade Tier</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quota Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Copilot Queries Card */}
        <div className="p-6 rounded-2xl border space-y-4 bg-[#09090b] border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-red-400 font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
              {usage?.ai_queries?.percentage || 0}% CONSUMED
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block font-bold">Monthly AI Copilot Queries</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                {usage?.ai_queries?.used || 0}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                / {usage?.ai_queries?.limit || 15} queries
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className="h-full rounded-full bg-red-600 transition-all"
              style={{ width: `${usage?.ai_queries?.percentage || 0}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400">Resets on the first of each calendar month.</p>
        </div>

        {/* PDF Reports Quota Card */}
        <div className="p-6 rounded-2xl border space-y-4 bg-[#09090b] border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white border border-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-white font-bold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">
              {usage?.reports?.percentage || 0}% CONSUMED
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block font-bold">PDF Engineering Reports</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">
                {usage?.reports?.used || 0}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                / {usage?.reports?.limit || 2} documents
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${usage?.reports?.percentage || 0}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400">Includes ReportLab high-fidelity flight summaries.</p>
        </div>

        {/* Telemetry Storage Card */}
        <div className="p-6 rounded-2xl border space-y-4 bg-[#09090b] border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-white font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
              ACTIVE
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block font-bold">Telemetry Cloud Storage</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">
                {usage?.telemetry_storage_mb ? usage.telemetry_storage_mb.toFixed(1) : '45.2'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                MB logged
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-red-600" style={{ width: '15%' }} />
          </div>
          <p className="text-[11px] text-zinc-400">Blackbox flight session ring buffers retained per plan.</p>
        </div>
      </div>
    </div>
  );
};

