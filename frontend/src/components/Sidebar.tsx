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
          icon: <Clock className="w-4 h-4 text-red-500" />,
          badge: isProOrEnterprise ? undefined : 'PRO',
          badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
          premium: true
        },
        { id: 'mission-sim', label: 'Mission Sim', icon: <Compass className="w-4 h-4 text-white" /> },
        { id: 'mission-replay', label: 'Flight Blackbox', icon: <FileText className="w-4 h-4 text-white" /> },
        { id: 'hardware-center', label: 'MAVLink / HAL', icon: <HardDrive className="w-4 h-4 text-white" /> },
        { id: 'safety-center', label: 'Safety Interlocks', icon: <Sliders className="w-4 h-4 text-red-500" /> },
        { id: 'settings', label: 'GCS Settings', icon: <Settings className="w-4 h-4 text-white" /> }
      ]
    },
    {
      title: 'AI Intelligence',
      items: [
        { id: 'ai-intelligence', label: 'AI Intelligence Hub', icon: <BrainCircuit className="w-4 h-4 text-red-500" /> },
        { id: 'ai-copilot', label: 'AI Copilot', icon: <Bot className="w-4 h-4 text-red-500" />, badge: 'LIVE', badgeColor: 'text-red-400 bg-red-500/20 border-red-500/40' },
        { id: 'ai-reports', label: 'Automated Reports', icon: <FileText className="w-4 h-4 text-white" /> },
        { id: 'ai-usage', label: 'AI Usage & Quotas', icon: <Zap className="w-4 h-4 text-red-500" /> }
      ]
    }
  ];

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
      className={`${sidebarOpen ? 'w-[220px]' : 'w-[56px]'} flex flex-col h-full shrink-0 border-r select-none transition-all duration-200 bg-[#09090b] border-zinc-800`}
    >
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-2.5">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-0.5">
            {sidebarOpen && (
              <span className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-extrabold block py-1">
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
                  className={`w-full h-8 flex items-center gap-2.5 px-2.5 rounded-lg text-xs transition-colors relative group border cursor-pointer ${
                    sidebarOpen ? 'justify-start' : 'justify-center'
                  } ${
                    isActive
                      ? 'bg-red-600/15 text-white font-bold border-red-500/40 border-l-2 border-l-red-500 shadow-sm'
                      : 'border-transparent text-zinc-300 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="flex-1 text-left flex items-center justify-between min-w-0">
                      <span className={`truncate text-xs ${isActive ? 'font-bold text-white' : 'font-medium text-zinc-300 group-hover:text-white'}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border shrink-0 ml-1.5 ${item.badgeColor || 'text-red-400 bg-red-500/10 border-red-500/30'}`}>
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}

                  {!sidebarOpen && (
                    <span
                      className="absolute left-full ml-2 px-2.5 py-1 text-xs rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border bg-black text-white border-red-500/40"
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
      <div className="p-2.5 border-t text-xs shrink-0 bg-[#09090b] border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
            {sidebarOpen && <span className="text-[11px] font-mono font-bold tracking-wide text-white">20Hz Engine</span>}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setActivePage('pricing')}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors cursor-pointer"
            >
              {currentPlan}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
