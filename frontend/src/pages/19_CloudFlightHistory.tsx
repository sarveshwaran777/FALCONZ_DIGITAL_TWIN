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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border bg-[#09090b] border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30">
              BLACKBOX AUDIT LOG
            </span>
            <span className="text-xs text-zinc-400">Total: {sessions.length} Flight Sessions</span>
          </div>
          <h1 className="text-2xl font-black flex items-center gap-2.5 text-white">
            <Cloud className="w-6 h-6 text-red-500" />
            Cloud Flight History
          </h1>
          <p className="text-xs text-zinc-300 mt-1 font-medium">
            High-frequency synchronized telemetry, residuals, and ML diagnostics persisted for post-mission engineering review.
          </p>
        </div>
      </div>

      {/* Flight Sessions Table */}
      <div className="rounded-2xl border overflow-hidden bg-[#09090b] border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b text-[11px] uppercase tracking-wider text-zinc-400 font-bold bg-black border-zinc-800">
              <tr>
                <th className="px-5 py-3.5 text-white font-bold">Mission Session</th>
                <th className="px-4 py-3.5 text-white font-bold">Aircraft</th>
                <th className="px-4 py-3.5 text-white font-bold">Duration</th>
                <th className="px-4 py-3.5 text-white font-bold">Peak RPM</th>
                <th className="px-4 py-3.5 text-white font-bold">Max Temp</th>
                <th className="px-4 py-3.5 text-white font-bold">Max Vib</th>
                <th className="px-4 py-3.5 text-white font-bold">Min Health</th>
                <th className="px-4 py-3.5 text-white font-bold">Status</th>
                <th className="px-5 py-3.5 text-right text-white font-bold">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[11.5px] divide-zinc-800/60">
              {sessions.map((s) => {
                const durationMin = Math.round(s.duration_sec / 60.0);
                const isHealthy = s.min_health_idx >= 85;
                const isWarning = s.min_health_idx >= 70 && s.min_health_idx < 85;

                return (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-bold text-white font-sans">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{s.session_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-300 font-sans">{s.drone_name || 'Falcon-X1'}</td>
                    <td className="px-4 py-4 text-zinc-300 font-bold">{durationMin} min</td>
                    <td className="px-4 py-4 text-white font-black">{s.max_rpm.toFixed(0)}</td>
                    <td className="px-4 py-4 text-red-400 font-bold">{s.max_temp_c.toFixed(1)} °C</td>
                    <td className="px-4 py-4 text-zinc-300 font-bold">{s.max_vib_g.toFixed(2)} g</td>
                    <td className={`px-4 py-4 font-black ${isHealthy ? 'text-white' : isWarning ? 'text-red-400' : 'text-red-500'}`}>
                      {s.min_health_idx.toFixed(1)}%
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-white border border-zinc-700">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={`/api/telemetry/record/export/${s.id}.csv`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-sans transition-colors hover:border-red-500 bg-black text-white font-bold"
                      >
                        <Download className="w-3.5 h-3.5 text-red-500" />
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

