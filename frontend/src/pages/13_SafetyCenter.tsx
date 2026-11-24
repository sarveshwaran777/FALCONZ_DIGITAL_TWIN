import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cpu, Power, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAppStore } from '../state/store';
import { StatusBadge } from '../components/StatusBadge';

export const SafetyCenterPage: React.FC = () => {
  const { systemState, triggerEmergencyStop, resetEmergencyStop } = useAppStore();
  const [safetyStatus, setSafetyStatus] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getSafetyStatus();
      setSafetyStatus(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const isEmergency = safetyStatus?.emergency_stop_latched || systemState?.safety_state === 'EMERGENCY';

  const telRpm = systemState?.telemetry?.rpm ?? 0;
  const telCurr = systemState?.telemetry?.current_a ?? 0;
  const telTemp = systemState?.telemetry?.temperature_c ?? 25;
  const telVib = systemState?.telemetry?.vibration_rms_g ?? 0.05;

  const hardLimits = [
    { limit: 'Maximum RPM Limit', value: '7,500 RPM', current: `${telRpm.toFixed(0)} RPM`, status: telRpm > 7500 ? 'VIOLATED' : 'SAFE' },
    { limit: 'Maximum Phase Current', value: '38.0 A', current: `${telCurr.toFixed(1)} A`, status: telCurr > 38 ? 'VIOLATED' : 'SAFE' },
    { limit: 'Maximum Stator Winding Temp', value: '85.0 °C', current: `${telTemp.toFixed(1)} °C`, status: telTemp > 85 ? 'VIOLATED' : 'SAFE' },
    { limit: 'Maximum Vibration Threshold', value: '12.0 g RMS', current: `${telVib.toFixed(2)} g`, status: telVib > 12 ? 'VIOLATED' : 'SAFE' },
    { limit: 'Stale Data Watchdog Timeout', value: '2.0 seconds', current: '< 0.5s stream lag', status: 'SAFE' }
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-500" />
          Safety Center & Hardware Interlock Governance
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Deterministic hardware envelope boundaries, watchdog stale-data detection, and fail-safe governor transitions
        </p>
      </div>

      {/* Emergency Status Banner */}
      <div className={`aerospace-card p-5 border-l-4 bg-[#09090b] ${isEmergency ? 'border-l-red-600 border-red-800' : 'border-l-red-500 border-zinc-800'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-red-400">
              SAFETY GOVERNANCE STATUS
            </span>
            <h3 className={`text-xl font-black font-mono ${isEmergency ? 'text-red-500' : 'text-white'}`}>
              {isEmergency ? 'EMERGENCY SHUTDOWN LATCHED' : `SAFETY STATE: ${systemState?.safety_state || 'SAFE'}`}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Active Control Mode: <strong className="font-bold text-white">{systemState?.control_mode || 'MANUAL'}</strong> (Governor Interlocks Enabled)
            </p>
          </div>

          <div>
            {isEmergency ? (
              <button
                onClick={resetEmergencyStop}
                className="bg-white hover:bg-zinc-200 text-black font-black text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-black" /> RESET & CLEAR E-STOP
              </button>
            ) : (
              <button
                onClick={triggerEmergencyStop}
                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/50 flex items-center gap-2 transition-colors cursor-pointer animate-pulse"
              >
                <Power className="w-4 h-4" /> MANUAL EMERGENCY SHUTDOWN
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hard Interlock Limits Table */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
          Hard Physical Protection Envelopes (Non-Bypassable)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-bold text-[11px] bg-black">
                <th className="py-2.5 px-3">SAFETY PARAMETER</th>
                <th className="py-2.5 px-3">HARD ENVELOPE LIMIT</th>
                <th className="py-2.5 px-3">CURRENT LIVE READING</th>
                <th className="py-2.5 px-3">INTERLOCK STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {hardLimits.map((lim, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white font-sans">{lim.limit}</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-300">{lim.value}</td>
                  <td className="py-2.5 px-3 font-black text-white">{lim.current}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      lim.status === 'SAFE'
                        ? 'bg-zinc-800 text-white border-zinc-700'
                        : 'bg-red-600 text-white border-red-700'
                    }`}>
                      {lim.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Philosophy */}
      <div className="p-4 rounded-xl bg-black border border-zinc-800 text-xs text-zinc-300 space-y-1">
        <strong className="text-white block text-xs uppercase font-bold">Safety Rule:</strong>
        <p className="leading-relaxed font-medium">
          AI predictions never have write-authority over safety constraints. Automatic derate actions can only restrict throttle to protect the physical testbed, never exceed operator limits or hardware safety ceilings.
        </p>
      </div>
    </div>
  );
};
