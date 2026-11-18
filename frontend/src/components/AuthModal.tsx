import React, { useState } from 'react';
import { 
  X, Lock, Mail, User, Building2, Shield, Eye, EyeOff, 
  ArrowRight, Sparkles, CheckCircle2, AlertTriangle, KeyRound
} from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, closeAuthModal, authModalMode, setAuthModalMode, 
    setToken, setCurrentUser, setCurrentPlan, showToast 
  } = useAppStore();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState<boolean>(false);

  if (!authModalOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPass || password;

    try {
      const res = await api.login(loginEmail, loginPassword);
      if (res.access_token) {
        setToken(res.access_token);
        if (res.user) {
          const userObj: any = {
            id: res.user.id,
            email: res.user.email,
            full_name: res.user.full_name,
            role: res.user.role,
            organization: res.organization
          };
          setCurrentUser(userObj);
          if (res.organization?.plan_code) {
            setCurrentPlan(res.organization.plan_code);
          }
        }
        showToast(`Welcome back, ${res.user?.full_name || 'Commander'}!`, 'success');
        closeAuthModal();
      } else {
        setErrorMessage(res.detail || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the authentication server.');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await api.register(email, password, fullName, orgName || undefined);
      if (res.access_token) {
        setToken(res.access_token);
        if (res.user) {
          const userObj: any = {
            id: res.user.id,
            email: res.user.email,
            full_name: res.user.full_name,
            role: res.user.role,
            organization: res.organization
          };
          setCurrentUser(userObj);
          if (res.organization?.plan_code) {
            setCurrentPlan(res.organization.plan_code);
          }
        }
        showToast(`Account created successfully! Welcome to FALCONZ, ${res.user?.full_name}!`, 'success');
        closeAuthModal();
      } else {
        setErrorMessage(res.detail || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration service unavailable.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setForgotSent(true);
      showToast('Password reset link dispatched.', 'info');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process reset request.');
    }
    setLoading(false);
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeInUp">
      <div 
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col relative"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b text-center relative" style={{ borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-600/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            FALCONZ Ground Control Station
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {authModalMode === 'LOGIN' && 'Sign in to access real-time propulsion telemetry & AI Copilot'}
            {authModalMode === 'REGISTER' && 'Create your aerospace engineering workspace & drone fleet'}
            {authModalMode === 'FORGOT' && 'Dispatch security recovery link for operator credentials'}
          </p>

          {/* Mode Switcher Tabs */}
          {authModalMode !== 'FORGOT' && (
            <div 
              className="flex items-center p-1 rounded-xl border mt-4 text-xs font-semibold"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={() => { setAuthModalMode('LOGIN'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authModalMode === 'LOGIN'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Operator Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthModalMode('REGISTER'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authModalMode === 'REGISTER'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 pt-4 space-y-4">
          
          {/* TAB 1: LOGIN FORM */}
          {authModalMode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Operator Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@falconz.aero"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setAuthModalMode('FORGOT'); setErrorMessage(null); setForgotSent(false); }}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all mt-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : <ArrowRight className="w-4 h-4" />}
                <span>{loading ? 'Authenticating...' : 'Sign In to Flight Station'}</span>
              </button>

              {/* Quick Demo Logins Box */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block text-center mb-2">
                  ⚡ 1-Click Evaluation Credentials:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('admin@falconz.aero', 'Admin@Falconz2026')}
                    className="p-2 rounded-xl border text-left hover:border-purple-500 hover:bg-purple-500/5 transition-all text-[11px]"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="font-bold text-slate-900 dark:text-white">Super Admin</div>
                    <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono truncate">admin@falconz.aero</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('engineer@falconz.aero', 'Falconz@Engineer2026')}
                    className="p-2 rounded-xl border text-left hover:border-purple-500 hover:bg-purple-500/5 transition-all text-[11px]"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="font-bold text-slate-900 dark:text-white">Lead Engineer</div>
                    <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono truncate">engineer@falconz.aero</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {authModalMode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Flight Test Specialist"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Organization / Fleet Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. AeroDynamics Labs"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="specialist@company.aero"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Security Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password || !fullName}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all mt-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Creating Account...' : 'Create Account & Launch Workspace'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {authModalMode === 'FORGOT' && (
            <div className="space-y-4 text-xs">
              {forgotSent ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold">Recovery Dispatch Completed</p>
                  <p className="text-[11px] leading-relaxed">
                    If an account exists for <strong className="font-mono">{email}</strong>, a secure password recovery dispatch has been logged.
                  </p>
                  <button
                    onClick={() => { setAuthModalMode('LOGIN'); setForgotSent(false); }}
                    className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 underline"
                  >
                    Return to Operator Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Registered Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@falconz.aero"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs font-medium"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{loading ? 'Dispatching...' : 'Dispatch Reset Link'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('LOGIN')}
                      className="text-[11px] text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-medium"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
