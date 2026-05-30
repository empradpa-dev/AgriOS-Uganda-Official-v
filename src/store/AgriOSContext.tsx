import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  AgriOSState, User, AgriculturalBatch, InputAllocationTransaction, 
  EpidemiologicalReport, CooperativeSiloNode, SiloGrainDeposit, LogisticsJob,
  SyncState, StorageQueuePhase
} from '@/types';
import { generateUUID } from '@/lib/utils';

const initialState: AgriOSState = {
  users: [
    { id: 'u1', nin: 'CF1234567890AX', fullName: 'Mukasa John', role: 'Farmer', district: 'Gulu', subCounty: 'Bardege', parish: 'Layibi', contactNumber: '+256700000001', allocationQuotaTracker: 2 },
    { id: 'u2', nin: 'CM0987654321ZZ', fullName: 'Betty Nambooze', role: 'ParishChief', district: 'Gulu', subCounty: 'Bardege', parish: 'Layibi', contactNumber: '+256700000002' },
    { id: 'u3', nin: 'CF2233445566YY', fullName: 'Samuel Odongo', role: 'ExtensionOfficer', district: 'Mityana', subCounty: 'Ssekanyonyi', parish: 'Busuubizi', contactNumber: '+256700000003' },
    { id: 'u4', nin: 'CF9988776655EE', fullName: 'Alice Atim', role: 'Farmer', district: 'Mityana', subCounty: 'Ssekanyonyi', parish: 'Busuubizi', contactNumber: '+256700000004', allocationQuotaTracker: 4 },
  ],
  batches: [
    { id: 'b1', sku: 'NPK-100', assetType: 'Fertilizers', totalVolumeWeight: 5000, originSupplier: 'Uganda Fertilizers Ltd', waybillCryptographicToken: 'QR-XR3-99M-2026', status: 'ReceivedAtParish', transitCheckpoints: ['Kampala Depot', 'Gulu Weighbridge'] },
    { id: 'b2', sku: 'SD-CF-50', assetType: 'Seedlings', totalVolumeWeight: 2000, originSupplier: 'NAADS Seed Bank', waybillCryptographicToken: 'QR-CFK-11Z-2026', status: 'InTransit', transitCheckpoints: ['Kampala Depot'] }
  ],
  transactions: [
    { id: 't1', farmerId: 'u1', batchId: 'b1', authorizedByChiefId: 'u2', quantityHandedOver: 2, handoverTimestamp: new Date(Date.now() - 86400000).toISOString(), syncState: 'OnlineSync', smsReceiptId: 'SMS-884-2' }
  ],
  reports: [
    { id: 'r1', officerId: 'u3', targetCrop: 'Coffee', identifiedThreatVector: 'Coffee Wilt Disease', imageProofUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80', severityScale: 'Critical', latitude: 0.3476, longitude: 32.5825, timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'Pending' }
  ],
  silos: [
    { id: 's1', facilityName: 'Gulu Cooperative Grain Silo', district: 'Gulu', totalCapacityTons: 5000, occupiedSpaceTons: 3200, reservedSpaceTons: 400, moistureSafetyThreshold: 13.5 },
    { id: 's2', facilityName: 'Mityana Farmers Hub', district: 'Mityana', totalCapacityTons: 2000, occupiedSpaceTons: 1900, reservedSpaceTons: 0, moistureSafetyThreshold: 13.5 }
  ],
  deposits: [],
  jobs: [
    { id: 'j1', driverName: 'Kato Patrick', truckCapacityTons: 10, currentSubCounty: 'Bardege', assignedTargetCluster: 'Gulu Route A', transitState: 'Available' }
  ]
};

interface AgriOSContextType extends AgriOSState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  // AgriTrace
  verifyNIN: (nin: string) => User | null;
  logHandover: (farmerId: string, batchId: string, quantity: number, offline?: boolean) => void;
  syncOfflineTransactions: () => void;
  // HarvestShield
  submitReport: (report: Omit<EpidemiologicalReport, 'id' | 'timestamp' | 'status'>) => void;
  broadcastAlert: (lat: number, lng: number, radiusKm: number, message: string) => number;
  updateReportStatus: (id: string, status: EpidemiologicalReport['status']) => void;
  // SiloLink
  logMoisture: (siloId: string, farmerId: string, cropType: string, weight: number, moisture: number) => void;
  reserveStorage: (siloId: string, farmerId: string, volume: number) => string;
}

const AgriOSContext = createContext<AgriOSContextType | undefined>(undefined);

export function AgriOSPovider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AgriOSState>(initialState);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('agrios_session_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [offlineQueue, setOfflineQueue] = useState<InputAllocationTransaction[]>([]);

  // Periodically check constraints and simulate environment
  useEffect(() => {
    // Environmental mock updates could go here
  }, []);

  const verifyNIN = (nin: string) => {
    return state.users.find(u => u.nin.replace(/\s/g, '').toUpperCase() === nin.replace(/\s/g, '').toUpperCase()) || null;
  };

  const logHandover = (farmerId: string, batchId: string, quantity: number, offline = false) => {
    const tx: InputAllocationTransaction = {
      id: generateUUID(),
      farmerId,
      batchId,
      authorizedByChiefId: currentUser?.id || 'sys',
      quantityHandedOver: quantity,
      handoverTimestamp: new Date().toISOString(),
      syncState: offline ? 'OfflineCached' : 'OnlineSync',
      smsReceiptId: `SMS-${Math.floor(Math.random()*10000)}`
    };

    if (offline) {
      setOfflineQueue(prev => [...prev, tx]);
    }

    setState(prev => {
      // Find farmer and decrement quota
      const newUsers = prev.users.map(u => {
        if (u.id === farmerId && u.allocationQuotaTracker !== undefined) {
          return { ...u, allocationQuotaTracker: Math.max(0, u.allocationQuotaTracker - quantity) };
        }
        return u;
      });
      return { ...prev, users: newUsers, transactions: [...prev.transactions, tx] };
    });
  };

  const syncOfflineTransactions = () => {
    if (offlineQueue.length === 0) return;
    setState(prev => {
       const updatedTxs = prev.transactions.map(t => offlineQueue.find(oq => oq.id === t.id) ? { ...t, syncState: 'OnlineSync' as const } : t);
       return { ...prev, transactions: updatedTxs };
    });
    setOfflineQueue([]);
  };

  const submitReport = (report: Omit<EpidemiologicalReport, 'id' | 'timestamp' | 'status'>) => {
    const fullReport: EpidemiologicalReport = {
      ...report,
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      status: 'Pending'
    };
    setState(prev => ({ ...prev, reports: [...prev.reports, fullReport] }));
  };

  const broadcastAlert = (lat: number, lng: number, radiusKm: number, message: string) => {
    // Simple mock logic to count affected farmers
    const farmers = state.users.filter(u => u.role === 'Farmer');
    // We just return a mock random fraction of farmers for UI effect as we don't store individual coords for them in this demo setup
    return Math.max(1, Math.floor(farmers.length * 0.8));
  };
  
  const updateReportStatus = (id: string, status: EpidemiologicalReport['status']) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => r.id === id ? { ...r, status } : r)
    }));
  }

  const logMoisture = (siloId: string, farmerId: string, cropType: string, weight: number, moisture: number) => {
    const isHighMoisture = moisture > 13.5;
    const phase: StorageQueuePhase = isHighMoisture ? 'MechanicalDrying' : 'SafelyStored';
    
    const deposit: SiloGrainDeposit = {
      id: generateUUID(),
      siloId,
      farmerId,
      cropType,
      netWeightKgs: weight,
      measuredMoisturePercentage: moisture,
      storageQueuePhase: phase,
      tokenizedWarehouseReceipt: generateUUID(),
      timestamp: new Date().toISOString()
    };
    
    setState(prev => {
      const newSilos = prev.silos.map(s => {
        if (s.id === siloId) {
          return { ...s, occupiedSpaceTons: s.occupiedSpaceTons + (weight / 1000) };
        }
        return s;
      });
      return { ...prev, silos: newSilos, deposits: [...prev.deposits, deposit] };
    });
  };

  const reserveStorage = (siloId: string, farmerId: string, volume: number) => {
    const receiptId = generateUUID();
    setState(prev => {
      const newSilos = prev.silos.map(s => {
        if (s.id === siloId) {
          return { ...s, reservedSpaceTons: s.reservedSpaceTons + volume };
        }
        return s;
      });
      return { ...prev, silos: newSilos };
    });
    return receiptId;
  };

  return (
    <AgriOSContext.Provider value={{
      ...state,
      currentUser,
      setCurrentUser,
      verifyNIN,
      logHandover,
      syncOfflineTransactions,
      submitReport,
      broadcastAlert,
      updateReportStatus,
      logMoisture,
      reserveStorage
    }}>
      {children}
    </AgriOSContext.Provider>
  );
}

export const useAgriOS = () => {
  const ctx = useContext(AgriOSContext);
  if (!ctx) throw new Error("useAgriOS must be used within AgriOSPovider");
  return ctx;
};
