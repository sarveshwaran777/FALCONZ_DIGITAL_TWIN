import React from 'react';
import { Cpu, Activity } from 'lucide-react';
import { useAppStore } from '../state/store';
import { StatusBadge } from '../components/StatusBadge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const LiveDigitalTwinPage: React.FC = () => {
  const { systemState, history } = useAppStore();
  if (!systemState) return null;
  const tel = systemState.telemetry;
  const dt = systemState.digital_twin;
  const res = systemState.residuals;
  const rawChartData = history.map((h, i) => ({
    time: i,
    actualRpm: h.telemetry?.rpm ?? 0,
    expectedRpm: h.digital_twin?.expected_rpm ?? 0,
    actualTemp: h.telemetry?.temperature_c ?? 25,
    expectedTemp: h.digital_twin?.expected_temperature_c ?? 25,
  }));
  const chartData = rawChartData.length > 0 ? rawChartData : [
    { time: 0, actualRpm: tel.rpm ?? 0, expectedRpm: dt.expected_rpm ?? 0, actualTemp: tel.temperature_c ?? 25, expectedTemp: dt.expected_temperature_c ?? 25 }
  ];
  const rows = [
    { name: 'Rotational Speed', actual: `${(tel.rpm ?? 0).toFixed(0)} RPM`, expected: `${(dt.expected_rpm ?? 0).toFixed(0)} RPM`, delta: `${(res.residual_rpm ?? 0).toFixed(0)}` },
    { name: 'Temperature', actual: `${(tel.temperature_c ?? 25).toFixed(1)} °C`, expected: `${(dt.expected_temperature_c ?? 25).toFixed(1)} °C`, delta: `${(res.residual_temperature_c ?? 0).toFixed(1)}` },
    { name: 'Current', actual: `${(tel.current_a ?? 0).toFixed(2)} A`, expected: `${(dt.expected_current_a ?? 0).toFixed(2)} A`, delta: `${(res.residual_current_a ?? 0).toFixed(2)}` },
    { name: 'Power', actual: `${(tel.power_elec_w ?? 0).toFixed(1)} W`, expected: `${(dt.expected_power_elec_w ?? 0).toFixed(1)} W`, delta: `${(res.residual_power_w ?? 0).toFixed(1)}` },
  ];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-base font-black flex items-center gap-2 text-white">
          <Cpu className="w-5 h-5 text-red-500" /> Digital Twin Propulsion Residuals
        </h2>
        <p className="text-xs mt-1 text-zinc-400 font-medium">Measured vs physics propulsion state — real-time physical residuals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RPM Chart */}
        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">RPM — Actual vs Expected</span>
            <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
              <span className="text-red-500">— Actual</span>
              <span className="text-white">--- Expected</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis hide />
                <YAxis stroke="#ffffff" fontSize={11} width={45} tick={{ fill: '#ffffff', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                <Tooltip 
                  contentStyle={{ background: '#09090b', border: '1px solid #ef4444', borderRadius: 8, color: '#ffffff', fontWeight: 'bold' }} 
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="actualRpm" stroke="#ef4444" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Actual RPM" />
                <Line type="monotone" dataKey="expectedRpm" stroke="#ffffff" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} name="Expected RPM" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Temperature — Actual vs Expected</span>
            <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
              <span className="text-red-500">— Actual</span>
              <span className="text-white">--- Expected</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis hide />
                <YAxis stroke="#ffffff" fontSize={11} width={45} tick={{ fill: '#ffffff', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                <Tooltip 
                  contentStyle={{ background: '#09090b', border: '1px solid #ef4444', borderRadius: 8, color: '#ffffff', fontWeight: 'bold' }} 
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="actualTemp" stroke="#ef4444" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Actual Temp" />
                <Line type="monotone" dataKey="expectedTemp" stroke="#ffffff" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} name="Expected Temp" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold flex items-center gap-2 text-white uppercase tracking-wider">
            <Activity className="w-4 h-4 text-red-500" /> Propulsion Residual State Table
          </span>
          <StatusBadge type="VALIDATED" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wide bg-[#0c0c10] text-white">
                <th className="py-2.5 px-3 font-bold text-white">Parameter</th>
                <th className="py-2.5 px-3 font-bold text-white">Actual Signal</th>
                <th className="py-2.5 px-3 font-bold text-white">Digital Twin Expected</th>
                <th className="py-2.5 px-3 font-bold text-red-400">Δ Residual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {rows.map(r => (
                <tr key={r.name} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{r.name}</td>
                  <td className="py-2.5 px-3 tabular-nums font-bold text-white">{r.actual}</td>
                  <td className="py-2.5 px-3 tabular-nums font-semibold text-zinc-300">{r.expected}</td>
                  <td className="py-2.5 px-3 tabular-nums font-black text-red-400">{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
