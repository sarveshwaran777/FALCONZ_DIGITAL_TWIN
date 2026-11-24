import React from 'react';
import { Settings, Save, Shield, Sliders, Database, Info } from 'lucide-react';
import { useAppStore } from '../state/store';

export const SettingsPage: React.FC = () => {
  const { systemState } = useAppStore();

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-red-500" />
          FALCONZ System Settings & Propulsion Physics Calibration
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Hardware constants, safety governor thresholds, and telemetry streaming configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Physical Testbed Parameters */}
        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800 space-y-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5 font-mono">
            <Sliders className="w-4 h-4 text-red-500" />
            BLDC Physical Rig Motor Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Motor Velocity Constant (Kv)</label>
              <input type="text" readOnly value="880 RPM/V" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-white font-bold" />
            </div>
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Phase Resistance (Rm)</label>
              <input type="text" readOnly value="0.085 Ohms" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-white font-bold" />
            </div>
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">No-Load Current (I0)</label>
              <input type="text" readOnly value="0.65 A" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-white font-bold" />
            </div>
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Thermal Capacitance (C_th)</label>
              <input type="text" readOnly value="45.0 J/K" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-white font-bold" />
            </div>
          </div>
        </div>

        {/* Safety Limits */}
        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800 space-y-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5 font-mono">
            <Shield className="w-4 h-4 text-red-500" />
            Hard Safety Envelope Limits
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Max Stator Temperature Limit</label>
              <input type="text" readOnly value="85.0 °C" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-red-400 font-black" />
            </div>
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Max Continuous Current Limit</label>
              <input type="text" readOnly value="38.0 A" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-red-400 font-black" />
            </div>
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Max Rotational Speed Limit</label>
              <input type="text" readOnly value="7,500 RPM" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-red-400 font-black" />
            </div>
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Watchdog Stale Telemetry Timeout</label>
              <input type="text" readOnly value="2.0 Seconds" className="w-full bg-black border border-zinc-800 rounded-lg p-2 font-mono text-white font-bold" />
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Mode info */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 font-mono">
          Edge & Local Deployment Topology
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-300">
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono">
            <strong className="text-white block mb-1">Edge Local Mode:</strong> Active on Companion SBC / Local GCS without cloud dependency.
          </div>
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono">
            <strong className="text-white block mb-1">Telemetry Stream:</strong> Native WebSocket on port 8000 (/ws/telemetry) at 2.0 Hz.
          </div>
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono">
            <strong className="text-white block mb-1">Model Registry:</strong> Local Scikit-learn serialized models with quantile confidence estimation.
          </div>
        </div>
      </div>
    </div>
  );
};
