import React, { useState, useEffect } from 'react';
import { Cloud, Download, FileText, Clock, Activity, Calendar, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const CloudFlightHistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getCloudFlightHistory().then((data) => {
      if (Array.isArray(data)) setSessions(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              BLACKBOX AUDIT LOG
            </span>
            <span className="text-xs text-slate-400">Total: {sessions.length} Flight Sessions</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Cloud className="w-6 h-6 text-purple-400" />
            Cloud Flight History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            High-frequency synchronized telemetry, residuals, and ML diagnostics persisted for post-mission engineering review.
          </p>
        </div>
      </div>

      {/* Flight Sessions Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Mission Session</th>
                <th className="px-4 py-3.5">Aircraft</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Peak RPM</th>
                <th className="px-4 py-3.5">Max Temp</th>
                <th className="px-4 py-3.5">Max Vib</th>
                <th className="px-4 py-3.5">Min Health</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {sessions.map((s) => {
                const durationMin = Math.round(s.duration_sec / 60.0);
                const isHealthy = s.min_health_idx >= 85;
                const isWarning = s.min_health_idx >= 70 && s.min_health_idx < 85;

                return (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{s.session_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300 font-sans">{s.drone_name || 'Falcon-X1'}</td>
                    <td className="px-4 py-4 text-slate-300">{durationMin} min</td>
                    <td className="px-4 py-4 text-slate-300">{s.max_rpm.toFixed(0)}</td>
                    <td className="px-4 py-4 text-slate-300">{s.max_temp_c.toFixed(1)} °C</td>
                    <td className="px-4 py-4 text-slate-300">{s.max_vib_g.toFixed(2)} g</td>
                    <td className={`px-4 py-4 font-bold ${isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400'}`}>
                      {s.min_health_idx.toFixed(1)}%
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={`/api/telemetry/record/export/${s.id}.csv`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-sans transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" />
                        <span>CSV</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
