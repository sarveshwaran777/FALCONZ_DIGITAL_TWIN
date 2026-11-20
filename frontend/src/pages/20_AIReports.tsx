import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, Plus, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const AIReportsPage: React.FC = () => {
  const { showToast, openUpgradeModal } = useAppStore();
  const [reports, setReports] = useState<any[]>([]);
  const [reportType, setReportType] = useState<string>('PROPULSION_HEALTH');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);

  const reportTypes = [
    { value: 'PROPULSION_HEALTH', label: 'Propulsion Health & Degradation Audit' },
    { value: 'FLIGHT_PERFORMANCE', label: 'Flight Performance & Electrical Efficiency' },
    { value: 'MOTOR_FAILURE', label: 'Motor Subsystem Failure Analysis' },
    { value: 'PREDICTIVE_MAINTENANCE', label: 'Predictive Maintenance Work Order' },
    { value: 'RUL_FORECAST', label: 'Quantile RUL Prognostic Certificate' },
    { value: 'ANOMALY_DETECTION', label: 'Isolation Forest Anomaly Dossier' },
    { value: 'COMPLETE_DIAGNOSTIC', label: 'Complete Propulsion Engineering Diagnostic' }
  ];

  const fetchReports = async () => {
    try {
      const data = await api.getReports();
      if (Array.isArray(data)) setReports(data);
    } catch {}
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const title = reportTitle.trim() || undefined;
      const res = await api.generateReport(reportType, title);
      if (res && res.status === 'SUCCESS') {
        showToast('Engineering PDF generated successfully!', 'success');
        setReportTitle('');
        fetchReports();
      } else if (res.detail?.error === 'QUOTA_EXCEEDED') {
        openUpgradeModal(
          'Automated Engineering PDF Reports',
          'PROFESSIONAL',
          res.detail.message
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Error generating report', 'error');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border bg-[#09090b] border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30">
              REPORTLAB ENGINE V5.0
            </span>
            <span className="text-xs text-zinc-400 font-mono">Total: {reports.length} Generated</span>
          </div>
          <h1 className="text-2xl font-black flex items-center gap-2.5 text-white">
            <FileText className="w-6 h-6 text-red-500" />
            AI Automated Engineering Reports
          </h1>
          <p className="text-xs text-zinc-300 mt-1 font-medium">
            Generate and export certified publication-grade aerospace PDF reports with telemetry, residuals & technician SOP checklists.
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="p-6 rounded-2xl border bg-[#09090b] border-zinc-800">
        <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-white">
          <Sparkles className="w-4 h-4 text-red-500" />
          Generate New Aerospace Diagnostic Report
        </h2>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-white">Report Architecture</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-800 text-xs focus:outline-none focus:border-red-500 font-bold bg-black text-white"
            >
              {reportTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-white">Custom Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Flight 104 - Thermal Benchmark"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-800 text-xs focus:outline-none focus:border-red-500 font-bold bg-black text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-xl font-black text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Compiling ReportLab PDF...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Generate Certified PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reports Archive */}
      <div className="rounded-2xl border overflow-hidden bg-[#09090b] border-zinc-800">
        <div className="px-6 py-4 border-b border-zinc-800 font-bold text-sm text-white flex items-center justify-between">
          <span>Generated Reports Archive</span>
          <span className="text-xs font-mono text-zinc-400 font-bold">{reports.length} PDF Documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5 text-white font-bold">Report Title</th>
                <th className="px-4 py-3.5 text-white font-bold">Type</th>
                <th className="px-4 py-3.5 text-white font-bold">File Size</th>
                <th className="px-4 py-3.5 text-white font-bold">Status</th>
                <th className="px-4 py-3.5 text-white font-bold">Date</th>
                <th className="px-5 py-3.5 text-right text-white font-bold">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-bold text-white font-sans">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{r.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-300 font-mono text-[11px] font-bold">{r.report_type}</td>
                  <td className="px-4 py-4 text-white font-mono text-[11px] font-bold">
                    {(r.file_size_bytes / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-white border border-zinc-700">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-300 font-mono text-[11px]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={r.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

