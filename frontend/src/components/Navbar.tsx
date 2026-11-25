import React, { useState, useEffect } from 'react';
import { 
  Menu, Bell, Sun, Moon, Radio, Power, RefreshCw, 
  Sparkles, Bot, User as UserIcon, Shield, LogOut, KeyRound, ChevronDown, Check 
} from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { 
    theme, toggleTheme, toggleSidebar, activeAlerts, setAlertDrawerOpen, 
    systemState, currentUser, currentPlan, setActivePage, openAuthModal, logout,
    takeoff, land, groundReset
  } = useAppStore();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [diag, setDiag] = useState<any>(null);
  const [isConnectedLocally, setIsConnectedLocally] = useState<boolean>(false);
  const [ports, setPorts] = useState<any[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('COM3');
  const [customPort, setCustomPort] = useState<string>('');
  const [baudRate, setBaudRate] = useState<number>(57600);
  const [connType, setConnType] = useState<'SIM' | 'USB_SERIAL' | 'UDP'>('SIM');
  const [udpIp, setUdpIp] = useState<string>('0.0.0.0');
  const [udpPort, setUdpPort] = useState<number>(14550);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPortsAndDiag = async () => {
    try {
      const [p, d] = await Promise.all([api.getSerialPorts(), api.getAPMDiagnostics()]);
      if (p?.ports && Array.isArray(p.ports)) {
        setPorts(p.ports);
        if (p.ports.length > 0) {
          const names = p.ports.map((x: any) => x.port);
          if (!selectedPort || !names.includes(selectedPort)) {
            setSelectedPort(p.ports[0].port);
            const desc = (p.ports[0].description || '').toLowerCase();
            if (desc.includes('cp210') || desc.includes('radio') || desc.includes('3dr')) setBaudRate(57600);
          }
        }
      }
      if (d) {
        setDiag(d);
        if (d.apm_connection === 'CONNECTED') setIsConnectedLocally(true);
        else if (d.apm_connection === 'DISCONNECTED') setIsConnectedLocally(false);
      }
    } catch {}
  };

  useEffect(() => {
    fetchPortsAndDiag();
    const id = setInterval(fetchPortsAndDiag, 1500);
    return () => clearInterval(id);
  }, [selectedPort]);

  const isConnected = isConnectedLocally || diag?.apm_connection === 'CONNECTED';
  const heartbeatOk = diag?.heartbeat === 'RECEIVED';
  const isHardwareLive = isConnected && heartbeatOk;
  const isSimLive = systemState?.telemetry?.source_type === 'SIMULATION' || connType === 'SIM';
  const isArmed = Boolean(systemState?.telemetry?.is_armed);
  const liveThrottle = systemState?.telemetry?.throttle_pct ?? 0;
  const isOnGround = !isArmed || liveThrottle < 0.5;
  const isStreaming = isHardwareLive || isSimLive;
  const unread = activeAlerts.length;

  const handleSwitchToSim = async () => {
    setLoading(true);
    setConnType('SIM');
    try {
      await api.setTelemetrySource('SIMULATION' as any);
      setIsConnectedLocally(false);
      await fetchPortsAndDiag();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleConnect = async () => {
    const portTarget = customPort.trim() || selectedPort;
    if (connType === 'USB_SERIAL' && !portTarget) return;
    setLoading(true);
    try {
      const target = connType === 'UDP' ? `udpin:${udpIp}:${udpPort}` : portTarget;
      const res: any = await api.connectMAVLink(target, baudRate, connType);
      if (res?.success || res?.status === 'CONNECTED' || res?.status === 'CONNECTING') {
        await api.setTelemetrySource('APM_MAVLINK' as any);
        setIsConnectedLocally(true);
      }
      await fetchPortsAndDiag();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.disconnectMAVLink();
      await api.setTelemetrySource('SIMULATION' as any);
      setIsConnectedLocally(false);
      await fetchPortsAndDiag();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 shrink-0 px-3 sm:px-6 border-b select-none bg-[#09090b] border-zinc-800">
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        {/* LEFT — menu + brand + live */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={toggleSidebar} className="w-8 h-8 rounded-md flex items-center justify-center border border-zinc-800 bg-black text-white hover:border-red-500 cursor-pointer transition-colors" aria-label="Toggle menu">
            <Menu className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2.5 pl-3 ml-1 border-l cursor-pointer" onClick={() => setActivePage('overview')} style={{ borderColor: 'var(--border)' }}>
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-red-700 to-red-600 flex items-center justify-center shadow-sm shadow-red-900/40">
              <span className="text-[11px] font-black text-white tracking-widest">F</span>
            </div>
            <span className="text-[14px] font-black tracking-[0.16em] text-white">FALCONZ</span>
            <span className="hidden sm:inline text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              AERO-TWIN
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l text-xs" style={{ borderColor: 'var(--border)' }}>
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'animate-pulse' : ''}`} style={{ background: isHardwareLive ? '#ef4444' : (isSimLive && !isOnGround) ? '#ef4444' : '#22c55e' }} />
            <span className="font-semibold tracking-wide text-[11px]" style={{ color: isStreaming ? '#ffffff' : '#a1a1aa' }}>
              {isHardwareLive ? 'LIVE HARDWARE (APM)' : (isSimLive ? (isOnGround ? 'SIM: ON GROUND (0 RPM)' : `SIM: AIRBORNE (${Math.round(liveThrottle)}%)`) : 'OFFLINE')}
            </span>
          </div>
        </div>

        {/* CENTER — connect & flight operations */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1">
            <button onClick={handleSwitchToSim} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${connType === 'SIM' ? 'bg-red-600 text-white shadow-sm shadow-red-900/40' : 'hover:bg-neutral-800 text-zinc-300'}`}>SIM</button>
            <button onClick={() => setConnType('USB_SERIAL')} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${connType === 'USB_SERIAL' ? 'bg-white text-black' : 'hover:bg-neutral-800 text-zinc-300'}`}>COM</button>
            <button onClick={() => setConnType('UDP')} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${connType === 'UDP' ? 'bg-white text-black' : 'hover:bg-neutral-800 text-zinc-300'}`}>UDP</button>
          </div>
          <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
          
          {connType === 'SIM' ? (
            <div className="flex items-center gap-2 px-1">
              {isOnGround ? (
                <>
                  <span className="text-[10.5px] font-mono text-zinc-400 font-bold px-1">PRE-TAKEOFF (0 RPM)</span>
                  <button 
                    onClick={() => takeoff(55)} 
                    disabled={loading}
                    className="h-7 px-3 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-red-900/40 cursor-pointer transition-colors"
                  >
                    Takeoff (55%)
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[10.5px] font-mono text-red-400 font-bold px-1">AIRBORNE ({Math.round(liveThrottle)}%)</span>
                  <button 
                    onClick={land} 
                    disabled={loading}
                    className="h-7 px-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    Land (0 RPM)
                  </button>
                </>
              )}
            </div>
          ) : connType === 'USB_SERIAL' ? (
            <>
              {ports.length > 0 ? (
                <select value={selectedPort} onChange={e=>setSelectedPort(e.target.value)} disabled={isConnected || loading} className="h-7 text-xs rounded-full border px-2.5 bg-transparent max-w-[150px] truncate disabled:opacity-50 cursor-pointer" style={{ borderColor:'var(--border)', color:'var(--text)' }}>
                  {ports.map((p:any)=><option key={p.port} value={p.port} className="bg-black text-white">{p.port} {p.description?`(${p.description.slice(0,18)})`:''}</option>)}
                </select>
              ) : (
                <input 
                  value={customPort || selectedPort} 
                  onChange={e=>{ setCustomPort(e.target.value); setSelectedPort(e.target.value); }} 
                  placeholder="e.g. COM3" 
                  disabled={isConnected || loading} 
                  className="h-7 w-24 text-xs rounded-full border px-2.5 bg-transparent disabled:opacity-50 font-mono" 
                  style={{ borderColor:'var(--border)', color:'var(--text)' }} 
                />
              )}
              <select value={baudRate} onChange={e=>setBaudRate(Number(e.target.value))} disabled={isConnected || loading} className="h-7 text-xs rounded-full border px-2 bg-transparent disabled:opacity-50 cursor-pointer" style={{ borderColor:'var(--border)', color:'var(--text-muted)' }}>
                <option value={57600} className="bg-black text-white">57600</option>
                <option value={115200} className="bg-black text-white">115200</option>
                <option value={9600} className="bg-black text-white">9600</option>
                <option value={921600} className="bg-black text-white">921600</option>
              </select>
              <button onClick={fetchPortsAndDiag} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-neutral-800 cursor-pointer transition-colors" style={{ borderColor:'var(--border)', color:'var(--text-faint)' }} title="Refresh ports">
                <RefreshCw className="w-3 h-3" />
              </button>
              {isConnected ? (
                <button onClick={handleDisconnect} disabled={loading} className="h-7 px-3 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer hover:bg-red-600/30 transition-colors">
                  <Power className="w-3 h-3" /> Disconnect
                </button>
              ) : (
                <button onClick={handleConnect} disabled={loading || (!selectedPort && !customPort)} className="h-7 px-3 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors shadow-sm">
                  <Radio className="w-3 h-3 text-red-600" /> {loading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1">
              <input value={udpIp} onChange={e=>setUdpIp(e.target.value)} disabled={isConnected||loading} placeholder="0.0.0.0" className="h-7 w-24 text-xs rounded-full border px-2.5 bg-transparent disabled:opacity-50 font-mono" style={{ borderColor:'var(--border)', color:'var(--text)' }} />
              <span style={{ color:'var(--text-faint)' }}>:</span>
              <input type="number" value={udpPort} onChange={e=>setUdpPort(Number(e.target.value))} disabled={isConnected||loading} className="h-7 w-20 text-xs rounded-full border px-2 bg-transparent disabled:opacity-50 font-mono" style={{ borderColor:'var(--border)', color:'var(--text)' }} />
              {isConnected ? (
                <button onClick={handleDisconnect} disabled={loading} className="h-7 px-3 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer hover:bg-red-600/30 transition-colors">
                  <Power className="w-3 h-3" /> Disconnect
                </button>
              ) : (
                <button onClick={handleConnect} disabled={loading} className="h-7 px-3 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors shadow-sm">
                  <Radio className="w-3 h-3 text-red-600" /> {loading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — AI Copilot Shortcut + Plan Tier Badge + User + Alerts + Theme */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick AI Copilot Button */}
          <button
            onClick={() => setActivePage('ai-copilot')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-600/15 text-red-400 border border-red-500/30 hover:bg-red-600/25 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-red-500" />
            <span>Copilot</span>
          </button>

          {/* Plan Pill with Upgrade Action */}
          <button
            onClick={() => setActivePage('pricing')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border border-red-500/30 transition-colors"
            style={{ background: 'var(--card-subtle)', color: 'var(--text)' }}
            title="Click to manage subscription"
          >
            <Sparkles className="w-3 h-3 text-red-500" />
            <span>{currentPlan}</span>
          </button>

          {/* User Profile Avatar / Sign In Trigger */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold hover:border-red-500 transition-colors focus:outline-none"
                style={{ background: 'var(--card-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                title={currentUser?.email || 'User Profile'}
              >
                {currentUser?.full_name?.charAt(0) || <UserIcon className="w-4 h-4" />}
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div 
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-red-600/30 shadow-2xl p-3 z-50 animate-fadeInUp text-xs space-y-2.5"
                    style={{ background: 'var(--card)' }}
                  >
                    {/* User Header */}
                    <div className="pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="font-bold text-white truncate">
                        {currentUser.full_name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">
                        {currentUser.email}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                          {currentUser.role}
                        </span>
                        <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                          {currentPlan}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1">
                      <button
                        onClick={() => { setActivePage('profile'); setUserMenuOpen(false); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 flex items-center gap-2 text-zinc-200 hover:text-white"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-red-500" />
                        <span>Account & Security</span>
                      </button>

                      <button
                        onClick={() => { setActivePage('billing'); setUserMenuOpen(false); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 flex items-center gap-2 text-zinc-200 hover:text-white"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-red-500" />
                        <span>Subscription & Invoices</span>
                      </button>

                      <button
                        onClick={() => { openAuthModal('LOGIN'); setUserMenuOpen(false); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 flex items-center gap-2 text-zinc-200 hover:text-white"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-red-500" />
                        <span>Switch Operator Session</span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); openAuthModal('LOGIN'); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 text-red-400 font-bold flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('LOGIN')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-900/40 flex items-center gap-1.5 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button onClick={() => setAlertDrawerOpen(true)} className="relative w-8 h-8 rounded-md flex items-center justify-center border hover:bg-neutral-50 dark:hover:bg-neutral-900" style={{ borderColor:'var(--border)', color:'var(--text-muted)'}} aria-label="Alerts">
            <Bell className="w-4 h-4" />
            {unread>0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{unread}</span>}
          </button>
          <button onClick={toggleTheme} className="w-8 h-8 rounded-md flex items-center justify-center border hover:bg-neutral-50 dark:hover:bg-neutral-900" style={{ borderColor:'var(--border)', color:'var(--text-muted)'}} aria-label="Toggle theme">
            {theme==='dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
