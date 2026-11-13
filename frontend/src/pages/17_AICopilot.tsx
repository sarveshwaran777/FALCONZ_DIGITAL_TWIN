import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, MessageSquare, Plus, ArrowRight, 
  CheckCircle, AlertTriangle, AlertOctagon, HelpCircle, Activity,
  RefreshCw, Wrench, Shield
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
  created_at?: string;
}

export const AICopilotPage: React.FC = () => {
  const { systemState, showToast } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Why is the propulsion system health at the current level?",
    "Which motor channel has the highest vibration harmonics?",
    "Compare actual RPM against expected Digital Twin physics RPM.",
    "Explain the current anomaly and recommended maintenance SOP.",
    "What is the predicted remaining useful life (RUL)?"
  ];

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

    const tempUserMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'USER',
      content: text
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.chatAICopilot(text, activeConvId || undefined);
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
          recommended_actions: res.recommended_actions
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      showToast(err.message || 'AI Copilot error', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* Left Sidebar: Conversations History */}
      <div 
        className="w-64 hidden md:flex flex-col rounded-2xl border p-4 select-none shrink-0"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={handleNewConversation}
          className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 mb-4 shadow-md shadow-purple-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Diagnostic Chat
        </button>

        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 mb-2 font-bold">
          Recent Conversations
        </span>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {conversations.map((c) => {
            const isActive = activeConvId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors truncate flex items-center gap-2 ${
                  isActive ? 'bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.title || 'Propulsion Analysis'}</span>
              </button>
            );
          })}
        </div>

        {/* Live Grounding Indicator */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 mt-auto text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>20 Hz Causal Grounding</span>
          </div>
          <p className="text-[10px] text-slate-500">
            OpenAI model receives validated telemetry and physical residuals.
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div 
        className="flex-1 flex flex-col rounded-2xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Chat Top Header */}
        <div className="px-6 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                FALCONZ Engineering Copilot
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AEROSPACE LLM
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Grounded in first-principles physics, real telemetry & random forest classification.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSend("Analyze latest flight telemetry and summarize all degradation factors.")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Run Full Diagnostics
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && (
            <div className="max-w-xl mx-auto py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">How can I assist your propulsion analysis?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask questions about live RPM, current draw, thermal gradients, vibration harmonics, remaining useful life, or component failure modes.
              </p>

              {/* Suggested Questions Grid */}
              <div className="grid grid-cols-1 gap-2 pt-2 text-left">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{p}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
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
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div 
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-600/20'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line prose prose-invert prose-xs">
                      {m.content}
                    </div>
                  </div>

                  {/* Evidence & Telemetry Reference Card (for AI responses) */}
                  {!isUser && m.evidence && (
                    <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400 font-mono">
                        <span className="font-bold uppercase tracking-wider text-purple-400 text-[10px]">
                          TELEMETRY EVIDENCE SNAPSHOT
                        </span>
                        <span>Confidence: {m.confidence_pct ? `${m.confidence_pct.toFixed(1)}%` : '95%'}</span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Actual RPM</span>
                          <span className="text-white font-bold">{m.evidence.rpm_actual || 0}</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Twin Expected</span>
                          <span className="text-white font-bold">{m.evidence.rpm_expected || 0}</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Current Draw</span>
                          <span className="text-white font-bold">{m.evidence.current_a || 0} A</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Temperature</span>
                          <span className="text-white font-bold">{m.evidence.temperature_c || 0} °C</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Vib RMS</span>
                          <span className="text-white font-bold">{m.evidence.vibration_rms_g || 0} g</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Composite Z</span>
                          <span className="text-purple-400 font-bold">{m.evidence.composite_z_score || 0} σ</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Health Index</span>
                          <span className="text-emerald-400 font-bold">{m.evidence.health_index || 100}%</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5">
                          <span className="text-slate-500 block">Severity</span>
                          <span className="text-amber-400 font-bold">{m.severity || 'Nominal'}</span>
                        </div>
                      </div>

                      {/* Action Plan */}
                      {m.recommended_actions && m.recommended_actions.length > 0 && (
                        <div className="pt-2 border-t border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-purple-400" /> Recommended Action
                          </span>
                          {m.recommended_actions.map((act, i) => (
                            <p key={i} className="text-slate-300 text-[10px]">{act}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-purple-400 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>FALCONZ Copilot is analyzing live telemetry residuals...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask FALCONZ Copilot about live telemetry, bearings, thermal limits..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md shadow-purple-600/20 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
