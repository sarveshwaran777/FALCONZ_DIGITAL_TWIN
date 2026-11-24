import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, Flame, BarChart3 } from 'lucide-react';
import { useAppStore } from '../state/store';
import { StatusBadge } from '../components/StatusBadge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const HealthIntelligencePage: React.FC = () => {
  const { systemState, history } = useAppStore();

  if (!systemState) return null;

  const intel = systemState.intelligence;
  const res = systemState.residuals;

  const healthData = history.map((h, i) => ({
    time: i,
    health: h.intelligence?.health_index ?? 100,
    anomaly: h.intelligence?.anomaly_score ?? 0,
    compositeRes: h.residuals?.composite_residual_score ?? 0
  }));

  const residualHeatmap = [
    { label: 'Normalized Stator Temp Residual', value: res.norm_residual_temp ?? 0, unit: 'σ', status: Math.abs(res.norm_residual_temp ?? 0) > 3 ? 'CRITICAL' : Math.abs(res.norm_residual_temp ?? 0) > 1.8 ? 'WARNING' : 'NORMAL' },
    { label: 'Normalized Vibration Residual', value: res.norm_residual_vibration ?? 0, unit: 'σ', status: Math.abs(res.norm_residual_vibration ?? 0) > 3 ? 'CRITICAL' : Math.abs(res.norm_residual_vibration ?? 0) > 1.8 ? 'WARNING' : 'NORMAL' },
    { label: 'Normalized Phase Current Residual', value: res.norm_residual_current ?? 0, unit: 'σ', status: Math.abs(res.norm_residual_current ?? 0) > 3 ? 'CRITICAL' : Math.abs(res.norm_residual_current ?? 0) > 1.8 ? 'WARNING' : 'NORMAL' },
    { label: 'Normalized RPM Deviation', value: res.norm_residual_rpm ?? 0, unit: 'σ', status: Math.abs(res.norm_residual_rpm ?? 0) > 3 ? 'CRITICAL' : Math.abs(res.norm_residual_rpm ?? 0) > 1.8 ? 'WARNING' : 'NORMAL' },
    { label: 'Normalized Efficiency Loss', value: res.norm_residual_efficiency ?? 0, unit: 'σ', status: Math.abs(res.norm_residual_efficiency ?? 0) > 3 ? 'CRITICAL' : Math.abs(res.norm_residual_efficiency ?? 0) > 1.8 ? 'WARNING' : 'NORMAL' }
  ];

  const healthIndex = intel.health_index ?? 100;
  const anomalyScore = intel.anomaly_score ?? 0;
  const compResScore = res.composite_residual_score ?? 0;

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-500" />
          Health Intelligence & Degradation Diagnostics
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Isolation Forest Anomaly Scoring with 3-5 sample temporal hysteresis and composite physics residual tracking
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Composite Health Score</span>
            <StatusBadge type="HEALTH" value={intel.health_band || 'HEALTHY'} />
          </div>
          <div className="text-3xl font-black font-mono text-white my-1">
            {healthIndex.toFixed(1)}%
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-300 ${
                healthIndex >= 85 ? 'bg-white' : healthIndex >= 70 ? 'bg-red-400' : 'bg-red-600'
              }`}
              style={{ width: `${healthIndex}%` }}
            />
          </div>
        </div>

        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Isolation Forest Anomaly Score</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              intel.is_anomaly ? 'bg-red-600 text-white border-red-700' : 'bg-white/10 text-white border-white/20'
            }`}>
              {intel.is_anomaly ? 'ANOMALY DETECTED' : 'NOMINAL'}
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white my-1">
            {anomalyScore.toFixed(1)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Hysteresis Count: <strong className="text-white">{intel.anomaly_hysteresis_count ?? 0} / 5</strong>
          </p>
        </div>

        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Composite Residual Distance</span>
            <span className="text-[10px] font-mono font-bold text-red-400">EUCLIDEAN Z-SPACE</span>
          </div>
          <div className="text-3xl font-black font-mono text-white my-1">
            {compResScore.toFixed(2)}σ
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Anomaly Threshold: <strong className="text-red-400">2.20σ</strong>
          </p>
        </div>
      </div>

      {/* Health Trend Timeline */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Continuous Health Index & Anomaly Score Progression
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="text-white flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white" /> HEALTH INDEX (%)
            </span>
            <span className="text-red-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> ANOMALY SCORE
            </span>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={healthData}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} stroke="#ffffff" fontSize={11} tick={{ fill: '#ffffff', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
              <Tooltip 
                contentStyle={{ background: '#09090b', border: '1px solid #ef4444', borderRadius: 8, color: '#ffffff', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="health" stroke="#ffffff" strokeWidth={2.5} fill="rgba(255, 255, 255, 0.15)" isAnimationActive={false} name="Health Index" />
              <Area type="monotone" dataKey="anomaly" stroke="#ef4444" strokeWidth={2} fill="rgba(239, 68, 68, 0.25)" isAnimationActive={false} name="Anomaly Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Normalized Residuals Heatmap */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
          Physics Residual Deviation Heatmap (Z-Scores Relative to Digital Twin)
        </h3>

        <div className="space-y-3 font-mono">
          {residualHeatmap.map((item, idx) => (
            <div key={idx} className="bg-black border border-zinc-800 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-white w-64">{item.label}</span>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      item.status === 'CRITICAL' ? 'bg-red-600' : item.status === 'WARNING' ? 'bg-red-400' : 'bg-white'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(item.value) * 20)}%` }}
                  />
                </div>
                <span className="font-mono font-black text-white w-20 text-right">
                  {item.value > 0 ? `+${item.value.toFixed(2)}` : item.value.toFixed(2)} {item.unit}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold w-24 text-center border ${
                item.status === 'CRITICAL' ? 'bg-red-600 text-white border-red-700' : item.status === 'WARNING' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-white/10 text-white border-white/20'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
