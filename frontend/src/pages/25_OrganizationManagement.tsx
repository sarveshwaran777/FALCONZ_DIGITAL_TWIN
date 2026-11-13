import React, { useState, useEffect } from 'react';
import { Building2, UserPlus, Trash2, Mail, Shield, X, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const OrganizationManagementPage: React.FC = () => {
  const { currentPlan, showToast } = useAppStore();
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('ENGINEER');

  const fetchData = async () => {
    try {
      const [o, m] = await Promise.all([
        api.getCurrentOrg(),
        api.getOrgMembers()
      ]);
      setOrg(o);
      if (Array.isArray(m)) setMembers(m);
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    try {
      const res = await api.inviteOrgMember(inviteEmail, inviteName, inviteRole);
      if (res.status === 'SUCCESS') {
        showToast(res.message, 'success');
        setModalOpen(false);
        setInviteEmail('');
        setInviteName('');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error inviting member', 'error');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this team member from organization?')) return;
    try {
      const res = await api.removeOrgMember(memberId);
      showToast(res.message, 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error removing member', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              RBAC TEAM GOVERNANCE
            </span>
            <span className="text-xs text-slate-400">Organization: {org?.name || 'AeroPropulsion Labs'}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text)' }}>
            <Building2 className="w-6 h-6 text-purple-500" />
            Organization & Team Members
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Manage multi-tenant engineering seats, technician credentials, and role-based permissions.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Invite Team Member
        </button>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="px-6 py-4 border-b font-bold text-sm flex items-center justify-between" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
          <span>Active Team Seats ({members.length})</span>
          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">{org?.plan_code || currentPlan} TIER</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider font-bold" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-semibold text-white">{m.full_name}</td>
                  <td className="px-4 py-4 text-slate-300 font-mono text-[11px]">{m.email}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Invite Team Member</h3>
            <p className="text-xs text-slate-400 mb-5">
              Dispatches an automated credential link to access the GCS telemetry and AI copilot workspace.
            </p>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight Line Specialist"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. specialist@company.aero"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role / Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ORG_ADMIN">Organization Admin (Full Control & Billing)</option>
                  <option value="ENGINEER">Propulsion Engineer (Analysis & Flight Ingress)</option>
                  <option value="TECHNICIAN">Line Technician (Calibration & Maintenance SOPs)</option>
                  <option value="VIEWER">Read-Only Viewer (Telemetry HUD Observer)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

