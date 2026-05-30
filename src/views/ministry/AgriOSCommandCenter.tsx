import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAgriOS } from '@/store/AgriOSContext';
import { 
  ShieldAlert, Sprout, Building2, Droplets, ArrowUpRight, 
  ArrowDownRight, AlertCircle, Sparkles, RefreshCw, Layers, 
  TrendingUp, AlertTriangle, ShieldCheck, Play, Pause, Power, 
  Activity, User as UserIcon, CheckSquare, ChevronRight, Landmark, Filter, 
  Trash2, PlusCircle, Check, Coins, FileSpreadsheet, Eye, ShieldAlert as Lock, 
  X, HelpCircle, HardDrive, Cpu, Radio, Truck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// Regional aggregate data modeling
interface RegionalAllocation {
  id: string;
  regionName: string;
  districtsCovered: string[];
  totalSeedlingsTarget: number;
  totalSeedlingsDelivered: number;
  totalNPKTarget: number;
  totalNPKDelivered: number;
  utilizationPct: number;
  parishChiefsCount: number;
  primaryCrop: string;
  healthScore: number; // 0-100 rating
}

// Post-harvest data point for operational curves
interface LossPreventionDataPoint {
  month: string;
  traditionalLossPct: number;      // Un-dried/Bypassed wastage curve
  agriosProtectedLossPct: number;   // AgriOS moisture control queue curve
  aflatoxinIncidentsBypassed: number;
  savedTonnageSilos: number;
}

// Custom defined scanned anomaly format
interface AutomatedScanAnomaly {
  id: string;
  sourceTable: 'users' | 'transactions' | 'reports' | 'silos' | 'batches';
  anomalyType: 'DUPLICATE_NIN' | 'OUTBREAK_HOTSPOT' | 'MOISTURE_BYPASS' | 'QUOTA_OVERRUN' | 'LOGISTICS_DRIFT';
  severity: 'CRITICAL' | 'WARNING' | 'COMPLIANCE';
  affectedEntity: string;
  location: string;
  description: string;
  timestamp: string;
  status: 'Critical Alert' | 'Mitigated' | 'Under Investigation';
  metricImpact?: string;
}

export default function AgriOSCommandCenter() {
  const { transactions, reports, silos, batches, users, logMoisture, submitReport, logHandover } = useAgriOS();
  const { role: authRole, user: authUser } = useAuth();
  const navigate = useNavigate();

  // Selected state variables
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [activeDistrictFilter, setActiveDistrictFilter] = useState<'ALL' | 'GULU' | 'MITYANA' | 'MASAKA'>('ALL');
  const [tickerPlaying, setTickerPlaying] = useState<boolean>(true);
  const [selectedAnomalyFilter, setSelectedAnomalyFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'COMPLIANCE'>('ALL');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FINANCE' | 'AGRONOMIC' | 'SECURITY'>('OVERVIEW');
  const [showExplanation, setShowExplanation] = useState<boolean>(true);
  const [auditResolutionLog, setAuditResolutionLog] = useState<Record<string, string>>({});

  // Dynamic state for injected simulation variables
  const [integrityOverrideScore, setIntegrityOverrideScore] = useState<number>(98.4);
  const [manualAnomalies, setManualAnomalies] = useState<AutomatedScanAnomaly[]>([]);
  const [selectedDetailAnomaly, setSelectedDetailAnomaly] = useState<AutomatedScanAnomaly | null>(null);

  // Cross-App State Broker Hardening Alert
  const [brokerWarning, setBrokerWarning] = useState<{ id: string; message: string; timestamp: string } | null>(null);

  // Auditor Command Workspace Overrides State
  const [overrideLogs, setOverrideLogs] = useState<Array<{
    id: string;
    action: string;
    target: string;
    operator: string;
    timestamp: string;
    impact: string;
    leakageDelta: string;
    verified: boolean;
  }>>([
    { id: 'log-01', action: 'GEOFENCE_FORCE_BYPASS', target: 'Wet Silo Hatch - Gulu Hub 4', operator: 'Doreen Alupo (Senior Auditor)', timestamp: '10:42 AM', impact: 'Bypassed automatic wet-grain locking queue to secure emergency drying capacity.', leakageDelta: '₦0 Risk Leakage', verified: true },
    { id: 'log-02', action: 'DUPLICATE_NIN_RESOLVE', target: 'NIN: CF9911223344BB - Doreen A.', operator: 'Doreen Alupo (Senior Auditor)', timestamp: '11:15 AM', impact: 'Manually verified finger hashes. Restored individual crop subsidy quotas.', leakageDelta: '-₦24,500,000 Subsidy Leak Mitigated', verified: true },
    { id: 'log-03', action: 'OVERRUN_QUOTA_RESET', target: 'Farmer: Alice Atim (Mityana)', operator: 'Doreen Alupo (Senior Auditor)', timestamp: '12:05 PM', impact: 'Synchronized negative offline ledger quota discrepancy after physical field check.', leakageDelta: '-₦6,200,000 Subsidy Leak Mitigated', verified: true }
  ]);
  const [fiscalLeakageTotal, setFiscalLeakageTotal] = useState<number>(312450000); 
  const [isOverrideDrawerOpen, setIsOverrideDrawerOpen] = useState<boolean>(false);
  const [wetBatchId, setWetBatchId] = useState<string>('SILO-BATCH-09');
  const [blockedNIN, setBlockedNIN] = useState<string>('CF9988776655EE');
  const [quotaOverrideFarmer, setQuotaOverrideFarmer] = useState<string>('c1');
  const [quotaAmount, setQuotaAmount] = useState<number>(5);

  // Regional configurations (Uganda Districts aggregate stats)
  const [regions, setRegions] = useState<RegionalAllocation[]>([
    {
      id: 'reg-north',
      regionName: 'Northern Pearl Hub',
      districtsCovered: ['Gulu', 'Lira', 'Kitgum'],
      totalSeedlingsTarget: 15000,
      totalSeedlingsDelivered: 12240,
      totalNPKTarget: 9000,
      totalNPKDelivered: 8100,
      utilizationPct: 86.8,
      parishChiefsCount: 24,
      primaryCrop: 'Maize & Sorghum',
      healthScore: 92
    },
    {
      id: 'reg-central',
      regionName: 'Central Grid Area',
      districtsCovered: ['Mityana', 'Luwero', 'Wakiso'],
      totalSeedlingsTarget: 12000,
      totalSeedlingsDelivered: 10800,
      totalNPKTarget: 6000,
      totalNPKDelivered: 4150,
      utilizationPct: 73.2,
      parishChiefsCount: 18,
      primaryCrop: 'Beans & Seedlings',
      healthScore: 84
    },
    {
      id: 'reg-southwest',
      regionName: 'Southwestern Belt',
      districtsCovered: ['Masaka', 'Mbarara', 'Kanungu'],
      totalSeedlingsTarget: 25000,
      totalSeedlingsDelivered: 23500,
      totalNPKTarget: 14000,
      totalNPKDelivered: 13380,
      utilizationPct: 94.5,
      parishChiefsCount: 42,
      primaryCrop: 'Premium Robusta Coffee',
      healthScore: 95
    },
    {
      id: 'reg-east',
      regionName: 'Eastern Border Range',
      districtsCovered: ['Mbale', 'Jinja', 'Iganga'],
      totalSeedlingsTarget: 8000,
      totalSeedlingsDelivered: 4900,
      totalNPKTarget: 5000,
      totalNPKDelivered: 3200,
      utilizationPct: 62.3,
      parishChiefsCount: 12,
      primaryCrop: 'Rice & Maize',
      healthScore: 71
    }
  ]);

  // Operational post-harvest moisture curves data state (Gulu vs Mityana vs Masaka vs general combined)
  const [lossPreventionCurves] = useState<Record<'ALL' | 'GULU' | 'MITYANA' | 'MASAKA', LossPreventionDataPoint[]>>({
    ALL: [
      { month: 'Jan', traditionalLossPct: 28.5, agriosProtectedLossPct: 14.1, aflatoxinIncidentsBypassed: 12, savedTonnageSilos: 140 },
      { month: 'Feb', traditionalLossPct: 27.2, agriosProtectedLossPct: 11.2, aflatoxinIncidentsBypassed: 18, savedTonnageSilos: 195 },
      { month: 'Mar', traditionalLossPct: 29.8, agriosProtectedLossPct: 8.5, aflatoxinIncidentsBypassed: 22, savedTonnageSilos: 280 },
      { month: 'Apr', traditionalLossPct: 26.5, agriosProtectedLossPct: 4.8, aflatoxinIncidentsBypassed: 34, savedTonnageSilos: 420 },
      { month: 'May', traditionalLossPct: 25.1, agriosProtectedLossPct: 3.2, aflatoxinIncidentsBypassed: 41, savedTonnageSilos: 590 },
      { month: 'Jun', traditionalLossPct: 24.3, agriosProtectedLossPct: 2.1, aflatoxinIncidentsBypassed: 48, savedTonnageSilos: 740 }
    ],
    GULU: [
      { month: 'Jan', traditionalLossPct: 32.0, agriosProtectedLossPct: 16.5, aflatoxinIncidentsBypassed: 5, savedTonnageSilos: 50 },
      { month: 'Feb', traditionalLossPct: 30.5, agriosProtectedLossPct: 12.0, aflatoxinIncidentsBypassed: 8, savedTonnageSilos: 80 },
      { month: 'Mar', traditionalLossPct: 34.0, agriosProtectedLossPct: 9.2, aflatoxinIncidentsBypassed: 11, savedTonnageSilos: 110 },
      { month: 'Apr', traditionalLossPct: 29.5, agriosProtectedLossPct: 5.5, aflatoxinIncidentsBypassed: 15, savedTonnageSilos: 190 },
      { month: 'May', traditionalLossPct: 28.0, agriosProtectedLossPct: 3.8, aflatoxinIncidentsBypassed: 22, savedTonnageSilos: 260 },
      { month: 'Jun', traditionalLossPct: 27.2, agriosProtectedLossPct: 2.5, aflatoxinIncidentsBypassed: 29, savedTonnageSilos: 340 }
    ],
    MITYANA: [
      { month: 'Jan', traditionalLossPct: 24.0, agriosProtectedLossPct: 12.0, aflatoxinIncidentsBypassed: 3, savedTonnageSilos: 40 },
      { month: 'Feb', traditionalLossPct: 23.5, agriosProtectedLossPct: 10.5, aflatoxinIncidentsBypassed: 4, savedTonnageSilos: 55 },
      { month: 'Mar', traditionalLossPct: 25.0, agriosProtectedLossPct: 8.0, aflatoxinIncidentsBypassed: 5, savedTonnageSilos: 70 },
      { month: 'Apr', traditionalLossPct: 22.5, agriosProtectedLossPct: 4.2, aflatoxinIncidentsBypassed: 9, savedTonnageSilos: 110 },
      { month: 'May', traditionalLossPct: 21.0, agriosProtectedLossPct: 2.9, aflatoxinIncidentsBypassed: 11, savedTonnageSilos: 150 },
      { month: 'Jun', traditionalLossPct: 20.5, agriosProtectedLossPct: 1.8, aflatoxinIncidentsBypassed: 14, savedTonnageSilos: 190 }
    ],
    MASAKA: [
      { month: 'Jan', traditionalLossPct: 29.0, agriosProtectedLossPct: 13.8, aflatoxinIncidentsBypassed: 4, savedTonnageSilos: 50 },
      { month: 'Feb', traditionalLossPct: 27.5, agriosProtectedLossPct: 11.0, aflatoxinIncidentsBypassed: 6, savedTonnageSilos: 60 },
      { month: 'Mar', traditionalLossPct: 30.5, agriosProtectedLossPct: 8.3, aflatoxinIncidentsBypassed: 8, savedTonnageSilos: 100 },
      { month: 'Apr', traditionalLossPct: 27.5, agriosProtectedLossPct: 4.7, aflatoxinIncidentsBypassed: 10, savedTonnageSilos: 120 },
      { month: 'May', traditionalLossPct: 26.2, agriosProtectedLossPct: 3.0, aflatoxinIncidentsBypassed: 15, savedTonnageSilos: 210 },
      { month: 'Jun', traditionalLossPct: 25.0, agriosProtectedLossPct: 2.0, aflatoxinIncidentsBypassed: 21, savedTonnageSilos: 210 }
    ]
  });

  // Structural Table-Scanning Algorithm
  // Scans all fields in matching contexts (users, reports, transactions, silos) to extract actual anomalies
  const scanSystemicAnomalies = (): AutomatedScanAnomaly[] => {
    const list: AutomatedScanAnomaly[] = [];

    // A. Scan users table for redundant / duplicate NIN lookup profiles 
    const seenNins: Record<string, string[]> = {};
    users.forEach(u => {
      const cleanNIN = u.nin.trim().toUpperCase();
      if (!seenNins[cleanNIN]) {
        seenNins[cleanNIN] = [];
      }
      seenNins[cleanNIN].push(u.fullName);
    });

    Object.entries(seenNins).forEach(([nin, names]) => {
      if (names.length > 1) {
        list.push({
          id: `nin-leak-${nin}`,
          sourceTable: 'users',
          anomalyType: 'DUPLICATE_NIN',
          severity: 'CRITICAL',
          affectedEntity: `NIN Group: ${nin}`,
          location: 'National Lookup Registry / NIRA Proxy',
          description: `Duplicate Identity Mismatch: Identical NIN token registered across multiple farmer records (${names.join(' & ')}). Highly indicative of fraudulent DPI credential splits.`,
          timestamp: 'Live Security Frame',
          status: 'Critical Alert',
          metricImpact: '-₦24,500,000 Subsidy Leak Vector'
        });
      }
    });

    // B. Scan transactions for negative quotas / direct allocation anomalies
    users.forEach(u => {
      if (u.allocationQuotaTracker !== undefined && u.allocationQuotaTracker < 0) {
        list.push({
          id: `quota-leak-${u.id}`,
          sourceTable: 'users',
          anomalyType: 'QUOTA_OVERRUN',
          severity: 'WARNING',
          affectedEntity: u.fullName,
          location: `${u.district} - ${u.subCounty}`,
          description: `Quota Limit Exeeded: Farmer quota deficit is negative (${u.allocationQuotaTracker}). Authorized allocation bypassed localized limits during offline sync merge.`,
          timestamp: 'Live Ledger Audit',
          status: 'Critical Alert',
          metricImpact: 'Oversized fertilizer drawdown'
        });
      }
    });

    // C. Scan reports for critical outbreaks (Sudden regional declines)
    const criticalReports = reports.filter(r => r.severityScale === 'Critical');
    criticalReports.forEach(rep => {
      list.push({
        id: `outbreak-scan-${rep.id}`,
        sourceTable: 'reports',
        anomalyType: 'OUTBREAK_HOTSPOT',
        severity: 'CRITICAL',
        affectedEntity: `${rep.targetCrop} Crop Field Vector`,
        location: `${rep.identifiedThreatVector} Hotspot Matrix`,
        description: `Sudden Agronomic Decline: Highly infectious Pathogen outburst (${rep.identifiedThreatVector}) logged of 'Critical' scale. Rapid dispersion threat within surrounding agricultural clusters!`,
        timestamp: new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: rep.status === 'Pending' ? 'Critical Alert' : 'Mitigated',
        metricImpact: 'Estimated Outbreak Spillage Radius: 12Km'
      });
    });

    // D. Scan moisture alerts (high moisture bypass incidents)
    silos.forEach(s => {
      const riskRatio = s.occupiedSpaceTons / s.totalCapacityTons;
      if (riskRatio > 0.90) {
        list.push({
          id: `silo-capacity-leak-${s.id}`,
          sourceTable: 'silos',
          anomalyType: 'MOISTURE_BYPASS',
          severity: 'COMPLIANCE',
          affectedEntity: s.facilityName,
          location: s.district,
          description: `Storage Threshold Overflow: Volume utilization is critical at ${(riskRatio * 100).toFixed(1)}%. Drying queues throttled. Damp grains are vulnerable to mechanical blockage risks.`,
          timestamp: 'Static Capacity Meter',
          status: 'Under Investigation',
          metricImpact: 'Elevated Post-Harvest decay rate (+8.4% monthly)'
        });
      }
    });

    // Append manual pre-configured anomalies and any simulated triggers
    return [...list, ...manualAnomalies];
  };

  // Live evaluated anomalies feed
  const activeScannedAnomalies = scanSystemicAnomalies();

  // Simulated background ticker loop representing other compliance indicators
  useEffect(() => {
    if (!tickerPlaying) return;

    const interval = setInterval(() => {
      // Inward automatic simulation triggers every 20 seconds
      const simulatedInjections: AutomatedScanAnomaly[] = [
        {
          id: `auto-inject-${Date.now()}-1`,
          sourceTable: 'batches',
          anomalyType: 'LOGISTICS_DRIFT',
          severity: 'WARNING',
          affectedEntity: 'NPK Fertilizer Batch (SD-CF-50)',
          location: 'Gulu-Kampala Corridor',
          description: 'Geofenced GPS Drift Alert: Delivery truck deviating >14.2 km away from specified NAADS agricultural supply bypass route. Unauthorized offloading risk.',
          timestamp: 'Just Now',
          status: 'Critical Alert',
          metricImpact: 'Waybill Corrupted Seal Certificate'
        },
        {
          id: `auto-inject-${Date.now()}-2`,
          sourceTable: 'transactions',
          anomalyType: 'MOISTURE_BYPASS',
          severity: 'COMPLIANCE',
          affectedEntity: 'Silo Input Batch #933',
          location: 'Mityana Farmers Hub',
          description: 'Digital Weight Incoherence: Grains weighed at mechanical dry intake do not align with tokenized warehouse deposit receipts (Variance: +240 Kgs).',
          timestamp: '1 Min Ago',
          status: 'Under Investigation',
          metricImpact: 'System-wide inventory leakage factor'
        }
      ];

      // Pick randomly
      const chosen = simulatedInjections[Math.floor(Math.random() * simulatedInjections.length)];
      setManualAnomalies(prev => {
        // Prevent infinite duplicates
        if (prev.some(x => x.anomalyType === chosen.anomalyType)) return prev;
        return [chosen, ...prev.slice(0, 5)];
      });
      
      // Slightly fluctuate the override integrity index
      setIntegrityOverrideScore(prev => parseFloat((prev + (Math.random() * 0.4 - 0.2)).toFixed(2)));
    }, 15000);

    return () => clearInterval(interval);
  }, [tickerPlaying]);

  // Inject a simulated duplicate NIN lookup manually to demonstrate the table scanner instantly
  const handleTriggerNINFraudSim = () => {
    const simAnomaly: AutomatedScanAnomaly = {
      id: `sim-nin-fraud-${Date.now()}`,
      sourceTable: 'users',
      anomalyType: 'DUPLICATE_NIN',
      severity: 'CRITICAL',
      affectedEntity: 'Biometric Hash: CF1234567890AX',
      location: 'Layibi Parish Gate Terminal',
      description: 'IMMEDIATE FRAUD FLAGGED: Hardware fingerprint token conflict. Duplicate NIN auth request reported simultaneously from Gulu branch and Mityana hub.',
      timestamp: 'Immediate scan trigger',
      status: 'Critical Alert',
      metricImpact: 'Critical Leak Category: Duplicate Allocation Blocked'
    };

    setManualAnomalies(prev => [simAnomaly, ...prev]);
    setBrokerWarning({
      id: `nin-sim-${Date.now()}`,
      message: "Simulated duplicate NIN credential lookup successfully injected! The Real-Time Scanner has flagged this vulnerability.",
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // Inject a sudden regional crop health decline hotspot
  const handleTriggerCropDeclineSim = () => {
    // Inject a report under the hood
    submitReport({
      officerId: 'u3',
      targetCrop: 'Cavendish Bananas',
      identifiedThreatVector: 'Banana Bunchy Top Virus (BBTV) Outbreak Spurt',
      imageProofUrl: 'https://images.unsplash.com/photo-1550989461-0adf9ea622e2?auto=format&fit=crop&q=80',
      latitude: 0.3176,
      longitude: 32.5425,
      severityScale: 'Critical'
    });

    const simAnomaly: AutomatedScanAnomaly = {
      id: `sim-crop-decline-${Date.now()}`,
      sourceTable: 'reports',
      anomalyType: 'OUTBREAK_HOTSPOT',
      severity: 'CRITICAL',
      affectedEntity: 'Banana Plantation Block G',
      location: 'Central Grid Area, Luwero Grid',
      description: 'EPI-ALERT: Live table scanner identified severe crop health index degradation in Banana plantations within Luwero District. Outbreak density exceeded MAAIF critical thresholds.',
      timestamp: 'Live Scan Engine',
      status: 'Critical Alert',
      metricImpact: 'Outbreak containment threat index escalated (+34%)'
    };

    setManualAnomalies(prev => [simAnomaly, ...prev]);
  };

  // 1. Mock Intrusion Attempt Trigger
  const handleSimulateUnauthorizedNav = (targetPath: string) => {
    // Navigate directly thither. The router ProtectedRoute catches this instantly if unauthorized!
    navigate(targetPath);
  };

  // 2. Cross-App State Broker Hardening Logic simulation
  const handleSimulateRogueStateWrite = () => {
    const activeUserName = authUser?.fullName || 'Anonymous Worker';
    const activeUserRole = authRole || 'GUEST_UNAUTHENTICATED';

    // The system context engine parses credentials in state broker layer
    const isAuthorized = ['MinistryAuditor', 'SiloOperator'].includes(activeUserRole);

    const timestampStr = new Date().toLocaleTimeString();

    if (!isAuthorized) {
      // Create blocked warning trace event in UI
      setBrokerWarning({
        id: `block-${Date.now()}`,
        message: `STATE_BROKER BLOCK: Rejected rogue state write attempt to "Central Cooperative Silo Node #s1" by unprivileged user '${activeUserName}' (${activeUserRole}). Write authorization mismatch. Integrity level protected.`,
        timestamp: timestampStr
      });

      // Inject warning report trace directly into the National Security Audit Scanner list
      const rogueAnomaly: AutomatedScanAnomaly = {
        id: `rogue-write-intercept-${Date.now()}`,
        sourceTable: 'silos',
        anomalyType: 'QUOTA_OVERRUN',
        severity: 'CRITICAL',
        affectedEntity: 'Central Silo Node (#s1)',
        location: 'Layibi Parish Block',
        description: `INTRUSION MUTATION INTEGRITY INCIDENT: State broker forcefully deflected unauthorized write transaction attempted by unauthorized role '${activeUserRole}'. Parameters blocked. Transaction signed off.`,
        timestamp: 'Just Now',
        status: 'Critical Alert',
        metricImpact: 'FISCAL_LEAKAGE_RISK - Potential fraud blocked'
      };

      setManualAnomalies(prev => [rogueAnomaly, ...prev]);
      setIntegrityOverrideScore(prev => Math.max(70, parseFloat((prev - 4.5).toFixed(2))));
    } else {
      // Authorized simulated write
      setBrokerWarning({
        id: `auth-${Date.now()}`,
        message: `STATE_BROKER SUCCESS: Authorized state write transaction executed on "Central Cooperative Silo Node #s1" by verified role '${activeUserRole}'. Integrity level maintained.`,
        timestamp: timestampStr
      });

      setIntegrityOverrideScore(prev => Math.min(100, parseFloat((prev + 0.5).toFixed(2))));
    }
  };

  // Resolve anomalies
  const handleRemediateAnomaly = (anomalyId: string) => {
    setAuditResolutionLog(prev => ({
      ...prev,
      [anomalyId]: `Mitigated by Senior Auditor at ${new Date().toLocaleTimeString()} - GPS lockdown/parish freeze command synchronized.`
    }));
    setManualAnomalies(prev => prev.map(a => a.id === anomalyId ? { ...a, status: 'Mitigated' } : a));
    // Reduce leakage on manual mitigations
    setFiscalLeakageTotal(prev => Math.max(0, prev - 24500000));
  };

  // Force open locked wet silo batch override
  const handleForceOpenWetSiloBatch = (batchId: string) => {
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: `ovr-silo-${Date.now()}`,
      action: 'GEOFENCE_FORCE_BYPASS',
      target: `Wet Silo Batch: ${batchId || 'SILO-BATCH-09'}`,
      operator: authUser?.fullName || 'Doreen Alupo (Senior Auditor)',
      timestamp: timestampStr,
      impact: 'Forced dry-cycle ventilation override. Saved 45 T critic wet grain from fermentation.',
      leakageDelta: '-₦18,400,000 Post-Harvest Saving',
      verified: true
    };

    setOverrideLogs(prev => [newLog, ...prev]);
    setFiscalLeakageTotal(prev => Math.max(0, prev - 18400000));
    setIntegrityOverrideScore(prev => Math.min(100, parseFloat((prev + 0.3).toFixed(2))));
  };

  // Clear blocked NIN record duplicate status
  const handleClearBlockedNINRecord = (ninValue: string) => {
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const targetNIN = (ninValue || 'CF9988776655EE').trim().toUpperCase();
    const newLog = {
      id: `ovr-nin-${Date.now()}`,
      action: 'DUPLICATE_NIN_RESOLVE',
      target: `DPI Identity: ${targetNIN}`,
      operator: authUser?.fullName || 'Doreen Alupo (Senior Auditor)',
      timestamp: timestampStr,
      impact: 'Manual audit verification complete. Decentralized biometric conflict resolved.',
      leakageDelta: '-₦24,500,000 Fraud Leakage Rescued',
      verified: true
    };

    setOverrideLogs(prev => [newLog, ...prev]);
    setFiscalLeakageTotal(prev => Math.max(0, prev - 24500000));
    setIntegrityOverrideScore(prev => Math.min(100, parseFloat((prev + 0.6).toFixed(2))));
  };

  // Parish quota allocation bypass override
  const handleManualQuotaBypass = (district: string, amount: number) => {
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: `ovr-quota-${Date.now()}`,
      action: 'OVERRUN_QUOTA_RESET',
      target: `Parish Allocation: ${district || 'Gulu'} (+${amount || 5} Tons Limit)`,
      operator: authUser?.fullName || 'Doreen Alupo (Senior Auditor)',
      timestamp: timestampStr,
      impact: `Authorized auxiliary fertilizer allowance for high-density smallholder parish clusters.`,
      leakageDelta: '-₦6,200,000 Risk Liquidated',
      verified: true
    };

    setOverrideLogs(prev => [newLog, ...prev]);
    setFiscalLeakageTotal(prev => Math.max(0, prev - 6200000));
    setIntegrityOverrideScore(prev => Math.min(100, parseFloat((prev + 0.4).toFixed(2))));
  };

  // Math totals parsed
  const totalSubsidiesHandedOver = transactions.reduce((acc, t) => acc + t.quantityHandedOver, 0);
  const activeAlertsCount = reports.filter(r => r.status === 'Pending').length;
  const currentSiloOccupancy = silos.reduce((acc, s) => acc + s.occupiedSpaceTons, 0);
  const totalCapacitySilos = silos.reduce((acc, s) => acc + s.totalCapacityTons, 0);

  // Selected Region Info
  const selectedRegion = regions.find(r => r.id === selectedRegionId);

  // Recharts Pie Chart configuration for Anomaly distribution breakdown
  const anomalyCategoryCounts = activeScannedAnomalies.reduce((acc, curr) => {
    acc[curr.anomalyType] = (acc[curr.anomalyType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(anomalyCategoryCounts).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];

  return (
    <div id="agrios-executive-deck-root" style={{ backgroundColor: '#ffffff' }} className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans text-stone-900">
      
      {/* 💡 USER EXPLANATION / BLUEPRINT HERO STATEMENT */}
      {showExplanation && (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl relative animate-in fade-in duration-300">
          <div className="space-y-1.5 flex-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider">
                Auditor & Cabinet Persona Active
              </span>
              <span className="text-slate-400 font-mono text-xs">DPI_V2.04_CABINET_PLANNER</span>
            </div>
            <h3 className="font-extrabold text-sm text-yellow-300 tracking-tight">
              Unified Executive M&E Command Center (AgriOSCommandCenter.tsx)
            </h3>
            <p className="text-slate-350 text-xs leading-relaxed max-w-4xl">
              This panel is the core administrative dashboard that aggregates and scans **all underlying live data tables** (Farmers, Parish allocations, Crop Reports, and Silo moisture logs). It is built with super-dense split panes showing multi-domain sub-metrics and regional output health curves to flag systemic fraud loops, duplicate NIN auths, spatial pathogens, or inventory deficits.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button 
              onClick={handleTriggerNINFraudSim}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-slate-700 hover:border-yellow-400 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-yellow-400" />
              <span>Simulate Duplicate NIN</span>
            </button>
            <button 
              onClick={handleTriggerCropDeclineSim}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-705 hover:border-emerald-400 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Crop Hotspot</span>
            </button>
            <button 
              onClick={() => setShowExplanation(false)}
              className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              title="Hide Info Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION WITH INTEGRITY INDEX & COMMAND CONTROL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-stone-900 text-white text-[9px] font-mono font-bold tracking-widest uppercase rounded">
              MAAIF NATIONAL SECURITY & AUDIT
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>LIVE AUDIT AGGREGATOR PING: ACTIVE</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-2.5">
            <Landmark className="w-8 h-8 text-slate-900 shrink-0" />
            <span>National Agricultural Lifecycle Command Center</span>
          </h1>
          <p className="text-stone-500 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Consolidated monitor covering spatial epidemiological containment grids, parish level input subsidy utilization, and public-benefit cooperative grain reservoirs.
          </p>
        </div>

        {/* Dense telemetry indicators */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/95 shadow-sm max-w-sm self-start shrink-0">
          <div className="pr-3.5 border-r border-stone-150">
            <span className="block text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wider">SYSTEM INTEGRITY INDEX</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-indigo-950 tracking-tight">{integrityOverrideScore}%</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                <span>+0.2%</span>
              </span>
            </div>
            <span className="block text-[8px] text-stone-400 mt-0.5 font-mono">DPI Verification Rate</span>
          </div>

          <div className="pl-1 text-right">
            <span className="block text-[9px] font-mono font-bold text-rose-500 uppercase tracking-wider animate-pulse flex items-center justify-end gap-1">
              <Lock className="w-3 h-3" />
              <span>SECURITY ALERTS</span>
            </span>
            <strong className="text-lg font-bold font-mono text-slate-900 block mt-0.5">{activeScannedAnomalies.length} Scanned</strong>
            <button 
              onClick={() => {
                setManualAnomalies([]);
                setAuditResolutionLog({});
                alert("Security databases refreshed. Systemic anomalies re-evaluated.");
              }}
              className="text-[9px] font-mono font-bold text-indigo-600 hover:text-indigo-800 underline block mt-0.5 cursor-pointer"
            >
              Reset Live Feeds
            </button>
          </div>
        </div>
      </div>

      {/* CORE FOUR TILES OF MULTI-DOMAIN SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Financial Utilization Loop */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-stone-400">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                FINANCIAL / LOOP UT-V1
              </span>
              <Coins className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-[11px] block font-semibold text-stone-500 uppercase tracking-wider">National Funding Dispatched</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {(totalSubsidiesHandedOver * 14.2).toFixed(1)}M
              </span>
              <span className="text-xs text-stone-400 font-mono">UGX</span>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-3 pt-2.5 flex justify-between items-center text-[10px] text-stone-500">
            <span>DPI Token Allocation Efficiency:</span>
            <strong className="text-emerald-600 font-bold">92.6%</strong>
          </div>
        </div>

        {/* Metric 2: Parish Level Distribution Tracker */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-stone-400">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                PARISH / AGRITRACE
              </span>
              <Sprout className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[11px] block font-semibold text-stone-500 uppercase tracking-wider">Subsidized Bags Handed Over</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {totalSubsidiesHandedOver.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400">Bags</span>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-3 pt-2.5 flex justify-between items-center text-[10px] text-stone-500">
            <span>Synchronized Offline Units:</span>
            <strong className="text-stone-700 font-mono font-bold">{transactions.length} receipts</strong>
          </div>
        </div>

        {/* Metric 3: Active Crop Outbreak Threats */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-stone-400">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                EPIDEMIOLOGY / THREATS
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-[11px] block font-semibold text-stone-500 uppercase tracking-wider">Active Pathogen Hotspots</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-rose-600 animate-pulse">
                {activeAlertsCount}
              </span>
              <span className="text-xs text-rose-400 font-bold uppercase ml-1 block">CRITICAL GEOS</span>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-3 pt-2.5 flex justify-between items-center text-[10px] text-stone-500">
            <span>Investigated Containment Zone:</span>
            <strong className="text-stone-700 font-bold">{reports.length - activeAlertsCount} resolved</strong>
          </div>
        </div>

        {/* Metric 4: Cooperative Silo Moisture Reserve */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-stone-400">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">
                GRAIN STOCK / SILOLINK
              </span>
              <Building2 className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-[11px] block font-semibold text-stone-500 uppercase tracking-wider">Cooperative Moisture Ledger</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {currentSiloOccupancy.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400 font-mono">/ {totalCapacitySilos.toLocaleString()} Tons</span>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-3 pt-2.5 flex justify-between items-center text-[10px] text-stone-500">
            <span>Cooperative Silo Utilization:</span>
            <strong className="text-cyan-600 font-bold">{((currentSiloOccupancy / totalCapacitySilos) * 100).toFixed(1)}% Capacity</strong>
          </div>
        </div>

      </div>

      {/* DENSE REGIONAL OUTPUT HEALTH CURVES & LAYOUT TRACKERS */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-3">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-700">DPI COMPLIANCE TRACKING GRAPH</span>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>National Crop Output Health & General Allocation Summary Grid</span>
            </h2>
            <p className="text-xs text-stone-500">Click a regional card to overlay transactional audit matrices and seed trace verification telemetry.</p>
          </div>
          <p className="text-[10px] text-stone-400 font-mono italic">
            * Direct lookup derived from consolidated District parish chiefs data-loggers.
          </p>
        </div>

        {/* 4 REGIONAL DETAILED DENSE CARDS GRID PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {regions.map((reg) => {
            const isSelected = selectedRegionId === reg.id;
            const healthColor = reg.healthScore > 90 ? 'text-emerald-600 bg-emerald-50' : reg.healthScore > 80 ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50';

            return (
              <div
                key={reg.id}
                onClick={() => setSelectedRegionId(isSelected ? null : reg.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  isSelected 
                    ? 'bg-slate-50 border-slate-900 shadow-md ring-4 ring-slate-900/5' 
                    : 'bg-white border-stone-200/80 hover:bg-slate-50/50 hover:border-slate-350'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 tracking-tight font-mono uppercase">{reg.regionName}</h3>
                    <span className="text-[10px] text-stone-400 font-sans block mt-0.5 leading-none">
                      Focus: <strong className="text-stone-700 font-mono">{reg.primaryCrop}</strong>
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono ${healthColor}`}>
                    {reg.healthScore}% health
                  </span>
                </div>

                {/* Subsidies Delivered visual stats */}
                <div className="mt-4 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-stone-500 font-medium font-mono">Seedlings Distributed:</span>
                      <strong className="text-stone-900 font-mono font-bold">
                        {reg.totalSeedlingsDelivered.toLocaleString()} <span className="font-normal text-stone-400">/ {reg.totalSeedlingsTarget.toLocaleString()}</span>
                      </strong>
                    </div>
                    {/* Compact visual progress bar */}
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-900 rounded-full transition-all duration-500"
                        style={{ width: `${(reg.totalSeedlingsDelivered / reg.totalSeedlingsTarget) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-stone-500 font-medium font-mono">NPK Fertilizer Bagged:</span>
                      <strong className="text-stone-900 font-mono font-bold">
                        {reg.totalNPKDelivered.toLocaleString()} <span className="font-normal text-stone-400 text-[9px]">/ {reg.totalNPKTarget.toLocaleString()}</span>
                      </strong>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${(reg.totalNPKDelivered / reg.totalNPKTarget) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Compact Footer info */}
                <div className="border-t border-stone-100 mt-3 pt-2 text-[9px] text-stone-400 font-mono flex justify-between items-center">
                  <span>{reg.districtsCovered.join(' • ')}</span>
                  <span className="font-bold text-slate-800">{reg.parishChiefsCount} Chiefs Auth</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* EXPANDED INTERACTIVE AUDITOR CORRELATION DETAILS */}
        {selectedRegionId && selectedRegion && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in slide-in-from-top-3 duration-250">
            <div className="flex justify-between items-center border-b border-stone-200/80 pb-2">
              <div className="flex items-center gap-1.5">
                <ChevronRight className="w-4 h-4 text-slate-900" />
                <h4 className="font-bold text-xs font-mono uppercase text-stone-900">
                  National Auditor Query: Allocation Dispatches Core for {selectedRegion.regionName}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedRegionId(null)}
                className="text-[10px] font-mono font-bold text-stone-400 hover:text-rose-600 uppercase"
              >
                Close Audit Grid
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest block">AUDITOR THREAT ASSESSMENT</span>
                <p className="text-stone-600 leading-relaxed font-sans mt-1">
                  The M&E Ledger verified a consolidated total allocation index of <strong className="text-slate-900">{(selectedRegion.totalSeedlingsDelivered + selectedRegion.totalNPKDelivered).toLocaleString()} bags</strong> dispatched to localized agrarian blocks. Regional output index reports an operational health curve of <strong className="text-emerald-700">{selectedRegion.healthScore}%</strong>.
                </p>
                <div className="pt-1.5">
                  <span className="text-[10px] font-mono text-indigo-700 inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>NAADS Cryptographic Audit Match</span>
                  </span>
                </div>
              </div>

              {/* Live list corresponding directly of transactions */}
              <div className="bg-white p-3 rounded-lg border border-stone-200 md:col-span-2 space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest block">
                  REAL-TIME PARISH TRANSACTION EVIDENCE VERIFIED AT TERMINALS:
                </span>
                <div className="divide-y divide-stone-100 max-h-[140px] overflow-y-auto pr-1">
                  {transactions.slice(0, 5).map((tx) => {
                    const farmer = users.find(u => u.id === tx.farmerId);
                    const chief = users.find(u => u.id === tx.authorizedByChiefId);
                    const batch = batches.find(b => b.id === tx.batchId);

                    return (
                      <div key={tx.id} className="py-2 flex justify-between items-center text-[11px] font-mono">
                        <div className="space-y-0.5">
                          <div>
                            <span className="font-extrabold text-slate-950">{farmer?.fullName || 'John Mukasa'}</span>
                            <span className="text-stone-450"> (NIN: {farmer?.nin})</span>
                          </div>
                          <div className="text-stone-400 text-[10px]">
                            Dispatched: <strong className="text-stone-600">{tx.quantityHandedOver * 100} Kgs</strong> • Authorized by Chief: {chief?.fullName || 'Alice Atim'}
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <span className="text-slate-900 font-bold block">Ref: {tx.smsReceiptId}</span>
                          <span className={`text-[9px] font-bold ${tx.syncState === 'OnlineSync' ? 'text-emerald-600' : 'text-amber-500 animate-pulse'}`}>
                            {tx.syncState === 'OnlineSync' ? '✓ Encoded & Synced' : '⚠️ Offline Buffered'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <p className="text-stone-400 py-4 text-center italic">No localized receipts reported for this region.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUPER-DENSE DUAL PANES LAYOUT SPLITTING OPERATIONAL METRICS (LEFT) & LIVE SYSTEMIC ANOMALY SYSTEM (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN SPLIT PANES (7 COLS): ACTIVE OPERATIONAL DOMAIN TILES */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">M&E DRILLDOWN ENGINE</span>
              <h2 className="text-base font-extrabold text-slate-950 tracking-tight flex items-center gap-1.5">
                <FileSpreadsheet className="w-4.5 h-4.5 text-slate-700" />
                <span>Multi-Domain Dense Performance Panes</span>
              </h2>
            </div>

            {/* TAB SELECTORS FOR SUPER-DENSE SUBPORTALS */}
            <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[10px] font-bold uppercase shrink-0">
              {(['OVERVIEW', 'FINANCE', 'AGRONOMIC', 'SECURITY'] as const).map(tabName => (
                <button
                  key={tabName}
                  onClick={() => setActiveTab(tabName)}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    activeTab === tabName 
                      ? 'bg-slate-950 text-white shadow-xs' 
                      : 'text-stone-500 hover:text-stone-950'
                  }`}
                >
                  {tabName}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1 CONTENT: DENSE PORTAL OVERVIEW (LINE GRAPH SHOWING POST-HARVEST HEALTH CURVES CORES) */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-stone-900 uppercase font-mono">
                    Post-Harvest Loss Prevention Index Curves (SiloLink Metrics)
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Comparing traditional food spoilage levels against AgriOS unified moisture feedback systems.
                  </p>
                </div>

                {/* Sub-port district switcher */}
                <div className="flex bg-stone-100 p-0.5 rounded border border-stone-200 text-[8.5px] font-mono font-black uppercase">
                  {(['ALL', 'GULU', 'MITYANA', 'MASAKA'] as const).map(dist => (
                    <button
                      key={dist}
                      onClick={() => setActiveDistrictFilter(dist)}
                      className={`px-1.5 py-0.5 rounded ${
                        activeDistrictFilter === dist ? 'bg-white text-slate-900 border border-stone-200' : 'text-stone-400 hover:text-slate-900'
                      }`}
                    >
                      {dist === 'ALL' ? 'Uganda Avg' : dist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Embedded Line Chart representing loss prevention curves */}
              <div className="h-60 sm:h-64 w-full bg-stone-50/50 p-2.5 rounded-lg border border-stone-100 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={lossPreventionCurves[activeDistrictFilter]} 
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#78716c', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                      tick={{ fill: '#78716c', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '8px' }} />
                    <ReferenceLine y={13.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Safe Humidity (13.5%)', fill: '#b45309', fontSize: 8, position: 'insideTopLeft' }} />
                    <Area 
                      type="monotone" 
                      dataKey="traditionalLossPct" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTrad)" 
                      name="Bypassed Spoilage Rate"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="agriosProtectedLossPct" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorOS)" 
                      name="Unified Gate Saved Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Curve Analysis Math Stats Breakdown */}
              <div className="grid grid-cols-3 gap-3 divide-x divide-stone-150 p-3 bg-stone-50 border border-stone-200 rounded-xl text-center">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block">SAVED VALUE TONNAGE</span>
                  <strong className="text-base font-black text-slate-900 font-mono">
                    {lossPreventionCurves[activeDistrictFilter].reduce((acc, c) => acc + c.savedTonnageSilos, 0)} Tons
                  </strong>
                  <span className="text-[9px] text-emerald-600 font-bold block">✓ Safe Grains Guarded</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block">DAMP DISCOVERY CLUSTER</span>
                  <strong className="text-base font-black text-rose-600 font-mono">
                    {lossPreventionCurves[activeDistrictFilter].reduce((acc, c) => acc + c.aflatoxinIncidentsBypassed, 0)} Alarms
                  </strong>
                  <span className="text-[9px] text-stone-400 block">Moisture Breached</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block">DRY INTAKE SAVINGS</span>
                  <strong className="text-base font-black text-indigo-900 font-mono">
                    ₦182,500,000
                  </strong>
                  <span className="text-[9px] text-stone-400 block">Prevented Decay Lost</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 CONTENT: FINANCIAL TRACKING (BUDGET SPENT VS ASSIGNED PARISH LOOPS) */}
          {activeTab === 'FINANCE' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-900 uppercase font-mono">National Subsidy Financial Dispatches Loop Matrix</h4>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Detailed analysis of capital spending correlation against active regional parish user enrollments.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Horizontal Bar Chart representing subsidy ratios */}
                <div className="h-52 bg-stone-50 rounded-lg p-2 border border-stone-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={regions}
                      layout="vertical"
                      margin={{ top: 10, right: 10, left: -5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                      <YAxis dataKey="regionName" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#1a1a1a', fontWeight: 'bold' }} width={80} />
                      <Tooltip />
                      <Bar dataKey="totalSeedlingsDelivered" fill="#1e293b" radius={[0, 4, 4, 0]} name="Seedlings Disbursed" />
                      <Bar dataKey="totalNPKDelivered" fill="#4f46e5" radius={[0, 4, 4, 0]} name="NPK Fertilizer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Sub-finance metrics breakdown */}
                <div className="space-y-2 text-xs">
                  <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest block">CAPITAL FLOW AUDIT CONTROL</span>
                  
                  <div className="p-3 bg-indigo-50/55 rounded-xl border border-indigo-100/50 space-y-1.5">
                    <div className="flex justify-between items-center text-indigo-950 font-bold">
                      <span>Live Ledger Integrity Core</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      All funds cleared under code **DPI-NAADS-2026** are linked directly to authenticated national biometric NIN tokens. Live ledger scans protect against ghost farmer enrollments.
                    </p>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>Total Budget Limit:</span>
                      <strong>$2,500,000</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear Handover Value:</span>
                      <strong className="text-slate-900">${(totalSubsidiesHandedOver * 14.5 * 10).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-1 text-slate-900 font-bold">
                      <span>Unallocated Reserve:</span>
                      <span>$2,145,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3 CONTENT: AGRONOMIC containment status (HarvestShield Alerts Matrix list) */}
          {activeTab === 'AGRONOMIC' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-900 uppercase font-mono">HarvestShield Epidemiological Vector Ledger</h4>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Analyzing density vector indices of reported crop outbreaks parsed via official 3-Tap diagnostic telemetry.
                </p>
              </div>

              {/* Table displaying reports */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white max-h-[190px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 uppercase text-[9px] font-bold">
                      <th className="p-2.5">Crop</th>
                      <th className="p-2.5">Threat Pathogen</th>
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150">
                    {reports.map((rep) => {
                      const isCritical = rep.severityScale === 'Critical';
                      const isPending = rep.status === 'Pending';

                      return (
                        <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 font-bold text-slate-900">{rep.targetCrop}</td>
                          <td className="p-2.5 text-stone-600">{rep.identifiedThreatVector}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              isCritical ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rep.severityScale}
                            </span>
                          </td>
                          <td className="p-2.5 text-stone-400 text-[10px]">
                            {new Date(rep.timestamp).toLocaleDateString()}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              isPending ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {rep.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-stone-400 italic">No epidemiological threat vectors recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Containment statistics row */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-bold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>National Quarantine Protocols Synced: 100% of spatial threat logs matching geofenced quarantine barriers.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4 CONTENT: TECHNICAL DPI SECURED MATRIX */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs text-stone-800">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-stone-900 uppercase font-mono">DPI National Security Audit Standard System</h4>
                <p className="text-[11px] text-stone-500 leading-tight font-sans">
                  Active stress testing sandbox, cross-app state broker hardening, and geofence status.
                </p>
              </div>

              {/* Status Alert and Broker Intercept Logs */}
              {brokerWarning && (
                <div className="p-3 bg-red-950 text-red-100 border border-red-800 rounded-xl space-y-1 animate-bounce font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-red-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>REALTIME INTERCEPT DEFLECTION</span>
                    </span>
                    <span className="text-stone-500">{brokerWarning.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-stone-300">{brokerWarning.message}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono w-full">
                <div className="bg-slate-900 text-slate-350 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">NIRA PROXY TELEMETRY BASE</span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Proxy API Socket:</span>
                      <span className="text-emerald-400 font-bold">CONNECTED (Port 443)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Credentials:</span>
                      <strong className="text-white uppercase font-sans">{authRole || 'Not Selected'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>State Broker Seal:</span>
                      <strong className="text-indigo-400 font-bold">MUTATION GUARD ENABLED</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Integrity Index Score:</span>
                      <span className={`${integrityOverrideScore > 90 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                        {integrityOverrideScore}% Secure
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block">SECURITY BY CONTRACT LAW</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                    According to the PDM digital fraud block mandate, duplicate NIN lookups trigger temporary parish-wide subsidy lockouts. National planners audit this telemetry curve to secure public agriculture funds against double withdrawals.
                  </p>
                </div>
              </div>

              {/* Interactive Staging Tests Panel */}
              <div className="border border-stone-200 bg-white rounded-xl p-4 space-y-3 font-sans">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block font-bold">INTERACTIVE TESTING SUITE</span>
                  <h5 className="text-xs font-bold text-stone-900 uppercase">IAM Stress Testing Sandbox</h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="border border-stone-150 rounded-xl p-3 bg-stone-50 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase inline-block">
                        1. Route Intrusion Test
                      </span>
                      <p className="text-[11px] text-stone-500 leading-normal">
                        Simulate routing directly to unprivileged view paths without landing page redirects to verify absolute Router gate interceptions.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-500 uppercase font-mono bg-white p-1.5 rounded border border-dashed text-center">
                        Active Simulated Role: <strong className="text-indigo-600 font-black">{authRole || 'GUEST'}</strong>
                      </div>
                      
                      <button
                        onClick={() => handleSimulateUnauthorizedNav('/silolink/moisture')}
                        className="w-full text-left bg-white hover:bg-slate-900 hover:text-white border border-stone-300 transition-colors py-2 px-2.5 rounded-lg text-xs font-mono font-medium flex items-center justify-between cursor-pointer shadow-sm text-stone-700 hover:border-slate-800"
                      >
                        <span>Navigate `/silolink/moisture`</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleSimulateUnauthorizedNav('/agritrace/scanner')}
                        className="w-full text-left bg-white hover:bg-slate-900 hover:text-white border border-stone-300 transition-colors py-2 px-2.5 rounded-lg text-xs font-mono font-medium flex items-center justify-between cursor-pointer shadow-sm text-stone-700 hover:border-slate-800"
                      >
                        <span>Navigate `/agritrace/scanner`</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="border border-stone-150 rounded-xl p-3 bg-stone-50 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-bold uppercase inline-block font-sans">
                        2. State Broker Overrun Test
                      </span>
                      <p className="text-[11px] text-stone-500 leading-normal">
                        Simulate an execution loop trying to inject rogue grain moisture overrides directly into global state. Broker blocks unprivileged requests.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 text-stone-800">
                      <button
                        onClick={handleSimulateRogueStateWrite}
                        className="w-full bg-[#1a1a1a] hover:bg-black text-white text-center py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 shadow"
                      >
                        <span>Execute Rogue State Modification</span>
                      </button>
                      <span className="text-[9px] text-stone-400 block text-center italic">
                        Logs instant deflected intrusion triggers in Audit Scanner panel.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN (5 COLS): LIVE REAL-TIME AUDIT TELEMETRY SCANNER WITH CRITICAL DETECTIONS */}
        <div 
          style={{
            paddingRight: '20px',
            paddingLeft: '20px',
            paddingBottom: '20px',
            paddingTop: '20px',
            marginLeft: '0px',
            marginRight: '0px',
            marginTop: '0px',
            marginBottom: '0px',
          }}
          className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col h-[520px] relative overflow-hidden"
        >
          
          <div className="shrink-0 space-y-2.5 pb-3 border-b border-stone-150">
            <div className="flex justify-between items-center gap-1.5 flex-wrap">
              <div className="space-y-0.5">
                <span className="text-[9px] bg-rose-50 border border-rose-250 text-rose-900 rounded px-2 py-0.5 font-bold uppercase font-mono">
                  ANOMALY DETECTION CORE
                </span>
                <h2 className="text-base font-extrabold text-slate-950 mt-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                  <span>National Security Audit Scanner</span>
                </h2>
              </div>

              {/* Pause Play status Indicator info */}
              <button 
                onClick={() => setTickerPlaying(!tickerPlaying)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                  tickerPlaying 
                    ? 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100' 
                    : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                }`}
              >
                {tickerPlaying ? (
                  <>
                    <Pause className="w-3 h-3 text-rose-600" />
                    <span>SCANNING LIVE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-stone-500" />
                    <span>SCANNER PAUSED</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-tight">
              Runs computerized algorithms iterating over base data structures to catch double NIN registrations, logistics deviations, and mechanical drying grid bypass incidents.
            </p>

            {/* Severity Filter selectors */}
            <div className="flex gap-1.5 text-[9.5px] items-center text-stone-500 font-mono pt-1">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <span>Filter Severity:</span>
              <div className="flex gap-1 cursor-pointer">
                {(['ALL', 'CRITICAL', 'WARNING', 'COMPLIANCE'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSelectedAnomalyFilter(sev)}
                    className={`px-1.5 py-0.5 rounded text-[8.5px] font-black font-mono transition-all ${
                      selectedAnomalyFilter === sev 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIVE SCROLLABLE SCANNED ANOMALIES LIST */}
          <div className="flex-grow overflow-y-auto space-y-2.5 pt-3 pr-1 max-h-[250px]">
            {activeScannedAnomalies
              .filter(an => selectedAnomalyFilter === 'ALL' || an.severity === selectedAnomalyFilter)
              .length === 0 ? (
                <div className="py-12 text-center text-stone-400 italic text-xs font-mono space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p>All database registers fully healthy. Zero systemic anomalies flagged.</p>
                </div>
            ) : (
              activeScannedAnomalies
                .filter(an => selectedAnomalyFilter === 'ALL' || an.severity === selectedAnomalyFilter)
                .map((an) => {
                  const isCritical = an.severity === 'CRITICAL';
                  const isWarning = an.severity === 'WARNING';
                  const isMitigated = an.status === 'Mitigated';

                  return (
                    <div 
                      key={an.id}
                      onClick={() => setSelectedDetailAnomaly(an)}
                      className={`p-3 rounded-xl border-l-4 cursor-pointer text-left transition-all ${
                        isMitigated 
                          ? 'bg-slate-50 border-stone-405 border opacity-60' 
                          : isCritical 
                          ? 'bg-rose-50/70 border-rose-600 border-y border-r border-rose-100 hover:bg-rose-50 shadow-xs' 
                          : isWarning
                          ? 'bg-amber-50 border-amber-500 border-y border-r border-amber-150 hover:bg-amber-50'
                          : 'bg-indigo-50/50 border-indigo-400 border-y border-r border-indigo-100 hover:bg-indigo-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded leading-none border ${
                              isCritical 
                                ? 'bg-rose-100 text-rose-900 border-rose-250 animate-pulse' 
                                : isWarning
                                ? 'bg-amber-100 text-amber-900 border-amber-250'
                                : 'bg-indigo-100 text-indigo-950 border-indigo-150'
                            }`}>
                              {an.anomalyType.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-stone-400 font-mono">{an.timestamp}</span>
                            <span className="text-[9px] text-indigo-900 font-bold uppercase">{an.location}</span>
                          </div>

                          <p className={`text-[11px] leading-tight font-sans font-bold ${isMitigated ? 'line-through text-stone-450' : 'text-stone-900'}`}>
                            {an.description}
                          </p>

                          {an.metricImpact && (
                            <span className="text-[9px] font-mono font-bold text-rose-600 block bg-rose-50/50 px-1 py-0.5 rounded w-max mt-0.5">
                              ⚠️ Impact: {an.metricImpact}
                            </span>
                          )}

                          {auditResolutionLog[an.id] && (
                            <p className="text-[10px] font-mono text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-100 mt-1">
                              {auditResolutionLog[an.id]}
                            </p>
                          )}
                        </div>

                        {/* Mitigation Buttons */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            isMitigated 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                              : isCritical 
                              ? 'bg-rose-100 text-rose-900 border border-rose-200' 
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {an.status}
                          </span>

                          {!isMitigated && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemediateAnomaly(an.id);
                              }}
                              className="px-2 py-1 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[9px] font-extrabold uppercase rounded shadow-xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>Audit Seal</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* PERSISTENT REAL-TIME LOG FOOTER WARNING BANNER */}
          <div 
            style={{ marginRight: '0px', marginBottom: '-42px' }}
            className="mt-auto shrink-0 bg-slate-900 text-slate-100 rounded-xl p-3 flex items-center gap-3 text-xs shadow-md border border-slate-800"
          >
            <Lock className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="leading-tight space-y-0.5">
              <span className="font-extrabold text-yellow-400 block uppercase font-mono text-[9px] tracking-wider">
                PDM CONFLICT-RESOLUTION HANDSHAKE PROTOCOL
              </span>
              <span className="opacity-85 text-[10px] block leading-snug">
                Scanner automatically runs localized validation hashes. Authorized bypass blocks are synchronized at Parish cloud gateways upon audit check completion.
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ANOMALY DETAILS MODAL / DEEPMAP BLOCK OUT OVERLAY TYPE */}
      {selectedDetailAnomaly && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-slate-900 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-stone-200 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-widest block">
                  NATIONAL EXECUTIVE SECURITY LOG
                </span>
                <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Lock className="w-5 h-5 text-rose-500" />
                  <span>Security Overrun Telemetry Query</span>
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetailAnomaly(null)}
                className="p-1 hover:bg-stone-100 rounded-full text-stone-500 hover:text-stone-900 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase">FLAG CATEGORY</span>
                  <strong className="text-stone-900">{selectedDetailAnomaly.anomalyType}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase">SEVERITY LEVEL</span>
                  <strong className={`font-black ${selectedDetailAnomaly.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-500'}`}>
                    {selectedDetailAnomaly.severity}
                  </strong>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] text-stone-400 block uppercase">AFFECTED NODE</span>
                  <strong className="text-stone-900">{selectedDetailAnomaly.affectedEntity}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] text-stone-400 block uppercase">REGIONAL CLUSTER</span>
                  <strong className="text-indigo-900">{selectedDetailAnomaly.location}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-stone-400 block uppercase">TELEMETRY DIAGNOSTIC SYNOPSIS</span>
                <p className="text-stone-800 leading-relaxed font-sans text-xs bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                  {selectedDetailAnomaly.description}
                </p>
              </div>

              {selectedDetailAnomaly.metricImpact && (
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase">FISCAL DEFICIT DANGER IMPACT</span>
                  <span className="text-rose-700 font-bold block">{selectedDetailAnomaly.metricImpact}</span>
                </div>
              )}

              {auditResolutionLog[selectedDetailAnomaly.id] && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
                  <span className="text-[8.5px] font-bold uppercase block text-emerald-800">AUDIT CLEARANCE CERTIFICATE</span>
                  <span className="text-[11px] block mt-0.5">{auditResolutionLog[selectedDetailAnomaly.id]}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-200 pt-4">
              <button 
                onClick={() => setSelectedDetailAnomaly(null)}
                className="px-3 py-1.5 border border-stone-300 hover:border-slate-800 font-bold max-text-[12px] rounded-lg transition-colors cursor-pointer"
              >
                Close Query
              </button>
              {selectedDetailAnomaly.status !== 'Mitigated' && (
                <button 
                  onClick={() => {
                    handleRemediateAnomaly(selectedDetailAnomaly.id);
                    setSelectedDetailAnomaly(null);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold max-text-[12px] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Mitigate & Freeze Route</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 💸 LIVE FISCAL LEAKAGE RISK TICKER & ADMINISTRATIVE COMMAND CONTROLS */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl border border-slate-700/60 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        
        {/* Animated glowing background grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25"></div>

        <div className="relative flex items-center gap-4 flex-1">
          <div className="p-3 bg-cyan-950/80 rounded-2xl border border-cyan-500/30 shrink-0">
            <Coins className="w-8 h-8 text-[#06B6D4] animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black text-[#06B6D4] uppercase tracking-widest block">
              REAL-TIME NATIONAL BUDGETARY DRAIN ESTIMATOR
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                ₦{fiscalLeakageTotal.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 font-bold animate-pulse">
                <ShieldAlert className="w-3 h-3" />
                <span>ACTIVE DRAIN RISK</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Scrolling Ticker Content */}
        <div className="relative flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 h-12 overflow-hidden w-full md:max-w-md flex items-center">
          <div className="w-full flex flex-col text-xs font-mono text-[#06B6D4]">
            <div className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold flex items-center justify-between">
              <span>LEDGER STATE STREAM</span>
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
            </div>
            <div className="mt-0.5 h-5 overflow-hidden relative">
              <div className="absolute w-full leading-tight select-none">
                {overrideLogs.length > 0 ? (
                  <div className="truncate text-stone-200">
                    <strong className="text-[#10B981]">{overrideLogs[0].action}</strong>: {overrideLogs[0].target} ({overrideLogs[0].leakageDelta})
                  </div>
                ) : (
                  <div className="truncate text-slate-400">
                    Monitoring system biometrics and dry silo geofence locks...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button to launch the Master Override Controls Drawer */}
        <div className="relative shrink-0 w-full md:w-auto">
          <button
            onClick={() => setIsOverrideDrawerOpen(true)}
            className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <span className="material-symbols-rounded text-base">construction</span>
            <span>Open Override Workspace</span>
          </button>
        </div>
      </div>

      {/* 🛠️ MASTER SYSTEM OVERRIDE WORKSPACE SIDE-DRAWER */}
      <AnimatePresence>
        {isOverrideDrawerOpen && (
          <>
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOverrideDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 pointer-events-auto"
            />

            {/* Glowing slate drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-slate-950 text-slate-100 z-50 shadow-2xl flex flex-col border-l border-slate-800 p-6 md:p-8 justify-between font-sans overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                      <Cpu className="w-6 h-6 text-[#06B6D4]" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-black text-amber-500 uppercase tracking-widest block">
                        ADMINISTRATIVE COMMAND CONSOLE
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                        System Override workspace
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOverrideDrawerOpen(false)}
                    className="p-1.5 hover:bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 cursor-pointer transition-all text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Live Audit Counters */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">BUDGET LEAK STABILIZED</span>
                    <strong className="text-base text-emerald-400 block mt-1">
                      ₦{(312450000 - fiscalLeakageTotal).toLocaleString()} Saved
                    </strong>
                  </div>
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">SYSTEM INTEGRITY RECORD</span>
                    <strong className="text-base text-cyan-400 block mt-1">
                      {integrityOverrideScore}% Secure
                    </strong>
                  </div>
                </div>

                {/* Interactive Controls Segment */}
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-black">
                    EXECUTE SIGNATURE OVERRIDES
                  </span>

                  {/* Override Action 1: Force open Silo */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <HardDrive className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-extrabold text-white uppercase font-sans">Silo Geofence Hatch Bypass</h4>
                        <p className="text-[11px] text-slate-400 leading-normal mt-0.5 font-sans">
                          Force-releases a wet or delayed grain batch from automated lock queues to avoid localized Cooperative decay metrics.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <select
                          value={wetBatchId}
                          onChange={(e) => setWetBatchId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-[#06B6D4] focus:outline-none focus:border-cyan-500"
                        >
                          <option value="SILO-BATCH-09">SILO-BATCH-09 (Wet Gulu Hub - 14.5% H2O)</option>
                          <option value="SILO-BATCH-14">SILO-BATCH-14 (Wet Mityana Hub - 15.2% H2O)</option>
                          <option value="SILO-BATCH-22">SILO-BATCH-22 (Damp Masaka Reservoir - 13.9% H2O)</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleForceOpenWetSiloBatch(wetBatchId)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-lg cursor-pointer transition-all font-sans shrink-0"
                      >
                        Bypass Lock
                      </button>
                    </div>
                  </div>

                  {/* Override Action 2: Clear duplicate NIN */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <UserIcon className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-extrabold text-white uppercase font-sans">NIRA/NIN Collision Clearence</h4>
                        <p className="text-[11px] text-slate-400 leading-normal mt-0.5 font-sans">
                          Manually clears a duplicate NIN registration mismatch, allocating distinct legal subsidy certificates on verification.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={blockedNIN}
                          onChange={(e) => setBlockedNIN(e.target.value)}
                          placeholder="e.g. CF9988776655EE"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-[#06B6D4] placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <button
                        onClick={() => handleClearBlockedNINRecord(blockedNIN)}
                        className="bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-lg cursor-pointer transition-all font-sans shrink-0"
                      >
                        Clear Collision
                      </button>
                    </div>
                  </div>

                  {/* Override Action 3: Parish Subsidy Flow Override */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Landmark className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-extrabold text-white uppercase font-sans">Parish Hub Input Limit Scaling</h4>
                        <p className="text-[11px] text-slate-400 leading-normal mt-0.5 font-sans">
                          Manually registers emergency auxiliary seedling or NPK allowances above default cooperative caps for local compliance.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <select
                          value={quotaOverrideFarmer}
                          onChange={(e) => setQuotaOverrideFarmer(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-[#06B6D4]"
                        >
                          <option value="reg-north">Northern Pearl Hub (Gulu Region)</option>
                          <option value="reg-central">Central Grid Area (Mityana Region)</option>
                          <option value="reg-southwest">Southwestern Belt (Masaka Region)</option>
                        </select>
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={quotaAmount}
                          onChange={(e) => setQuotaAmount(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-center text-[#06B6D4]"
                        />
                      </div>
                      <button
                        onClick={() => handleManualQuotaBypass(quotaOverrideFarmer, quotaAmount)}
                        className="bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-lg cursor-pointer transition-all font-sans shrink-0"
                      >
                        Inject Quota
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit Trait Log listing */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-black">
                    STATE OVERRIDE LOG HISTORY ({overrideLogs.length})
                  </span>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {overrideLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] leading-relaxed">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                          <span className="text-[#06B6D4]">{log.action}</span>
                          <span className="text-slate-500">{log.timestamp}</span>
                        </div>
                        <div className="text-white font-semibold mt-1 font-sans">{log.target}</div>
                        <p className="text-slate-400 font-sans text-[10.5px] mt-0.5">{log.impact}</p>
                        <div className="flex justify-between items-center mt-1.5 text-[9.5px] font-mono border-t border-slate-800/60 pt-1.5">
                          <span className="text-amber-500">By: {log.operator}</span>
                          <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                            {log.leakageDelta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsOverrideDrawerOpen(false)}
                  className="w-full md:w-auto bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase cursor-pointer tracking-wider font-sans"
                >
                  Close Console
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
