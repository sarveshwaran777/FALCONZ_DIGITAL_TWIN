import React, { useState, useEffect } from 'react';
import { PlaySquare, Play, Pause, RotateCcw, FastForward, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const MissionReplayPage: React.FC = () => {
  const [replayData, setReplayData] = useState<any>(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);

  const fetchReplayData = async () => {
    try {
      const data = await api.getAllReplayFrames();
      setReplayData(data);
      setCurrentFrameIdx(data.current_frame_idx);
      setIsPlaying(data.is_playing);
      setSpeed(data.playback_speed);
    } catch (err) {}
  };

  useEffect(() => {
    fetchReplayData();
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying && replayData?.frames) {
      timer = setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % replayData.frames.length);
      }, 500 / speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, replayData]);

  const handlePlay = () => {
    setIsPlaying(true);
    api.controlReplay('play');
  };

  const handlePause = () => {
    setIsPlaying(false);
    api.controlReplay('pause');
  };

  const handleReset = () => {
    setCurrentFrameIdx(0);
    setIsPlaying(false);
    api.controlReplay('reset');
  };

  const handleSeek = (idx: number) => {
    setCurrentFrameIdx(idx);
    api.controlReplay('seek', idx);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    api.controlReplay('speed', undefined, newSpeed);
  };

  const currentFrame = replayData?.frames?.[currentFrameIdx] || null;
  const tel = currentFrame?.telemetry;
  const health = currentFrame?.health;
  const totalFrames = replayData?.frames?.length || 120;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
          <PlaySquare className="w-5 h-5 text-red-500" />
          Deterministic Flight Mission Replay & Black-Box Telemetry Analyzer
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Playback timestamped historical flight phases (Takeoff, Climb, Cruise, Ingress, Bearing Inception, Thermal Rise, RTB)
        </p>
      </div>

      {/* Playback Control Deck */}
      <div className="aerospace-card p-5 bg-[#09090b] text-white border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
              FLIGHT PHASE:
            </span>
            <h3 className="text-base font-black text-white font-mono">
              {currentFrame?.flight_phase || 'STANDBY'}
            </h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-black hover:bg-zinc-800 text-white border border-zinc-800 cursor-pointer transition-colors"
              title="Reset to start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isPlaying ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 cursor-pointer transition-colors"
              >
                <Pause className="w-4 h-4 text-red-500" /> PAUSE
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-950/40 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4" /> PLAY REPLAY
              </button>
            )}

            {/* Speed Multipliers */}
            <div className="flex rounded-xl bg-black p-1 border border-zinc-800 text-xs font-mono">
              {[0.5, 1.0, 2.0, 4.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${speed === s ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrubbing Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-300">
            <span>FRAME: {currentFrameIdx + 1} / {totalFrames}</span>
            <span>MISSION TIME: {currentFrame ? `${currentFrame.mission_time_sec.toFixed(0)}s` : '0s'}</span>
          </div>
          <input
            type="range"
            min="0"
            max={totalFrames - 1}
            value={currentFrameIdx}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>
      </div>

      {/* Synchronized Telemetry State at this Replay Frame */}
      {currentFrame && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              REPLAY ROTATIONAL SPEED
            </span>
            <div className="text-2xl font-black text-white">
              {tel?.rpm?.toFixed(0)} <span className="text-xs text-zinc-400 font-sans">RPM</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Throttle: {tel?.throttle_pct}%</p>
          </div>

          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              REPLAY WINDING TEMP
            </span>
            <div className="text-2xl font-black text-red-400">
              {tel?.temperature_c?.toFixed(1)} <span className="text-xs text-zinc-400 font-sans">°C</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Current: {tel?.current_a?.toFixed(1)}A</p>
          </div>

          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              REPLAY HEALTH INDEX
            </span>
            <div className="text-2xl font-black text-white">
              {health?.health_index?.toFixed(1)}%
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Band: <strong className="text-red-400">{health?.health_band}</strong></p>
          </div>

          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              REPLAY RUL ESTIMATE
            </span>
            <div className="text-2xl font-black text-white">
              {health?.rul_hours?.toFixed(1)} <span className="text-xs text-zinc-400 font-sans">HRS</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Fault: <strong className="text-white">{health?.predicted_fault}</strong></p>
          </div>
        </div>
      )}

      {/* Frame Diagnostic Summary */}
      {health && (
        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Replay Frame AI Diagnostics & Maintenance Action
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-black rounded-xl border border-zinc-800">
              <span className="font-bold text-red-400 block mb-1">XAI REASONING:</span>
              <p className="text-zinc-200 leading-relaxed font-medium">{health.xai_why}</p>
            </div>
            <div className="p-4 bg-black rounded-xl border border-zinc-800">
              <span className="font-bold text-white block mb-1">PRESCRIBED MAINTENANCE ACTION:</span>
              <p className="text-zinc-200 leading-relaxed font-medium">{health.maintenance_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
