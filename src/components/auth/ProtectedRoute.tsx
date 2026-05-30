import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, role, logout } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to /login keeping track of state
  if (!isAuthenticated || !user || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Define default mapping of paths to allowed roles if not explicitly passed
  // This automatically handles Route Security Guard Matrix
  let isRoleAllowed = true;
  
  if (role === 'MinistryAuditor' || role === 'MINISTRY_AUDITOR' as any) {
    isRoleAllowed = true;
  } else if (allowedRoles) {
    // Map Farmer to SMALLHOLDER_FARMER clean check
    const currentRoleClean = role === 'SMALLHOLDER_FARMER' ? 'Farmer' : role;
    const cleanAllowedRoles = allowedRoles.map(r => r === 'SMALLHOLDER_FARMER' ? 'Farmer' : r);
    isRoleAllowed = (cleanAllowedRoles as string[]).includes(currentRoleClean as string);
  } else {
    // Fallback automatic mapping based on location path prefixes
    const path = location.pathname;
    const currentRoleClean = role === 'SMALLHOLDER_FARMER' ? 'Farmer' : role;

    if (path.startsWith('/silolink')) {
      isRoleAllowed = ['SiloOperator', 'MinistryAuditor', 'LogisticsManager'].includes(currentRoleClean);
    } else if (path.startsWith('/agritrace')) {
      isRoleAllowed = ['ParishChief', 'NAADS_DISTRIBUTOR', 'ExtensionOfficer', 'MinistryAuditor'].includes(currentRoleClean);
    } else if (path.startsWith('/harvestshield')) {
      isRoleAllowed = ['ExtensionOfficer', 'MinistryAuditor'].includes(currentRoleClean);
    } else if (path.startsWith('/ministry')) {
      isRoleAllowed = ['MinistryAuditor'].includes(currentRoleClean);
    }
  }

  // If authenticated but role lacks authorization clearances
  if (!isRoleAllowed) {
    return (
      <div className="min-h-[85vh] w-full flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-lg bg-white border border-red-200 rounded-3xl p-8 space-y-6 shadow-xl text-center">
          
          <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              IAM SECURITY CRITICAL EXCEPTION
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Access Denied & Blocked</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-mono">
              Your security token with clearance <span className="text-red-600 font-bold">'{role}'</span> does not have structural permissions to render this workspace path:
            </p>
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-mono text-[11px] text-[#0ea5e9] truncate">
              {location.pathname}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>AgriOS Home</span>
            </Link>

            <button
              onClick={() => logout()}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              type="button"
            >
              <LogOut className="w-4 h-4" />
              <span>Change Account</span>
            </button>
          </div>

          <p className="text-[9px] text-slate-400 uppercase font-mono tracking-widest leading-none">
            UGANDA GOVERNMENT IAM CORE v2.4
          </p>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}
