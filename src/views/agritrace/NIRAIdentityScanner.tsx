import React, { useState, useEffect } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Camera, CheckCircle2, User as UserIcon, AlertCircle, 
  ScanLine, Smartphone, Fingerprint, RefreshCw, Layers, Check, Sparkles
} from 'lucide-react';
import type { User } from '@/types';

// Let's add extra local mock databases profiles with gorgeous avatars for authenticity!
const MOCK_NIRA_PROFILES = [
  {
    nin: 'CF1234567890AX',
    fullName: 'Mukasa John',
    gender: 'MALE',
    dob: '12-04-1981',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    contactNumber: '+256700000001',
    district: 'Gulu',
    subCounty: 'Bardege',
    parish: 'Layibi',
    quotas: {
      fertilizer: 2,
      seeds: 3,
      pesticides: 1
    }
  },
  {
    nin: 'CF9988776655EE',
    fullName: 'Alice Atim',
    gender: 'FEMALE',
    dob: '24-09-1988',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=150&h=150&q=80',
    contactNumber: '+256700000004',
    district: 'Mityana',
    subCounty: 'Ssekanyonyi',
    parish: 'Busuubizi',
    quotas: {
      fertilizer: 4,
      seeds: 2,
      pesticides: 2
    }
  },
  {
    nin: 'CM4455667788BB',
    fullName: 'Okot Geoffrey',
    gender: 'MALE',
    dob: '05-11-1976',
    avatar: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=150&h=150&q=80',
    contactNumber: '+256772112233',
    district: 'Gulu',
    subCounty: 'Bardege',
    parish: 'Layibi',
    quotas: {
      fertilizer: 1,
      seeds: 4,
      pesticides: 3
    }
  }
];

export default function NIRAIdentityScanner() {
  const { verifyNIN, logHandover, batches } = useAgriOS();
  const [ninInput, setNinInput] = useState('');
  const [scannedUser, setScannedUser] = useState<User | null>(null);
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedProfile, setScannedProfile] = useState<typeof MOCK_NIRA_PROFILES[0] | null>(null);
  
  // Selection of distribution item & quantity
  const [selectedAssetType, setSelectedAssetType] = useState<'fertilizer' | 'seeds' | 'pesticides'>('fertilizer');
  const [distributionQty, setDistributionQty] = useState(1);
  
  // Custom interactive simulation for SMS Receipt
  const [showSMSDrawer, setShowSMSDrawer] = useState(false);
  const [recentSMS, setRecentSMS] = useState<string | null>(null);
  const [smsReceiptDetails, setSmsReceiptDetails] = useState<{
    phone: string;
    message: string;
    timestamp: string;
    receiptId: string;
    farmerName: string;
  } | null>(null);

  // Auto-scan simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      setScanProgress(0);
      setScanError('');
      setScannedUser(null);
      setScannedProfile(null);
      
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            setIsScanning(false);
            clearInterval(interval);
            // Select a random profile to scan
            const randomProfile = MOCK_NIRA_PROFILES[Math.floor(Math.random() * MOCK_NIRA_PROFILES.length)];
            const verified = verifyNIN(randomProfile.nin);
            if (verified) {
              setScannedUser(verified);
              setScannedProfile(randomProfile);
              setNinInput(randomProfile.nin);
            } else {
              setScanError('NIN Scanner timed out or network of NIRA proxy failed.');
            }
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    setScannedUser(null);
    setScannedProfile(null);
    if (!ninInput.trim()) {
      setScanError('Please enter a valid NIN.');
      return;
    }

    const cleanNin = ninInput.replace(/\s/g, '').toUpperCase();
    const user = verifyNIN(cleanNin);
    if (user) {
      setScannedUser(user);
      // Link mock profile styling (avatar, gender etc.)
      const matchedProfile = MOCK_NIRA_PROFILES.find(p => p.nin === cleanNin) || {
        nin: user.nin,
        fullName: user.fullName,
        gender: 'UNKNOWN',
        dob: 'XX-XX-XXXX',
        avatar: '',
        contactNumber: user.contactNumber,
        district: user.district,
        subCounty: user.subCounty,
        parish: user.parish,
        quotas: { fertilizer: user.allocationQuotaTracker || 2, seeds: 2, pesticides: 1 }
      };
      setScannedProfile(matchedProfile as any);
    } else {
      setScanError('NIN not found in NIRA DPI database.');
    }
  };

  const selectQuickProfile = (nin: string) => {
    setNinInput(nin);
    const user = verifyNIN(nin);
    if (user) {
      setScannedUser(user);
      const matched = MOCK_NIRA_PROFILES.find(p => p.nin === nin);
      if (matched) {
        setScannedProfile(matched);
      }
    }
  };

  const handleHandover = () => {
    if (!scannedUser || !scannedProfile) return;
    
    // Choose appropriate batch
    const mappedAssetType = selectedAssetType === 'fertilizer' ? 'Fertilizers' : selectedAssetType === 'seeds' ? 'Seedlings' : 'Pesticides';
    const batch = batches.find(b => b.assetType === mappedAssetType) || batches[0];
    
    if (batch) {
      const remainingQuota = scannedUser.allocationQuotaTracker || 0;
      if (remainingQuota < distributionQty) {
        setScanError(`Distribution rejected: Exceeds agricultural allocation remaining.`);
        return;
      }

      // Log handover through global ledger
      logHandover(scannedUser.id, batch.id, distributionQty, !navigator.onLine);
      
      const receiptId = `SMS-${Math.floor(Math.random() * 9000 + 1000)}-${scannedUser.id.toUpperCase()}`;
      const msg = `AgriOS GOV: Recieved ${distributionQty} unit(s) of ${mappedAssetType} (${batch.sku}) from NAADS Parish Agent. Handed over at ${scannedUser.parish}. Verify at dpi.gov.ug/agri. Receipt ID: ${receiptId}`;
      
      setSmsReceiptDetails({
        phone: scannedUser.contactNumber,
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
        receiptId,
        farmerName: scannedUser.fullName
      });
      
      setShowSMSDrawer(true);

      // Decrement the local quota state for the UI immediately
      setScannedUser(prev => prev ? {
        ...prev,
        allocationQuotaTracker: Math.max(0, (prev.allocationQuotaTracker || 0) - distributionQty)
      } : null);

      if (scannedProfile) {
        setScannedProfile(prev => prev ? {
          ...prev,
          quotas: {
            ...prev.quotas,
            fertilizer: selectedAssetType === 'fertilizer' ? Math.max(0, prev.quotas.fertilizer - distributionQty) : prev.quotas.fertilizer,
            seeds: selectedAssetType === 'seeds' ? Math.max(0, prev.quotas.seeds - distributionQty) : prev.quotas.seeds,
            pesticides: selectedAssetType === 'pesticides' ? Math.max(0, prev.quotas.pesticides - distributionQty) : prev.quotas.pesticides,
          }
        } : null);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full uppercase tracking-wider">Domain A - Last-Mile Integrity</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Parish Chief Mobile Intake Interface</h2>
          <p className="text-slate-500 text-sm mt-0.5">Eliminating diversion & ghost beneficiaries using secure NIRA Cross-Referencing & Biometric IDs.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm text-xs text-slate-500">
          <Fingerprint className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <span className="font-semibold block text-slate-800">Biometric Auth Module</span>
            <span className="text-[10px] text-emerald-600 font-mono">NIRA_SECURE_API_v4_ONLINE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Hand: Intake and Scanner Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Mock NIRA selector helper */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-md border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Parish Scans (Select Farmer)</span>
            </div>
            <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
              Click a mock national ID below to autofill or simulate camera optic OCR reading in the parish field:
            </p>
            <MutationGuard action="AGRITRACE_INTAKE">
              <div className="space-y-1.5">
                {MOCK_NIRA_PROFILES.map(f => (
                  <button
                    key={f.nin}
                    onClick={() => selectQuickProfile(f.nin)}
                    className={`w-full text-left bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-lg text-xs flex justify-between items-center transition-all ${
                      ninInput === f.nin ? 'ring-2 ring-emerald-500 bg-slate-800' : 'border border-slate-700/50'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-white block">{f.fullName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{f.nin}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      Gulu District
                    </span>
                  </button>
                ))}
              </div>
            </MutationGuard>
          </div>

          {/* Camera Scanning Frame */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>NIRA Secure Scanner Portal</span>
              </h3>
              <span className={`h-2 w-2 rounded-full ${isScanning ? 'bg-orange-500 animate-ping' : 'bg-emerald-500'}`}></span>
            </div>

            <div className="relative h-56 bg-gradient-to-b from-slate-950 to-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center text-center">
              
              {/* Retro HUD & Scan lines */}
              <div className="absolute inset-4 border border-emerald-500/20 rounded pointer-events-none"></div>
              {/* Scanning Corner markings */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 pointer-events-none"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 pointer-events-none"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 pointer-events-none"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 pointer-events-none"></div>

              {isScanning ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-emerald-400">
                  <ScanLine className="w-16 h-16 text-emerald-400 animate-pulse mb-3" />
                  <p className="font-mono text-xs tracking-widest text-[#f97316] uppercase animate-pulse">Scanning Bio-chip...</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-1">CROSS RELATION SYSTEM IN OPERATION</p>
                  
                  {/* Progress bar */}
                  <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-150" 
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 z-10">
                  {scannedProfile ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={scannedProfile.avatar} 
                        onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'; }}
                        className="w-20 h-20 rounded-full border-2 border-emerald-400 object-cover shadow-md mb-2" 
                        alt="Photo" 
                      />
                      <span className="font-mono text-xs text-emerald-400">BENEFICIARY RETRIEVED</span>
                      <span className="font-bold text-white text-sm">{scannedProfile.fullName}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <ScanLine className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="font-bold text-xs uppercase tracking-wider text-slate-300">Optic NIN Scanner Ready</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs">Align the phone's QR core or National ID card bar code inside the camera grid area</p>
                    </div>
                  )}
                </div>
              )}

              {/* Scanning laser line overlay */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_10px_#10b981] animate-bounce top-1/4"></div>
              )}
            </div>

             <div className="mt-4">
               <MutationGuard action="AGRITRACE_INTAKE">
                 <button
                   type="button"
                   onClick={() => setIsScanning(true)}
                   disabled={isScanning}
                   className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200/60 flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                 >
                   <Camera className="w-3.5 h-3.5 text-slate-500" />
                   <span>Trigger Simulated Optics Scan</span>
                 </button>
               </MutationGuard>
             </div>
          </div>

          {/* Fallback Manual Entry form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Fallback Manual NIN Entry</h3>
            <form onSubmit={handleManualSearch}>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={ninInput}
                    onChange={(e) => setNinInput(e.target.value)}
                    placeholder="e.g. CF1234567890AX (14 positions)"
                    className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner uppercase"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    <Fingerprint className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                 <MutationGuard action="AGRITRACE_INTAKE">
                   <button
                     type="submit"
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                   >
                     Confirm NIN Database Query
                   </button>
                 </MutationGuard>
              </div>
            </form>

            {scanError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p>{scanError}</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Hand: Dynamic Profile & Eligibility Card */}
        <div className="lg:col-span-7 space-y-6">
          {scannedUser && scannedProfile ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Authentic Ugandan National ID mockup */}
              <div className="relative bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl overflow-hidden border border-blue-800">
                
                {/* ID watermark & holographic details */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                  <Fingerprint className="w-48 h-48" />
                </div>
                {/* Security shield decoration representing Republic of Uganda */}
                <div className="absolute left-64 top-4 w-40 h-40 border border-yellow-500/10 rounded-full flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 border border-yellow-500/5 rotate-45"></div>
                </div>

                {/* ID Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-yellow-400 flex items-center justify-center text-blue-950 font-black text-xs">UG</div>
                    <div>
                      <h4 className="text-[11px] font-extrabold tracking-widest text-slate-300 uppercase leading-none">The Republic of Uganda</h4>
                      <h5 className="text-[10px] font-semibold text-yellow-400 mt-0.5 uppercase tracking-wide">National Identity Card</h5>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    <span className="text-[9px] font-mono font-bold tracking-tight text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded">NIRA SECURE</span>
                  </div>
                </div>

                {/* ID Details Grid with golden microchip chip indicator */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  
                  {/* Photo area with Holographic Seal watermark */}
                  <div className="md:col-span-1 flex flex-col items-center">
                    <div className="relative w-24 h-28 bg-slate-800 rounded border border-white/20 overflow-hidden shadow">
                      <img 
                        src={scannedProfile.avatar} 
                        onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'; }}
                        className="w-full h-full object-cover" 
                        alt="Profile photograph" 
                      />
                      <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none mix-blend-color-burn"></div>
                      
                      {/* Holographic NIRA seal floating on top left */}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-gradient-to-tr from-yellow-300 via-emerald-300 to-indigo-400 opacity-60 rounded-full flex items-center justify-center border border-white/50 shadow">
                        <span className="text-[8px] font-bold text-black scale-75">N</span>
                      </div>
                    </div>
                    {/* Simulated security microchip visual */}
                    <div className="w-6 h-5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded mt-2 border border-blue-900 shadow-inner flex flex-wrap p-0.5 gap-0.5 overflow-hidden">
                      <div className="w-1.5 h-1 bg-amber-600 opacity-50 rounded"></div>
                      <div className="w-1.5 h-1 bg-amber-600 opacity-50 rounded"></div>
                      <div className="w-1.5 h-1 bg-amber-600 opacity-50 rounded"></div>
                      <div className="w-1.5 h-1 bg-amber-600 opacity-50 rounded"></div>
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="md:col-span-3 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Surname / First Name</span>
                        <span className="font-bold text-white text-sm whitespace-nowrap">{scannedProfile.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block">NIN</span>
                        <span className="font-mono font-bold text-yellow-400 text-xs tracking-tight">{scannedProfile.nin}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Gender</span>
                        <span className="font-medium text-white">{scannedProfile.gender}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Date of Birth</span>
                        <span className="font-medium text-white font-mono">{scannedProfile.dob}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-white/10 pt-2 grid grid-cols-3 gap-1 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase">District</span>
                        <span className="font-semibold text-slate-200">{scannedProfile.district}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase">Sub-County</span>
                        <span className="font-semibold text-slate-200">{scannedProfile.subCounty}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase">Parish</span>
                        <span className="font-semibold text-[#f97316]">{scannedProfile.parish}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-slate-400 pt-1">
                      <span>Card Serial: UG09421A</span>
                      <span>Signature: <span className="italic font-serif text-slate-300 font-bold whitespace-nowrap">John M.</span></span>
                    </div>

                  </div>
                </div>

              </div>

              {/* Dynamic Seasonal Eligibility Allocation Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Seasonal Input Subsidy Allocation Quota</h3>
                    <p className="text-xs text-slate-500">Limits per farmer to stop agricultural diversion and black-market resell.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-lg border border-emerald-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ELIGIBLE
                  </span>
                </div>

                {/* Grid of separate asset quotas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Fertilizer item quota card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    selectedAssetType === 'fertilizer' 
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-400' 
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
                  } cursor-pointer`}
                  onClick={() => { setSelectedAssetType('fertilizer'); setDistributionQty(1); }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-1.5 bg-sky-100 text-sky-800 rounded-lg text-[10px] font-bold">NPK COMPOUND</span>
                      {selectedAssetType === 'fertilizer' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Fertilizer remaining</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-950">{scannedProfile.quotas.fertilizer}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Bags</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-3">
                      <div className="bg-sky-500 h-full" style={{ width: `${(scannedProfile.quotas.fertilizer / 4) * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Seed item quota card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    selectedAssetType === 'seeds' 
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-400' 
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
                  } cursor-pointer`}
                  onClick={() => { setSelectedAssetType('seeds'); setDistributionQty(1); }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">HYBRID MAIZE</span>
                      {selectedAssetType === 'seeds' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Seed packs remaining</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-950">{scannedProfile.quotas.seeds}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Packs</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-3">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(scannedProfile.quotas.seeds / 4) * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Pesticides quota card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    selectedAssetType === 'pesticides' 
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-400' 
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
                  } cursor-pointer`}
                  onClick={() => { setSelectedAssetType('pesticides'); setDistributionQty(1); }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-bold">FALL ARMYWORM</span>
                      {selectedAssetType === 'pesticides' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Pesticide remaining</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-950">{scannedProfile.quotas.pesticides}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Bottles</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-3">
                      <div className="bg-purple-500 h-full" style={{ width: `${(scannedProfile.quotas.pesticides / 4) * 100}%` }}></div>
                    </div>
                  </div>

                </div>

                {/* Handover distribution quantity selector */}
                <MutationGuard action="AGRITRACE_INTAKE">
                  <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">Select Distribution Quantity</span>
                        <span className="text-[11px] text-slate-500">Currently distributing <strong>{selectedAssetType.toUpperCase()}</strong></span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDistributionQty(prev => Math.max(1, prev - 1))}
                          disabled={distributionQty <= 1}
                          className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold flex items-center justify-center active:bg-slate-50 transition-colors disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm font-black text-slate-900 font-mono text-lg bg-white py-1.5 border border-slate-200 rounded-lg shadow-inner">
                          {distributionQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDistributionQty(prev => {
                            const limit = selectedAssetType === 'fertilizer' ? scannedProfile.quotas.fertilizer : 
                                          selectedAssetType === 'seeds' ? scannedProfile.quotas.seeds : scannedProfile.quotas.pesticides;
                            return Math.min(limit, prev + 1);
                          })}
                          disabled={distributionQty >= (selectedAssetType === 'fertilizer' ? scannedProfile.quotas.fertilizer : 
                                    selectedAssetType === 'seeds' ? scannedProfile.quotas.seeds : scannedProfile.quotas.pesticides)}
                          className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold flex items-center justify-center active:bg-slate-50 transition-colors disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Submit Confirmation button */}
                    <button
                      onClick={handleHandover}
                      disabled={
                        (selectedAssetType === 'fertilizer' && scannedProfile.quotas.fertilizer <= 0) ||
                        (selectedAssetType === 'seeds' && scannedProfile.quotas.seeds <= 0) ||
                        (selectedAssetType === 'pesticides' && scannedProfile.quotas.pesticides <= 0)
                      }
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-[#059669] shadow-md shadow-emerald-900/10 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize Input Handover & Send SMS Receipt</span>
                    </button>
                  </div>
                </MutationGuard>

              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-sm animate-pulse">
                <UserIcon className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Beneficiary Identity Dashboard</h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm">
                Scan a National ID using the simulated Optics reader or select a micro-profile from the simulator helper panel to verify NIRA record, quotas, and sign.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Mobile SMS Preview Drawer/Modal */}
      {showSMSDrawer && smsReceiptDetails && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden text-white relative flex flex-col h-[560px]">
            
            {/* Phone notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl flex justify-center items-center z-20">
              <div className="w-20 h-3 bg-black rounded-full mb-1"></div>
            </div>

            {/* Simulated Phone UI Header */}
            <div className="bg-slate-950 px-6 pt-8 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-[10px] font-mono font-medium text-slate-400">Gulu Telecom</div>
              <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>SECURED SMS DELIVERY</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">11:55</div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 p-4 bg-slate-950 overflow-y-auto space-y-4">
              
              <div className="text-center font-mono text-[9px] text-slate-500 py-1 border-b border-slate-900/50">
                Today, {smsReceiptDetails.timestamp}
              </div>

              {/* Message from AGRI-OS */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-orange-500 border border-orange-400 shrink-0 flex items-center justify-center font-black text-[9px] text-white">
                  GOV
                </div>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className="text-[9px] font-bold text-[#f97316] uppercase tracking-wider">AgriOS-Receipt</div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl rounded-tl-none border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans shadow shadow-black">
                    {smsReceiptDetails.message}
                  </div>
                  <span className="text-[8px] text-slate-500 self-end font-mono">Delivered via Gulu Mast #3</span>
                </div>
              </div>

              {/* Transaction Integrity block */}
              <div className="bg-slate-900/50 border border-emerald-500/20 p-3 rounded-2xl text-[10px] font-mono text-slate-300 space-y-1 bg-gradient-to-tr from-emerald-950/20 to-indigo-950/20">
                <div className="flex justify-between text-emerald-400 font-bold border-b border-emerald-500/10 pb-1 mb-1 items-center">
                  <span>UNALTERABLE CRYPTO LOG</span>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 border border-emerald-500/20 uppercase rounded font-normal">Active</span>
                </div>
                <p><span className="text-slate-500">Receipt ID: </span>{smsReceiptDetails.receiptId}</p>
                <p><span className="text-slate-500">NIN Hash: </span>{scannedUser.nin}</p>
                <p><span className="text-slate-500">Parish: </span>{scannedUser.parish}</p>
                <p className="text-[9px] text-slate-400 leading-normal pt-1 break-all">
                  SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </p>
              </div>

            </div>

            {/* Close button inside phone frame bar representing native interactions */}
            <div className="bg-slate-950 p-4 border-t border-slate-900 text-center shrink-0">
              <button
                type="button"
                onClick={() => setShowSMSDrawer(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer w-full active:scale-95"
              >
                Close Simulation Phone
              </button>
              <div className="w-1/3 h-1 bg-slate-800 mx-auto rounded-full mt-4"></div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
