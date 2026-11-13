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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              REPORTLAB ENGINE V5.0
            </span>
            <span className="text-xs text-slate-400">Total: {reports.length} Generated</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-400" />
            AI Automated Engineering Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate and export certified publication-grade aerospace PDF reports with telemetry, residuals & technician SOP checklists.
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Generate New Aerospace Diagnostic Report
        </h2>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Report Architecture</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {reportTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Flight 104 - Thermal Benchmark"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
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
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-white flex items-center justify-between">
          <span>Generated Reports Archive</span>
          <span className="text-xs font-mono text-slate-500 font-normal">{reports.length} PDF Documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Report Title</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">File Size</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{r.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-300 font-mono text-[11px]">{r.report_type}</td>
                  <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                    {(r.file_size_bytes / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={r.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
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
