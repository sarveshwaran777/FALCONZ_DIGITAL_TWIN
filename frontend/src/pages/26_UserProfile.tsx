import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, Shield, CheckCircle2, LogOut, Save } from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const UserProfilePage: React.FC = () => {
  const { currentUser, logout, showToast, refreshUser } = useAppStore();
  const [fullName, setFullName] = useState<string>(currentUser?.full_name || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [password, setPassword] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { full_name: fullName, email };
      if (password.trim()) payload.password = password;

      const res = await api.updateProfile(payload);
      if (res.status === 'SUCCESS') {
        showToast('Profile updated successfully', 'success');
        setPassword('');
        refreshUser();
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            OPERATOR CREDENTIALS
          </span>
          <span className="text-xs text-slate-400 font-mono">ID: {currentUser?.id || 'N/A'}</span>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text)' }}>
          <UserIcon className="w-6 h-6 text-purple-500" />
          User Profile & Security Settings
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          Manage your aerospace engineer profile, security keys, authentication credentials, and session state.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Identity Summary */}
        <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-2xl mx-auto">
            {currentUser?.full_name?.charAt(0) || 'A'}
          </div>

          <div className="text-center">
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{currentUser?.full_name || 'Aerospace Engineer'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{currentUser?.email}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold mt-2">
              <Shield className="w-3 h-3" />
              {currentUser?.role || 'ENGINEER'}
            </div>
          </div>

          <div className="pt-4 border-t space-y-2 text-xs" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Organization:</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{currentUser?.organization?.name || 'AeroPropulsion Labs'}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Email Verified:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> YES
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session (Log Out)
          </button>
        </div>

        {/* Right: Profile Edit Form */}
        <div className="md:col-span-2 p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Save className="w-4 h-4 text-purple-500" />
            Update Account Details
          </h3>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Registered Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                New Password (Leave blank to keep unchanged)
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

