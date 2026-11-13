import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Battery, Clock, Activity, AlertTriangle, 
  CheckCircle2, X, Shield, ArrowUpRight, Wrench 
} from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const FleetManagementPage: React.FC = () => {
  const { currentPlan, openUpgradeModal, showToast } = useAppStore();
  const [drones, setDrones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [droneName, setDroneName] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [frameType, setFrameType] = useState<string>('Quadcopter F450');

  const fetchDrones = async () => {
    try {
      const data = await api.getDrones();
      if (Array.isArray(data)) setDrones(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchDrones();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!droneName.trim() || !serialNumber.trim()) return;

    try {
      const res = await api.registerDrone(droneName, serialNumber, frameType);
      if (res.status === 'SUCCESS') {
        showToast(res.message, 'success');
        setModalOpen(false);
        setDroneName('');
        setSerialNumber('');
        fetchDrones();
      } else if (res.detail?.error === 'PLAN_LIMIT_REACHED') {
        openUpgradeModal(
          'Additional Drone Fleet Capacity',
          'STARTER',
          res.detail.message
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Error registering drone', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              FLEET TELEMETRY INGRESS
            </span>
            <span className="text-xs text-slate-400">Total: {drones.length} Aircraft</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text)' }}>
            <Users className="w-6 h-6 text-cyan-500" />
            Drone Fleet Management
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Monitor, calibrate and manage multi-aircraft propulsion systems across your organization.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register New Aircraft
        </button>
      </div>

      {/* Drones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {drones.map((d) => {
          const isHealthy = d.health_index >= 85;
          const isWarning = d.health_index >= 70 && d.health_index < 85;
          const statusColor = d.status === 'ONLINE' ? 'bg-emerald-400' : (d.status === 'IN_FLIGHT' ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400');

          return (
            <div 
              key={d.id}
              className="p-5 rounded-2xl border transition-all relative overflow-hidden"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* Status Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                  {d.status}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{d.serial_number}</span>
              </div>

              {/* Drone Name & Frame */}
              <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>{d.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{d.frame_type}</p>

              {/* Health & Metrics Bar */}
              <div className="space-y-3 pt-3 border-t border-white/5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" /> Propulsion Health
                  </span>
                  <span className={`font-bold ${isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400'}`}>
                    {d.health_index.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, d.health_index)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{d.total_flight_hours.toFixed(1)} hrs logged</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Battery className="w-3.5 h-3.5 text-slate-500" />
                    <span>{d.battery_level_pct?.toFixed(0) || 90}% pack</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Drone Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Register Aircraft to Fleet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Connect a physical or simulated UAV airframe to your organization's digital twin telemetry bus.
            </p>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Aircraft Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Falcon-Surveyor-04"
                  value={droneName}
                  onChange={(e) => setDroneName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500"
                  style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: 'var(--border)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Hardware Serial Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLC-F450-SN-004"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500"
                  style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: 'var(--border)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>Frame Architecture</label>
                <select
                  value={frameType}
                  onChange={(e) => setFrameType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500"
                  style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: 'var(--border)' }}
                >
                  <option value="Quadcopter F450">Quadcopter F450 (4× BLDC)</option>
                  <option value="Hexacopter F550">Hexacopter F550 (6× BLDC)</option>
                  <option value="Octocopter Heavy">Octocopter Heavy (8× BLDC)</option>
                  <option value="MALE UAV Aero-Piston">MALE UAV Aero-Piston (Target Engine)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

