export type Role = 'Farmer' | 'ParishChief' | 'ExtensionOfficer' | 'SiloOperator' | 'MinistryAuditor' | 'MINISTRY_AUDITOR' | 'LogisticsManager' | 'NAADS_DISTRIBUTOR' | 'SMALLHOLDER_FARMER';

export interface User {
  id: string;
  nin: string;
  fullName: string;
  role: Role;
  district: string;
  subCounty: string;
  parish: string;
  contactNumber: string;
  avatarUrl?: string; // Appended by NIRA proxy
  allocationQuotaTracker?: number;
}

export type AssetType = 'Seedlings' | 'Fertilizers' | 'Pesticides';
export type BatchStatus = 'Procured' | 'InTransit' | 'ReceivedAtParish' | 'DispatchedToCrisis';

export interface AgriculturalBatch {
  id: string;
  sku: string;
  assetType: AssetType;
  totalVolumeWeight: number;
  originSupplier: string;
  waybillCryptographicToken: string;
  status: BatchStatus;
  transitCheckpoints?: string[];
}

export type SyncState = 'OnlineSync' | 'OfflineCached';

export interface InputAllocationTransaction {
  id: string;
  farmerId: string;
  batchId: string;
  authorizedByChiefId: string;
  quantityHandedOver: number;
  handoverTimestamp: string;
  syncState: SyncState;
  smsReceiptId: string;
}

export type OutbreakSeverityScale = 'Low' | 'Medium' | 'Critical';
export type OutbreakStatus = 'Pending' | 'Investigated' | 'ResourceDeployed';

export interface EpidemiologicalReport {
  id: string;
  officerId: string;
  targetCrop: string;
  identifiedThreatVector: string; // e.g., 'Coffee Wilt'
  imageProofUrl: string;
  latitude: number;
  longitude: number;
  severityScale: OutbreakSeverityScale;
  timestamp: string;
  status: OutbreakStatus;
}

export interface CooperativeSiloNode {
  id: string;
  facilityName: string;
  district: string;
  totalCapacityTons: number;
  occupiedSpaceTons: number;
  reservedSpaceTons: number;
  moistureSafetyThreshold: number; // typically 13.5
}

export type StorageQueuePhase = 'InQueue' | 'MechanicalDrying' | 'SafelyStored' | 'Released';

export interface SiloGrainDeposit {
  id: string;
  siloId: string;
  farmerId: string;
  cropType: string;
  netWeightKgs: number;
  measuredMoisturePercentage: number;
  storageQueuePhase: StorageQueuePhase;
  tokenizedWarehouseReceipt: string; // UUID string
  timestamp: string;
}

export type TransitState = 'Available' | 'Booked' | 'Loading' | 'Dispatched' | 'Delivered';

export interface LogisticsJob {
  id: string;
  driverName: string;
  truckCapacityTons: number;
  currentSubCounty: string;
  assignedTargetCluster: string;
  transitState: TransitState;
}

export interface AgriOSState {
  users: User[];
  batches: AgriculturalBatch[];
  transactions: InputAllocationTransaction[];
  reports: EpidemiologicalReport[];
  silos: CooperativeSiloNode[];
  deposits: SiloGrainDeposit[];
  jobs: LogisticsJob[];
}
