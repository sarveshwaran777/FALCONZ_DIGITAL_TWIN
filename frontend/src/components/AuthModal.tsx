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
        className="w-full max-w-md rounded-2xl border border-red-600/40 shadow-2xl overflow-hidden flex flex-col relative"
        style={{ background: '#09090b' }}
      >
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-zinc-800 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-700 to-red-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-red-900/40">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-white">
            FALCONZ Ground Control Station
          </h2>
          <p className="text-xs text-zinc-300 mt-1 max-w-xs mx-auto font-medium">
            {authModalMode === 'LOGIN' && 'Sign in to access real-time propulsion telemetry & AI Copilot'}
            {authModalMode === 'REGISTER' && 'Create your aerospace engineering workspace & drone fleet'}
            {authModalMode === 'FORGOT' && 'Dispatch security recovery link for operator credentials'}
          </p>

          {/* Mode Switcher Tabs */}
          {authModalMode !== 'FORGOT' && (
            <div 
              className="flex items-center p-1 rounded-xl border border-zinc-800 mt-4 text-xs font-semibold bg-black"
            >
              <button
                type="button"
                onClick={() => { setAuthModalMode('LOGIN'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authModalMode === 'LOGIN'
                    ? 'bg-red-600 text-white shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Operator Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthModalMode('REGISTER'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authModalMode === 'REGISTER'
                    ? 'bg-red-600 text-white shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 pt-4 space-y-4">
          
          {/* TAB 1: LOGIN FORM */}
          {authModalMode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white font-bold mb-1">
                  Operator Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@falconz.aero"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-xs font-medium bg-[#070709] text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white font-bold">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setAuthModalMode('FORGOT'); setErrorMessage(null); setForgotSent(false); }}
                    className="text-[11px] text-red-400 hover:text-red-300 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-xs font-medium bg-[#070709] text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-900/30 transition-all mt-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : <ArrowRight className="w-4 h-4" />}
                <span>{loading ? 'Authenticating...' : 'Sign In to Flight Station'}</span>
              </button>

              {/* Quick Demo Logins Box */}
              <div className="pt-3 border-t border-zinc-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold block text-center mb-2">
                  ⚡ 1-Click Evaluation Credentials:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('admin@falconz.aero', 'Admin@Falconz2026')}
                    className="p-2 rounded-xl border border-zinc-800 text-left hover:border-red-500 hover:bg-red-500/10 transition-all text-[11px] bg-black"
                  >
                    <div className="font-bold text-white">Super Admin</div>
                    <div className="text-[9.5px] text-zinc-400 font-mono truncate">admin@falconz.aero</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('engineer@falconz.aero', 'Falconz@Engineer2026')}
                    className="p-2 rounded-xl border border-zinc-800 text-left hover:border-red-500 hover:bg-red-500/10 transition-all text-[11px] bg-black"
                  >
                    <div className="font-bold text-white">Lead Engineer</div>
                    <div className="text-[9.5px] text-zinc-400 font-mono truncate">engineer@falconz.aero</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {authModalMode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-white font-bold mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Flight Test Specialist"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-xs font-medium bg-[#070709] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">
                  Organization / Fleet Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. AeroDynamics Labs"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-xs font-medium bg-[#070709] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="specialist@company.aero"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-xs font-medium bg-[#070709] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">
                  Security Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-xs font-medium bg-[#070709] text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password || !fullName}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-900/30 transition-all mt-2"
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
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-white space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="font-bold">Recovery Dispatch Completed</p>
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    If an account exists for <strong className="font-mono text-white">{email}</strong>, a secure password recovery dispatch has been logged.
                  </p>
                  <button
                    onClick={() => { setAuthModalMode('LOGIN'); setForgotSent(false); }}
                    className="mt-2 text-xs font-bold text-red-400 underline"
                  >
                    Return to Operator Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="block text-white font-bold mb-1">
                      Registered Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@falconz.aero"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-xs font-medium bg-[#070709] text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-900/30 transition-all"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{loading ? 'Dispatching...' : 'Dispatch Reset Link'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('LOGIN')}
                      className="text-[11px] text-zinc-400 hover:text-red-400 font-medium"
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
