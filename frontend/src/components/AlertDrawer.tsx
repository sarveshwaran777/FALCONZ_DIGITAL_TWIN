import React from 'react';
import { 
  X, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  ShieldAlert, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../state/store';

export const AlertDrawer: React.FC = () => {
  const { alertDrawerOpen, setAlertDrawerOpen, activeAlerts, dismissAlert } = useAppStore();

  if (!alertDrawerOpen) return null;

  const criticalCount = activeAlerts.filter(a => a.level === 'CRITICAL').length;
  const warningCount = activeAlerts.filter(a => a.level === 'WARNING').length;
  const infoCount = activeAlerts.filter(a => a.level === 'INFO').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={() => setAlertDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#09090b] border-l border-zinc-800 shadow-2xl flex flex-col text-white">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-black">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white font-sans">
                  Active System Alerts
                </h2>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Hardware & Model-Derived Health Notifications
                </p>
              </div>
            </div>

            <button
              onClick={() => setAlertDrawerOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Category Counts */}
          <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-zinc-800 text-xs font-mono bg-black/60">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-600/15 border border-red-500/30 text-red-400 font-bold">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>CRIT: <strong className="text-white">{criticalCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>WARN: <strong className="text-white">{warningCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/20 text-white font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>INFO: <strong className="text-white">{infoCount}</strong></span>
            </div>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#09090b]">
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <CheckCircle2 className="w-10 h-10 text-red-500 mb-2" />
                <p className="text-xs font-black text-white font-sans">
                  No Active System Alerts
                </p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  All propulsion channels and telemetry bounds are nominal.
                </p>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const isCrit = alert.level === 'CRITICAL';
                const isWarn = alert.level === 'WARNING';

                return (
                  <div 
                    key={alert.id}
                    className={`rounded-xl border p-3.5 transition-all text-xs font-mono space-y-2.5 bg-black ${
                      isCrit
                        ? 'border-red-600 shadow-md shadow-red-950/40 text-white'
                        : isWarn
                        ? 'border-red-500/40 text-white'
                        : 'border-zinc-800 text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          isCrit
                            ? 'bg-red-600 text-white'
                            : isWarn
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}>
                          {alert.level}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-400">
                          {alert.target}
                        </span>
                      </div>

                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                        title="Dismiss Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-sans font-bold text-xs text-white">
                        {alert.event}
                      </h4>
                    </div>

                    {/* Measured vs Limit info if present */}
                    {(alert.measured || alert.limit) && (
                      <div className="grid grid-cols-2 gap-2 bg-[#121216] border border-zinc-800 p-2 rounded-lg text-[11px]">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">MEASURED</span>
                          <strong className="text-white">{alert.measured}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-red-400 block font-bold">SAFETY LIMIT</span>
                          <strong className="text-red-500">{alert.limit}</strong>
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-zinc-300">
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase">EVIDENCE</span>
                      <p className="mt-0.5 font-sans leading-relaxed text-zinc-200">{alert.evidence}</p>
                    </div>

                    <div className="p-2 rounded-lg bg-[#121216] border border-red-500/30 text-[11px]">
                      <span className="text-[10px] font-bold text-red-400 block uppercase">
                        RECOMMENDED ACTION
                      </span>
                      <p className="font-sans text-white font-bold mt-0.5">
                        {alert.action}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-black flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-400 text-[11px]">
              Engine Status: <strong className="text-red-500">20 Hz Active</strong>
            </span>
            <button
              onClick={() => setAlertDrawerOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
