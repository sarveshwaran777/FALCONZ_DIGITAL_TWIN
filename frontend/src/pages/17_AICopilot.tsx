import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, MessageSquare, Plus, ArrowRight, 
  CheckCircle, AlertTriangle, AlertOctagon, HelpCircle, Activity,
  RefreshCw, Wrench, Shield, Volume2, VolumeX, Mic, MicOff,
  Copy, Check, ThumbsUp, ThumbsDown, Download, Trash2, Gauge,
  Sliders, User, ArrowUpRight
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
  const [cockpitOpen, setCockpitOpen] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Quick Diagnostic Action Chips
  const presetActions = [
    { label: '🛡️ Pre-Flight Clearance', prompt: 'Perform complete pre-flight health clearance and evaluate launch safety.' },
    { label: '⚙️ Bearing Harmonic Scan', prompt: 'Perform 1X and high-frequency harmonic vibration scan for bearing raceway degradation.' },
    { label: '🌡️ Stator Thermal Check', prompt: 'Analyze current stator temperature, convection resistance, and thermal slope margin.' },
    { label: '🔄 RPM Twin Comparison', prompt: 'Compare actual measured RPM against first-principles digital twin physics expectation.' },
    { label: '⏱️ Quantile RUL Prognosis', prompt: 'What is the multi-quantile Remaining Useful Life (RUL) with 90% confidence bounds?' },
    { label: '📋 Line Maintenance SOP', prompt: 'Generate step-by-step line technician maintenance checklist for current propulsion state.' },
    { label: '📄 Automated PDF Report', prompt: 'Explain the available automated engineering PDF reports and how to generate them.' },
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
      showToast('Voice input is not supported in this browser.', 'info');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Listening... Speak your flight engineering question.', 'info');
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
    showToast(type === 'up' ? 'Feedback recorded: Highly helpful!' : 'Feedback recorded: Calibration adjusted.', 'success');
  };

  const exportConversation = () => {
    if (messages.length === 0) return;
    const transcript = messages.map(m => {
      const sender = m.sender === 'USER' ? 'ENGINEER' : 'FALCONZ COPILOT';
      return `[${sender}]\n${m.content}\n`;
    }).join('\n----------------------------------------\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FalconZ_Copilot_Transcript_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Diagnostic transcript downloaded.', 'success');
  };

  const clearChat = () => {
    if (window.confirm('Clear current diagnostic session?')) {
      setMessages([]);
      showToast('Chat cleared.', 'info');
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
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.newConversation();
      setActiveConvId(newConv.id);
      setMessages([]);
      fetchConversations();
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
      showToast(err.message || 'AI Copilot error', 'error');
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
    <div className="flex flex-col h-[calc(100vh-84px)] gap-3 select-none">
      {/* Top Engineering Mode Bar & Diagnostic Quick-Pills */}
      <div 
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Left: Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Copilot Persona:
          </span>
          <div className="flex items-center gap-1 p-0.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <button
              onClick={() => setRoleMode('ENGINEERING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                roleMode === 'ENGINEERING' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Propulsion Engineer
            </button>
            <button
              onClick={() => setRoleMode('TECHNICIAN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                roleMode === 'TECHNICIAN' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Line Technician
            </button>
            <button
              onClick={() => setRoleMode('COMMANDER')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                roleMode === 'COMMANDER' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Flight Commander
            </button>
          </div>
        </div>

        {/* Right: Telemetry Cockpit Drawer Toggle & Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCockpitOpen(!cockpitOpen)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              cockpitOpen 
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                : 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle live telemetry cockpit panel"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Telemetry Gauges</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>

          <button
            onClick={exportConversation}
            disabled={messages.length === 0}
            className="p-1.5 rounded-xl border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            style={{ borderColor: 'var(--border)' }}
            title="Download diagnostic conversation transcript"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="p-1.5 rounded-xl border text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            style={{ borderColor: 'var(--border)' }}
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Sidebar + Chat Stream + Telemetry Cockpit */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Left Drawer: Saved Diagnostic Sessions */}
        <div 
          className="w-56 hidden lg:flex flex-col rounded-2xl border p-3 shrink-0"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={handleNewConversation}
            className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 mb-3 shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Diagnostic Session
          </button>

          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 mb-1.5 font-bold">
            Flight Sessions
          </span>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {conversations.map((c) => {
              const isActive = activeConvId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-colors truncate flex items-center gap-2 ${
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

          {/* Active AI Telemetry Status Badge */}
          <div className="p-2.5 rounded-xl border mt-auto text-[11px] space-y-1" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10.5px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>20 Hz Physical Causal Engine</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Real-time residual Z-scores & random forest classification grounded.
            </p>
          </div>
        </div>

        {/* Center: Interactive Chat Interface */}
        <div 
          className="flex-1 flex flex-col rounded-2xl border min-h-0 overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Preset Quick-Actions Carousel Bar */}
          <div className="px-4 py-2 border-b overflow-x-auto flex items-center gap-1.5 scrollbar-none" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 mr-1">
              Quick Scans:
            </span>
            {presetActions.map((act, i) => (
              <button
                key={i}
                onClick={() => handleSend(act.prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 transition-all hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-300"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0">
            {messages.length === 0 && (
              <div className="max-w-xl mx-auto py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    FALCONZ Aerospace Engineering Copilot
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                    Ask natural questions regarding live RPM, harmonic vibration, stator thermal gradients, physics residuals, or component remaining useful life.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 text-left">
                  {presetActions.slice(0, 4).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(p.prompt)}
                      className="p-3 rounded-xl border text-xs transition-all flex items-center justify-between group hover:border-purple-500 hover:shadow-sm"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <span className="font-medium">{p.prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.sender === 'USER';
              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div 
                      className={`p-4 rounded-2xl text-[12.5px] leading-relaxed shadow-sm transition-all ${
                        isUser
                          ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-br-none'
                          : 'border text-slate-900 dark:text-slate-100 rounded-bl-none'
                      }`}
                      style={!isUser ? { background: 'var(--card-subtle)', borderColor: 'var(--border)' } : {}}
                    >
                      <div className="whitespace-pre-line font-normal prose-sm">
                        {m.content}
                      </div>

                      {/* Interactive Bottom Action Toolbar (Audio, Copy, Thumbs) for Copilot */}
                      {!isUser && (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-1.5">
                            {/* Speech Readout Button */}
                            <button
                              onClick={() => toggleSpeak(m.id, m.content)}
                              className={`p-1.5 rounded-lg border flex items-center gap-1 text-[11px] font-medium transition-colors ${
                                speakingMsgId === m.id 
                                  ? 'bg-purple-600 text-white border-purple-500 animate-pulse' 
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                              title={speakingMsgId === m.id ? 'Stop audio' : 'Listen to Copilot response'}
                            >
                              {speakingMsgId === m.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                              <span>{speakingMsgId === m.id ? 'Mute' : 'Voice'}</span>
                            </button>

                            {/* Copy Button */}
                            <button
                              onClick={() => handleCopy(m.id, m.content)}
                              className="p-1.5 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                              title="Copy response"
                            >
                              {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleFeedback(m.id, 'up')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                feedbackGiven[m.id] === 'up' 
                                  ? 'text-emerald-500 bg-emerald-500/10' 
                                  : 'text-slate-400 hover:text-emerald-500'
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(m.id, 'down')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                feedbackGiven[m.id] === 'down' 
                                  ? 'text-rose-500 bg-rose-500/10' 
                                  : 'text-slate-400 hover:text-rose-500'
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive Telemetry Snapshot Evidence Card */}
                    {!isUser && m.evidence && (
                      <div 
                        className="p-3.5 rounded-xl border space-y-2 text-[11px]"
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[10.5px]">
                          <span className="font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            GROUNDED TELEMETRY EVIDENCE
                          </span>
                          <span>Confidence: {m.confidence_pct ? `${m.confidence_pct.toFixed(1)}%` : '98.0%'}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10.5px]">
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Measured RPM</span>
                            <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.rpm_actual || 0}</span>
                          </div>
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Twin Target</span>
                            <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.rpm_expected || 0}</span>
                          </div>
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Stator Temp</span>
                            <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.temperature_c || 0} °C</span>
                          </div>
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Vibration RMS</span>
                            <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.vibration_rms_g || 0} g</span>
                          </div>
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Composite Z</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">{m.evidence.composite_z_score || 0} σ</span>
                          </div>
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Health Index</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.evidence.health_index || 100}%</span>
                          </div>
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Phase Current</span>
                            <span className="font-bold" style={{ color: 'var(--text)' }}>{m.evidence.current_a || 0} A</span>
                          </div>
                          <div className="p-1.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Severity</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{m.severity || 'Nominal'}</span>
                          </div>
                        </div>

                        {/* Action Plan */}
                        {m.recommended_actions && m.recommended_actions.length > 0 && (
                          <div className="pt-2 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-purple-500" /> Maintenance Action SOP
                            </span>
                            {m.recommended_actions.map((act, i) => (
                              <p key={i} className="text-slate-700 dark:text-slate-300 text-[11px] pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-purple-500">
                                {act}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Suggested Follow-Up Chips */}
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
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-purple-600 dark:text-purple-400 animate-pulse py-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold">FALCONZ Copilot is analyzing live telemetry residuals...</p>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Computing 20 Hz Joule dissipation, 1X harmonics & quantile RUL bounds.</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Chat Input Bar with Voice Dictation */}
          <div className="p-3 sm:p-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-3 rounded-xl border transition-all ${
                  isListening 
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/25' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={{ background: isListening ? undefined : 'var(--input-bg)' }}
                title={isListening ? 'Stop listening' : 'Speak your question (Voice dictation)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input with High Contrast */}
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={isListening ? "Listening... Speak your flight question..." : "Ask Copilot: 'Why is Motor 2 hot?', 'Check vibration', 'Is it safe to fly?'..."}
                className="flex-1 rounded-xl px-4 py-3 text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                style={{
                  background: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-md shadow-purple-600/20 transition-all shrink-0 font-bold"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Drawer: Live Telemetry Mini-Cockpit Panel */}
        {cockpitOpen && (
          <div 
            className="w-64 hidden xl:flex flex-col rounded-2xl border p-4 shrink-0 space-y-3.5 overflow-y-auto"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                Live Telemetry Cockpit
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                20 Hz
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Click any metric dial below to instantly ask the Copilot to analyze that parameter.
            </p>

            {/* Metric Dial 1: RPM */}
            <div 
              onClick={() => handleSend("Compare actual RPM against expected digital twin speed.")}
              className="p-3 rounded-xl border cursor-pointer hover:border-purple-500 hover:shadow-xs transition-all group"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">Propulsion RPM</span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 group-hover:underline">Ask ↗</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--text)' }}>
                  {liveRpm} <span className="text-xs font-normal text-slate-400">RPM</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">Twin: {expectedRpm}</span>
              </div>
            </div>

            {/* Metric Dial 2: Stator Temperature */}
            <div 
              onClick={() => handleSend("Analyze why stator core temperature is at current level and project thermal slope.")}
              className="p-3 rounded-xl border cursor-pointer hover:border-purple-500 hover:shadow-xs transition-all group"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">Stator Temperature</span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 group-hover:underline">Ask ↗</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-extrabold tabular-nums ${Number(liveTemp) > 65 ? 'text-amber-500' : ''}`} style={{ color: Number(liveTemp) <= 65 ? 'var(--text)' : undefined }}>
                  {liveTemp} <span className="text-xs font-normal text-slate-400">°C</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">Limit: 75°C</span>
              </div>
            </div>

            {/* Metric Dial 3: Vibration RMS */}
            <div 
              onClick={() => handleSend("Analyze current vibration RMS and identify which motor has the highest harmonic peak.")}
              className="p-3 rounded-xl border cursor-pointer hover:border-purple-500 hover:shadow-xs transition-all group"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">Radial Vibration</span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 group-hover:underline">Ask ↗</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-extrabold tabular-nums ${Number(liveVib) > 0.5 ? 'text-rose-500' : ''}`} style={{ color: Number(liveVib) <= 0.5 ? 'var(--text)' : undefined }}>
                  {liveVib} <span className="text-xs font-normal text-slate-400">g</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">Norm: &lt;0.35g</span>
              </div>
            </div>

            {/* Metric Dial 4: Phase Current */}
            <div 
              onClick={() => handleSend("Analyze phase current draw and calculate Joule dissipation losses.")}
              className="p-3 rounded-xl border cursor-pointer hover:border-purple-500 hover:shadow-xs transition-all group"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">Current Draw</span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 group-hover:underline">Ask ↗</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--text)' }}>
                  {liveCurr} <span className="text-xs font-normal text-slate-400">A</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">Total Pack</span>
              </div>
            </div>

            {/* Metric Dial 5: Composite Residual Z-Score */}
            <div 
              onClick={() => handleSend("Explain how the composite residual score and Z-score are calculated.")}
              className="p-3 rounded-xl border cursor-pointer hover:border-purple-500 hover:shadow-xs transition-all group"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">Composite Residual</span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 group-hover:underline">Ask ↗</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
                  {liveZScore} <span className="text-xs font-normal text-slate-400">σ</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">Warn: &gt;2.0σ</span>
              </div>
            </div>

            {/* Metric Dial 6: Propulsion Health Index */}
            <div 
              onClick={() => handleSend("Why is the propulsion health index at its current level?")}
              className="p-3 rounded-xl border cursor-pointer hover:border-purple-500 hover:shadow-xs transition-all group"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">Health Integrity</span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 group-hover:underline">Ask ↗</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {liveHealth}%
                </span>
                <span className="text-[11px] font-mono text-slate-500">{intel?.health_band || 'HEALTHY'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
