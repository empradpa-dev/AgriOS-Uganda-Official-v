import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { Lock } from 'lucide-react';

interface RBACGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallbackBehavior?: 'hide' | 'disable';
  customWarningMessage?: string;
}

export default function RBACGuard({
  allowedRoles,
  children,
  fallbackBehavior = 'hide',
  customWarningMessage = 'Requires High-Clearance Credentials'
}: RBACGuardProps) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !role) {
    if (fallbackBehavior === 'hide') return null;
    return (
      <div className="relative border border-slate-200 bg-slate-50/50 rounded-xl p-4 opacity-40 grayscale pointer-events-none select-none">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/10 backdrop-blur-[1px] z-10 rounded-xl">
          <Lock className="w-4 h-4 text-slate-500 mb-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">{customWarningMessage}</span>
        </div>
        {children}
      </div>
    );
  }

  // Normalize check for SMALLHOLDER_FARMER <-> Farmer to protect interoperability
  const currentRoleClean = role === 'SMALLHOLDER_FARMER' ? 'Farmer' : role;
  const cleanAllowedRoles = allowedRoles.map(r => r === 'SMALLHOLDER_FARMER' ? 'Farmer' : r);
  
  const isAllowed = (cleanAllowedRoles as string[]).includes(currentRoleClean as string) || role === 'MinistryAuditor' || role === 'MINISTRY_AUDITOR' as any;

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallbackBehavior === 'hide') {
    return null;
  }

  // Return a beautiful, locked view
  return (
    <div className="relative border border-dashed border-red-200/40 bg-slate-50/40 rounded-xl p-4 opacity-50 grayscale pointer-events-none select-none transition-all">
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-[1.5px] z-10 rounded-xl">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100/90 text-red-700 rounded-full border border-red-200/50 shadow-sm animate-pulse">
          <Lock className="w-3 h-3" />
          <span className="text-[9px] uppercase font-mono font-black tracking-wider">{customWarningMessage}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
