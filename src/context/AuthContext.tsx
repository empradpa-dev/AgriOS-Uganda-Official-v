import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/types';

export interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  isConnecting: boolean;
  login: (credentials: {
    identity: string;
    secret?: string;
    role: Role;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  simulateNetworkStatusChange: (offline: boolean) => void;
  saveOfflineCredential: (identity: string, secret: string, user: User) => Promise<void>;
  clearCache: () => Promise<void>;
  switchPersona: (role: Role, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to open IndexedDB
const openOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('agri_os_offline_db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('users_cache')) {
        db.createObjectStore('users_cache', { keyPath: 'identity' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Initialize from session on mount
  useEffect(() => {
    // Clear any previous session on fresh app load to guarantee starting from the login page
    sessionStorage.removeItem('agrios_session_user');
    sessionStorage.removeItem('agrios_session_role');
    sessionStorage.removeItem('agrios_session_auth');
    
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    
    const savedOffline = localStorage.getItem('agrios_offline_mode') === 'true';
    setIsOfflineMode(savedOffline);
  }, []);

  // Sync state helper to update standard sessionStorage
  const saveSession = (authenticatedUser: User | null, userRole: Role | null) => {
    if (authenticatedUser && userRole) {
      setUser(authenticatedUser);
      setRole(userRole);
      setIsAuthenticated(true);
      sessionStorage.setItem('agrios_session_user', JSON.stringify(authenticatedUser));
      sessionStorage.setItem('agrios_session_role', userRole);
      sessionStorage.setItem('agrios_session_auth', 'true');
    } else {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem('agrios_session_user');
      sessionStorage.removeItem('agrios_session_role');
      sessionStorage.removeItem('agrios_session_auth');
    }
  };

  // Simulate network status toggling
  const simulateNetworkStatusChange = (offline: boolean) => {
    setIsOfflineMode(offline);
    localStorage.setItem('agrios_offline_mode', String(offline));
    
    // Custom logging for traceability
    console.log(`[AgriOS Security] Network mode switched. Active state: ${offline ? 'OFFLINE_CACHED' : 'ONLINE_SECURE'}`);
  };

  // Save profile credentials to client-side IndexedDB securely for offline login handshakes
  const saveOfflineCredential = async (identity: string, secret: string, userData: User) => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction('users_cache', 'readwrite');
      const store = transaction.objectStore('users_cache');
      
      const entry = {
        identity: identity.trim().toUpperCase(),
        secretHash: secret, // Simulated representation of robust hash token
        user: userData,
        role: userData.role,
        cachedAt: new Date().toISOString()
      };
      
      store.put(entry);
      console.log(`[AgriOS Cache] Offline credentials cached for ${identity}`);
    } catch (e) {
      console.error('[AgriOS Cache] Failed to cache offline credential', e);
    }
  };

  const clearCache = async () => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction('users_cache', 'readwrite');
      const store = transaction.objectStore('users_cache');
      store.clear();
      console.log('[AgriOS Cache] Offline credentials store cleared.');
    } catch (e) {
      console.error('[AgriOS Cache] Failed to clear offline cache', e);
    }
  };

  // Authenticate user
  const login = async (credentials: {
    identity: string;
    secret?: string;
    role: Role;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsConnecting(true);
    
    // Simulate real network/registry verification latency
    await new Promise((resolve) => setTimeout(resolve, 1600));

    const queryIdentity = credentials.identity.trim().toUpperCase();
    const querySecret = credentials.secret ? credentials.secret.trim() : '';

    if (isOfflineMode) {
      // OFFLINE LOGIN - Check IndexedDB
      try {
        const db = await openOfflineDB();
        const cacheMatch = await new Promise<any>((resolve, reject) => {
          const trans = db.transaction('users_cache', 'readonly');
          const store = trans.objectStore('users_cache');
          const request = store.get(queryIdentity);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (cacheMatch && cacheMatch.secretHash === querySecret && cacheMatch.role === credentials.role) {
          saveSession(cacheMatch.user, cacheMatch.role);
          setIsConnecting(false);
          return { success: true };
        } else {
          setIsConnecting(false);
          return { 
            success: false, 
            error: cacheMatch 
              ? 'Local authentication failed: Invalid security key/PIN in offline cache.' 
              : 'Offline lookup failed: No cached credential found for this identity in local storage. Log in online first.' 
          };
        }
      } catch (err) {
        setIsConnecting(false);
        return { success: false, error: 'IndexedDB Access Denied: Could not read cached profiles.' };
      }
    }

    // ONLINE LOGIN - Default preset credentials (also saves to offline cache automatically for seamless future offline access)
    // List of reliable platform users matching roles
    const sampleProfiles: Record<string, { secret: string; user: User }> = {
      // Parish Chief: PIN is '1234'
      'CM0987654321ZZ': {
        secret: '1234',
        user: { id: 'u2', nin: 'CM0987654321ZZ', fullName: 'Betty Nambooze', role: 'ParishChief', district: 'Gulu', subCounty: 'Bardege', parish: 'Layibi', contactNumber: '+256700000002' }
      },
      // Smallholder Farmer: Phone is '+256700000001' or '0700000001', pin/OTP is '5555' 
      '0700000001': {
        secret: '5555',
        user: { id: 'u1', nin: 'CF1234567890AX', fullName: 'Mukasa John', role: 'Farmer', district: 'Gulu', subCounty: 'Bardege', parish: 'Layibi', contactNumber: '+256700000001', allocationQuotaTracker: 2 }
      },
      '+256700000001': {
        secret: '5555',
        user: { id: 'u1', nin: 'CF1234567890AX', fullName: 'Mukasa John', role: 'Farmer', district: 'Gulu', subCounty: 'Bardege', parish: 'Layibi', contactNumber: '+256700000001', allocationQuotaTracker: 2 }
      },
      // Farmer: Phone is '+256700000004' or '0700000004', pin/OTP is '4321'
      '0700000004': {
        secret: '4321',
        user: { id: 'u4', nin: 'CF9988776655EE', fullName: 'Alice Atim', role: 'Farmer', district: 'Mityana', subCounty: 'Ssekanyonyi', parish: 'Busuubizi', contactNumber: '+256700000004', allocationQuotaTracker: 4 }
      },
      '+256700000004': {
        secret: '4321',
        user: { id: 'u4', nin: 'CF9988776655EE', fullName: 'Alice Atim', role: 'Farmer', district: 'Mityana', subCounty: 'Ssekanyonyi', parish: 'Busuubizi', contactNumber: '+256700000004', allocationQuotaTracker: 4 }
      },
      // Extension Officer: passcode 'password'
      'EXT-301': {
        secret: 'password',
        user: { id: 'u3', nin: 'CF2233445566YY', fullName: 'Samuel Odongo', role: 'ExtensionOfficer', district: 'Mityana', subCounty: 'Ssekanyonyi', parish: 'Busuubizi', contactNumber: '+256700000003' }
      },
      // Silo Operator: passcode 'password'
      'SILO-778': {
        secret: 'password',
        user: { id: 'u5', nin: 'CF8877441122AA', fullName: 'Okello Joseph', role: 'SiloOperator', district: 'Gulu', subCounty: 'Bardege', parish: 'Layibi', contactNumber: '+256700000005' }
      },
      // Ministry Auditor: passcode 'password'
      'MINISTRY-101': {
        secret: 'password',
        user: { id: 'u6', nin: 'CF9911223344BB', fullName: 'Doreen Alupo', role: 'MinistryAuditor', district: 'Kampala', subCounty: 'Central', parish: 'Nakasero', contactNumber: '+256700000006' }
      },
      // NAADS Distributor: passcode 'password'
      'NAADS-552': {
        secret: 'password',
        user: { id: 'u7', nin: 'CF7711993388CC', fullName: 'Frank Mugisha', role: 'NAADS_DISTRIBUTOR', district: 'Kampala', subCounty: 'Central', parish: 'Nakasero', contactNumber: '+256700000007' }
      }
    };

    const targetUser = sampleProfiles[queryIdentity];

    if (!targetUser) {
      setIsConnecting(false);
      return { success: false, error: 'Identity Anchor not found. Please review credential parameters.' };
    }

    if (targetUser.secret !== querySecret) {
      setIsConnecting(false);
      return { success: false, error: 'Authentication challenge failed: Invalid password or PIN.' };
    }

    // Role verification matching
    const assignedRole = targetUser.user.role;
    // Map Farmer to SMALLHOLDER_FARMER if needed / they are structurally similar
    const requestedRoleClean = credentials.role === 'SMALLHOLDER_FARMER' ? 'Farmer' : credentials.role;
    const assignedRoleClean = assignedRole === 'Farmer' ? 'Farmer' : assignedRole;

    if (assignedRoleClean !== requestedRoleClean) {
      setIsConnecting(false);
      return { success: false, error: `Clearence check failed: Identity matches role '${assignedRole}' but logged in as '${credentials.role}'.` };
    }

    // Success login!
    saveSession(targetUser.user, credentials.role);
    
    // Automatically cache credentials to local IndexedDB for future offline login comfort
    await saveOfflineCredential(credentials.identity, querySecret, targetUser.user);
    
    setIsConnecting(false);
    return { success: true };
  };

  const logout = () => {
    saveSession(null, null);
  };

  const switchPersona = (newRole: Role, newUser: User) => {
    saveSession(newUser, newRole);
    console.log(`[AgriOS Security] Persona switched to '${newUser.fullName}' (${newRole})`);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated,
      isOfflineMode,
      isConnecting,
      login,
      logout,
      simulateNetworkStatusChange,
      saveOfflineCredential,
      clearCache,
      switchPersona
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
