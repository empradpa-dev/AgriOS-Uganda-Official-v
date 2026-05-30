import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@/context/MutationContext';
import SecuredSidebar from './SecuredSidebar';
import EmergencyDispatchModal from '@/components/EmergencyDispatchModal';
import UserProfileModal from '@/components/UserProfileModal';
import PersonaSandbox from '@/views/sandbox/PersonaSandbox';
import { Shield, ShieldAlert, AlertOctagon, Terminal, X, Lock, FlameKindling, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getRequiredMutationActionForPath = (path: string): string | null => {
  if (path === '/') return null;
  if (path.startsWith('/agritrace/scanner')) return 'AGRITRACE_INTAKE';
  if (path.startsWith('/agritrace/dispatch')) return 'AGRITRACE_DISPATCH';
  if (path.startsWith('/harvestshield/intake')) return 'HARVESTSHIELD_REPORT';
  if (path.startsWith('/harvestshield/broadcast')) return 'LAUNCH_BIORAD_EMERGENCY';
  if (path.startsWith('/harvestshield/map')) return 'HARVESTSHIELD_MAP';
  if (path.startsWith('/silolink/matrix')) return 'SILOLINK_OPERATOR';
  if (path.startsWith('/silolink/moisture')) return 'EDIT_MOISTURE_LOCK';
  if (path.startsWith('/silolink/booking')) return 'SILOLINK_BOOKING';
  if (path.startsWith('/silolink/dispatch')) return 'SILOLINK_OPERATOR';
  if (path.startsWith('/ministry/command')) return 'GEOFENCE_SAFETY_OVERRIDE';
  return null;
};

export default function UnifiedAppGrid({ children }: { children: React.ReactNode }) {
  const { user, role, logout } = useAuth();
  const { violation, dismissViolation, checkMutationAccess } = useMutation();
  const location = useLocation();

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const activePath = location.pathname;
  const currentAction = getRequiredMutationActionForPath(activePath);

  // Determine if current zone is writable for logged-in user
  let isWritableZone = true;
  if (currentAction) {
    isWritableZone = checkMutationAccess(currentAction);
  }

  const isAuditor = role === 'MinistryAuditor' || role === 'MINISTRY_AUDITOR' as any;

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans relative ${
      isAuditor 
        ? 'bg-white text-slate-900 border-slate-200' 
        : 'bg-[#fcfbfc] text-stone-900'
    }`}>
      <SecuredSidebar />
      
      {/* Content Viewport Frame wrapper */}
      <div className={`flex-1 flex flex-col min-h-0 relative ${
        isAuditor 
          ? 'bg-white text-slate-900' 
          : 'bg-stone-50/50'
      }`}>
        
        {/* Dynamic Contextual Status Header Ribbon */}
        <div className={`z-10 flex flex-col shrink-0 ${
          isAuditor 
            ? 'bg-white border-b border-slate-200' 
            : 'bg-white border-b border-black/5'
        }`}>
          
          {/* Master Command Ribbon if active */}
          {isAuditor && (
            <div style={{ backgroundColor: '#ffffff' }} className="border-b border-[#06B6D4]/30 px-6 py-2.5 flex items-center justify-between text-[11px] font-sans text-slate-800 font-bold select-none tracking-wide">
              <div className="flex items-center gap-2">
                <span className="text-amber-500">⚡</span>
                <span>SYSTEM ADMINISTRATOR ACCESS: Full Master Overrides and Cross-Domain Write Permissions Enabled.</span>
              </div>
              <div className="text-[9px] font-mono tracking-wider bg-slate-900 px-2 py-0.5 rounded text-white border border-slate-700 font-bold">
                CORE OVERRIDE SYSTEM ACTIVE
              </div>
            </div>
          )}

          {/* Global Mode Indicator Ribbon */}
          {currentAction ? (
            isWritableZone ? (
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center justify-between text-[11px] font-sans text-emerald-800 font-semibold select-none animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>● ACTIVE ACCESS: Full Records and State Mutations Enabled</span>
                </div>
                <div className="text-[9px] font-mono tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase border border-emerald-500/20">
                  MUTATION GRANTED
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-[11px] font-sans text-amber-850 font-semibold select-none animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>🔒 TRANSPARENCY ACCESS: Historical Records View-Only Mode</span>
                </div>
                <div className="text-[9px] font-mono tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded uppercase border border-amber-500/20 text-amber-800 font-bold">
                  MUTATION LOCKED
                </div>
              </div>
            )
          ) : (
            // Idle Dashboard banner
            <div className={`border-b px-6 py-2 flex items-center justify-between text-[11px] font-sans font-semibold select-none ${
              isAuditor 
                ? 'bg-[#06B6D4]/10 border-[#06B6D4]/20 text-[#06B6D4]' 
                : 'bg-[#06B6D4]/5 border-[#06B6D4]/10 text-cyan-855'
            }`}>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>● SECURE SESSION STATE: Central Cooperative Network Connected</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${isAuditor ? 'text-amber-500' : 'text-cyan-600'}`}>AUDIT LOG ONLINE</span>
            </div>
          )}

          {/* Sub-Header bar */}
          <header style={{ backgroundColor: '#fdfdfd' }} className={`h-14 flex items-center justify-between px-6 ${
            isAuditor 
              ? 'bg-white border-b border-slate-200' 
              : 'bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                isAuditor 
                  ? 'bg-slate-100 border-slate-200 text-slate-500' 
                  : 'bg-stone-100 border-stone-200 text-[#888888]'
              }`}>
                DPI_V2.05_RBAC
              </span>
              <div className={`h-4 w-px ${isAuditor ? 'bg-slate-200' : 'bg-stone-200'}`} />
              <div className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide ${
                isAuditor ? 'text-slate-500' : 'text-stone-500'
              }`}>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>STATE_BROKER SEALS LOGGED</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Persona Testing Switch triggers */}
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center font-bold text-xs shrink-0 select-none cursor-pointer border ${
                  isAuditor 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' 
                    : 'bg-stone-100 hover:bg-stone-200 text-[#1a1a1a] border-stone-200'
                }`}
                title="View active profile & change roles"
              >
                {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
              </button>

              <button 
                onClick={() => setIsEmergencyModalOpen(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  isAuditor 
                    ? 'bg-[#06B6D4] hover:bg-[#0891b2] text-slate-950 font-black' 
                    : 'bg-[#1a1a1a] text-white hover:bg-black'
                }`}
              >
                <span className="material-symbols-rounded text-[14px]">bolt</span>
                <span>Emergency Dispatch</span>
              </button>
            </div>
          </header>
        </div>

        {/* Primary Viewport Main Frame */}
        <main className="flex-1 overflow-y-auto bg-transparent relative pb-[1.5cm]">
          {children}
        </main>

        <EmergencyDispatchModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
        <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        
        {/* Swappable Persona Control Bar Floating Overlay */}
        <PersonaSandbox />
      </div>

      {/* State Transparency Violation slide-over Crimson warning drawer */}
      <AnimatePresence>
        {violation && (
          <>
            {/* Blurry dim backing backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={dismissViolation}
              className="absolute inset-0 bg-stone-950 z-50 pointer-events-auto"
            />

            {/* Slide over Crimson warning block */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#7f1d1d] text-rose-100 z-50 shadow-2xl flex flex-col border-l border-red-500/30 p-8 justify-between font-sans"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-red-950 rounded-2xl border border-red-500">
                    <AlertOctagon className="w-8 h-8 text-rose-500 animate-pulse" />
                  </div>
                  <button 
                    onClick={dismissViolation}
                    className="p-1.5 hover:bg-red-900/40 rounded-full border border-red-500/20 hover:border-red-500/50 cursor-pointer transition-all text-rose-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase bg-red-950 text-red-400 font-black border border-red-800 px-2 py-1 rounded inline-block tracking-widest leading-none">
                    MUTATION INTERCEPT VIOLATION
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    State Change Blocked
                  </h3>
                  <p className="text-xs text-rose-300 font-medium leading-relaxed">
                    You attempted to perform a secure state change operation which falls outside your active credentials scope.
                  </p>
                </div>

                {/* Audit code terminal view */}
                <div className="bg-slate-950/95 border border-red-800/40 rounded-2xl p-4 text-left font-mono text-[10px] space-y-3 leading-loose text-stone-200 select-all shadow-inner">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[9px] uppercase font-bold text-stone-500 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-rose-500" />
                      <span>STATE_BROKER INCIDENT TRAIL</span>
                    </span>
                    <span className="text-rose-400">BLOCKED</span>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-stone-500">CLASH_CODE :</span>{' '}
                      <span className="text-[#06B6D4] font-bold">{violation.code}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">USER       :</span>{' '}
                      <span className="text-stone-400 font-sans">{user?.fullName || 'Anonymous Worker'}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">USER_ROLE  :</span>{' '}
                      <span className="text-amber-500 font-bold uppercase">{violation.userRole}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">ACTION_TAG :</span>{' '}
                      <span className="text-[#06B6D4] font-bold uppercase">{violation.action}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">STATE_MUT  :</span>{' '}
                      <span className="text-rose-400 font-bold uppercase">ABORTED (INTEGRITY SEAL MAINTAINED)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-red-950/40 border border-slate-500/10 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-100 font-bold text-[11px] uppercase font-mono">
                    <Info className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Audit Mitigation Notice</span>
                  </div>
                  <p className="text-[10px] text-rose-300 leading-normal font-sans">
                    The active state ledger has protected system properties from unauthorized overrides. This incident is recorded under Uganda MAAIF DPI policy compliance directives.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={dismissViolation}
                  className="w-full bg-white hover:bg-rose-100 text-rose-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md font-sans"
                >
                  <span>Acknowledge Block & Dismiss</span>
                </button>
                <div className="text-center text-[8px] text-red-400 uppercase tracking-widest font-mono">
                  State Mutation Intercept Shell v2
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
