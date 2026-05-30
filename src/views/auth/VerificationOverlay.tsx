import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, AlertTriangle, FileCheck, Server, Key, Landmark } from 'lucide-react';

interface VerificationOverlayProps {
  isOpen: boolean;
  identity: string;
  role: string;
  isOffline: boolean;
  onFinish: () => void;
  errorMsg?: string;
  onDismissError?: () => void;
}

interface Step {
  id: number;
  label: string;
  subLabel: string;
  status: 'pending' | 'loading' | 'success' | 'failed';
  icon: React.ComponentType<any>;
}

export default function VerificationOverlay({
  isOpen,
  identity,
  role,
  isOffline,
  onFinish,
  errorMsg,
  onDismissError
}: VerificationOverlayProps) {
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: 'Connecting to Secure System Switch', subLabel: 'Establishing encrypted gateway handshake', status: 'pending', icon: Server },
    { id: 2, label: 'Querying NIRA Identity Registry', subLabel: 'Validating National Identification Number parameters', status: 'pending', icon: Landmark },
    { id: 3, label: 'Validating Account Allocation & Quotas', subLabel: 'Parsing NAADS entitlement data stores', status: 'pending', icon: Key },
    { id: 4, label: 'Routing to Secure Workspace Domain', subLabel: 'Loading layout view templates', status: 'pending', icon: FileCheck }
  ]);
  
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // Reset steps
      setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
      setActiveStepIndex(0);
      return;
    }

    if (errorMsg) {
      // Fail the current step
      setSteps(prev => prev.map((s, idx) => {
        if (idx === activeStepIndex) return { ...s, status: 'failed' };
        return s;
      }));
      return;
    }

    // Process steps sequentially
    let isMounted = true;
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        if (!isMounted) return;
        
        setActiveStepIndex(i);
        setSteps(prev => prev.map((s, idx) => {
          if (idx === i) return { ...s, status: 'loading' };
          if (idx < i) return { ...s, status: 'success' };
          return s;
        }));

        // Latency for simulation
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 400 : i === 1 ? 500 : 400));
      }

      if (isMounted && !errorMsg) {
        setSteps(prev => prev.map(s => ({ ...s, status: 'success' })));
        onFinish();
      }
    };

    processSteps();

    return () => {
      isMounted = false;
    };
  }, [isOpen, errorMsg]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Animated Badge Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-400 gap-1.5 items-center justify-center"
          >
            <Shield className="w-6 h-6 animate-pulse" />
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </motion.div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight text-white uppercase font-sans">
              AgriOS Identity Firewall
            </h3>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">
              {isOffline ? 'OFFLINE SECURE HANDSHAKE' : 'AUTHENTICATED GATEWAY SECURED'}
            </p>
          </div>
        </div>

        {/* Verification Timeline Cards */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Verification Steps</span>
            <span className="text-[10px] text-emerald-400 font-mono">
              ID Link: {identity.slice(0, 4)}...{identity.slice(-3)}
            </span>
          </div>

          <div className="space-y-3.5">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
                    step.status === 'loading'
                      ? 'bg-slate-800/40 border-slate-700 text-white'
                      : step.status === 'success'
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                      : step.status === 'failed'
                      ? 'bg-red-500/5 border-red-500/20 text-slate-300'
                      : 'bg-transparent border-transparent text-slate-600'
                  }`}
                >
                  {/* Status Ring Indicator */}
                  <div className="shrink-0 mt-0.5 relative">
                    {step.status === 'loading' && (
                      <span className="absolute inset-0 rounded-full border-2 border-slate-400 border-t-white animate-spin"></span>
                    )}
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border ${
                      step.status === 'loading'
                        ? 'border-transparent text-white'
                        : step.status === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : step.status === 'failed'
                        ? 'bg-red-500/10 border-red-500 text-red-500 font-bold'
                        : 'border-slate-800 text-slate-600'
                    }`}>
                      {step.status === 'success' ? '✓' : step.status === 'failed' ? '✖' : step.id}
                    </span>
                  </div>

                  {/* Text labels */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={`text-xs font-semibold ${step.status === 'pending' ? 'text-slate-500' : 'text-slate-100'}`}>
                        {step.label}
                      </p>
                      {step.status === 'loading' && (
                        <span className="text-[8px] uppercase tracking-widest text-[#06B6D4] font-mono animate-pulse">
                          Processing
                        </span>
                      )}
                    </div>
                    <p className={`text-[9.5px] mt-0.5 truncate ${step.status === 'pending' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {step.subLabel}
                    </p>
                  </div>

                  {/* Step Actionable Icon representation */}
                  <div className="shrink-0 self-center">
                    <StepIcon className={`w-4 h-4 ${
                      step.status === 'loading'
                        ? 'text-[#06B6D4]'
                        : step.status === 'success'
                        ? 'text-emerald-500'
                        : step.status === 'failed'
                        ? 'text-red-500'
                        : 'text-slate-700'
                    }`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Error Modal Card if verification fails */}
        {errorMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3 shadow-inner"
          >
            <div className="flex items-start gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">Crisis Alert: Gateway Rejection</span>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-mono">
                  {errorMsg}
                </p>
              </div>
            </div>
            
            <button
              onClick={onDismissError}
              type="button"
              className="w-full bg-red-600/25 hover:bg-red-600/40 text-red-100 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-500/30 transition-all cursor-pointer"
            >
              Acknowledge & Resync
            </button>
          </motion.div>
        )}

        {/* Dynamic bottom status bar */}
        <div className="text-center">
          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
            {errorMsg ? 'SECURE BLOCK ENGAGED' : 'AGRIOS SECURE CRYPTOGRAPHIC HANDSHAKE v2.4'}
          </p>
        </div>

      </div>
    </div>
  );
}
