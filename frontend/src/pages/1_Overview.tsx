import React, { useState, useMemo } from 'react';
import { Activity, Cpu, AlertTriangle, Play, Power, RotateCcw, Sliders, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../state/store';
import { Quadcopter3DViewer } from '../three/Quadcopter3DViewer';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const OverviewPage: React.FC = () => {
  const { systemState, history, activeAlerts, theme, setThrottle, takeoff, land, groundReset } = useAppStore();
  const [timeRange, setTimeRange] = useState<'5m' | '10m' | '20m'>('5m');
  const [activeTab, setActiveTab] = useState<'rpm' | 'current' | 'temperature' | 'power'>('rpm');
  const isDark = theme === 'dark';

  const historySlice = useMemo(() => {
    // True time-window filtering + decimation for 5m/10m/20m
    const windowSec = timeRange === '5m' ? 300 : timeRange === '10m' ? 600 : 1200;
    const now = Date.now() / 1000;
    // If history has timestamps, filter by time; fallback to count
    let filtered = history;
    if (history.length > 0 && history[0]?.telemetry?.timestamp) {
      filtered = history.filter(h => now - (h.telemetry.timestamp ?? now) < windowSec + 2);
      if (filtered.length === 0) filtered = history;
    } else {
      const count = timeRange === '5m' ? 600 : timeRange === '10m' ? 1200 : 2400;
      filtered = history.slice(-count);
    }
    // Decimate to ≤400 points for smooth AreaChart performance
    const maxPoints = 400;
    if (filtered.length > maxPoints) {
      const step = Math.ceil(filtered.length / maxPoints);
      filtered = filtered.filter((_, i) => i % step === 0);
    }
    return filtered;
  }, [history, timeRange]);

  const chartData = useMemo(() => {
    return historySlice.map(h => {
      const ts = h.telemetry?.timestamp ?? 0;
      const d = new Date(ts * 1000);
      const m = d.getMinutes().toString().padStart(2, '0');
      const s = d.getSeconds().toString().padStart(2, '0');
      const label = `${m}:${s}`;
      return {
        time: label,
        timeLabel: label,
        rpm: h.telemetry?.rpm ?? 0,
        current: h.telemetry?.current_a ?? 0,
        temperature: h.telemetry?.temperature_c ?? 25,
        power: h.telemetry?.power_elec_w ?? 0,
      };
    });
  }, [historySlice]);

  if (!systemState) {
    return (
      <div className="flex flex-col items-center justify-center h-[420px] gap-3">
        <div className="w-9 h-9 rounded-md border flex items-center justify-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <Activity className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Connecting…</p>
      </div>
    );
  }

  const tel = systemState.telemetry;
  const intel = systemState.intelligence;
  const motors = tel.motors || {};
  const isConnected = (tel.connection_status !== 'DISCONNECTED' && tel.connection_status !== undefined) || tel.source_type === 'SIMULATION' || !!tel.heartbeat_received;
  const critical = activeAlerts.find(a => a.level === 'CRITICAL');

  const liveThrottle = tel.throttle_pct ?? 0;
  const isArmed = Boolean(tel.is_armed);
  const isOnGround = !isArmed || liveThrottle < 0.5;
  const isSpooling = isArmed && liveThrottle >= 0.5 && liveThrottle < 50;
  const isAirborne = isArmed && liveThrottle >= 50;

  const getMotor = (key: 'motor_1' | 'motor_2' | 'motor_3' | 'motor_4', idx: number) => {
    const m: any = motors[key];
    const connected = m ? (m.is_connected !== false && m.connection_status !== 'DISCONNECTED' && m.connection_status !== 'NOT CONNECTED') : isConnected;
    const liveRpm = connected ? Math.round(m?.live_rpm ?? m?.rpm ?? (isArmed ? (tel.rpm ?? 0) : 0)) : 0;
    const liveCurr = connected ? (m?.current_a ?? (tel.current_a ? tel.current_a / 4 : 0)) : 0;
    const liveTemp = connected ? (m?.temperature_c ?? tel.temperature_c ?? null) : null;
    const liveThrust = connected ? (m?.thrust_g ?? (tel.total_thrust_g ? tel.total_thrust_g / 4 : 0)) : 0;
    const isRunning = connected && liveRpm > 50;
    return {
      id: key,
      label: `M${idx + 1}`,
      name: `Motor ${idx + 1}`,
      connected,
      isRunning,
      rpm: liveRpm,
      thrust: liveThrust,
      current: liveCurr,
      temp: liveTemp,
    };
  };
  const motorList = [getMotor('motor_1', 0), getMotor('motor_2', 1), getMotor('motor_3', 2), getMotor('motor_4', 3)];

  return (
    <div className="space-y-6 w-full">
      {critical && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm bg-red-950/40 border-red-600 text-white shadow-lg shadow-red-950/50">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <div className="min-w-0">
            <div className="font-bold leading-none text-white">Attention required</div>
            <div className="text-xs text-zinc-300 mt-1 leading-relaxed font-medium">{critical.event} — {critical.evidence}</div>
          </div>
        </div>
      )}

      <div className="aerospace-card p-6 bg-[#09090b] border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-[11px] tracking-widest uppercase font-bold text-red-400">Propulsion Cockpit</div>
            <div className="text-[24px] font-black tracking-tight mt-1 text-white">
              {isConnected ? 'System Nominal' : 'Offline'}
            </div>
            <div className="text-xs mt-1 text-zinc-400 font-medium">{motorList.filter(m => m.connected).length} of 4 channels active & streaming</div>
          </div>
          <div className="flex gap-8">
            <div>
              <div className="text-[11px] tracking-widest uppercase font-bold text-zinc-400">Health Index</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black tabular-nums text-white">
                  {tel.source_type === 'SIMULATION' || isConnected ? `${Math.round(intel.health_index ?? 100)}%` : '—'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-red-500/40 text-red-400 font-bold bg-red-500/15">
                  {intel.health_band || 'HEALTHY'}
                </span>
              </div>
            </div>
            <div className="hidden sm:block w-px self-stretch bg-zinc-800" />
            <div className="hidden sm:block">
              <div className="text-[11px] tracking-widest uppercase font-bold text-zinc-400">Operational Mode</div>
              <div className="text-sm font-bold mt-1.5 text-white">{tel.source_type === 'SIMULATION' ? 'Simulation (20 Hz)' : 'Hardware Telemetry'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Operations Deck: Pre-Flight (0 Initial Values) & Takeoff / Landing Controls */}
      <div className="aerospace-card p-4 bg-[#09090b] border-zinc-800 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnGround ? 'bg-emerald-500' : isSpooling ? 'bg-red-500 animate-ping' : 'bg-red-500 animate-pulse'}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-white">
                  {isOnGround 
                    ? 'PRE-FLIGHT STATE: ON GROUND (0 RPM)' 
                    : isSpooling 
                      ? `SPOOLING UP: PROGRESSIVE LIFTOFF (${Math.round(tel.rpm ?? 0)} RPM)` 
                      : 'FLIGHT ACTIVE: HOVER STABILIZED'}
                </span>
                <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isOnGround 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40' 
                    : isSpooling 
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 animate-pulse' 
                      : 'bg-red-950/40 text-red-400 border-red-500/40'
                }`}>
                  {isOnGround ? 'INITIAL 0 VALUES' : isSpooling ? `RAMPING (${Math.round(liveThrottle)}%)` : `55% HOVER`}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                {isOnGround
                  ? 'All 4 propulsion channels held strictly at 0.0 RPM resting state before takeoff.'
                  : isSpooling
                    ? `Simulating physical motor spool-up inertia and aerodynamic liftoff. Altitude: ${(tel.altitude_m ?? 0).toFixed(1)}m`
                    : `Motors engaged: Total thrust ${(tel.total_thrust_g ?? 0).toFixed(0)}g | Current ${(tel.current_a ?? 0).toFixed(2)}A | Alt: ${(tel.altitude_m ?? 2.5).toFixed(1)}m`}
              </div>
            </div>
          </div>

          {/* Action Controls & Throttle Slider */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Takeoff / Land Trigger */}
            {isOnGround ? (
              <button
                onClick={() => takeoff(55)}
                className="h-8 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono tracking-wider flex items-center gap-2 shadow-md shadow-red-900/40 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                INITIATE TAKEOFF (55%)
              </button>
            ) : isSpooling ? (
              <button
                onClick={land}
                className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                ABORT / RETURN TO 0
              </button>
            ) : (
              <button
                onClick={land}
                className="h-8 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold font-mono tracking-wider flex items-center gap-2 cursor-pointer transition-colors border border-zinc-700"
              >
                <Power className="w-3.5 h-3.5 text-red-400" />
                LAND (RETURN TO 0)
              </button>
            )}

            {/* Quick Ground Reset */}
            <button
              onClick={groundReset}
              className="h-8 px-3 rounded-lg border border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reset telemetry to initial 0 state on ground"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESET (0)
            </button>

            {/* Throttle Range Slider */}
            <div className="flex items-center gap-2 px-3 py-1 bg-black rounded-lg border border-zinc-800">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">THROTTLE</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(liveThrottle)}
                onChange={(e) => setThrottle(Number(e.target.value))}
                className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <span className="text-xs font-mono font-black text-white w-9 text-right">
                {Math.round(liveThrottle)}%
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progressive Spool-up Progress Track */}
        {isSpooling && (
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div 
              className="bg-gradient-to-r from-amber-500 to-red-600 h-full transition-all duration-200" 
              style={{ width: `${Math.min(100, (liveThrottle / 55) * 100)}%` }} 
            />
          </div>
        )}
      </div>

      <Quadcopter3DViewer />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Propulsion Channels</h3>
          <span className="text-xs font-mono font-bold text-red-400">{motorList.filter(m => m.connected).length}/4 Online</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {motorList.map(m => (
            <div key={m.id} className="aerospace-card p-4 flex flex-col gap-4 bg-[#09090b] border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white">{m.name}</div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${
                    m.connected 
                      ? (m.rpm > 4500 
                          ? 'bg-red-600/20 text-red-400 border-red-500/40' 
                          : m.rpm > 50 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                            : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30') 
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  {m.connected ? (m.rpm > 4500 ? 'Running' : m.rpm > 50 ? 'Spooling' : 'Ready') : 'Offline'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400 font-bold">RPM</div>
                  <div className="text-sm font-black tabular-nums mt-0.5 text-white">{m.connected ? m.rpm.toFixed(0) : '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400 font-bold">Thrust</div>
                  <div className="text-sm font-black tabular-nums mt-0.5 text-white">{m.connected && m.thrust ? `${m.thrust.toFixed(0)} g` : '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400 font-bold">Current</div>
                  <div className="text-sm font-black tabular-nums mt-0.5 text-white">{m.connected ? `${m.current.toFixed(2)} A` : '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400 font-bold">Temp</div>
                  <div className="text-sm font-black tabular-nums mt-0.5 text-white">{m.temp !== null && m.temp !== undefined ? `${Number(m.temp).toFixed(0)}°C` : '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aerospace-card p-6 bg-[#09090b] border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Propulsion Telemetry Stream</h3>
          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-full border border-zinc-800 bg-black gap-1">
              {(['rpm', 'current', 'temperature', 'power'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs capitalize font-bold transition-colors ${
                    activeTab === tab ? 'bg-red-600 text-white shadow-sm shadow-red-900/40' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="hidden sm:flex rounded-full border border-zinc-800 bg-black p-1 gap-1">
              {(['5m', '10m', '20m'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r as any)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    timeRange === r ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#ffffff', fontWeight: 700 }} tickLine={false} axisLine={{ stroke: '#27272a' }} interval="preserveStartEnd" minTickGap={40} />
              <YAxis stroke="#ffffff" fontSize={11} width={44} tick={{ fill: '#ffffff', fontWeight: 700, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#09090b', border: '1px solid #ef4444', borderRadius: 8, fontSize: 12, color: '#ffffff' }}
                cursor={{ stroke: '#ef4444' }}
                labelStyle={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}
                itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey={activeTab} stroke="#ef4444" strokeWidth={2.5} fill="rgba(239, 68, 68, 0.2)" fillOpacity={1} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-[10px] mt-1 px-1 font-mono text-zinc-400">
            <span>{timeRange} window • {chartData.length} points</span>
            <span className="hidden sm:inline">Live {activeTab} • 20 Hz decimated to ≤400 pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
