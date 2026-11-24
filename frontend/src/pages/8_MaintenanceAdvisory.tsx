import React from 'react';
import { Wrench, AlertTriangle, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import { useAppStore } from '../state/store';
import { StatusBadge } from '../components/StatusBadge';

export const MaintenanceAdvisoryPage: React.FC = () => {
  const { systemState } = useAppStore();

  if (!systemState) return null;

  const intel = systemState.intelligence;

  const urgencyColors: Record<string, string> = {
    NONE: 'bg-zinc-800 text-white border-zinc-700',
    ROUTINE: 'bg-red-950/20 text-white border-red-800',
    SOON: 'bg-red-900/30 text-red-300 border-red-700',
    IMMEDIATE: 'bg-red-700 text-white border-red-600',
    CRITICAL: 'bg-red-600 text-white border-red-500 animate-pulse'
  };

  const inspectionChecklist = [
    { item: 'Motor Phase Resistance Balance Check', spec: '< 5% delta across U-V-W phases', tool: 'Digital Milli-Ohmmeter', required: intel.affected_subsystem.includes('Winding') || intel.affected_subsystem.includes('Phase') },
    { item: 'Rotor Radial & Axial Play / Dial Runout', spec: '< 0.05 mm total indicator reading', tool: 'Magnetic Base Dial Gauge', required: intel.affected_subsystem.includes('Bearing') || intel.affected_subsystem.includes('Rotor') },
    { item: 'Optical / Hall Pickup Lens Cleanliness', spec: 'Zero dust occlusion, 1.2mm air gap', tool: 'Optical Inspection Loupe', required: intel.affected_subsystem.includes('Sensor') },
    { item: 'Propeller Dynamic Balancing (1X Harmonic)', spec: '< 0.15g RMS unbalance at 6000 RPM', tool: 'Dynamic Balancer / Accelerometer', required: true },
    { item: 'ESC Inverter MOSFET Thermal Pad Inspection', spec: 'Uniform contact, no thermal discolouration', tool: 'FLIR Thermal Camera / Visual', required: intel.affected_subsystem.includes('ESC') || intel.affected_subsystem.includes('Thermal') },
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
          <Wrench className="w-5 h-5 text-red-500" />
          Predictive Maintenance Advisory & Ground Support Checklists
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Condition-based maintenance work orders synthesized from AI fault classification and physics residual drivers
        </p>
      </div>

      {/* Primary Work Order Banner */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800 border-l-4 border-l-red-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">
              CURRENT ACTIVE MAINTENANCE ACTION
            </span>
            <h3 className="text-lg font-black text-white">
              {intel.maintenance_action}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-md text-xs font-black border ${urgencyColors[intel.maintenance_urgency] || urgencyColors.NONE}`}>
              URGENCY: {intel.maintenance_urgency}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-black rounded-xl border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5 text-[10px] font-bold">AFFECTED SUBSYSTEM</span>
            <strong className="text-white text-sm font-black">{intel.affected_subsystem}</strong>
          </div>
          <div className="p-4 bg-black rounded-xl border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5 text-[10px] font-bold">ESTIMATED RISK LEVEL</span>
            <strong className="text-white text-sm font-black">{intel.maintenance_risk_level} Risk</strong>
          </div>
          <div className="p-4 bg-black rounded-xl border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5 text-[10px] font-bold">REMAINING LIFE TO OVERHAUL</span>
            <strong className="text-red-400 font-mono text-sm font-black">
              {intel.rul_hours !== null && intel.rul_hours !== undefined
                ? `${intel.rul_hours.toFixed(1)} Operating Hours`
                : 'PENDING SUFFICIENT DATA'}
            </strong>
          </div>
        </div>
      </div>

      {/* Ground Support Inspection Checklist */}
      <div className="aerospace-card p-5 bg-[#09090b] border-zinc-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Prescribed Ground Support Workshop Inspection Checklist
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-bold text-[11px] bg-black">
                <th className="py-2.5 px-3">INSPECTION ITEM</th>
                <th className="py-2.5 px-3">ACCEPTANCE CRITERIA</th>
                <th className="py-2.5 px-3">RECOMMENDED TOOL</th>
                <th className="py-2.5 px-3">PRIORITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {inspectionChecklist.map((chk, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white font-sans">{chk.item}</td>
                  <td className="py-2.5 px-3 text-zinc-300 font-medium">{chk.spec}</td>
                  <td className="py-2.5 px-3 text-white font-bold">{chk.tool}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      chk.required
                        ? 'bg-red-600 text-white border-red-700'
                        : 'bg-zinc-800 text-white border-zinc-700'
                    }`}>
                      {chk.required ? 'MANDATORY' : 'ROUTINE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory Disclaimer */}
      <div className="p-4 bg-black border border-zinc-800 rounded-xl text-[11px] text-zinc-300">
        <strong className="text-white">Aviation Decision Support Notice:</strong> Recommendations are prototype engineering health advisories designed for laboratory testbed decision support and academic demonstration, not certified civil aviation maintenance manuals (AMM).
      </div>
    </div>
  );
};
