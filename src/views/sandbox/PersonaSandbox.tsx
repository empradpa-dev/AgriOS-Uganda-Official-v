import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAgriOS } from '@/store/AgriOSContext';
import { User, Role } from '@/types';
import { Users, SlidersHorizontal, ChevronUp, ChevronDown, Check, Shield, UserCheck, Zap, RefreshCw } from 'lucide-react';

interface SandboxPersona {
  roleName: string;
  roleKey: Role;
  username: string;
  identity: string;
  avatarBg: string;
  avatarText: string;
  description: string;
}

const SANDBOX_PERSONAS: SandboxPersona[] = [
  {
    roleName: 'Parish Chief',
    roleKey: 'ParishChief',
    username: 'Betty Nambooze',
    identity: 'CM0987654321ZZ',
    avatarBg: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    avatarText: 'BN',
    description: 'AgriTrace Intake, Biometric Scans, Handover Allocation inputs',
  },
  {
    roleName: 'NAADS Distributor',
    roleKey: 'NAADS_DISTRIBUTOR',
    username: 'Frank Mugisha',
    identity: 'NAADS-552',
    avatarBg: 'bg-blue-100 border-blue-300 text-blue-800',
    avatarText: 'FM',
    description: 'Seed Batch Compilation, QR Waybill Generation, Cargo Dispatches',
  },
  {
    roleName: 'Extension Officer',
    roleKey: 'ExtensionOfficer',
    username: 'Samuel Odongo',
    identity: 'EXT-301',
    avatarBg: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    avatarText: 'SO',
    description: '3-Tap Diagnosis outbreak logging, local quarantine alerts',
  },
  {
    roleName: 'Ministry Auditor',
    roleKey: 'MinistryAuditor',
    username: 'Doreen Alupo',
    identity: 'MINISTRY-101',
    avatarBg: 'bg-purple-100 border-purple-300 text-purple-800',
    avatarText: 'DA',
    description: 'National biosecurity dashboards, national security audit ledger',
  },
  {
    roleName: 'Silo Operator',
    roleKey: 'SiloOperator',
    username: 'Okello Joseph',
    identity: 'SILO-778',
    avatarBg: 'bg-amber-100 border-amber-300 text-amber-805',
    avatarText: 'OJ',
    description: 'Moisture Control Overrides, Drying Routing triggers',
  },
  {
    roleName: 'Smallholder Farmer',
    roleKey: 'SMALLHOLDER_FARMER',
    username: 'Mukasa John',
    identity: '0700000001',
    avatarBg: 'bg-teal-100 border-teal-300 text-teal-800',
    avatarText: 'JM',
    description: 'Reserve storage slots, view warehouse receipts, track grain quotas',
  },
];

export default function PersonaSandbox() {
  const { switchPersona, role: currentRole, user: currentUser } = useAuth();
  const { setCurrentUser } = useAgriOS();
  const [isOpen, setIsOpen] = useState(false);
  const [lastSwapped, setLastSwapped] = useState<string | null>(null);

  const handleSwap = (p: SandboxPersona) => {
    // Generate standard user object corresponding to our selection
    const mockUser: User = {
      id: p.identity === '0700000001' ? 'u1' : p.identity === 'CM0987654321ZZ' ? 'u2' : p.identity === 'EXT-301' ? 'u3' : 'u_rand',
      nin: p.identity.includes('ZZ') ? p.identity : 'CF0000000000AA',
      fullName: p.username,
      role: p.roleKey,
      district: 'Gulu',
      subCounty: 'Bardege',
      parish: 'Layibi',
      contactNumber: '+2567000001',
    };

    // Instant hot state updates Cascading down 
    switchPersona(p.roleKey, mockUser);
    setCurrentUser(mockUser);

    setLastSwapped(p.roleName);
    setTimeout(() => setLastSwapped(null), 1800);
  };

  const activeRoleClean = currentRole || 'GUEST';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-none font-sans font-medium text-xs">
      <div 
        style={{ backgroundColor: '#013001', paddingLeft: '14px', marginLeft: '90px' }}
        className="backdrop-blur-md border border-emerald-900/60 shadow-2xl rounded-2xl p-3.5 pointer-events-auto flex flex-col gap-3"
      >
        {/* Toggle Title Bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 cursor-pointer text-stone-200 hover:text-white focus:outline-none transition-all"
          >
            <div className="p-1 bg-white/10 border border-white/10 rounded-lg animate-pulse">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-mono text-emerald-400/80 tracking-wider">WORKSPACE TESTING SYSTEM</span>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none mt-0.5">
                <span style={{ color: '#c4c4c4' }}>Active Credentials Token Sandbox</span>
                <span className="text-[9px] font-mono tracking-wider font-extrabold text-[#F59E0B] bg-[#F59E0B]/20 border border-[#F59E0B]/30 px-1.5 py-0.5 rounded uppercase">
                  {activeRoleClean}
                </span>
              </h4>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {lastSwapped && (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5 flex items-center gap-1 animate-bounce">
                <Zap className="w-3 h-3 text-emerald-400 shrink-0 fill-current" />
                <span>Instantly Mounted: {lastSwapped}!</span>
              </span>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-stone-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 rounded-lg cursor-pointer transition-all"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Retractable Dashboard panel Grid */}
        {isOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border-t border-white/10 pt-3 animate-in fade-in duration-200">
            {SANDBOX_PERSONAS.map((p) => {
              const worksAsActive = activeRoleClean === p.roleKey;

              return (
                <button
                  key={p.roleKey}
                  onClick={() => handleSwap(p)}
                  className={`p-2.5 rounded-xl border text-left flex gap-2.5 cursor-pointer transition-all group duration-200 relative overflow-hidden select-none ${
                    worksAsActive 
                      ? 'bg-amber-600/20 border-amber-500/50 text-white shadow-md' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-200 hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs select-none ${p.avatarBg} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                    {worksAsActive ? <UserCheck className="w-4 h-4 text-emerald-400" /> : p.avatarText}
                  </div>
                  <div className="flex flex-col min-w-0 pr-1 select-text">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wide leading-none ${worksAsActive ? 'text-white' : 'text-stone-100'}`}>
                        {p.roleName}
                      </span>
                      {worksAsActive && <Check className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 font-extrabold" />}
                    </div>
                    <span className={`text-[10px] italic mt-0.5 truncate leading-tight ${worksAsActive ? 'text-amber-300 font-semibold' : 'text-stone-300'}`}>
                      {p.username}
                    </span>
                    <span className="text-[9px] mt-1 text-stone-400 leading-tight block select-none">
                      {p.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
