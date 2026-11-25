import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { 
  FullSystemState, 
  ScenarioType, 
  TelemetrySource, 
  ControlMode, 
  DemoState, 
  SystemAlert 
} from '../types/telemetry';
import { wsService } from '../services/websocket';
import { api } from '../services/api';
import { createMockSystemState } from '../services/mockTelemetry';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ENGINEER' | 'TECHNICIAN' | 'VIEWER';
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan_code: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  };
}

export interface UpgradeModalData {
  featureName: string;
  requiredPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  message?: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  systemState: FullSystemState | null;
  wsConnected: boolean;
  history: FullSystemState[];
  demoState: DemoState | null;
  activePage: string;
  setActivePage: (page: string) => void;
  
  // Theme & Layout
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Alerts
  activeAlerts: SystemAlert[];
  dismissAlert: (id: string) => void;
  alertDrawerOpen: boolean;
  setAlertDrawerOpen: (open: boolean) => void;

  // Technical Help Modal
  helpModalParam: string | null;
  setHelpModalParam: (param: string | null) => void;

  // Ask FALCONZ AI Assistant
  askFalconzOpen: boolean;
  setAskFalconzOpen: (open: boolean) => void;

  // Hardware & Propulsion Actions
  setThrottle: (throttle: number, load?: number) => Promise<void>;
  takeoff: (throttle?: number) => Promise<void>;
  land: () => Promise<void>;
  groundReset: () => Promise<void>;
  setScenario: (scenario: ScenarioType, severity?: number) => Promise<void>;
  setSource: (source: TelemetrySource) => Promise<void>;
  setControlMode: (mode: ControlMode) => Promise<void>;
  triggerEmergencyStop: () => Promise<void>;
  resetEmergencyStop: () => Promise<void>;
  refreshDemoState: () => Promise<void>;

  // SaaS, User & Entitlements State
  currentUser: UserProfile | null;
  currentPlan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  token: string | null;
  setToken: (token: string | null) => void;
  setCurrentUser: (user: UserProfile | null) => void;
  setCurrentPlan: (plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  
  // Auth Modal (Login / Register / Password Reset)
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'LOGIN' | 'REGISTER' | 'FORGOT';
  setAuthModalMode: (mode: 'LOGIN' | 'REGISTER' | 'FORGOT') => void;
  openAuthModal: (mode?: 'LOGIN' | 'REGISTER' | 'FORGOT') => void;
  closeAuthModal: () => void;

  // Upgrade Modal
  upgradeModalOpen: boolean;
  upgradeModalData: UpgradeModalData | null;
  openUpgradeModal: (featureName: string, requiredPlan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE', message?: string) => void;
  closeUpgradeModal: () => void;

  // Toasts
  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systemState, setSystemState] = useState<FullSystemState | null>(() => createMockSystemState(0, 'NORMAL', 0, 0, false));
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [history, setHistory] = useState<FullSystemState[]>(() => {
    const init: FullSystemState[] = [];
    for (let i = 20; i >= 0; i--) {
      init.push(createMockSystemState(-i, 'NORMAL', 0, 0, false));
    }
    return init;
  });
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [activePage, setActivePage] = useState<string>('overview');

  // SaaS User & Subscription state
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('falconz_token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return {
      id: 'usr_admin_001',
      email: 'admin@falconz.aero',
      full_name: 'Lead Propulsion Engineer',
      role: 'SUPER_ADMIN',
      organization: {
        id: 'org_aero_001',
        name: 'AeroPropulsion Labs',
        slug: 'aeropropulsion-labs',
        plan_code: 'PROFESSIONAL'
      }
    };
  });
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Upgrade Modal & Toast State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeModalData, setUpgradeModalData] = useState<UpgradeModalData | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Client-side simulation state when backend is disconnected
  const simStepRef = useRef(0);
  const simThrottleRef = useRef(0);
  const simEStopRef = useRef(false);
  const simScenarioRef = useRef<ScenarioType>('NORMAL');
  const simSeverityRef = useRef(0.0);
  const isBackendLiveRef = useRef(false);

  // Theme setup (default dark for aerospace GCS)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('falconz_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [alertDrawerOpen, setAlertDrawerOpen] = useState<boolean>(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [helpModalParam, setHelpModalParam] = useState<string | null>(null);
  const [askFalconzOpen, setAskFalconzOpen] = useState<boolean>(false);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('falconz_theme', theme);
  }, [theme]);

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const setToken = (t: string | null) => {
    if (t) {
      localStorage.setItem('falconz_token', t);
    } else {
      localStorage.removeItem('falconz_token');
    }
    setTokenState(t);
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setCurrentPlan('FREE');
    showToast('Logged out successfully', 'info');
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      if (me && me.id) {
        setCurrentUser(me);
        if (me.organization?.plan_code) {
          setCurrentPlan(me.organization.plan_code);
        }
      }
    } catch {}
  };

  const openAuthModal = (mode: 'LOGIN' | 'REGISTER' | 'FORGOT' = 'LOGIN') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const openUpgradeModal = (
    featureName: string,
    requiredPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'PROFESSIONAL',
    message?: string
  ) => {
    setUpgradeModalData({ featureName, requiredPlan, message });
    setUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setUpgradeModalOpen(false);
    setUpgradeModalData(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ id: `${Date.now()}`, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  useEffect(() => {
    wsService.connect();

    const unsubStatus = wsService.subscribeStatus((connected) => {
      setWsConnected(connected);
      if (connected) {
        isBackendLiveRef.current = true;
      }
    });

    let lastHistoryPush = 0;
    const unsubMsg = wsService.subscribe((state) => {
      isBackendLiveRef.current = true;
      setSystemState(state);

      const now = performance.now();
      if (now - lastHistoryPush >= 500) {
        lastHistoryPush = now;
        setHistory((prev) => {
          const next = [...prev, state];
          return next.length > 3000 ? next.slice(-3000) : next;
        });
      }
    });

    // Initial fallback REST poll
    api.getFullSystemState().then((state) => {
      if (state && state.telemetry) {
        isBackendLiveRef.current = true;
        setSystemState(state);
      }
    }).catch(() => {});
    api.getDemoState().then(setDemoState).catch(() => {});

    const demoPollInterval = setInterval(() => {
      api.getDemoState().then(setDemoState).catch(() => {});
    }, 2000);

    // Client-side simulation ticker at 5 Hz when backend is offline
    const simInterval = setInterval(() => {
      if (!isBackendLiveRef.current) {
        simStepRef.current += 1;
        const mock = createMockSystemState(
          simStepRef.current,
          simScenarioRef.current,
          simSeverityRef.current,
          simThrottleRef.current,
          simEStopRef.current
        );
        setSystemState(mock);

        const now = performance.now();
        if (now - lastHistoryPush >= 500) {
          lastHistoryPush = now;
          setHistory((prev) => {
            const next = [...prev, mock];
            return next.length > 3000 ? next.slice(-3000) : next;
          });
        }
      }
    }, 200);

    return () => {
      unsubStatus();
      unsubMsg();
      clearInterval(demoPollInterval);
      clearInterval(simInterval);
    };
  }, []);

  // Compute live backend-derived alerts without fake data
  const activeAlerts = useMemo<SystemAlert[]>(() => {
    if (!systemState) return [];
    const alerts: SystemAlert[] = [];
    const tel = systemState.telemetry;
    const intel = systemState.intelligence;
    const now = tel.timestamp || Date.now() / 1000;

    // 1. Emergency Stop Active
    if (systemState.emergency_stop_active || systemState.safety_state === 'EMERGENCY') {
      alerts.push({
        id: 'alert_estop',
        timestamp: now,
        level: 'CRITICAL',
        target: 'GLOBAL PROPULSION',
        event: 'Emergency Stop Interlock Active',
        evidence: 'Propulsion output commands cut off due to operator or safety guard trigger.',
        action: 'Inspect hardware, clear physical hazards, and reset latch via Safety Center.'
      });
    }

    // 2. Hardware Over-Temperature Breach
    if (tel.temperature_c > 80.0) {
      alerts.push({
        id: 'alert_temp_high',
        timestamp: now,
        level: 'CRITICAL',
        target: 'Stator Winding',
        event: `Temperature Limit Exceeded (${tel.temperature_c.toFixed(1)}°C > 80.0°C)`,
        evidence: `Direct ESC/sensor measurement exceeds hard interlock bounds.`,
        action: 'Throttle back immediately to prevent permanent winding insulation breakdown.'
      });
    } else if (tel.temperature_c > 65.0) {
      alerts.push({
        id: 'alert_temp_warn',
        timestamp: now,
        level: 'WARNING',
        target: 'Stator Winding',
        event: `Elevated Motor Temperature (${tel.temperature_c.toFixed(1)}°C)`,
        evidence: 'Thermal model shows rapid heat accumulation rate.',
        action: 'Reduce continuous throttle load and check cooling airflow duct.'
      });
    }

    // 3. Current Over-Draw Breach
    if (tel.current_a > 35.0) {
      alerts.push({
        id: 'alert_curr_high',
        timestamp: now,
        level: 'CRITICAL',
        target: 'ESC Inverter',
        event: `Current Limit Exceeded (${tel.current_a.toFixed(1)}A > 35.0A)`,
        evidence: 'Phase current approaching MOSFET thermal desoldering limit.',
        action: 'Reduce commanded power or engage automatic Assisted Derate mode.'
      });
    }

    // 4. Vibration Spike
    if (tel.vibration_rms_g > 2.0) {
      alerts.push({
        id: 'alert_vib_crit',
        timestamp: now,
        level: 'CRITICAL',
        target: 'Bearing & Propeller Hub',
        event: `Severe Vibration Level (${tel.vibration_rms_g.toFixed(2)}g > 2.00g)`,
        evidence: 'Exceeds structural airframe safe oscillation threshold.',
        action: 'Inspect propeller tracking and check motor mount screw torque.'
      });
    }

    // 5. ML Confirmed Anomaly & Fault
    if (intel && intel.is_anomaly && intel.anomaly_severity !== 'NOMINAL') {
      alerts.push({
        id: 'alert_ml_fault',
        timestamp: now,
        level: intel.anomaly_severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        target: intel.predicted_fault || 'Propulsion System',
        event: `AI Diagnostic: ${intel.predicted_fault} (${intel.fault_confidence_pct.toFixed(0)}% conf)`,
        evidence: intel.xai_what || 'Multi-channel residual deviation verified across feature pipeline.',
        action: intel.xai_recommendation || 'Initiate scheduled maintenance review.'
      });
    }

    return alerts.filter((a) => !dismissedAlertIds.has(a.id));
  }, [systemState, dismissedAlertIds]);

  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, id]));
  };

  const setThrottle = async (throttle: number, load?: number) => {
    simThrottleRef.current = throttle;
    try {
      await api.setThrottle(throttle, load);
    } catch {}
  };

  const takeoff = async (throttle = 55) => {
    simThrottleRef.current = throttle;
    try {
      await api.takeoff(throttle);
      showToast(`Takeoff initiated: Throttle set to ${throttle}% hover.`, 'success');
    } catch {
      await api.setThrottle(throttle, 40);
    }
  };

  const land = async () => {
    simThrottleRef.current = 0;
    try {
      await api.land();
      showToast('Aircraft landed: Throttle set to 0% initial state.', 'info');
    } catch {
      await api.setThrottle(0, 0);
    }
  };

  const groundReset = async () => {
    simThrottleRef.current = 0;
    try {
      await api.groundReset();
      showToast('Reset to ground initial state (0 RPM).', 'info');
    } catch {
      await api.setThrottle(0, 0);
    }
  };

  const setScenario = async (scenario: ScenarioType, severity = 0.5) => {
    simScenarioRef.current = scenario;
    simSeverityRef.current = severity;
    try {
      await api.setScenario(scenario, severity);
    } catch {}
  };

  const setSource = async (source: TelemetrySource) => {
    try {
      await api.setTelemetrySource(source);
    } catch {}
  };

  const setControlMode = async (mode: ControlMode) => {
    try {
      await api.setControlMode(mode);
    } catch {}
  };

  const triggerEmergencyStop = async () => {
    simEStopRef.current = true;
    try {
      await api.triggerEmergencyStop();
    } catch {}
  };

  const resetEmergencyStop = async () => {
    simEStopRef.current = false;
    try {
      await api.resetEmergencyStop();
    } catch {}
  };

  const refreshDemoState = async () => {
    try {
      const d = await api.getDemoState();
      setDemoState(d);
    } catch {}
  };

  return React.createElement(
    AppContext.Provider,
    {
      value: {
        systemState,
        wsConnected,
        history,
        demoState,
        activePage,
        setActivePage,
        theme,
        setTheme,
        toggleTheme,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        activeAlerts,
        dismissAlert,
        alertDrawerOpen,
        setAlertDrawerOpen,
        helpModalParam,
        setHelpModalParam,
        askFalconzOpen,
        setAskFalconzOpen,
        setThrottle,
        takeoff,
        land,
        groundReset,
        setScenario,
        setSource,
        setControlMode,
        triggerEmergencyStop,
        resetEmergencyStop,
        refreshDemoState,
        currentUser,
        currentPlan,
        setCurrentUser,
        setCurrentPlan,
        token,
        setToken,
        logout,
        refreshUser,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
        upgradeModalOpen,
        upgradeModalData,
        openUpgradeModal,
        closeUpgradeModal,
        toast,
        showToast
      }
    },
    children
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within an AppProvider');
  return context;
};
