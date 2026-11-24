import React, { useState, useEffect } from 'react';
import { Compass, Play, CheckCircle2, AlertTriangle, Cloud, Thermometer, Wind } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MissionSimulatorPage: React.FC = () => {
  const [profiles, setProfiles] = useState<any>({});
  const [selectedProfile, setSelectedProfile] = useState<string>('HIGH_ALTITUDE');
  const [durationHours, setDurationHours] = useState<number>(12);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    api.getMissionProfiles().then(setProfiles).catch(() => { });
    runSimulation('HIGH_ALTITUDE', 12);
  }, []);

  const runSimulation = async (profKey: string, dur: number) => {
    setLoading(true);
    try {
      const res = await api.simulateMission(profKey, dur);
      setSimulationResult(res);
    } catch (err) { }
    setLoading(false);
  };

  const handleProfileChange = (key: string) => {
    setSelectedProfile(key);
    runSimulation(key, durationHours);
  };

  const handleDurationChange = (dur: number) => {
    setDurationHours(dur);
    runSimulation(selectedProfile, dur);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Compass className="w-5 h-5 text-sky-600" />
          MALE UAV Mission Profile & Life Consumption Simulator
        </h2>
        <p className="text-xs text-slate-500">
          Project multi-hour degradation, equivalent operating hours consumed, and mission feasibility under diverse flight profiles
        </p>
      </div>

      {/* Control Configuration Card */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Mission Profile Selection */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              SELECT UAV FLIGHT MISSION PROFILE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(profiles).map(([key, prof]: [string, any]) => (
                <button
                  key={key}
                  onClick={() => handleProfileChange(key)}
                  className={`text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    selectedProfile === key
                      ? 'bg-red-950/40 text-white border-red-600 ring-1 ring-red-600 shadow-md'
                      : 'bg-black text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-white mb-0.5">{prof.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    ALT: {prof.altitude_m}m | TEMP: {prof.ambient_temp_c}°C
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mission Duration Slider */}
          <div className="space-y-3 bg-black p-4 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white uppercase tracking-wider">MISSION FLIGHT DURATION</span>
              <span className="font-mono text-base font-black text-red-500">{durationHours} HOURS</span>
            </div>
            <input
              type="range"
              min="1"
              max="48"
              value={durationHours}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>1 hr (Short sortie)</span>
              <span>24 hrs (Standard MALE loiter)</span>
              <span>48 hrs (Max endurance)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Grid */}
      {simulationResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="aerospace-card p-4 bg-[#09090b] border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                PROJECTED FINAL HEALTH
              </span>
              <div className="text-3xl font-black font-mono text-white my-1">
                {simulationResult.final_health}%
              </div>
              <p className="text-[11px] text-zinc-400">
                Initial: {simulationResult.initial_health}% (Δ -{(simulationResult.initial_health - simulationResult.final_health).toFixed(1)}%)
              </p>
            </div>

            <div className="aerospace-card p-4 bg-[#09090b] border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                EQUIVALENT LIFE CONSUMED
              </span>
              <div className="text-3xl font-black font-mono text-white my-1">
                {simulationResult.equivalent_operating_hours} <span className="text-xs text-zinc-400 font-sans">HRS</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Acceleration ratio: <strong className="text-red-400">{simulationResult.damage_acceleration_ratio}x</strong>
              </p>
            </div>

            <div className="aerospace-card p-4 bg-[#09090b] border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                PEAK WINDING TEMPERATURE
              </span>
              <div className="text-3xl font-black font-mono text-red-400 my-1">
                {simulationResult.peak_winding_temp_c}°C
              </div>
              <p className="text-[11px] text-zinc-400">Altitude convective cooling factor</p>
            </div>

            <div className="aerospace-card p-4 bg-[#09090b] border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                MISSION FEASIBILITY
              </span>
              <div className="text-xl font-black font-mono text-white my-1 flex items-center gap-1.5">
                {simulationResult.is_mission_feasible ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-red-500" /> FEASIBLE
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500" /> HIGH RISK
                  </>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">Risk rating: <strong className="text-white">{simulationResult.mission_risk}</strong></p>
            </div>
          </div>

          {/* Projected Health & Winding Temperature Trajectory */}
          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Simulated Health Decay Trajectory Over Mission Duration
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {simulationResult.profile_name} — {simulationResult.description}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" /> HEALTH (%)
                </span>
                <span className="text-red-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> RUL (HOURS)
                </span>
              </div>
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationResult.trajectory}>
                  <defs>
                    <linearGradient id="simHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                  <XAxis dataKey="time_hours" stroke="#ffffff" fontSize={11} unit="h" tick={{ fill: '#ffffff', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                  <YAxis stroke="#ffffff" fontSize={11} tick={{ fill: '#ffffff', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                  <Tooltip
                    contentStyle={{ background: '#09090b', border: '1px solid #ef4444', borderRadius: 8, color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="health_index" stroke="#ffffff" strokeWidth={2.5} fill="url(#simHealth)" isAnimationActive={false} name="Health Index" />
                  <Area type="monotone" dataKey="rul_hours" stroke="#ef4444" strokeWidth={2.5} fill="none" isAnimationActive={false} name="RUL (Hours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
