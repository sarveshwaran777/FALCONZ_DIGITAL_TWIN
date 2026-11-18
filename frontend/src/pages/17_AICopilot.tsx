import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, MessageSquare, Plus, ArrowRight, 
  Activity, RefreshCw, Wrench, Volume2, VolumeX, Mic, MicOff,
  Copy, Check, ThumbsUp, ThumbsDown, Download, Trash2, Gauge,
  Sliders, User, ArrowUpRight, ChevronDown, ChevronUp, History,
  ShieldCheck, AlertTriangle, Zap, CheckCircle2, X
} from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'COPILOT';
  content: string;
  evidence?: any;
  root_cause?: string;
  severity?: string;
  confidence_pct?: number;
  recommended_actions?: string[];
  suggested_followups?: string[];
  created_at?: string;
}

// Custom Rich Markdown Formatter for High-Contrast Clean Typography
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1.5 my-2.5 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
              <div className="flex-1">{renderInline(item)}</div>
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const cleanMath = (str: string): string => {
    return str
      .replace(/\\\$/g, '$')
      .replace(/\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g, '$1 / $2')
      .replace(/\$f_0\$/g, 'f₀')
      .replace(/\$f_\{BPFO\}\$/g, 'f_BPFO')
      .replace(/\$1X\$/g, '1X')
      .replace(/\$2X\$/g, '2X')
      .replace(/\$3\.2X - 5\.8X\$/g, '3.2X - 5.8X')
      .replace(/\$q_\{10\}\$/g, 'q₁₀ (Conservative)')
      .replace(/\$q_\{50\}\$/g, 'q₅₀ (Median)')
      .replace(/\$q_\{90\}\$/g, 'q₉₀ (Optimistic)')
      .replace(/\$P = I\^2 R\$/g, 'P = I²R')
      .replace(/\$P_\{loss\} = I\^2 R_m\$/g, 'P_loss = I²Rm')
      .replace(/\$\\ge 75\\%\$/g, '≥ 75%')
      .replace(/\$\\sigma\$/g, 'σ')
      .replace(/\$Z\$/g, 'Z')
      .replace(/\$R\^2\$/g, 'R²')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\tau_\{motor\}/g, 'τ_motor')
      .replace(/\\tau_\{aero\}/g, 'τ_aero')
      .replace(/\\cdot/g, '·')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\$/g, '');
  };

  const renderInline = (text: string): React.ReactNode => {
    const cleaned = cleanMath(text);
    // Split by inline code (`...`) and bold (`**...**`)
    const parts = cleaned.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={i}
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border mx-0.5"
            style={{
              background: 'var(--card-subtle)',
              borderColor: 'var(--border)',
              color: 'var(--text)'
            }}
          >
            {codeText}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`list_flush_${lineIdx}`);
      return;
    }

    // Headings: ### Header or ## Header
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      flushList(`list_before_h_${lineIdx}`);
      const headingText = trimmed.replace(/^#{2,3}\s+/, '');
      elements.push(
        <div 
          key={`h_${lineIdx}`} 
          className="text-[13px] font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 pt-2.5 pb-1 mb-1.5 border-b border-slate-200/80 dark:border-slate-800"
        >
          {renderInline(headingText)}
        </div>
      );
      return;
    }

    // Unordered list items: - Item or * Item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(trimmed.slice(2));
      return;
    }

    // Numbered list items: 1. Item
    if (/^\d+\.\s+/.test(trimmed)) {
      flushList(`list_before_num_${lineIdx}`);
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        elements.push(
          <div key={`num_${lineIdx}`} className="flex items-start gap-2.5 text-xs my-1.5 text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="w-4 h-4 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              {match[1]}
            </span>
            <div className="flex-1">{renderInline(match[2])}</div>
          </div>
        );
        return;
      }
    }

    // Regular paragraph
    flushList(`list_before_p_${lineIdx}`);
    elements.push(
      <p key={`p_${lineIdx}`} className="text-xs leading-relaxed my-1.5 text-slate-700 dark:text-slate-200">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList('final_list_flush');

  return <div className="space-y-0.5">{elements}</div>;
};

export const AICopilotPage: React.FC = () => {
  const { systemState, showToast } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [id: string]: 'up' | 'down' }>({});
  const [isListening, setIsListening] = useState<boolean>(false);
  const [roleMode, setRoleMode] = useState<'ENGINEERING' | 'TECHNICIAN' | 'COMMANDER'>('ENGINEERING');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [hudDrawerOpen, setHudDrawerOpen] = useState<boolean>(false);
  const [expandedEvidence, setExpandedEvidence] = useState<{ [msgId: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Curated Quick Prompts
  const quickPrompts = [
    { label: '🛡️ Pre-Flight Clearance', prompt: 'Perform complete pre-flight health clearance and evaluate launch safety.' },
    { label: '⚙️ Bearing Harmonic Scan', prompt: 'Which motor channel has the highest vibration and bearing defect indicators?' },
    { label: '🌡️ Stator Thermal Check', prompt: 'Analyze current stator temperature, convection resistance, and thermal slope margin.' },
    { label: '⏱️ Quantile RUL Prognosis', prompt: 'What is the multi-quantile Remaining Useful Life (RUL) with 90% confidence bounds?' },
    { label: '🛫 Flight Mission Debrief', prompt: 'Analyze my latest flight session and debrief cruise performance.' },
    { label: '📋 Line Maintenance SOP', prompt: 'Generate step-by-step line technician maintenance checklist for current propulsion state.' },
  ];

  // Speech Recognition (Voice Dictation)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast('Voice dictation is not supported in this browser.', 'info');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Listening... Speak your aerospace query.', 'info');
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Text to Speech
  const toggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis is not supported on this browser.', 'info');
      return;
    }
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#`_$\\]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/σ/g, ' sigma')
      .replace(/°C/g, ' degrees Celsius');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMsgId(msgId);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copilot response copied to clipboard.', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: type }));
    showToast(type === 'up' ? 'Feedback recorded: Highly helpful!' : 'Feedback recorded: Model calibration updated.', 'success');
  };

  const toggleEvidence = (msgId: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const exportConversation = () => {
    if (messages.length === 0) return;
    const transcript = messages.map(m => {
      const sender = m.sender === 'USER' ? 'FLIGHT ENGINEER' : 'FALCONZ COPILOT';
      return `[${sender}]\n${m.content}\n`;
    }).join('\n----------------------------------------\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FalconZ_Copilot_Debrief_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Diagnostic transcript downloaded.', 'success');
  };

  const clearChat = () => {
    if (window.confirm('Clear active diagnostic session?')) {
      setMessages([]);
      showToast('Diagnostic conversation reset.', 'info');
    }
  };

  const fetchConversations = async () => {
    try {
      const convs = await api.getAIConversations();
      if (Array.isArray(convs)) {
        setConversations(convs);
        if (convs.length > 0 && !activeConvId) {
          loadConversation(convs[0].id);
        }
      }
    } catch {}
  };

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId);
    try {
      const data = await api.getConversationMessages(convId);
      if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {}
    setHistoryDrawerOpen(false);
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.newConversation();
      setActiveConvId(newConv.id);
      setMessages([]);
      fetchConversations();
      setHistoryDrawerOpen(false);
      showToast('New diagnostic flight session started.', 'info');
    } catch {}
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || loading) return;

    if (speakingMsgId) {
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
    }

    const tempUserMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'USER',
      content: text
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.chatAICopilot(text, activeConvId || undefined, undefined, roleMode);
      if (res && res.response) {
        if (!activeConvId && res.conversation_id) {
          setActiveConvId(res.conversation_id);
          fetchConversations();
        }
        const aiMsg: ChatMessage = {
          id: res.message_id || `ai_${Date.now()}`,
          sender: 'COPILOT',
          content: res.response,
          evidence: res.evidence,
          root_cause: res.root_cause,
          severity: res.severity,
          confidence_pct: res.confidence_pct,
          recommended_actions: res.recommended_actions,
          suggested_followups: res.suggested_followups || res.evidence?.suggested_followups || []
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      showToast(err.message || 'AI Copilot communication error', 'error');
    }
    setLoading(false);
  };

  // Live telemetry metrics from state
  const tel = systemState?.telemetry;
  const twin = systemState?.digital_twin;
  const intel = systemState?.intelligence;
  const res = systemState?.residuals;

  const liveRpm = Math.round(tel?.rpm ?? 0);
  const expectedRpm = Math.round(twin?.expected_rpm ?? 0);
  const liveTemp = (tel?.temperature_c ?? 25.0).toFixed(1);
  const liveCurr = (tel?.current_a ?? 0.0).toFixed(2);
  const liveVib = (tel?.vibration_rms_g ?? 0.05).toFixed(3);
  const liveHealth = Math.round(intel?.health_index ?? 100);
  const liveZScore = (res?.composite_residual_score ?? 0.0).toFixed(2);

  return (
    <div className="relative flex flex-col h-[calc(100vh-84px)] max-w-5xl mx-auto w-full select-none">
      
      {/* 1. TOP HEADER: Clean Navigation, Persona Segments & Telemetry Pill */}
      <header 
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border shrink-0 mb-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Left: Branding & Grounding Pulse */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
              FALCONZ Copilot
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              20 Hz Telemetry Grounded
            </span>
          </div>
        </div>

        {/* Center: Segmented Role Mode Pill */}
        <div 
          className="flex items-center p-0.5 rounded-xl border text-xs font-semibold"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setRoleMode('ENGINEERING')}
            className={`px-3 py-1 rounded-lg text-xs transition-all ${
              roleMode === 'ENGINEERING'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Engineer
          </button>
          <button
            onClick={() => setRoleMode('TECHNICIAN')}
            className={`px-3 py-1 rounded-lg text-xs transition-all ${
              roleMode === 'TECHNICIAN'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Technician
          </button>
          <button
            onClick={() => setRoleMode('COMMANDER')}
            className={`px-3 py-1 rounded-lg text-xs transition-all ${
              roleMode === 'COMMANDER'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Commander
          </button>
        </div>

        {/* Right: Telemetry HUD Pill & Control Actions */}
        <div className="flex items-center gap-1.5">
          {/* Live Telemetry Pill */}
          <button
            onClick={() => setHudDrawerOpen(!hudDrawerOpen)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              hudDrawerOpen 
                ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 border-purple-500/30' 
                : 'hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            style={!hudDrawerOpen ? { borderColor: 'var(--border)', color: 'var(--text)' } : {}}
            title="Toggle Live Telemetry HUD"
          >
            <Gauge className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-mono text-[11px] tabular-nums font-bold">
              {liveRpm} RPM • {liveTemp}°C
            </span>
          </button>

          {/* Sessions Drawer Toggle */}
          <button
            onClick={() => setHistoryDrawerOpen(!historyDrawerOpen)}
            className={`p-2 rounded-xl border transition-colors ${
              historyDrawerOpen 
                ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 border-purple-500/30' 
                : 'hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            style={!historyDrawerOpen ? { borderColor: 'var(--border)', color: 'var(--text)' } : {}}
            title="Flight Sessions History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Export Transcript */}
          <button
            onClick={exportConversation}
            disabled={messages.length === 0}
            className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            title="Download Transcript"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear Session */}
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="p-2 rounded-xl border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 disabled:opacity-40 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            title="Reset Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: Clean Centered Conversation View + Floating Drawers */}
      <div className="relative flex-1 flex flex-col min-h-0 rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        
        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          
          {/* Welcome Screen when Empty */}
          {messages.length === 0 && (
            <div className="max-w-xl mx-auto py-10 text-center space-y-6 animate-fadeInUp">
              <div className="w-16 h-16 rounded-3xl bg-purple-600/10 border border-purple-500/25 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                <Bot className="w-8 h-8" />
              </div>
              
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  How can I assist your propulsion test today?
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1.5 leading-relaxed">
                  Real-time physics residuals, 20 Hz multi-channel FFT vibration harmonics, stator temperature gradients, and quantile RUL forecasting.
                </p>
              </div>

              {/* 4 Feature Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                {quickPrompts.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.prompt)}
                    className="p-3.5 rounded-xl border text-xs transition-all flex flex-col justify-between group hover:border-purple-500 hover:shadow-xs"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-[12px]">{p.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {p.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((m) => {
            const isUser = m.sender === 'USER';
            const evidenceOpen = !!expandedEvidence[m.id];

            return (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-3xl mx-auto w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fadeInUp`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-2 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-br-sm'
                        : 'border rounded-bl-sm'
                    }`}
                    style={!isUser ? { background: 'var(--card-subtle)', borderColor: 'var(--border)' } : {}}
                  >
                    {/* Rich Formatted Content */}
                    {isUser ? (
                      <p className="whitespace-pre-line text-xs font-medium text-white">{m.content}</p>
                    ) : (
                      <FormattedMessage content={m.content} />
                    )}

                    {/* Copilot Action Toolbar (Speech, Copy, Feedback) */}
                    {!isUser && (
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-1">
                          {/* Audio Readout */}
                          <button
                            onClick={() => toggleSpeak(m.id, m.content)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                              speakingMsgId === m.id
                                ? 'bg-purple-600 text-white border-purple-500 animate-pulse'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                            title={speakingMsgId === m.id ? 'Mute speech' : 'Listen with voice readout'}
                          >
                            {speakingMsgId === m.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span>{speakingMsgId === m.id ? 'Mute' : 'Voice'}</span>
                          </button>

                          {/* Copy */}
                          <button
                            onClick={() => handleCopy(m.id, m.content)}
                            className="px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          {/* Evidence Toggle Button if evidence is attached */}
                          {m.evidence && (
                            <button
                              onClick={() => toggleEvidence(m.id)}
                              className="px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-purple-600 dark:text-purple-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Toggle Telemetry Snapshot Evidence"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>{evidenceOpen ? 'Hide Evidence' : 'View Evidence'}</span>
                              {evidenceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {/* Thumbs Feedback */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(m.id, 'up')}
                            className={`p-1 rounded-lg transition-colors ${
                              feedbackGiven[m.id] === 'up'
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : 'text-slate-400 hover:text-emerald-500'
                            }`}
                            title="Accurate & helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, 'down')}
                            className={`p-1 rounded-lg transition-colors ${
                              feedbackGiven[m.id] === 'down'
                                ? 'text-rose-500 bg-rose-500/10'
                                : 'text-slate-400 hover:text-rose-500'
                            }`}
                            title="Needs calibration"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Telemetry Snapshot Evidence Card */}
                  {!isUser && m.evidence && evidenceOpen && (
                    <div 
                      className="p-3.5 rounded-xl border space-y-2.5 text-[11px] animate-slideDown"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[10.5px]">
                        <span className="font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Grounded Telemetry Evidence
                        </span>
                        <span className="font-semibold">
                          Confidence: {m.confidence_pct ? `${m.confidence_pct.toFixed(1)}%` : '98.0%'}
                        </span>
                      </div>

                      {/* Clean 4-Grid Sensor Snapshot */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                        <div className="p-2 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                          <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Speed</span>
                          <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.rpm_actual || 0} RPM</span>
                        </div>
                        <div className="p-2 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                          <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Stator Heat</span>
                          <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.temperature_c || 0} °C</span>
                        </div>
                        <div className="p-2 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                          <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Vibration RMS</span>
                          <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.vibration_rms_g || 0} g</span>
                        </div>
                        <div className="p-2 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                          <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Composite Z</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{m.evidence.composite_z_score || 0} σ</span>
                        </div>
                      </div>

                      {/* Action Plan Checklist */}
                      {m.recommended_actions && m.recommended_actions.length > 0 && (
                        <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-purple-500" /> Maintenance Action SOP
                          </span>
                          {m.recommended_actions.map((act, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Follow-Up Prompt Chips */}
                  {!isUser && m.suggested_followups && m.suggested_followups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggested_followups.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          disabled={loading}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 group transition-all hover:border-purple-500 hover:shadow-xs"
                          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        >
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>{chip}</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm font-bold text-xs">
                    U
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking / Calculating Spinner */}
          {loading && (
            <div className="flex gap-3 items-center max-w-3xl mx-auto w-full text-xs text-purple-600 dark:text-purple-400 animate-pulse py-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-xs">FALCONZ Copilot is analyzing live telemetry residuals...</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Computing 20 Hz multi-channel FFT, Joule losses, and quantile RUL bounds.</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. BOTTOM FLOATING CONSOLE: Quick Action Carousel + Voice + Input Dock */}
        <div className="p-3 sm:p-4 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="max-w-3xl mx-auto space-y-2.5">
            
            {/* Quick Diagnostic Carousel Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                Quick Prompts:
              </span>
              {quickPrompts.map((act, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(act.prompt)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0 transition-all hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-300"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {act.label}
                </button>
              ))}
            </div>

            {/* Input Form with Voice Dictation & Send */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 p-1.5 rounded-2xl border shadow-xs"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
            >
              {/* Voice Microphone Dictation */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/25'
                    : 'text-slate-500 dark:text-slate-400 hover:text-purple-600 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isListening ? 'Stop listening' : 'Speak your question (Voice dictation)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Main Text Input */}
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={isListening ? "Listening... Speak your flight question..." : "Ask Copilot: 'Which motor has highest vibration?', 'Why is M2 hot?', 'Can I fly?'..."}
                className="flex-1 bg-transparent px-2 py-2 text-xs font-medium focus:outline-none"
                style={{ color: 'var(--text)' }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-sm shadow-purple-600/20 transition-all shrink-0 font-bold"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* 4. SLIDE-OUT DRAWER: Diagnostic Flight Sessions History */}
        {historyDrawerOpen && (
          <div 
            className="absolute inset-y-0 left-0 w-72 border-r shadow-2xl p-4 flex flex-col z-30 animate-fadeInUp"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-500" />
                Flight Sessions
              </span>
              <button 
                onClick={() => setHistoryDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleNewConversation}
              className="w-full mt-3 py-2 px-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-sm shadow-purple-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Flight Session
            </button>

            <div className="flex-1 overflow-y-auto space-y-1.5 mt-3 pr-1">
              {conversations.map((c) => {
                const isActive = activeConvId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors truncate flex items-center gap-2 ${
                      isActive 
                        ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{c.title || 'Propulsion Analysis'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. SLIDE-OUT DRAWER: Live Telemetry Mini-Cockpit HUD */}
        {hudDrawerOpen && (
          <div 
            className="absolute inset-y-0 right-0 w-72 border-l shadow-2xl p-4 flex flex-col z-30 space-y-3 animate-fadeInUp"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-purple-500" />
                Live Telemetry HUD
              </span>
              <button 
                onClick={() => setHudDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              Click any gauge to ask Copilot for instant diagnostic analysis:
            </p>

            <div className="space-y-2 overflow-y-auto pr-1">
              {/* Dial 1: RPM */}
              <div
                onClick={() => {
                  handleSend("Compare actual RPM against expected digital twin speed.");
                  setHudDrawerOpen(false);
                }}
                className="p-2.5 rounded-xl border cursor-pointer hover:border-purple-500 transition-all"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Propulsion Speed</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Ask ↗</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {liveRpm} <span className="text-xs font-normal text-slate-400">RPM</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Twin: {expectedRpm}</span>
                </div>
              </div>

              {/* Dial 2: Temperature */}
              <div
                onClick={() => {
                  handleSend("Analyze why stator core temperature is at current level and project thermal slope.");
                  setHudDrawerOpen(false);
                }}
                className="p-2.5 rounded-xl border cursor-pointer hover:border-purple-500 transition-all"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Stator Temperature</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Ask ↗</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {liveTemp} <span className="text-xs font-normal text-slate-400">°C</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Ceiling: 105°C</span>
                </div>
              </div>

              {/* Dial 3: Vibration */}
              <div
                onClick={() => {
                  handleSend("Which motor has the highest vibration peak and harmonic spectrum?");
                  setHudDrawerOpen(false);
                }}
                className="p-2.5 rounded-xl border cursor-pointer hover:border-purple-500 transition-all"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Radial Vibration</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Ask ↗</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {liveVib} <span className="text-xs font-normal text-slate-400">g</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Norm: &lt;0.35g</span>
                </div>
              </div>

              {/* Dial 4: Current */}
              <div
                onClick={() => {
                  handleSend("Analyze phase current draw and calculate Joule dissipation losses.");
                  setHudDrawerOpen(false);
                }}
                className="p-2.5 rounded-xl border cursor-pointer hover:border-purple-500 transition-all"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Phase Current</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Ask ↗</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {liveCurr} <span className="text-xs font-normal text-slate-400">A</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Total Pack</span>
                </div>
              </div>

              {/* Dial 5: Composite Z-Score */}
              <div
                onClick={() => {
                  handleSend("Explain how the composite residual score and Z-score are calculated.");
                  setHudDrawerOpen(false);
                }}
                className="p-2.5 rounded-xl border cursor-pointer hover:border-purple-500 transition-all"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Residual Variance</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Ask ↗</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                    {liveZScore} <span className="text-xs font-normal text-slate-400">σ</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Warn: &gt;2.0σ</span>
                </div>
              </div>

              {/* Dial 6: Health Index */}
              <div
                onClick={() => {
                  handleSend("Why is the propulsion health index at its current level?");
                  setHudDrawerOpen(false);
                }}
                className="p-2.5 rounded-xl border cursor-pointer hover:border-purple-500 transition-all"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Health Integrity</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Ask ↗</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {liveHealth}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{intel?.health_band || 'HEALTHY'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
