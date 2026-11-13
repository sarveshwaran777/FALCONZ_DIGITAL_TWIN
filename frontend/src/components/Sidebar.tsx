import React from 'react';
import { 
  Home, Cpu, Radio, Activity, TrendingUp, AlertOctagon, 
  FileText, HardDrive, Sliders, Settings, BrainCircuit, Bot, 
  Users, Cloud, Zap, CreditCard, History, Building2, User, ShieldAlert,
  Clock, Compass, Sparkles, Lock
} from 'lucide-react';
import { useAppStore } from '../state/store';

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    premium?: boolean;
  }[];
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, sidebarOpen, currentUser, currentPlan, openUpgradeModal } = useAppStore();

  const isProOrEnterprise = currentPlan === 'PROFESSIONAL' || currentPlan === 'ENTERPRISE';

  const sections: NavSection[] = [
    {
      title: 'Digital Twin Operations',
      items: [
        { id: 'overview', label: 'Overview Cockpit', icon: <Home className="w-4 h-4" /> },
        { id: 'live-twin', label: 'Physics Twin', icon: <Cpu className="w-4 h-4" /> },
        { id: 'telemetry-data', label: 'Live Telemetry', icon: <Radio className="w-4 h-4" /> },
        { id: 'health-intel', label: 'Health Intelligence', icon: <Activity className="w-4 h-4" /> },
        { id: 'fault-prediction', label: 'Fault Classifier', icon: <TrendingUp className="w-4 h-4" /> },
        { 
          id: 'rul-forecast', 
          label: 'RUL Prognostics', 
          icon: <Clock className="w-4 h-4" />,
          badge: isProOrEnterprise ? undefined : 'PRO',
          badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          premium: true
        },
        { id: 'mission-sim', label: 'Mission Sim', icon: <Compass className="w-4 h-4" /> },
        { id: 'mission-replay', label: 'Flight Blackbox', icon: <FileText className="w-4 h-4" /> },
        { id: 'hardware-center', label: 'MAVLink / HAL', icon: <HardDrive className="w-4 h-4" /> },
        { id: 'safety-center', label: 'Safety Interlocks', icon: <Sliders className="w-4 h-4" /> },
        { id: 'settings', label: 'GCS Settings', icon: <Settings className="w-4 h-4" /> }
      ]
    },
    {
      title: 'FALCONZ AI Intelligence',
      items: [
        { id: 'ai-intelligence', label: 'AI Intelligence Hub', icon: <BrainCircuit className="w-4 h-4 text-purple-400" /> },
        { id: 'ai-copilot', label: 'AI Engineering Copilot', icon: <Bot className="w-4 h-4 text-purple-400" />, badge: 'LIVE' },
        { id: 'ai-reports', label: 'Automated Reports', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
        { id: 'ai-usage', label: 'AI Usage & Quotas', icon: <Zap className="w-4 h-4 text-amber-400" /> }
      ]
    },
    {
      title: 'Fleet & Cloud Ingress',
      items: [
        { id: 'fleet-management', label: 'Drone Fleet', icon: <Users className="w-4 h-4 text-cyan-400" /> },
        { id: 'flight-history', label: 'Cloud Flight Logs', icon: <Cloud className="w-4 h-4 text-cyan-400" /> }
      ]
    },
    {
      title: 'SaaS, Billing & Org',
      items: [
        { id: 'pricing', label: 'Plans & Pricing', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
        { id: 'billing', label: 'Billing & Invoices', icon: <CreditCard className="w-4 h-4 text-slate-300" /> },
        { id: 'payment-history', label: 'Payment Ledger', icon: <History className="w-4 h-4 text-slate-300" /> },
        { id: 'organization', label: 'Team & RBAC', icon: <Building2 className="w-4 h-4 text-slate-300" /> },
        { id: 'profile', label: 'Account Security', icon: <User className="w-4 h-4 text-slate-300" /> }
      ]
    }
  ];

  // Super Admin section
  if (currentUser?.role === 'SUPER_ADMIN') {
    sections.push({
      title: 'System Administration',
      items: [
        { id: 'admin', label: 'Super Admin Center', icon: <ShieldAlert className="w-4 h-4 text-red-400" />, badge: 'ROOT' }
      ]
    });
  }

  const handleNavClick = (item: any) => {
    // Entitlement check for premium features
    if (item.premium && !isProOrEnterprise) {
      openUpgradeModal(
        item.label,
        'PROFESSIONAL',
        `Access to ${item.label} requires FalconZ Professional or Enterprise.`
      );
      return;
    }
    setActivePage(item.id);
  };

  return (
    <aside
      className={`${sidebarOpen ? 'w-[230px]' : 'w-[64px]'} flex flex-col h-[calc(100vh-56px)] sticky top-14 shrink-0 border-r transition-all select-none`}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {sidebarOpen && (
              <span className="px-2.5 text-[10.5px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block pt-1">
                {sec.title}
              </span>
            )}
            {sec.items.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] transition-colors relative group ${
                    sidebarOpen ? 'justify-start' : 'justify-center'
                  } ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="truncate flex-1 text-left flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${item.badgeColor || 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/20'}`}>
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}

                  {!sidebarOpen && (
                    <span
                      className="absolute left-full ml-2 px-2.5 py-1 text-xs rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border bg-slate-900 text-white border-slate-700"
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Plan Status Footer */}
      <div className="p-3 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-faint)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            {sidebarOpen && <span className="text-[11px] font-mono tracking-wide">20Hz Engine</span>}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setActivePage('pricing')}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 transition-colors"
            >
              {currentPlan}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
