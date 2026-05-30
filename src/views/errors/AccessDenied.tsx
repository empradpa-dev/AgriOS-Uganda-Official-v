import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldX, ArrowLeft, RefreshCw, Terminal, History } from 'lucide-react';
import { motion } from 'motion/react';

export default function AccessDenied() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturnHome = () => {
    navigate('/');
  };

  const timestamp = new Date().toISOString();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Visual background ambient danger red pulse glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-slate-900/80 border border-red-500/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-red-950/20 flex flex-col items-center text-center space-y-6"
        >
          {/* Obsidian Safe Ring & Heavy Crimson Safety Rings */}
          <div className="relative">
            <div className="absolute inset-x-0 top-0 -translate-y-1 w-20 h-20 bg-red-500/10 rounded-full blur-xl animate-pulse" />
            <div className="p-1 rounded-full border border-red-500/25 animate-pulse">
              <div className="p-2 rounded-full border border-red-500/40">
                <div className="p-4 bg-red-950/60 text-red-500 rounded-2xl border border-red-500/80 flex items-center justify-center shadow-lg shadow-red-500/10">
                  <ShieldX className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                IAM PRIVILEGE EXCEPTION INTERCEPT
              </span>
            </div>
            
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Access Restricted
            </h1>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Your registered NIRA-bound role certificate lacks execution permissions for this functional pathway.
            </p>
          </div>

          {/* Secure Technical Audit Log Box */}
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left font-mono text-[10px] space-y-3 leading-loose text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Security Receipt</span>
              </span>
              <span className="text-red-400">STATUS: PROTECTED</span>
            </div>

            <div className="space-y-1.5 select-all">
              <div>
                <span className="text-slate-500">ERROR_CODE :</span>{' '}
                <span className="text-red-400 font-bold">ERR_AUTH_SECURE_REJECT_403</span>
              </div>
              <div>
                <span className="text-slate-500">TIMESTAMP  :</span>{' '}
                <span className="text-slate-400">{timestamp}</span>
              </div>
              <div>
                <span className="text-slate-500">ACTIVE_USER:</span>{' '}
                <span className="text-slate-400">{user?.fullName || 'UNKNOWN'}</span>
              </div>
              <div>
                <span className="text-slate-500">ROLE_BIND  :</span>{' '}
                <span className="text-indigo-400 font-bold uppercase">{role || 'GUEST_UNAUTHENTICATED'}</span>
              </div>
              <div>
                <span className="text-slate-500">DIAGNOSTIC :</span>{' '}
                <span className="text-slate-400">IP SECURE SHIELD INTERCEPT_BOUNDS_VIOLATION_BLOCKED</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReturnHome}
              className="flex-1 bg-white hover:bg-slate-100 text-[#020617] font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Safety Restitution</span>
            </button>
            <button
              onClick={() => logout()}
              className="flex-1 bg-slate-800 hover:bg-slate-700/80 text-red-400 hover:text-red-300 border border-slate-700 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <History className="w-4 h-4" />
              <span>De-authenticate</span>
            </button>
          </div>
        </motion.div>

        {/* Outer Minimalist Watermark */}
        <div className="mt-8 text-center text-[9px] text-slate-600 font-mono tracking-widest uppercase">
          UGANDA MINISTRY OF AGRICULTURE • DATA PROTECTION INFRASTRUCTURE v2
        </div>
      </div>
    </div>
  );
}
