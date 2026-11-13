import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, DollarSign, Users, Activity, Sliders, 
  FileText, CheckCircle2, AlertTriangle, RefreshCw, Save 
} from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const SuperAdminCenterPage: React.FC = () => {
  const { showToast } = useAppStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdminData = async () => {
    try {
      const [m, u, p, a] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminPlans(),
        api.getAdminAuditLogs()
      ]);
      setMetrics(m);
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(p)) setPlans(p);
      if (Array.isArray(a)) setAuditLogs(a);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.updateAdminUserRole(userId, newRole);
      showToast(res.message, 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error updating role', 'error');
    }
  };

  const handlePlanPriceSave = async (planId: string, monthly: number, yearly: number) => {
    try {
      const res = await api.updateAdminPlan(planId, {
        price_monthly_inr: monthly,
        price_yearly_inr: yearly
      });
      showToast(res.message, 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error updating plan', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              RESTRICTED // ROOT ACCESS ONLY
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            Super Admin Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time SaaS recurring revenue metrics, subscription plan pricing overrides, user permissions and security audit trail.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border bg-white/5 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Monthly Recurring Revenue</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono block">
            ₹{metrics?.monthly_recurring_revenue_inr?.toLocaleString('en-IN') || '0'}
          </span>
          <span className="text-[10px] text-slate-500">Active Paid Subscriptions</span>
        </div>

        <div className="p-5 rounded-2xl border bg-white/5 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Annual Run Rate (ARR)</span>
          <span className="text-2xl font-extrabold text-cyan-400 font-mono block">
            ₹{metrics?.annual_recurring_revenue_inr?.toLocaleString('en-IN') || '0'}
          </span>
          <span className="text-[10px] text-slate-500">Projected Run Rate</span>
        </div>

        <div className="p-5 rounded-2xl border bg-white/5 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Total Operators</span>
          <span className="text-2xl font-extrabold text-white font-mono block">
            {metrics?.total_users || 0}
          </span>
          <span className="text-[10px] text-purple-400 font-mono font-bold">
            {metrics?.paid_subscribers || 0} Paid | {metrics?.free_users || 0} Free
          </span>
        </div>

        <div className="p-5 rounded-2xl border bg-white/5 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Registered Drones</span>
          <span className="text-2xl font-extrabold text-white font-mono block">
            {metrics?.total_registered_drones || 0}
          </span>
          <span className="text-[10px] text-slate-500">Across {metrics?.active_organizations || 0} Organizations</span>
        </div>
      </div>

      {/* Plan Pricing Overrides */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            Configurable SaaS Plans & Feature Entitlements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Plan Name</th>
                <th className="px-4 py-3.5">Code</th>
                <th className="px-4 py-3.5">Monthly (INR)</th>
                <th className="px-4 py-3.5">Yearly (INR)</th>
                <th className="px-4 py-3.5">Max Drones</th>
                <th className="px-4 py-3.5">AI Limit</th>
                <th className="px-4 py-3.5">Reports</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-semibold text-white font-sans">{p.name}</td>
                  <td className="px-4 py-4 text-purple-400 font-bold">{p.code}</td>
                  <td className="px-4 py-4 text-white">₹{p.price_monthly_inr}</td>
                  <td className="px-4 py-4 text-white">₹{p.price_yearly_inr}</td>
                  <td className="px-4 py-4 text-slate-300">{p.max_drones}</td>
                  <td className="px-4 py-4 text-slate-300">{p.ai_queries_limit}</td>
                  <td className="px-4 py-4 text-slate-300">{p.reports_limit}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handlePlanPriceSave(p.id, p.price_monthly_inr, p.price_yearly_inr)}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-white font-sans font-semibold text-xs"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Governance Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            User Identity & Role Permissions
          </span>
          <span className="text-xs font-mono text-slate-500 font-normal">{users.length} Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Full Name</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Update Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-semibold text-white font-sans">{u.full_name}</td>
                  <td className="px-4 py-4 text-slate-300">{u.email}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-emerald-400">
                    {u.is_active ? 'ACTIVE' : 'DISABLED'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-white focus:outline-none"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ORG_ADMIN">ORG_ADMIN</option>
                      <option value="ENGINEER">ENGINEER</option>
                      <option value="TECHNICIAN">TECHNICIAN</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
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
