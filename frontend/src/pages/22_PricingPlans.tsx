import React, { useState, useEffect } from 'react';
import { 
  Check, Sparkles, Zap, Shield, ArrowRight, Star, RefreshCw 
} from 'lucide-react';
import { useAppStore } from '../state/store';
import { api } from '../services/api';
import { initiateRazorpayCheckout } from '../utils/razorpay';

export const PricingPlansPage: React.FC = () => {
  const { currentPlan, refreshUser, showToast } = useAppStore();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [plans, setPlans] = useState<any[]>([]);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    api.getSubscriptionPlans().then((data) => {
      if (Array.isArray(data)) setPlans(data);
    }).catch(() => {});
  }, []);

  const handleSubscribe = async (planCode: string) => {
    if (planCode === 'FREE') {
      showToast('You are already on the Free tier', 'info');
      return;
    }
    if (planCode === 'ENTERPRISE') {
      showToast('Enterprise plan requires custom quotation. Our aerospace team will reach out!', 'info');
      return;
    }

    setProcessingPlan(planCode);
    initiateRazorpayCheckout(
      planCode,
      billingCycle,
      (res) => {
        showToast(res.message || 'Payment verified! Plan unlocked.', 'success');
        refreshUser();
        setProcessingPlan(null);
      },
      (errMsg) => {
        showToast(errMsg, 'error');
        setProcessingPlan(null);
      }
    );
  };

  return (
    <div className="space-y-10 py-4 w-full">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          COMMERCIAL AEROSPACE SAAS TIERS
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
          Enterprise Propulsion Intelligence
        </h1>
        <p className="text-sm md:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Predict mechanical failures, eliminate in-flight motor burnout, and access AI engineering copilot with certified physics digital twins.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4 select-none">
          <span className={`text-xs ${billingCycle === 'MONTHLY' ? 'font-black text-white' : 'font-semibold text-zinc-400'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(prev => prev === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
            className="w-14 h-7 rounded-full p-1 transition-colors relative border border-zinc-800 bg-black"
          >
            <div 
              className={`w-5 h-5 rounded-full bg-red-600 transition-transform ${
                billingCycle === 'YEARLY' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs flex items-center gap-1.5 ${billingCycle === 'YEARLY' ? 'font-black text-white' : 'font-semibold text-zinc-400'}`}>
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
              SAVE ~17%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.code;
          const isPro = p.code === 'PROFESSIONAL';
          const price = billingCycle === 'YEARLY' ? p.price_yearly_inr : p.price_monthly_inr;
          const isProcessing = processingPlan === p.code;

          return (
            <div
              key={p.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative border ${
                isPro 
                  ? 'border-2 border-red-600 bg-gradient-to-b from-red-950/40 via-zinc-950 to-black shadow-2xl shadow-red-950/40 md:-translate-y-2' 
                  : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700 hover:shadow-lg'
              }`}
            >
              {/* Pro Badge */}
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-600 text-white font-mono font-black text-[10px] tracking-widest uppercase shadow-md flex items-center gap-1 shadow-red-900/50">
                  <Star className="w-3 h-3 fill-white" />
                  MOST POPULAR
                </div>
              )}

              <div>
                {/* Plan Title & Desc */}
                <div className="mb-4">
                  <h3 className="text-lg font-black text-white">{p.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 min-h-[36px] font-medium">{p.description}</p>
                </div>

                {/* Price Display */}
                <div className="mb-6 font-mono">
                  {p.code === 'FREE' ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">₹0</span>
                      <span className="text-xs text-zinc-400">/ forever</span>
                    </div>
                  ) : p.code === 'ENTERPRISE' ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">Custom</span>
                      <span className="text-xs text-zinc-400">/ tailored</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {billingCycle === 'YEARLY' ? '/ yr' : '/ mo'}
                      </span>
                    </div>
                  )}
                  {billingCycle === 'YEARLY' && p.price_monthly_inr > 0 && (
                    <span className="text-[11px] text-red-400 block mt-1 font-bold">
                      (Approx. ₹{Math.round(p.price_yearly_inr / 12)}/mo)
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-4 border-t border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                    <span>Up to <b className="text-white">{p.max_drones}</b> drone aircraft</span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-200">
                    <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                    <span><b className="text-white">{p.ai_queries_limit}</b> AI Copilot queries/mo</span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-200">
                    <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                    <span><b className="text-white">{p.reports_limit}</b> Certified PDF reports/mo</span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-200">
                    <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                    <span><b className="text-white">{p.history_retention_days}</b> days flight history</span>
                  </div>

                  {p.code !== 'FREE' && (
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Check className="w-4 h-4 text-white shrink-0 font-bold" />
                      <span>Data export (CSV / JSON)</span>
                    </div>
                  )}

                  {(p.code === 'PROFESSIONAL' || p.code === 'ENTERPRISE') && (
                    <>
                      <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                        <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                        <span>Quantile RUL Prognostics</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                        <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                        <span>Mission Simulator & Feasibility</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                        <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                        <span>REST API Developer Access</span>
                      </div>
                    </>
                  )}

                  {p.code === 'ENTERPRISE' && (
                    <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                      <Check className="w-4 h-4 text-red-500 shrink-0 font-bold" />
                      <span>Dedicated Solutions Engineer</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-zinc-800">
                <button
                  disabled={isCurrent || isProcessing}
                  onClick={() => handleSubscribe(p.code)}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                      : isPro
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40'
                      : 'bg-white hover:bg-zinc-200 text-black font-black'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing Checkout...
                    </>
                  ) : isCurrent ? (
                    'Current Active Plan'
                  ) : p.code === 'FREE' ? (
                    'Default Plan'
                  ) : p.code === 'ENTERPRISE' ? (
                    'Contact Sales'
                  ) : (
                    <>
                      <span>Upgrade to {p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#09090b] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h4 className="font-bold text-white text-sm">Secure Razorpay Indian Payment Gateway</h4>
            <p className="text-zinc-300">256-bit encrypted checkout supporting UPI, Credit/Debit cards & Net Banking in INR.</p>
          </div>
        </div>
        <div className="font-mono text-[11px] text-red-400 font-bold">
          ● TEST MODE ENABLED (SANDBOX READY)
        </div>
      </div>
    </div>
  );
};
