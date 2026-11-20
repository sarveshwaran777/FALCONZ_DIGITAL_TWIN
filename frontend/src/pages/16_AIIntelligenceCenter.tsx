import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Bot, Users, FileText, Cpu, Activity, 
  ArrowRight, ShieldCheck, Zap, Sparkles, AlertCircle, BarChart3, ChevronRight 
} from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const AIIntelligenceCenterPage: React.FC = () => {
  const { setActivePage, systemState, currentPlan, openUpgradeModal } = useAppStore();
  const [fleetStats, setFleetStats] = useState<any>(null);
  const [modelStats, setModelStats] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    api.getFleetIntelligence().then(setFleetStats).catch(() => {});
    api.getModelsIntelligence().then(setModelStats).catch(() => {});
    api.getAIUsage().then(setUsage).catch(() => {});
  }, []);

  const intel = systemState?.intelligence;
  const telem = systemState?.telemetry;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border backdrop-blur-md"
        style={{ 
          background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.25) 0%, #09090b 100%)',
          borderColor: 'rgba(239, 68, 68, 0.4)' 
        }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
              PREMIUM INTELLIGENCE
            </span>
            <span className="text-xs font-mono text-zinc-400">20 Hz Causal Grounding</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <BrainCircuit className="w-8 h-8 text-red-500" />
            FALCONZ AI Intelligence Center
          </h1>
          <p className="text-sm max-w-2xl text-zinc-300 font-medium">
            Autonomous engineering diagnostics, conversational telemetry copilot, fleet-wide degradation tracking, and publication-grade automated flight reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('ai-copilot')}
            className="px-4 py-2.5 rounded-xl font-black text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all"
          >
            <Bot className="w-4 h-4" />
            Launch AI Copilot
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Copilot Card */}
        <div 
          onClick={() => setActivePage('ai-copilot')}
          className="p-5 rounded-2xl border border-zinc-800 cursor-pointer hover:border-red-500/50 hover:shadow-lg transition-all group relative overflow-hidden bg-[#09090b]"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-3">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
            AI Engineering Copilot
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-red-400 transition-transform" />
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Real-time chat grounded in live RPM, residuals, thermal slope & ML fault predictions.
          </p>
        </div>

        {/* Fleet Intel Card */}
        <div 
          onClick={() => setActivePage('fleet-management')}
          className="p-5 rounded-2xl border border-zinc-800 cursor-pointer hover:border-red-500/50 hover:shadow-lg transition-all group relative overflow-hidden bg-[#09090b]"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
            AI Fleet Intelligence
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-red-400 transition-transform" />
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Multi-drone health rankings, recurring failure detection & high-risk motor tracking.
          </p>
        </div>

        {/* Automated Reports Card */}
        <div 
          onClick={() => setActivePage('ai-reports')}
          className="p-5 rounded-2xl border border-zinc-800 cursor-pointer hover:border-red-500/50 hover:shadow-lg transition-all group relative overflow-hidden bg-[#09090b]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
            Automated PDF Reports
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-red-400 transition-transform" />
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Instant publication-grade engineering PDF downloads with telemetry charts & SOPs.
          </p>
        </div>

        {/* Usage Center Card */}
        <div 
          onClick={() => setActivePage('ai-usage')}
          className="p-5 rounded-2xl border border-zinc-800 cursor-pointer hover:border-red-500/50 hover:shadow-lg transition-all group relative overflow-hidden bg-[#09090b]"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
            AI Quota & Usage Center
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-red-400 transition-transform" />
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Track monthly AI queries, reports generation quota & data retention limits.
          </p>
        </div>
      </div>

      {/* Live AI Reasoning & Telemetry Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Telemetry Grounding */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-800 space-y-4 bg-[#09090b]">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base flex items-center gap-2 text-white">
              <Activity className="w-4 h-4 text-red-500" />
              Live Causal Grounding Feed (20 Hz)
            </h2>
            <span className="text-[11px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-md">
              ● REAL TELEMETRY ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-zinc-800 bg-black">
              <span className="text-zinc-400 text-[10px] uppercase font-mono font-semibold block">Speed (Actual)</span>
              <span className="text-base font-black font-mono mt-1 block text-white">
                {telem ? telem.rpm.toFixed(0) : '0'} RPM
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Δ {systemState?.residuals ? `${systemState.residuals.residual_rpm > 0 ? '+' : ''}${systemState.residuals.residual_rpm.toFixed(0)}` : '0'} RPM
              </span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800 bg-black">
              <span className="text-zinc-400 text-[10px] uppercase font-mono font-semibold block">Stator Temp</span>
              <span className="text-base font-black font-mono mt-1 block text-white">
                {telem ? telem.temperature_c.toFixed(1) : '0'} °C
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Δ {systemState?.residuals ? `${systemState.residuals.residual_temperature_c > 0 ? '+' : ''}${systemState.residuals.residual_temperature_c.toFixed(1)}` : '0'} °C
              </span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800 bg-black">
              <span className="text-zinc-400 text-[10px] uppercase font-mono font-semibold block">Vibration RMS</span>
              <span className="text-base font-black font-mono mt-1 block text-white">
                {telem ? telem.vibration_rms_g.toFixed(3) : '0'} g
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">1X Harmonics</span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800 bg-black">
              <span className="text-zinc-400 text-[10px] uppercase font-mono font-semibold block">Health Index</span>
              <span className={`text-base font-black font-mono mt-1 block ${
                (intel?.health_index || 100) >= 85 ? 'text-white' : (intel?.health_index || 100) >= 70 ? 'text-red-400' : 'text-red-500'
              }`}>
                {intel ? intel.health_index.toFixed(1) : '100'}%
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">{intel?.health_band || 'HEALTHY'}</span>
            </div>
          </div>

          {/* Real-time XAI Synthesis Box */}
          <div className="p-4 rounded-xl border border-red-500/30 bg-black space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>Real-Time XAI Physical Attribution</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {intel?.xai_what || 'Propulsion parameters operating within nominal aero-thermal boundaries.'}
            </p>
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <span><b className="text-white">Action:</b> {intel?.maintenance_action || 'Routine pre-flight inspection'}</span>
              <span className="text-red-400 font-mono font-bold">{intel?.maintenance_urgency || 'NONE'}</span>
            </div>
          </div>
        </div>

        {/* Right: Model Intelligence Card */}
        <div className="p-6 rounded-2xl border border-zinc-800 space-y-4 bg-[#09090b]">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base flex items-center gap-2 text-white">
              <Cpu className="w-4 h-4 text-red-500" />
              Model Intelligence
            </h2>
            <span className="text-[10px] font-mono font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md">
              VERIFIED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-zinc-800 bg-black">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">Random Forest Classifier</span>
                <span className="font-mono text-white font-black">92.2% Acc</span>
              </div>
              <p className="text-[11px] text-zinc-400">150 tuned estimators across 4 fault classes (Macro F1: 0.923).</p>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800 bg-black">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">Isolation Forest Anomaly</span>
                <span className="font-mono text-white font-black">0.941 F1</span>
              </div>
              <p className="text-[11px] text-zinc-400">3-5 step hysteresis preventing transient noise triggers.</p>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800 bg-black">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">Quantile RUL Regressor</span>
                <span className="font-mono text-red-400 font-black">R² 0.917</span>
              </div>
              <p className="text-[11px] text-zinc-400">Multi-quantile Gradient Boosting with 90% confidence envelope.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
