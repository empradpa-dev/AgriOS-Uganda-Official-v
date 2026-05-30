import React, { useState, useEffect } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import { 
  ShieldAlert, Truck, Send, Sparkles, Check, 
  X, RefreshCw, Layers, Shield, Radio, MapPin, 
  Volume2, Users, FileText, Compass, HardDrive, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmergencyDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyDispatchModal({ isOpen, onClose }: EmergencyDispatchModalProps) {
  const { reports, jobs, silos, updateReportStatus, broadcastAlert } = useAgriOS();
  
  // Choose initial active threat
  const pendingThreats = reports.filter(r => r.status === 'Pending' || r.status === 'Investigated');
  const [selectedThreatId, setSelectedThreatId] = useState<string>(pendingThreats[0]?.id || reports[0]?.id || '');
  const [resourceType, setResourceType] = useState<string>('Biosecurity strike squad (Copper-Cop)');
  const [assignedDriverId, setAssignedDriverId] = useState<string>(jobs[0]?.id || 'j1');
  const [threatPerimeter, setThreatPerimeter] = useState<number>(5);
  const [emergencyLevel, setEmergencyLevel] = useState<'Parish' | 'Regional' | 'National'>('Parish');
  const [advisorySms, setAdvisorySms] = useState<string>('MAAIF EMERGENCY: Lock down all seedlings. Disease spotted in your area. Cooperate with active biosecurity team.');
  
  // Animation / Status states
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [dispatchWaybill, setDispatchWaybill] = useState<string>('');

  const selectedThreat = reports.find(r => r.id === selectedThreatId);
  const selectedDriver = jobs.find(j => j.id === assignedDriverId);

  // Sync state if reports list changes initially
  useEffect(() => {
    if (pendingThreats.length > 0 && !selectedThreatId) {
      setSelectedThreatId(pendingThreats[0].id);
    }
  }, [reports]);

  const liveLogText = [
    "Establishing handshake with NAADS Logistics Server...",
    "Querying NIRA Identity Registry for driver verification...",
    "Securing cryptographic waybill token with SHA-256 signatures...",
    "Broadcasting mass SMS alerts to cells in quarantine radius...",
    "Mobilizing operator payroll & fueling dispatch units...",
    "GPS tracking active. Target cluster path lock secured."
  ];

  // Simulating the real-time dispatch progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDispatching) {
      interval = setInterval(() => {
        setDispatchProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            handleFinishDispatch();
            return 100;
          }
          const increment = Math.floor(Math.random() * 15) + 10;
          const nextProgress = Math.min(100, prev + increment);
          
          // Speed through logs
          const nextLogIndex = Math.floor((nextProgress / 100) * liveLogText.length);
          setActiveLogIndex(Math.min(liveLogText.length - 1, nextLogIndex));
          
          return nextProgress;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isDispatching]);

  const handleFinishDispatch = () => {
    // Generate a waybill token
    const randomWaybill = `QR-HS-${Math.floor(100 + Math.random() * 900)}-${emergencyLevel.toUpperCase().charAt(0)}-2026`;
    setDispatchWaybill(randomWaybill);
    setDispatchSuccess(true);
    setIsDispatching(false);

    // Call context to update the outbreak status
    if (selectedThreatId) {
      updateReportStatus(selectedThreatId, 'ResourceDeployed');
    }

    // Call context to broadcast alerts
    if (selectedThreat) {
      broadcastAlert(selectedThreat.latitude, selectedThreat.longitude, threatPerimeter, advisorySms);
    }
  };

  const startDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setDispatchProgress(0);
    setActiveLogIndex(0);
    setDispatchSuccess(false);
  };

  const handleReset = () => {
    setDispatchSuccess(false);
    setDispatchProgress(0);
    setIsDispatching(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-black/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-slate-950 p-5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/35 text-red-400">
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">Tactical Crisis Dispatch Deck</h3>
                <p className="text-[10px] text-slate-400">Authorize rapid biosecurity intervention squads, dry fuel, or relief logistics</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isDispatching}
              className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {!isDispatching && !dispatchSuccess ? (
              <form onSubmit={startDispatch} className="space-y-5">
                
                {/* 1. Threat Selector */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Biosecurity Outbreak/Crisis Coordinates
                  </label>
                  <select
                    value={selectedThreatId}
                    onChange={(e) => setSelectedThreatId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    {pendingThreats.map(threat => (
                      <option key={threat.id} value={threat.id}>
                        {threat.targetCrop} ({threat.identifiedThreatVector}) - Severity: {threat.severityScale}
                      </option>
                    ))}
                    {pendingThreats.length === 0 && (
                      <option value="">-- No Active Critical Pathogen Warnings --</option>
                    )}
                  </select>
                </div>

                {/* Selected Threat Details Panel */}
                {selectedThreat && (
                  <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center justify-between text-xs text-red-900 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span className="font-bold">Threat Location Coordinates:</span>
                        <code className="bg-red-100/60 px-1 rounded text-[10px] font-mono">
                          {selectedThreat.latitude}, {selectedThreat.longitude}
                        </code>
                      </div>
                      <p className="text-[10px] text-slate-500 max-w-sm">
                        Logged by Extension Officer on {new Date(selectedThreat.timestamp).toLocaleDateString()}. Severity scale is flagged as <span className="text-red-700 font-bold uppercase">{selectedThreat.severityScale}</span>.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-[10px] font-mono font-bold shrink-0">
                      STATUS: {selectedThreat.status.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* 2. Emergency Type & Level selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Resource Select */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Emergency Countermeasure Kit
                    </label>
                    <select
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950"
                    >
                      <option value="Biosecurity strike squad (Copper-Cop)">Biosecurity strike squad (Copper-Cop)</option>
                      <option value="Aflatoxin chemical vacuum spares (100 Tons)">Aflatoxin chemical vacuum spares (100 Tons)</option>
                      <option value="Resilient seedlings replacement (NAADS certified)">Resilient seedlings replacement (NAADS certified)</option>
                      <option value="Mechanical drying fuel cylinder delivery">Mechanical drying fuel cylinder delivery</option>
                    </select>
                  </div>

                  {/* Level select */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Response Quarantine Tier
                    </label>
                    <div className="flex bg-stone-105 p-0.5 rounded-xl border border-stone-200/80 text-xs font-bold uppercase text-center">
                      {(['Parish', 'Regional', 'National'] as const).map(lev => (
                        <button
                          key={lev}
                          type="button"
                          onClick={() => setEmergencyLevel(lev)}
                          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                            emergencyLevel === lev 
                              ? 'bg-[#1a1a1a] text-white shadow-sm' 
                              : 'text-stone-550 hover:text-stone-900'
                          }`}
                        >
                          {lev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Driver & Fleet Selection */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned NAADS Transit Operator
                  </label>
                  <select
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.driverName} - {job.assignedTargetCluster} Route capacity: {job.truckCapacityTons} Tons (State: {job.transitState})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Blast Radius slider details */}
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Advisory Broadcast Radius</span>
                    <strong className="text-sm font-black font-mono text-indigo-950">{threatPerimeter} KM Perimeter</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={threatPerimeter}
                    onChange={(e) => setThreatPerimeter(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1a1a1a]"
                  />
                  <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400 uppercase">
                    <span>Parish Border (1k)</span>
                    <span>Zone containment (15k)</span>
                  </div>
                </div>

                {/* 5. Custom SMS text area */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                    <span>Quarantine SMS Advisory Campaign</span>
                    <span className="font-mono text-[9px] text-slate-400">{advisorySms.length}/140 chars</span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={140}
                    value={advisorySms}
                    onChange={(e) => setAdvisorySms(e.target.value)}
                    className="w-full bg-[#fafdfc] border border-slate-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-1 focus:ring-slate-950 text-xs font-sans resize-none leading-relaxed"
                    placeholder="Enter urgent instructions to be blasted via cell towers..."
                  />
                </div>

                {/* Execute Button */}
                <button
                  type="submit"
                  disabled={pendingThreats.length === 0}
                  className="w-full bg-red-650 hover:bg-red-600 disabled:bg-slate-100 disabled:text-slate-400 font-bold py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md bg-red-600 text-white transition-all active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Authorize Emergency Dispatch Waybill</span>
                </button>
              </form>
            ) : isDispatching ? (
              /* PROGRESS STAGE SCREEN */
              <div className="py-12 flex flex-col items-center justify-center space-y-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
                  <Truck className="w-10 h-10 text-red-600 animate-bounce" />
                </div>

                <div className="text-center space-y-1.5 max-w-sm">
                  <h4 className="font-extrabold text-sm text-slate-900 tracking-tight uppercase">Mobilizing Bio-Defense Fleet</h4>
                  <p className="text-xs text-slate-400 font-mono">Quarantine clearance level: {emergencyLevel.toUpperCase()}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-250">
                  <div 
                    className="bg-red-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${dispatchProgress}%` }}
                  ></div>
                </div>

                {/* Live Terminal logs console */}
                <div className="w-full max-w-md bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 space-y-1 font-mono text-[10px] min-h-[90px] shadow-sm select-none">
                  <div className="flex justify-between items-center text-slate-500 border-b border-slate-850 pb-1.5 mb-1.5">
                    <span>SECURITY CONSOLE LOGS</span>
                    <span className="font-extrabold animate-pulse text-red-400">● RUNNING</span>
                  </div>
                  {liveLogText.slice(0, activeLogIndex + 1).map((log, idx) => (
                    <div key={idx} className="flex gap-2 items-start leading-relaxed text-stone-300">
                      <span className="text-emerald-500 font-bold select-none">[✓]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* SUCCESS SCREEN CERTIFICATE */
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-6 flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Check className="w-8 h-8 stroke-[3.5px] text-emerald-650" />
                </div>

                <div className="space-y-1 max-w-md">
                  <h4 className="text-lg font-black text-slate-950 tracking-tight leading-none uppercase">Emergency Dispacth Secured</h4>
                  <p className="text-xs text-slate-400">Cryptographically signed & synchronized at Cabinet level.</p>
                </div>

                {/* Waybill decal placard */}
                <div className="bg-[#fbfcfa] border border-stone-250 border-dashed rounded-xl p-5 w-full max-w-sm space-y-3 shadow-inner font-mono text-left text-xs relative overflow-hidden">
                  <div className="absolute right-4 top-4 bg-gradient-to-tr from-cyan-400 via-yellow-400 to-indigo-500 opacity-30 rounded w-8 h-8 border border-white"></div>
                  
                  <div className="text-center font-bold text-[9px] uppercase tracking-widest text-slate-400 border-b border-stone-150 pb-1.5 mb-3">
                    MINISTRY BIOSECURITY DECALWAYBILL
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[9px] uppercase font-bold">Waybill Token</span>
                      <strong className="text-slate-900 bg-stone-100 px-1.5 rounded">{dispatchWaybill}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[9px] uppercase font-bold">Countermeasure</span>
                      <span className="text-slate-800 text-[10px] truncate max-w-[200px] font-sans font-bold">{resourceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[9px] uppercase font-bold">Assigned Operator</span>
                      <span className="text-slate-850 font-sans font-bold">{selectedDriver?.driverName || 'Kato Patrick'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[9px] uppercase font-bold">Target coordinates</span>
                      <span className="text-slate-850 font-bold">
                        {selectedThreat ? `${selectedThreat.latitude}, ${selectedThreat.longitude}` : '0.3476, 32.5825'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-stone-200 pt-2 flex justify-between text-[9px] text-stone-400">
                    <span>SECURITY: AES_256 SIG</span>
                    <span>TOWERS: ENGAGED</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full max-w-sm">
                  <button
                    onClick={() => alert("Simulation waybill sent to depot dispatch printers.")}
                    className="flex-1 bg-slate-100 hover:bg-slate-205 py-3 rounded-xl text-xs font-bold text-slate-800 uppercase flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Decal</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-slate-950 hover:bg-slate-900 py-3 rounded-xl text-xs font-bold text-white uppercase cursor-pointer"
                  >
                    <span>Dispatch another</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center text-[10px] text-slate-450 px-6 shrink-0 font-mono">
            <span>DPI API COMPLIANT GATEWAY</span>
            <span>SECURE SYSTEM CONSOLE</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
