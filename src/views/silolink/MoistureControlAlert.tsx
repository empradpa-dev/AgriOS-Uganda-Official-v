import React, { useState, useEffect } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Droplets, AlertTriangle, CheckCircle, Database, ShieldAlert,
  Wind, ArrowDownCircle, RefreshCw, BarChart2, Flame, Users, Sparkles
} from 'lucide-react';
import { generateUUID } from '@/lib/utils';
import type { SiloGrainDeposit } from '@/types';

interface SimulatedDryingBatch extends SiloGrainDeposit {
  currentMoisture: number;
  isDrying: boolean;
  dryingProgress: number; // 0 to 100
}

export default function MoistureControlAlert() {
  const { silos, users, logMoisture, deposits } = useAgriOS();
  
  // Input fields state
  const [selectedSiloId, setSelectedSiloId] = useState(silos[0]?.id || '');
  const [selectedFarmerId, setSelectedFarmerId] = useState(users.filter(u => u.role === 'Farmer')[0]?.id || 'u1');
  const [cropType, setCropType] = useState('Maize');
  const [weight, setWeight] = useState('');
  const [moisture, setMoisture] = useState('');
  
  // Tactical keypad tracker
  const [activeInputField, setActiveInputField] = useState<'weight' | 'moisture' | null>('moisture');

  const handleKeypadKey = (key: string) => {
    if (!activeInputField) return;
    const currentVal = activeInputField === 'weight' ? weight : moisture;

    if (key === 'CLEAR') {
      if (activeInputField === 'weight') setWeight('');
      else setMoisture('');
    } else if (key === 'BACK') {
      const nextVal = currentVal.length > 0 ? currentVal.slice(0, -1) : '';
      if (activeInputField === 'weight') setWeight(nextVal);
      else setMoisture(nextVal);
    } else {
      // Prevent multiple decimals
      if (key === '.' && currentVal.includes('.')) return;
      
      const nextVal = currentVal + key;
      if (activeInputField === 'weight') {
        // limit weight characters appropriately
        if (nextVal.length <= 6) setWeight(nextVal);
      } else {
        // limit moisture to 4 characters (e.g. 15.5)
        if (nextVal.length <= 4) setMoisture(nextVal);
      }
    }
  };
  
  // Real-time Moisture Validation Hook states
  const [moistureError, setMoistureError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Mechanical Drying Queue state (Local simulator extending global context data seamlessly)
  const [dryingQueue, setDryingQueue] = useState<SimulatedDryingBatch[]>([]);
  const [successLogs, setSuccessLogs] = useState<SiloGrainDeposit[]>([]);

  // Validate moisture state reactively as user inputs values
  useEffect(() => {
    if (!moisture) {
      setMoistureError(null);
      setIsFormValid(false);
      return;
    }
    
    const mVal = parseFloat(moisture);
    if (isNaN(mVal)) {
      setMoistureError("CRITICAL EXCEPTION: Moisture readout must be a numerical fraction.");
      setIsFormValid(false);
    } else if (mVal < 5.0 || mVal > 35.0) {
      setMoistureError("CRITICAL LIMIT: Outside valid biometric scale (5.0% - 35.0% required).");
      setIsFormValid(false);
    } else {
      setMoistureError(null);
      setIsFormValid(parseFloat(weight) > 0);
    }
  }, [moisture, weight]);

  // Handle logging a new batch moisture readout
  const handleLogBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !moisture || !weight) return;

    const mVal = parseFloat(moisture);
    const wVal = parseFloat(weight);

    // Call state dispatcher
    logMoisture(selectedSiloId, selectedFarmerId, cropType, wVal, mVal);

    const farmerObj = users.find(u => u.id === selectedFarmerId);
    const siloObj = silos.find(s => s.id === selectedSiloId);

    const mockupDeposit: SiloGrainDeposit = {
      id: generateUUID(),
      siloId: selectedSiloId,
      farmerId: selectedFarmerId,
      cropType: cropType,
      netWeightKgs: wVal,
      measuredMoisturePercentage: mVal,
      storageQueuePhase: mVal > 13.5 ? 'MechanicalDrying' : 'SafelyStored',
      tokenizedWarehouseReceipt: generateUUID(),
      timestamp: new Date().toISOString()
    };

    if (mVal > 13.5) {
      // Direct mechanical queue redirection
      const newDryingBatch: SimulatedDryingBatch = {
        ...mockupDeposit,
        currentMoisture: mVal,
        isDrying: false,
        dryingProgress: 0
      };
      setDryingQueue(prev => [newDryingBatch, ...prev]);
    } else {
      setSuccessLogs(prev => [mockupDeposit, ...prev]);
    }

    // Reset inputs but keep dropdown indices
    setWeight('');
    setMoisture('');
  };

  // Run Simulated Mechanical Drying Action
  const triggerDryingProcess = (batchId: string) => {
    setDryingQueue(prev => prev.map(item => {
      if (item.id === batchId) {
        return { ...item, isDrying: true };
      }
      return item;
    }));

    // Trigger timer cycle simulating mechanical air handlers running at Gulu/Mityana silos
    const interval = setInterval(() => {
      setDryingQueue(prev => {
        let isDone = false;
        
        const updated = prev.map(item => {
          if (item.id !== batchId) return item;
          
          const nextMoisture = parseFloat((item.currentMoisture - 0.4).toFixed(1));
          const stepProgress = Math.min(100, item.dryingProgress + 15);
          
          if (nextMoisture <= 13.5) {
            isDone = true;
            return {
              ...item,
              currentMoisture: 13.5,
              dryingProgress: 100,
              isDrying: false,
              storageQueuePhase: 'SafelyStored' as const
            };
          }
          
          return {
            ...item,
            currentMoisture: nextMoisture,
            dryingProgress: stepProgress
          };
        });

        if (isDone) {
          clearInterval(interval);
          // Extract the completed batch to move it to safe storage log lists
          setTimeout(() => {
            setDryingQueue(currQueue => {
              const finished = currQueue.find(qi => qi.id === batchId);
              if (finished) {
                setSuccessLogs(sLog => [finished, ...sLog]);
              }
              return currQueue.filter(qi => qi.id !== batchId);
            });
          }, 800);
        }

        return updated;
      });
    }, 400);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-inter">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-xs font-semibold rounded-full uppercase tracking-wider">Domain C - Moisture Safeguards</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600 animate-pulse" />
            <span>Batch Moisture Evaluation Entry Ledger</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Biometric verification of post-harvest grain consignments to enforce high-quality aflatoxin defense lines.</p>
        </div>

        {/* Dynamic Queue Indicators */}
        <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm text-xs">
          <Wind className={`w-5 h-5 ${dryingQueue.some(i => i.isDrying) ? 'text-amber-500 animate-spin' : 'text-slate-400'}`} />
          <div>
            <span className="font-semibold block text-slate-800">Drying Stack Load</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {dryingQueue.length} BATCHES IN MECHANICAL QUEUE
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Strict Data Entry Form with validation */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            
            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
              Grain Biometric Ingestion Slip
            </div>

            <form onSubmit={handleLogBatch} className="p-5 space-y-5">
              
              {/* Destination Silo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Receiving Silo Node</label>
                <select
                  value={selectedSiloId}
                  onChange={(e) => setSelectedSiloId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {silos.map(s => (
                    <option key={s.id} value={s.id}>{s.facilityName} ({s.district})</option>
                  ))}
                </select>
              </div>

              {/* Co-op Member Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cooperative Member (Farmer)</label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {users.filter(u => u.role === 'Farmer').map(f => (
                    <option key={f.id} value={f.id}>{f.fullName} ({f.nin})</option>
                  ))}
                </select>
              </div>

              {/* Crop Species */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Crop Classification</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Maize">Maize (White Hybrid)</option>
                  <option value="Coffee">Coffee Cherries (Robusta)</option>
                  <option value="Beans">NARO Red Kidney Beans</option>
                  <option value="Sorghum">Sorghum (Grain)</option>
                </select>
              </div>

              {/* Two Column Numeric Fields */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Net weight */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Net Weight (Kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="100000"
                      placeholder="e.g. 500"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-8 text-xs font-mono font-bold text-right focus:outline-none focus:border-blue-500"
                      required
                    />
                    <span className="absolute right-2.5 top-3 text-[10px] font-bold text-slate-400">KG</span>
                  </div>
                </div>

                {/* Moisture % */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Moisture Ratio (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 14.5"
                      value={moisture}
                      onChange={e => setMoisture(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 pr-8 text-xs font-mono font-bold text-right focus:outline-none ${
                        moistureError 
                          ? 'bg-red-50 border-red-400 text-red-900 focus:border-red-500' 
                          : moisture && parseFloat(moisture) > 13.5
                          ? 'bg-amber-50 border-amber-400 text-amber-900 focus:border-amber-500'
                          : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                      }`}
                      required
                    />
                    <span className="absolute right-2.5 top-3 text-[10px] font-bold text-slate-400">%</span>
                  </div>
                </div>

              </div>

              {/* Reactive Error warning readout blocks */}
              {moistureError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] leading-relaxed rounded-xl font-mono">
                  ⚠️ {moistureError}
                </div>
              )}

              {/* Dynamic Warning for high moisture batches above 13.5% */}
              {moisture && !moistureError && parseFloat(moisture) > 13.5 && (
                <div className="p-3.5 bg-amber-50 border border-amber-250 text-amber-905 text-xs rounded-xl space-y-1 leading-snug animate-in fade-in duration-200">
                  <div className="flex items-center gap-1 text-amber-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>CRITICAL SPOILAGE DANGER (Moisture &gt; 13.5%)</span>
                  </div>
                  <p className="text-slate-500 text-[10.5px]">
                    High likelihood of rapid aflatoxin spore aggregation and mold colonisation. 
                    <strong className="text-amber-800 block mt-1">LOCK ACTION: Redirection to the automated mechanical drying queue is mandatory.</strong>
                  </p>
                </div>
              )}

              {/* Submit button */}
              <MutationGuard action="SILOLINK_MOISTURE_LOG">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-400 border border-blue-950 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-98"
                >
                  <Database className="w-4 h-4" />
                  <span>Log Scale Readout & Determine Route</span>
                </button>
              </MutationGuard>

            </form>

          </div>

        </div>

        {/* RIGHT COLUMN: Active mechanical dryers & Compliant deposit logs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* MECHANICAL DRYING QUEUE PANEL */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden min-h-[240px] flex flex-col">
            
            <div className="p-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-amber-400 animate-spin" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">Automated Mechanical Drying Controller</h3>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono text-[9px] font-black uppercase">
                Aflatoxin Defense Queued
              </span>
            </div>

            {/* List entries */}
            <div className="p-5 flex-grow overflow-y-auto space-y-4">
              
              {dryingQueue.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2 flex flex-col items-center justify-center h-full">
                  <Wind className="w-8 h-8 text-slate-700 mb-1" />
                  <span className="text-xs font-semibold block uppercase tracking-wider">No active batches in drying queue</span>
                  <p className="text-[10px] text-slate-600 max-w-xs mx-auto leading-normal">
                    Farming inputs matching standard moisture metrics under 13.5% bypass drying systems and go straight into secure storage bins.
                  </p>
                </div>
              ) : (
                dryingQueue.map(item => {
                  const farmer = users.find(u => u.id === item.farmerId);
                  
                  return (
                    <div 
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 relative overflow-hidden ${
                        item.isDrying 
                          ? 'bg-amber-950/20 border-amber-600/50' 
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Spin spinner overlay when blowing */}
                      {item.isDrying && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-amber-400">
                          <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                          <span>DRYING IN PROCESS...</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase font-black block">BATCH IDENTIFIER: {item.id.slice(0, 8)}</span>
                          <h4 className="font-bold text-xs text-slate-100 uppercase mt-0.5">
                            {item.cropType} • <span className="text-slate-400">{item.netWeightKgs} KGS ({Math.round(item.netWeightKgs / 50)} bags)</span>
                          </h4>
                          <span className="text-[10px] text-zinc-400">Owner: <strong className="text-white font-medium">{farmer?.fullName || 'Co-op Farmer'}</strong></span>
                        </div>

                        {/* Interactive Moister evaluation values */}
                        <div className="text-right shrink-0">
                          <span className="text-slate-400 text-[10px] block font-mono">MOISTURE VALUE:</span>
                          <strong className="text-lg font-mono font-black text-amber-400">
                            {item.currentMoisture}%
                          </strong>
                          <span className="text-[9px] text-zinc-500 block leading-tight">INITIAL: {item.measuredMoisturePercentage}%</span>
                        </div>
                      </div>

                      {/* Display Progress line for drying */}
                      {item.isDrying && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-mono text-amber-400">
                            <span>MOISTURE EXTRUSION RANGE</span>
                            <span>{item.dryingProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.dryingProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Control button */}
                      <div className="pt-1 flex justify-end">
                        <MutationGuard action="SILOLINK_MOISTURE_ACTUATE">
                          <button
                            type="button"
                            onClick={() => triggerDryingProcess(item.id)}
                            disabled={item.isDrying}
                            className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-zinc-650 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {item.isDrying ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>FANS RUNNING...</span>
                              </>
                            ) : (
                              <>
                                <Wind className="w-3.5 h-3.5 text-white/80" />
                                <span>Run Moisture Extruder</span>
                              </>
                            )}
                          </button>
                        </MutationGuard>
                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>

          {/* SAFELY STORED LOG LIST OF DISPATCHED COMPLIANT BATCHES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-950 text-xs uppercase font-mono tracking-wider">Primary Storage Silo Bins Registry (Compliant Logs)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Logs of high-quality grains docked securely below 13.5% threshold.</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-mono text-[9px] font-black border border-emerald-100 rounded">
                COMPLIANCE TRUST SECURED
              </span>
            </div>

            {/* List success items */}
            {successLogs.length === 0 ? (
              <p className="text-center font-semibold text-slate-400 text-xs italic py-6">
                No grain deposit receipts logged during the current operator shift.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {successLogs.map(log => {
                  const farmer = users.find(u => u.id === log.farmerId);
                  const silo = silos.find(s => s.id === log.siloId);
                  return (
                    <div key={log.id} className="p-3 bg-emerald-50/20 border border-emerald-100 text-slate-700 rounded-xl flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] bg-emerald-100 text-emerald-850 font-bold px-1.5 py-0.5 rounded">
                          ✓ BATCH DOCKED SECURE
                        </span>
                        <h4 className="font-bold text-slate-900 uppercase mt-1">
                          {log.cropType} • <span className="text-slate-500">{log.netWeightKgs} KG</span>
                        </h4>
                        <p className="text-[9.5px] text-slate-450 font-mono">
                          Facility: {silo?.facilityName} • Token: <span className="font-sans font-semibold text-blue-755">{log.tokenizedWarehouseReceipt.slice(0, 8)}...</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9.5px] font-mono text-emerald-700 font-bold block">MOISTURE VALUE:</span>
                        <strong className="text-sm font-mono font-black text-emerald-600">{log.measuredMoisturePercentage}%</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
