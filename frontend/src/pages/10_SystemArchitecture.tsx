import React from 'react';
import { Layers, ArrowDown, Cpu, ShieldCheck, Zap, Activity, Radio, Database, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useAppStore } from '../state/store';
import { StatusBadge } from '../components/StatusBadge';

export const SystemArchitecturePage: React.FC = () => {
  const { systemState } = useAppStore();
  const stages = systemState?.pipeline_stages || [];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-500" />
          Technical Pipeline & System Architecture Diagnostics
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Real-time visibility into every single stage of the 11-stage hardware ingress, validation, digital twin, and AI pipeline.
        </p>
      </div>

      {/* LIVE 11-STAGE PIPELINE DIAGNOSTICS MONITOR */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500" />
            Live 11-Stage Pipeline Health & Ingress Monitor
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            Source: <strong className="text-white">{systemState?.data_source || 'APM_MAVLINK'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stages.length > 0 ? (
            stages.map((stage: any, idx: number) => {
              let statusBg = 'bg-black border-zinc-800 text-zinc-300';
              let icon = <Clock className="w-4 h-4 text-zinc-500" />;
              
              if (stage.status === 'RUNNING') {
                statusBg = 'bg-black border-zinc-700 text-white shadow-xs';
                icon = <CheckCircle2 className="w-4 h-4 text-white" />;
              } else if (stage.status === 'STALE') {
                statusBg = 'bg-red-950/20 border-red-800 text-red-300';
                icon = <AlertTriangle className="w-4 h-4 text-red-400" />;
              } else if (stage.status === 'ERROR') {
                statusBg = 'bg-red-950/40 border-red-600 text-white';
                icon = <XCircle className="w-4 h-4 text-red-500" />;
              }

              return (
                <div key={idx} className={`p-3.5 rounded-xl border flex flex-col justify-between ${statusBg}`}>
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                        STAGE {idx + 1}
                      </span>
                      {icon}
                    </div>
                    <h4 className="text-xs font-black text-white mb-1">{stage.stage_name}</h4>
                    <p className="text-[11px] text-zinc-400 truncate" title={stage.details}>
                      {stage.details || 'Active'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-[10px] font-mono font-bold">
                    <span className="text-white">{stage.status}</span>
                    {stage.message_rate_hz !== null && stage.message_rate_hz !== undefined && (
                      <span className="text-zinc-400">{stage.message_rate_hz} Hz</span>
                    )}
                    {stage.latency_ms !== null && stage.latency_ms !== undefined && (
                      <span className="text-red-400">{stage.latency_ms} ms</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-4 text-center text-zinc-400 text-xs italic">
              Awaiting telemetry streaming worker initialization...
            </div>
          )}
        </div>
      </div>

      {/* End-to-End Functional Architecture Flow */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-red-500" />
          First-Principles Aerospace Propulsion Architecture
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-4 bg-black border border-zinc-800 rounded-xl flex items-start gap-3">
            <Radio className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">1. Hardware Ingress & MAVLink Adapter:</strong>
              <p className="text-zinc-300 leading-relaxed font-medium">
                Direct UART/UDP ingress decoding <code>ESC_TELEMETRY</code>, <code>SYS_STATUS</code>, <code>VFR_HUD</code>, and <code>RAW_IMU</code>. Strict channel provenance tags real BLDC testbed signals while leaving aero-piston parameters clearly marked as UNAVAILABLE.
              </p>
            </div>
          </div>

          <div className="p-4 bg-black border border-zinc-800 rounded-xl flex items-start gap-3">
            <Cpu className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">2. First-Principles Digital Twin & Residual Engine:</strong>
              <p className="text-zinc-300 leading-relaxed font-medium">
                Dynamic electro-mechanical power balance (P_elec = V · I, P_mech = τ · ω), lumped thermal ODE (dT/dt = (P_loss - ΔT/R_th)/C_th), and rotational vibration harmonics. Evaluates live standardized Z-score residuals without synthetic bias.
              </p>
            </div>
          </div>

          <div className="p-4 bg-black border border-zinc-800 rounded-xl flex items-start gap-3">
            <Activity className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">3. Real-Time Edge AI & Prognostics:</strong>
              <p className="text-zinc-300 leading-relaxed font-medium">
                27-feature rolling pipeline powering Isolation Forest anomaly detection (with temporal hysteresis) and 4-class Random Forest diagnosis (92.2% accuracy). Remaining Useful Life (RUL) strictly reports <code>INSUFFICIENT DATA</code> until validated degradation trajectories are established.
              </p>
            </div>
          </div>

          <div className="p-4 bg-black border border-zinc-800 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">4. Dual-Layer Safety Interlocks & XAI Advisory:</strong>
              <p className="text-zinc-300 leading-relaxed font-medium">
                Triple control envelopes (Manual, Assisted, Automatic) with hard current/RPM/temp boundaries, 2.0s watchdog, and latched emergency stop ensuring real physical testbed safety.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

