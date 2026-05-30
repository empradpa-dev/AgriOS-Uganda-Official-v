import React from 'react';
import { useMutation } from '@/context/MutationContext';
import { Lock } from 'lucide-react';

interface MutationGuardProps {
  action: string;
  children: React.ReactNode;
  fallbackBehavior?: 'disable' | 'hide';
  className?: string;
}

export default function MutationGuard({
  action,
  children,
  fallbackBehavior = 'disable',
  className = ''
}: MutationGuardProps) {
  const { checkMutationAccess, triggerViolation } = useMutation();
  const hasAccess = checkMutationAccess(action);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallbackBehavior === 'hide') {
    return null;
  }

  // Safe blocker to intercept events during view-only sessions
  const handleBlockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerViolation(action);
  };

  return (
    <div 
      className={`relative w-full group ${className}`}
      onClickCapture={handleBlockedClick}
    >
      {/* Transparent Click Intercepting Overlay with cursor-not-allowed */}
      <div className="absolute inset-0 bg-slate-950/5 backdrop-blur-[0.5px] cursor-not-allowed z-30 rounded-lg pointer-events-auto" />
      
      {/* Indicator Signposts: Lock Emblem */}
      <div className="absolute top-2 right-2 bg-slate-900/95 text-[9px] text-amber-500 font-extrabold uppercase font-mono tracking-wider px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1 shadow-md select-none z-40 pointer-events-none opacity-90 group-hover:scale-105 transition-transform duration-200">
        <Lock className="w-2.5 h-2.5 text-amber-400 animate-pulse shrink-0" />
        <span>🔒 VIEW ONLY</span>
      </div>

      {/* Styled Muted Element Container containing the cloned/rendered children */}
      <div className="pointer-events-none opacity-45 grayscale select-none cursor-not-allowed line-through">
        {children}
      </div>
    </div>
  );
}
