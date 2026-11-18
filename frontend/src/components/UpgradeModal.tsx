import React from 'react';
import { Sparkles, Shield, ArrowRight, X, Check, Zap } from 'lucide-react';
import { useAppStore } from '../state/store';

export const UpgradeModal: React.FC = () => {
  const { upgradeModalOpen, upgradeModalData, closeUpgradeModal, setActivePage, currentPlan } = useAppStore();

  if (!upgradeModalOpen || !upgradeModalData) return null;

  const targetPlan = upgradeModalData.requiredPlan || 'PROFESSIONAL';

  const handleUpgradeClick = () => {
    closeUpgradeModal();
    setActivePage('pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative overflow-hidden"
        style={{ 
          background: 'var(--card)', 
          borderColor: 'rgba(124, 58, 237, 0.4)',
          color: 'var(--text)' 
        }}
      >
        {/* Glowing Aerospace Accent Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-purple-400 font-bold">
              PREMIUM AEROSPACE CAPABILITY
            </span>
            <h3 className="text-xl font-bold tracking-tight">
              Unlock {upgradeModalData.featureName}
            </h3>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed font-medium">
          {upgradeModalData.message || `Access to ${upgradeModalData.featureName} requires a FalconZ ${targetPlan.charAt(0) + targetPlan.slice(1).toLowerCase()} subscription.`}
        </p>

        {/* Plan Comparison Pill */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl border text-xs font-mono" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div>
            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-[10px]">Your Current Tier</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              {currentPlan}
            </span>
          </div>
          <div>
            <span className="text-purple-600 dark:text-purple-400 uppercase tracking-wider block text-[10px]">Required Tier</span>
            <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              {targetPlan}
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 mb-6 text-xs text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>First-Principles Quantile RUL Prognostics (90% Confidence Bounds)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>AI Automated Engineering PDF Reports with Real Telemetry & Residuals</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Conversational Copilot Grounded in 20 Hz Live Sensor Streams</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Multi-Drone Fleet Capacity (Up to 10 Aircraft)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={closeUpgradeModal}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgradeClick}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 group"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

