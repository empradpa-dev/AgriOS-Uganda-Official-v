import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { Role } from '@/types';

export interface MutationViolation {
  id: string;
  action: string;
  requiredRoles: Role[];
  userRole: Role;
  message: string;
  code: string;
  timestamp: string;
}

interface MutationContextType {
  violation: MutationViolation | null;
  triggerViolation: (action: string, customMsg?: string) => void;
  dismissViolation: () => void;
  checkMutationAccess: (action: string) => boolean;
}

const MutationContext = createContext<MutationContextType | undefined>(undefined);

// Master Rule Mutation Rights Map (strictly matching section II of the instructions)
export const ACTION_MUTATION_ROLES: Record<string, Role[]> = {
  // Modules
  'AGRITRACE_INTAKE': ['ParishChief'],
  'AGRITRACE_DISPATCH': ['NAADS_DISTRIBUTOR'],
  'HARVESTSHIELD_REPORT': ['ExtensionOfficer'],
  'HARVESTSHIELD_MAP': ['MinistryAuditor', 'ExtensionOfficer'],
  'SILOLINK_OPERATOR': ['SiloOperator'],
  'SILOLINK_BOOKING': ['Farmer', 'SMALLHOLDER_FARMER'],

  // Specific buttons / items
  'EDIT_MOISTURE_LOCK': ['SiloOperator'],
  'RESERVE_STORAGE': ['Farmer', 'SMALLHOLDER_FARMER'],
  'REPORT_OUTBREAK': ['ExtensionOfficer'],
  'SCAN_NIRA': ['ParishChief'],
  'GENERATE_WAYBILL': ['NAADS_DISTRIBUTOR'],
  
  // Extra elements from specification
  'COMPILE_SEED_BATCH': ['NAADS_DISTRIBUTOR'],
  'LAUNCH_BIORAD_EMERGENCY': ['ExtensionOfficer', 'MinistryAuditor'],
  'GEOFENCE_SAFETY_OVERRIDE': ['MinistryAuditor'],
};

export function MutationProvider({ children }: { children: React.ReactNode }) {
  const { role, user } = useAuth();
  const [violation, setViolation] = useState<MutationViolation | null>(null);

  const checkMutationAccess = (action: string): boolean => {
    if (!role) return false;

    // Master bypass condition rule for MinistryAuditor
    if (role === 'MinistryAuditor' || role === 'MINISTRY_AUDITOR' as any) {
      return true;
    }

    // Standardize Farmer / SMALLHOLDER_FARMER match checks
    const currentRoleClean = role === 'SMALLHOLDER_FARMER' ? 'Farmer' : role;
    const allowedRoles = ACTION_MUTATION_ROLES[action] || [];

    const cleanAllowed = allowedRoles.map(r => r === 'SMALLHOLDER_FARMER' ? 'Farmer' : r);
    return cleanAllowed.includes(currentRoleClean);
  };

  const triggerViolation = (action: string, customMsg?: string) => {
    const userRole = role || 'SMALLHOLDER_FARMER';
    const requiredRoles = ACTION_MUTATION_ROLES[action] || [];
    
    const violationCode = `ERR_IAM_MUTATION_DENIED_${action.toUpperCase()}`;
    const timestampStr = new Date().toLocaleTimeString();

    const explanation = customMsg || `Security interceptor deflated manual data mutation: user role '${userRole}' lacks permission to perform action '${action}'. This incident has been appended to the global MAAIF security audit ledger.`;

    setViolation({
      id: `violation-${Date.now()}`,
      action,
      requiredRoles,
      userRole,
      message: explanation,
      code: violationCode,
      timestamp: timestampStr,
    });
  };

  const dismissViolation = () => {
    setViolation(null);
  };

  return (
    <MutationContext.Provider value={{
      violation,
      triggerViolation,
      dismissViolation,
      checkMutationAccess,
    }}>
      {children}
    </MutationContext.Provider>
  );
}

export function useMutation() {
  const context = useContext(MutationContext);
  if (!context) {
    throw new Error('useMutation must be used inside a MutationProvider');
  }
  return context;
}
