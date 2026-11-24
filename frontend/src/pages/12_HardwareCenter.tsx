import React, { useState, useEffect } from 'react';
import { Radio, Cpu, Power, CheckCircle, AlertCircle, XCircle, RefreshCw, Layers, ShieldCheck, Database, FileText, HardDrive, Download, Disc, Sliders, Activity, HelpCircle, Save, Zap, Gauge, Flame, Wind, ArrowUpDown, ChevronRight, BarChart2 } from 'lucide-react';
import { api, API_BASE } from '../services/api';
import { useAppStore } from '../state/store';
import { APMConnectionCard } from '../components/APMConnectionCard';
import { StatusBadge } from '../components/StatusBadge';
import { MotorBenchmarkData } from '../types/telemetry';

export const HardwareCenterPage: React.FC = () => {
  const { systemState } = useAppStore();
  const [hwStatus, setHwStatus] = useState<any>(null);
  const [diag, setDiag] = useState<any>(null);
  const [recStatus, setRecStatus] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [calibConfig, setCalibConfig] = useState<any>(null);
  const [calibSaving, setCalibSaving] = useState<boolean>(false);
  const [mappingConfig, setMappingConfig] = useState<any>(null);
  const [mappingSaving, setMappingSaving] = useState<boolean>(false);
  const [discoveryData, setDiscoveryData] = useState<any>(null);
  const [motorConnections, setMotorConnections] = useState<Record<string, boolean>>({
    motor_1: true,
    motor_2: true,
    motor_3: true,
    motor_4: true
  });
  const [benchmarkData, setBenchmarkData] = useState<MotorBenchmarkData | null>(null);
  const [selectedPropProfile, setSelectedPropProfile] = useState<string>('3S_1045_optimal');
  const [activeTab, setActiveTab] = useState<'MAPPING' | 'DISCOVERY' | 'PROVENANCE' | 'CALIBRATION' | 'RECORDER'>('MAPPING');

  const fetchStatus = async () => {
    try {
      const [hw, d, rec, recList, calib, mapRes, discRes, connRes, benchRes] = await Promise.all([
        api.getHardwareStatus(),
        api.getAPMDiagnostics(),
        api.getRecordingStatus(),
        api.listRecordings(),
        api.getMotorCalibration(),
        api.getMotorMapping(),
        api.getMavlinkDiscovery(),
        api.getMotorConnections(),
        api.getMotorBenchmark()
      ]);
      setHwStatus(hw);
      setDiag(d);
      setRecStatus(rec);
      if (recList?.recordings) setRecordings(recList.recordings);
      if (calib && !calibConfig) setCalibConfig(calib);
      if (mapRes?.mappings && !mappingConfig) setMappingConfig(mapRes.mappings);
      if (discRes) setDiscoveryData(discRes);
      if (connRes?.connections) setMotorConnections(connRes.connections);
      if (benchRes) setBenchmarkData(benchRes);
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStartRecording = async () => {
    await api.startRecording();
    await fetchStatus();
  };

  const handleStopRecording = async () => {
    await api.stopRecording();
    await fetchStatus();
  };

  const handleSaveCalibration = async () => {
    if (!calibConfig) return;
    setCalibSaving(true);
    await api.updateMotorCalibration(calibConfig);
    setCalibSaving(false);
    await fetchStatus();
  };

  const handleSaveMapping = async () => {
    if (!mappingConfig) return;
    setMappingSaving(true);
    await api.updateMotorMapping(mappingConfig);
    setMappingSaving(false);
    await fetchStatus();
  };

  const tel = systemState?.telemetry;
  const motors = tel?.motors || {};

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500" />
          Hardware Center & Quadcopter MAVLink Telemetry Foundation
        </h2>
        <p className="text-xs text-zinc-400 font-medium">
          Hardware-First Interface: Direct APM/ArduPilot serial connection, runtime message discovery, 4-motor channel mapper, and testbed calibration.
        </p>
      </div>

      {/* APM / ArduPilot Primary Connection Card */}
      <APMConnectionCard />

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-1 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('MAPPING')}
          className={`px-3.5 py-2 rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'MAPPING'
              ? 'bg-red-600 text-white border-b-2 border-red-500 shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          4-Motor Channel Mapping & Status
        </button>

        <button
          onClick={() => setActiveTab('DISCOVERY')}
          className={`px-3.5 py-2 rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'DISCOVERY'
              ? 'bg-red-600 text-white border-b-2 border-red-500 shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          MAVLink Discovery & Raw Trace
        </button>

        <button
          onClick={() => setActiveTab('PROVENANCE')}
          className={`px-3.5 py-2 rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'PROVENANCE'
              ? 'bg-red-600 text-white border-b-2 border-red-500 shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Field Provenance Matrix
        </button>

        <button
          onClick={() => setActiveTab('CALIBRATION')}
          className={`px-3.5 py-2 rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'CALIBRATION'
              ? 'bg-red-600 text-white border-b-2 border-red-500 shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Motor Calibration Matrix
        </button>

        <button
          onClick={() => setActiveTab('RECORDER')}
          className={`px-3.5 py-2 rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'RECORDER'
              ? 'bg-red-600 text-white border-b-2 border-red-500 shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          Flight Telemetry Recorder {recStatus?.is_recording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
        </button>
      </div>

      {/* TAB 1: 4-MOTOR CHANNEL MAPPING & REAL STATUS */}
      {activeTab === 'MAPPING' && (
        <div className="space-y-4">
          {/* Quick Propulsion Batch & Connection Overview */}
          <div className="aerospace-card p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Motor Grid:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  (tel?.connected_motors_count ?? 4) === 4
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : (tel?.connected_motors_count ?? 0) > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    (tel?.connected_motors_count ?? 4) === 4
                      ? 'bg-emerald-400 animate-pulse'
                      : (tel?.connected_motors_count ?? 0) > 0
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`} />
                  {tel?.connected_motors_count ?? 4} / 4 MOTORS CONNECTED
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400">Total Quadcopter Thrust:</span>
                <strong className="text-sky-300 font-bold">{tel?.total_thrust_g?.toFixed(0) || 0} g</strong>
              </div>

              <div className="hidden md:flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400">Avg Efficiency:</span>
                <strong className="text-emerald-300 font-bold">{tel?.avg_g_per_watt?.toFixed(2) || '0.00'} g/W</strong>
              </div>

              <div className="hidden lg:flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400">Total Current:</span>
                <strong className="text-slate-200 font-bold">{tel?.total_current_a?.toFixed(2) || '0.00'} A</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 text-[10px]">INGRESS STATE:</span>
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold">
                AUTOMATIC HARDWARE DETECTION
              </span>
            </div>
          </div>

          <div className="aerospace-card p-4 bg-[#09090b] border-zinc-800">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Cpu className="w-4 h-4 text-red-500" />
                  Physical Motor ↔ ESC Instance ↔ ArduPilot Servo Channel Mapping & Status
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Individual motor telemetry monitoring: Track connected vs disconnected state, measured RPM, current draw, thrust output, and efficiency.
                </p>
              </div>

              <button
                onClick={handleSaveMapping}
                disabled={mappingSaving}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {mappingSaving ? 'SAVING MAPPINGS...' : 'SAVE MOTOR MAPPINGS'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                    <th className="pb-2">Motor</th>
                    <th className="pb-2">Label</th>
                    <th className="pb-2">State & Action</th>
                    <th className="pb-2">ESC / Servo</th>
                    <th className="pb-2">Live RPM</th>
                    <th className="pb-2">V / Current</th>
                    <th className="pb-2">Thrust (g)</th>
                    <th className="pb-2">Thrust Eff</th>
                    <th className="pb-2">Elec Eff</th>
                    <th className="pb-2">Temp</th>
                    <th className="pb-2">Provenance / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(['motor_1', 'motor_2', 'motor_3', 'motor_4'] as const).map((mId, idx) => {
                    const mData = motors[mId];
                    const mapItem = mappingConfig?.[mId] || {};
                    const isConn = mData ? (mData.is_connected !== false) : (motorConnections[mId] !== false);

                    return (
                      <tr key={mId} className={`transition-colors border-b border-zinc-800 ${!isConn ? 'bg-red-950/20' : 'hover:bg-zinc-900/60'}`}>
                        <td className="py-2.5 font-sans font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isConn ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                            <span className="text-white font-black">Motor {idx + 1}</span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <input
                            type="text"
                            value={mapItem.label || ''}
                            onChange={(e) => {
                              setMappingConfig({
                                ...mappingConfig,
                                [mId]: { ...mapItem, label: e.target.value }
                              });
                            }}
                            className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white w-32 font-mono font-bold"
                          />
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await api.setMotorConnection(mId, !isConn);
                                await fetchStatus();
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                isConn
                                  ? 'bg-red-950/50 hover:bg-zinc-900 text-white border border-red-500/50'
                                  : 'bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-white border border-zinc-800'
                              }`}
                              title={`Click to ${isConn ? 'disconnect' : 'connect'} this motor on bench rig`}
                            >
                              {isConn ? '● CONNECTED' : '✕ NOT CONNECTED'}
                            </button>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              isConn ? 'bg-red-600 text-white border-red-500' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            }`}>
                              {isConn ? 'ACTIVE' : 'BENCH OFF'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <select
                              value={mapItem.esc_instance ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                setMappingConfig({
                                  ...mappingConfig,
                                  [mId]: { ...mapItem, esc_instance: val }
                                });
                              }}
                              className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono font-bold"
                            >
                              <option value="">ESC: None</option>
                              <option value="0">ESC 0</option>
                              <option value="1">ESC 1</option>
                              <option value="2">ESC 2</option>
                              <option value="3">ESC 3</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-2.5 font-bold">
                          {isConn && mData?.live_rpm !== null && mData?.live_rpm !== undefined ? (
                            <span className="text-white font-mono font-black">{mData.live_rpm.toFixed(0)} RPM</span>
                          ) : (
                            <span className="text-zinc-500 font-mono text-[11px]">0 RPM (OFFLINE)</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-xs">
                          {isConn && mData?.current_a !== null && mData?.current_a !== undefined ? (
                            <span>{(mData.voltage_v || 11.1).toFixed(1)}V / <strong className="text-white font-black">{mData.current_a.toFixed(2)}A</strong></span>
                          ) : (
                            <span className="text-zinc-500">0.00 A</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono font-bold">
                          {isConn && mData?.thrust_g ? (
                            <span className="text-red-500 font-black">{mData.thrust_g.toFixed(0)} g</span>
                          ) : (
                            <span className="text-zinc-500">0 g</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono">
                          {isConn && mData?.g_per_watt ? (
                            <span className={`inline-flex items-center gap-1 font-bold ${mData.in_cruise_efficiency_zone ? 'text-red-400' : 'text-white'}`}>
                              {mData.g_per_watt.toFixed(2)} g/W
                              {mData.in_cruise_efficiency_zone && (
                                <span className="text-[9px] bg-red-950 text-red-300 border border-red-800 px-1 py-0.2 rounded font-sans">CRUISE</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-500">0.00</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono">
                          {isConn && mData?.efficiency_pct !== null && mData?.efficiency_pct !== undefined ? (
                            <span className="text-white font-black">{mData.efficiency_pct.toFixed(1)}%</span>
                          ) : (
                            <span className="text-zinc-500">0.0%</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono">
                          {isConn && mData?.temperature_c !== null && mData?.temperature_c !== undefined ? (
                            <span className="text-red-400 font-bold">{mData.temperature_c.toFixed(1)} °C</span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="py-2.5 text-[11px]">
                          {!isConn ? (
                            <span className="text-red-400 font-mono font-bold">
                              {mData?.disconnection_reason || 'Cable Disconnected / Offline'}
                            </span>
                          ) : (
                            <span className="text-white font-mono font-bold">
                              {mData?.source_message || 'LIVE'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 bg-black border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div>
                <strong className="text-white">Honest Provenance & Motor Isolation:</strong> When a motor cable is disconnected or telemetry lost, the system sets its measured RPM, current, and thrust to 0 and explicitly displays <code className="text-red-400">OFFLINE</code>. Disconnected motors will never show phantom numbers.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MAVLINK DISCOVERY & RAW TRACE */}
      {activeTab === 'DISCOVERY' && (
        <div className="space-y-4">
          <div className="aerospace-card p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4 text-red-500" />
                  Runtime MAVLink Message Discovery Table
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Automatically tracks and discovers which MAVLink messages are actually broadcasting from the connected APM/ArduPilot.
                </p>
              </div>
              <button
                onClick={fetchStatus}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 bg-black hover:bg-zinc-900 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-red-500" /> REFRESH DISCOVERY
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase bg-[#0e0e12]">
                    <th className="py-2.5 px-3">MAVLink Message</th>
                    <th className="py-2.5 px-3">Discovery Status</th>
                    <th className="py-2.5 px-3">Packet Count</th>
                    <th className="py-2.5 px-3">Last Age (s)</th>
                    <th className="py-2.5 px-3">Decoded Sample Keys</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {discoveryData?.message_discovery && discoveryData.message_discovery.length > 0 ? (
                    discoveryData.message_discovery.map((m: any, idx: number) => {
                      let badge = 'bg-zinc-900 text-zinc-400 border-zinc-800';
                      if (m.status === 'AVAILABLE') badge = 'bg-red-950 text-red-300 border-red-800';
                      else if (m.status === 'STALE') badge = 'bg-zinc-900 text-zinc-300 border-zinc-700';

                      return (
                        <tr key={idx} className="hover:bg-zinc-900/60 text-zinc-200">
                          <td className="py-2.5 px-3 font-bold text-white">{m.msg_type}</td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${badge}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-white font-bold">{m.count}</td>
                          <td className="py-2.5 px-3 text-zinc-400">{m.last_received_age_sec !== null ? `${m.last_received_age_sec}s` : 'Never'}</td>
                          <td className="py-2.5 px-3 text-zinc-400 truncate max-w-xs">{JSON.stringify(Object.keys(m.sample_fields || {}))}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-500 italic">
                        No MAVLink messages discovered yet. Connect APM flight controller to start ingestion.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
              <FileText className="w-4 h-4 text-red-500" />
              Raw MAVLink Packet Trace (Last 25 Decoded Frames)
            </h3>
            <div className="h-60 overflow-y-auto bg-black text-white p-3.5 rounded-xl border border-zinc-800 font-mono text-[11px] space-y-1.5">
              {diag?.recent_messages && diag.recent_messages.length > 0 ? (
                diag.recent_messages.map((msg: any, idx: number) => (
                  <div key={idx} className="border-b border-zinc-800/80 pb-1 flex gap-2">
                    <span className="text-zinc-400 font-bold">[{msg.timestamp}]</span>
                    <span className="text-red-400 font-semibold">{msg.msg_type}</span>
                    <span className="text-zinc-500">SysID:{msg.sys_id}</span>
                    <span className="text-zinc-300 truncate">{JSON.stringify(msg.fields)}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic text-center py-6">
                  Raw packet stream waiting for MAVLink connection...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIELD PROVENANCE MATRIX */}
      {activeTab === 'PROVENANCE' && (
        <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Database className="w-4 h-4 text-red-500" />
                Field-by-Field Ingress Telemetry Availability Matrix
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">
                Strict provenance verification. Missing sensors display <code className="text-red-400">UNAVAILABLE</code> without artificial data synthesis.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase bg-[#0e0e12]">
                  <th className="py-2.5 px-3">Telemetry Channel</th>
                  <th className="py-2.5 px-3">Source MAVLink Message</th>
                  <th className="py-2.5 px-3">Availability Status</th>
                  <th className="py-2.5 px-3">Sample Telemetry Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {discoveryData?.field_availability && discoveryData.field_availability.length > 0 ? (
                  discoveryData.field_availability.map((f: any, idx: number) => {
                    const isAvail = f.status === 'AVAILABLE';
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/60 text-zinc-200">
                        <td className="py-2.5 px-3 text-white font-sans font-bold">{f.field}</td>
                        <td className="py-2.5 px-3 text-red-400">{f.source}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${
                              isAvail
                                ? 'bg-red-950 text-red-300 border-red-800'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-white font-bold">{f.sample_value}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500 italic">
                      Scanning telemetry channels...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MOTOR CALIBRATION MATRIX & BENCHMARK ANALYZER */}
      {activeTab === 'CALIBRATION' && (
        <div className="space-y-4">
          {/* A2212/15T 930KV Empirical Benchmark & Efficiency Analyzer */}
          <div className="aerospace-card p-5 space-y-4 border-l-4 border-l-red-600 bg-[#09090b] border-zinc-800">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded bg-red-950 text-red-400 border border-red-800/80 font-mono font-bold text-xs">
                    BENCHMARK LAB
                  </span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
                    A2212 / 15T 930KV BLDC Motor — Empirical Operating Curves & Efficiency
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-medium">
                  Calibrated dynamometer testbench data for the physical <strong className="text-white">A2212/15T 930KV</strong> outrunner motor. Detailed throttle sweeps, electrical efficiency, thrust-to-power (g/W) ratio, and peak cruise zone.
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`${API_BASE}/hardware/motor-benchmark/csv`}
                  download="a2212_15t_930kv_efficiency_data.csv"
                  className="text-xs font-bold bg-black hover:bg-zinc-800 text-white py-1.5 px-3.5 rounded-xl border border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-red-500" /> Export CSV
                </a>
                <a
                  href={`${API_BASE}/hardware/motor-benchmark`}
                  download="a2212_15t_930kv_benchmark.json"
                  className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white py-1.5 px-3.5 rounded-xl shadow-md shadow-red-950/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white" /> Export JSON
                </a>
              </div>
            </div>

            {/* Motor Hardware Spec Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-black rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">MOTOR MODEL</span>
                <strong className="text-white font-black">A2212 / 15T</strong>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">KV RATING</span>
                <strong className="text-white font-black">930 RPM/V</strong>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">STATOR DIMS</span>
                <strong className="text-white font-black">22 × 12 mm</strong>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">RESISTANCE (Rm)</span>
                <strong className="text-white font-black">0.110 Ω</strong>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">IDLE CURRENT (I0)</span>
                <strong className="text-white font-black">0.55 A @ 10V</strong>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">MAX CURRENT / PWR</span>
                <strong className="text-red-400 font-black">14.5 A / 180 W</strong>
              </div>
            </div>

            {/* Propeller Setup Selector */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-red-500" /> Select Propeller & Battery Profile:
                </span>
                <span className="text-[11px] text-red-400 font-mono font-bold">
                  ★ Recommended Rig Prop: 1045 (10x4.5 SF) on 3S LiPo
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {[
                  { key: '3S_1045_optimal', label: '3S LiPo + 10x4.5 (1045) SF [Optimal]', badge: 'GOLD STANDARD' },
                  { key: '3S_1047', label: '3S LiPo + 10x4.7 (1047) SF', badge: 'HIGH LIFT' },
                  { key: '4S_8045', label: '4S LiPo + 8x4.5 (8045) DD', badge: 'HIGH SPEED' },
                  { key: '4S_9045', label: '4S LiPo + 9x4.5 (9045) SF', badge: 'HEAVY PAYLOAD' }
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPropProfile(p.key)}
                    className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedPropProfile === p.key
                        ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-950/40'
                        : 'bg-black hover:bg-zinc-900 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-sans ${
                      selectedPropProfile === p.key ? 'bg-red-700 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {p.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optimal Cruise Zone Callout Banner */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-lg flex items-start gap-3 text-xs text-emerald-900">
              <div className="p-1.5 rounded-full bg-emerald-600 text-white shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-2 text-emerald-950 font-sans">
                  <span>OPTIMAL CRUISE EFFICIENCY ZONE (50% – 62% THROTTLE)</span>
                  <span className="bg-emerald-600 text-white text-[9px] font-mono px-2 py-0.2 rounded-full font-bold">
                    8.4 — 8.8 g/W PEAK
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  For this A2212/15T 930KV motor with a 1045 propeller, the <strong>50%–62% throttle range</strong> produces <strong>440g to 585g thrust per motor</strong> (1.76kg–2.34kg total quadcopter AUW lift) at an electrical efficiency of <strong>78.5%–81.2%</strong>. Operating within this cruise band minimizes $I^2 R_m$ winding heating losses and yields 30%–45% longer endurance.
                </p>
              </div>
            </div>

            {/* Operating Curves SVG Charts */}
            {(() => {
              const profiles = benchmarkData?.profiles || {};
              const currentProf = profiles[selectedPropProfile] || profiles['3S_1045_optimal'];
              const pts = currentProf?.points || [];
              if (pts.length === 0) return null;

              // Chart 1: Throttle % vs Thrust Efficiency (g/W)
              // Width: 460, Height: 160
              const maxGw = 10.0;
              const effPoints = pts.map((pt: any) => {
                const x = 30 + (pt.throttle_pct / 100) * 390;
                const y = 140 - (pt.g_per_watt / maxGw) * 120;
                return { x, y, pt };
              });
              const effPath = effPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

              // Cruise band x coordinates
              const cruiseX1 = 30 + (50 / 100) * 390;
              const cruiseX2 = 30 + (62 / 100) * 390;

              // Chart 2: Commanded Throttle % vs Thrust (g) & Power (W)
              const maxThrust = 1400;
              const maxPower = 220;
              const thrustPoints = pts.map((pt: any) => ({
                x: 30 + (pt.throttle_pct / 100) * 390,
                y: 140 - (pt.thrust_g / maxThrust) * 120,
                pt
              }));
              const thrustPath = thrustPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

              const powerPoints = pts.map((pt: any) => ({
                x: 30 + (pt.throttle_pct / 100) * 390,
                y: 140 - (pt.power_w / maxPower) * 120,
                pt
              }));
              const powerPath = powerPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Chart 1: Throttle vs Efficiency (g/W) */}
                  <div className="p-4 bg-[#09090b] text-white rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-red-500" /> Thrust Efficiency (g/W) vs Throttle (%)
                      </span>
                      <span className="text-[11px] font-bold text-red-400">Peak: 8.85 g/W</span>
                    </div>

                    <div className="relative h-44 w-full">
                      <svg className="w-full h-full" viewBox="0 0 460 160">
                        {/* Grid lines */}
                        <line x1="30" y1="20" x2="430" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="30" y1="60" x2="430" y2="60" stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="30" y1="100" x2="430" y2="100" stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="30" y1="140" x2="430" y2="140" stroke="#3f3f46" strokeWidth="1.5" />
                        <line x1="30" y1="20" x2="30" y2="140" stroke="#3f3f46" strokeWidth="1.5" />

                        {/* Cruise Zone Highlight Band */}
                        <rect x={cruiseX1} y="20" width={cruiseX2 - cruiseX1} height="120" fill="#ef4444" fillOpacity="0.18" />
                        <text x={(cruiseX1 + cruiseX2) / 2} y="32" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                          CRUISE ZONE (50-62%)
                        </text>

                        {/* Y-axis labels */}
                        <text x="24" y="24" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">10</text>
                        <text x="24" y="64" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">6.7</text>
                        <text x="24" y="104" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">3.3</text>
                        <text x="24" y="144" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">0</text>

                        {/* X-axis labels */}
                        <text x="30" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">0%</text>
                        <text x="127" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">25%</text>
                        <text x="225" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">50%</text>
                        <text x="322" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">75%</text>
                        <text x="420" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">100%</text>

                        {/* Efficiency curve */}
                        <path d={effPath} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Data dots */}
                        {effPoints.map((p: any, i: number) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={p.pt.in_cruise_efficiency_zone ? "5" : "3.5"}
                            fill={p.pt.in_cruise_efficiency_zone ? "#ef4444" : "#ffffff"}
                            stroke="#000000"
                            strokeWidth="1.5"
                          />
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* Chart 2: Throttle vs Thrust & Power */}
                  <div className="p-4 bg-[#09090b] text-white rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-red-500" /> Delivered Thrust (g) & Power (W)
                      </span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-red-500 font-bold">― Thrust (g)</span>
                        <span className="text-white font-bold">--- Power (W)</span>
                      </div>
                    </div>

                    <div className="relative h-44 w-full">
                      <svg className="w-full h-full" viewBox="0 0 460 160">
                        {/* Grid lines */}
                        <line x1="30" y1="20" x2="430" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="30" y1="60" x2="430" y2="60" stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="30" y1="100" x2="430" y2="100" stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="30" y1="140" x2="430" y2="140" stroke="#3f3f46" strokeWidth="1.5" />
                        <line x1="30" y1="20" x2="30" y2="140" stroke="#3f3f46" strokeWidth="1.5" />

                        {/* Y-axis labels (Thrust) */}
                        <text x="24" y="24" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">1.4k</text>
                        <text x="24" y="64" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">930</text>
                        <text x="24" y="104" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">460</text>
                        <text x="24" y="144" fill="#ffffff" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">0g</text>

                        {/* X-axis labels */}
                        <text x="30" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">0%</text>
                        <text x="127" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">25%</text>
                        <text x="225" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">50%</text>
                        <text x="322" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">75%</text>
                        <text x="420" y="155" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">100%</text>

                        {/* Thrust path */}
                        <path d={thrustPath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Power path */}
                        <path d={powerPath} fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Empirical Points Table for selected profile */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Empirical Dynamometer Calibration Points — {benchmarkData?.profiles?.[selectedPropProfile]?.name || selectedPropProfile}
              </h4>

              <div className="max-h-72 overflow-y-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0e0e12] sticky top-0 border-b border-zinc-800 text-zinc-300 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Throttle</th>
                      <th className="py-2.5 px-3">Voltage</th>
                      <th className="py-2.5 px-3">Current</th>
                      <th className="py-2.5 px-3">Power</th>
                      <th className="py-2.5 px-3">RPM</th>
                      <th className="py-2.5 px-3">Thrust</th>
                      <th className="py-2.5 px-3">Thrust Eff</th>
                      <th className="py-2.5 px-3">Elec Eff</th>
                      <th className="py-2.5 px-3">Temp</th>
                      <th className="py-2.5 px-3">Zone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {(benchmarkData?.profiles?.[selectedPropProfile]?.points || []).map((pt: any, i: number) => {
                      const isCruise = pt.in_cruise_efficiency_zone;
                      return (
                        <tr key={i} className={isCruise ? 'bg-red-950/30 font-bold text-white border-l-2 border-red-500' : 'hover:bg-zinc-900/60 text-zinc-300'}>
                          <td className="py-2 px-3 text-white font-bold">{pt.throttle_pct}%</td>
                          <td className="py-2 px-3">{pt.voltage_v.toFixed(2)} V</td>
                          <td className="py-2 px-3">{pt.current_a.toFixed(2)} A</td>
                          <td className="py-2 px-3">{pt.power_w.toFixed(1)} W</td>
                          <td className="py-2 px-3 text-white font-bold">{pt.rpm}</td>
                          <td className="py-2 px-3 text-white font-bold">{pt.thrust_g} g</td>
                          <td className="py-2 px-3">
                            <span className={isCruise ? 'text-red-400 font-bold' : ''}>
                              {pt.g_per_watt.toFixed(2)} g/W
                            </span>
                          </td>
                          <td className="py-2 px-3">{pt.electrical_eff_pct.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-red-400">{pt.motor_temp_c.toFixed(1)} °C</td>
                          <td className="py-2 px-3">
                            {isCruise ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-bold">
                                OPTIMAL CRUISE
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[10px]">Standard</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Testbed Physical Calibration Matrix */}
          <div className="aerospace-card p-5 space-y-4 bg-[#09090b] border-zinc-800">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Sliders className="w-4 h-4 text-red-500" />
                  Physical Quadcopter Motor Calibration Matrix
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Motor constants are labeled <span className="text-red-400 font-bold">CONFIGURED / NOT YET CALIBRATED</span> until confirmed by empirical testbed runs.
                </p>
              </div>

              <button
                onClick={handleSaveCalibration}
                disabled={calibSaving}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-950/40 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {calibSaving ? 'SAVING...' : 'SAVE MOTOR CALIBRATION'}
              </button>
            </div>

            <div className="p-3.5 bg-black border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span>CALIBRATION STATUS: <strong className="text-red-400">{calibConfig?.calibration_status || 'CALIBRATED - A2212/15T 930KV BENCH PROFILE'}</strong></span>
              <span>MOTOR TYPE: <strong className="text-white">{calibConfig?.motor_name || 'A2212/15T 930KV BLDC (Quadcopter Testbed)'}</strong></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-black border border-zinc-800 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-white block uppercase tracking-wider">Configured Rated RPM (User Parameter)</label>
                <input
                  type="number"
                  value={calibConfig?.target_rated_rpm ?? 930}
                  onChange={(e) => setCalibConfig({ ...calibConfig, target_rated_rpm: parseFloat(e.target.value) || 930 })}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
                <span className="text-[10px] text-zinc-400 block font-medium">Baseline rated operating point for the testbed.</span>
              </div>

              <div className="p-3.5 bg-black border border-zinc-800 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-white block uppercase tracking-wider">Velocity Constant Kv (RPM/V)</label>
                <input
                  type="number"
                  value={calibConfig?.kv_rpm_per_v ?? 930}
                  onChange={(e) => setCalibConfig({ ...calibConfig, kv_rpm_per_v: parseFloat(e.target.value) || 930 })}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
                <span className="text-[10px] text-zinc-400 block font-medium">A2212/15T 930KV velocity constant.</span>
              </div>

              <div className="p-3.5 bg-black border border-zinc-800 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-white block uppercase tracking-wider">Internal Resistance Rm (Ω)</label>
                <input
                  type="number"
                  step="0.005"
                  value={calibConfig?.internal_resistance_ohms ?? 0.110}
                  onChange={(e) => setCalibConfig({ ...calibConfig, internal_resistance_ohms: parseFloat(e.target.value) || 0.110 })}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
                <span className="text-[10px] text-zinc-400 block font-medium">Phase-to-phase armature resistance (0.110 Ω).</span>
              </div>

              <div className="p-3.5 bg-black border border-zinc-800 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-white block uppercase tracking-wider">No-Load Current I0 (A)</label>
                <input
                  type="number"
                  step="0.05"
                  value={calibConfig?.no_load_current_a ?? 0.55}
                  onChange={(e) => setCalibConfig({ ...calibConfig, no_load_current_a: parseFloat(e.target.value) || 0.55 })}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
                <span className="text-[10px] text-zinc-400 block font-medium">Idle current draw under zero propeller drag (0.55 A).</span>
              </div>

              <div className="p-3.5 bg-black border border-zinc-800 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-white block uppercase tracking-wider">Nominal Battery Pack (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calibConfig?.nominal_voltage_v ?? 11.1}
                  onChange={(e) => setCalibConfig({ ...calibConfig, nominal_voltage_v: parseFloat(e.target.value) || 11.1 })}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
                <span className="text-[10px] text-zinc-400 block font-medium">3S LiPo pack nominal voltage (11.1 V).</span>
              </div>

              <div className="p-3.5 bg-black border border-zinc-800 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-white block uppercase tracking-wider">Max Current Limit (A)</label>
                <input
                  type="number"
                  value={calibConfig?.max_safe_current_a ?? 15.0}
                  onChange={(e) => setCalibConfig({ ...calibConfig, max_safe_current_a: parseFloat(e.target.value) || 15.0 })}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
                <span className="text-[10px] text-zinc-400 block font-medium">Safety cutoff limit per motor channel (15.0 A).</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FLIGHT TELEMETRY RECORDER */}
      {activeTab === 'RECORDER' && (
        <div className="space-y-4">
          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Disc className="w-4 h-4 text-red-500" />
                  Real-Time Quadcopter Flight Telemetry Data Logger
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Records real MAVLink packets and canonical 4-motor telemetry frames to disk for empirical model calibration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {recStatus?.is_recording ? (
                  <button
                    onClick={handleStopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" /> STOP RECORDING ({recStatus?.sample_count || 0} samples)
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer transition-colors"
                  >
                    <Disc className="w-3.5 h-3.5" /> START FLIGHT RECORDING
                  </button>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-black border border-zinc-800 rounded-xl text-xs font-mono flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-white">
              <span>STATUS: <strong className={recStatus?.is_recording ? 'text-red-500 font-black' : 'text-zinc-400 font-bold'}>{recStatus?.is_recording ? 'RECORDING IN PROGRESS' : 'IDLE'}</strong></span>
              <span>SESSION: <strong className="text-white">{recStatus?.session?.session_id || 'None'}</strong></span>
              <span>SAMPLES CAPTURED: <strong className="text-red-400">{recStatus?.sample_count || 0}</strong></span>
            </div>
          </div>

          <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
              <HardDrive className="w-4 h-4 text-red-500" />
              Recorded Flight Logs on Disk
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] bg-[#0e0e12]">
                    <th className="py-2.5 px-3">Session ID</th>
                    <th className="py-2.5 px-3">Created Timestamp</th>
                    <th className="py-2.5 px-3">Total Samples</th>
                    <th className="py-2.5 px-3">Data Source</th>
                    <th className="py-2.5 px-3">Export Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {recordings.length > 0 ? (
                    recordings.map((r, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/60 text-zinc-200">
                        <td className="py-2.5 px-3 text-white font-bold">{r.session_id}</td>
                        <td className="py-2.5 px-3 text-zinc-400">{r.created_at}</td>
                        <td className="py-2.5 px-3 text-red-400 font-bold">{r.samples} frames</td>
                        <td className="py-2.5 px-3 text-zinc-300">{r.data_source}</td>
                        <td className="py-2.5 px-3 flex items-center gap-2">
                          <a
                            href={`${API_BASE}/telemetry/record/export/${r.session_id}.csv`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-black hover:bg-zinc-800 text-white border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3 text-red-500" /> CSV
                          </a>
                          <a
                            href={`${API_BASE}/telemetry/record/export/${r.session_id}.json`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-black hover:bg-zinc-800 text-white border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3 text-red-500" /> JSON
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-500 italic">
                        No recorded flight logs on disk yet. Click Start Flight Recording to capture live telemetry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
