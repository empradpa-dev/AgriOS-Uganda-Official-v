import React, { useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Building2, Package, Truck, Droplets, Plus, Trash2, Database, 
  CheckCircle, AlertTriangle, Sparkles, RefreshCw, Calculator, UserPlus, FileSpreadsheet, ArrowRight
} from 'lucide-react';
import { generateUUID } from '@/lib/utils';

interface SpreadsheetRow {
  id: string;
  farmerId: string;
  cropType: string;
  netWeightKgs: string;
  moisturePercentage: string;
  isValid: boolean;
}

export default function CapacityMatrixView() {
  const { silos, users, logMoisture, deposits } = useAgriOS();
  const [selectedSiloId, setSelectedSiloId] = useState<string>(silos[0]?.id || '');
  
  // Spreadsheet Local State
  const farmers = users.filter(u => u.role === 'Farmer');
  const [spreadsheetRows, setSpreadsheetRows] = useState<SpreadsheetRow[]>([
    { id: 'row-1', farmerId: farmers[0]?.id || 'u1', cropType: 'Maize', netWeightKgs: '1200', moisturePercentage: '14.2', isValid: true },
    { id: 'row-2', farmerId: farmers[1]?.id || 'u4', cropType: 'Maize', netWeightKgs: '850', moisturePercentage: '12.8', isValid: true },
    { id: 'row-3', farmerId: farmers[0]?.id || 'u1', cropType: 'Coffee', netWeightKgs: '2100', moisturePercentage: '15.5', isValid: true }
  ]);
  
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [committedReceiptCount, setCommittedReceiptCount] = useState(0);

  // Active Silo Node Selection
  const activeSilo = silos.find(s => s.id === selectedSiloId) || silos[0];

  // Derive granular metrics for the selected silo
  // Bag Conversion standard: 1 Ton = 20 Bags of 50Kgs each
  const totalCapacityBags = activeSilo ? activeSilo.totalCapacityTons * 20 : 0;
  const occupiedBags = activeSilo ? Math.round(activeSilo.occupiedSpaceTons * 20) : 0;
  const inTransitBags = activeSilo ? Math.round(activeSilo.reservedSpaceTons * 20) : 0;
  const availableTons = activeSilo ? activeSilo.totalCapacityTons - activeSilo.occupiedSpaceTons - activeSilo.reservedSpaceTons : 0;
  const availableBags = Math.round(availableTons * 20);
  
  // Drying Beds metric: count deposits of this silo in 'MechanicalDrying' queue
  const dryingDeposits = deposits.filter(d => d.siloId === activeSilo?.id && d.storageQueuePhase === 'MechanicalDrying');
  const dryingBags = dryingDeposits.reduce((acc, curr) => acc + (curr.netWeightKgs / 50), 0);
  const dryingWeightTons = dryingDeposits.reduce((acc, curr) => acc + (curr.netWeightKgs / 1000), 0);
  const dryingBedCapacityTons = 50; // default cap of drying zones
  const dryingBedPct = (dryingWeightTons / dryingBedCapacityTons) * 100;

  // Spreadsheet Ingestion Engine Handlers
  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    setSpreadsheetRows(prev => [
      ...prev,
      { id: newId, farmerId: farmers[0]?.id || 'u1', cropType: 'Maize', netWeightKgs: '', moisturePercentage: '', isValid: false }
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (spreadsheetRows.length <= 1) return;
    setSpreadsheetRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleCellChange = (rowId: string, field: keyof SpreadsheetRow, value: string) => {
    setSpreadsheetRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      
      const updatedRow = { ...row, [field]: value };
      
      // Perform inline math validation
      const weight = parseFloat(updatedRow.netWeightKgs);
      const moisture = parseFloat(updatedRow.moisturePercentage);
      
      const isWeightValid = !isNaN(weight) && weight > 0 && weight <= 50000;
      const isMoistureValid = !isNaN(moisture) && moisture >= 5 && moisture <= 35;
      
      updatedRow.isValid = isWeightValid && isMoistureValid;
      return updatedRow;
    }));
  };

  const handleSubmitLedger = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = spreadsheetRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    // Direct transaction ingestion in batch
    validRows.forEach(row => {
      logMoisture(
        activeSilo.id,
        row.farmerId,
        row.cropType,
        parseFloat(row.netWeightKgs),
        parseFloat(row.moisturePercentage)
      );
    });

    setCommittedReceiptCount(validRows.length);
    setIsSubmitSuccess(true);
    
    // Clear rows after short period
    setTimeout(() => {
      setIsSubmitSuccess(false);
      setSpreadsheetRows([
        { id: `row-${Date.now()}`, farmerId: farmers[0]?.id || 'u1', cropType: 'Maize', netWeightKgs: '', moisturePercentage: '', isValid: false }
      ]);
    }, 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-xs font-semibold rounded-full uppercase tracking-wider">Domain C - Processing Terminal</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Silo Operator Capacity Matrix Console</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time tonnage storage metrics & cryptographic warehouse receipts matching active member accounts.</p>
        </div>

        {/* Silo Node Switch Selector */}
        <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm text-xs">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Silo Facility</label>
            <select
              value={selectedSiloId}
              onChange={(e) => setSelectedSiloId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-4"
            >
              {silos.map(s => (
                <option key={s.id} value={s.id}>{s.facilityName} ({s.district})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MATRIX METRICS BOARD: 4 columns mapping structural inventory spaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Total Structural Capacity */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Cap Matrix</span>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight font-mono mt-1">
                {activeSilo?.totalCapacityTons} <span className="text-xs text-slate-400 font-sans">TONS</span>
              </h4>
            </div>
            <span className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2 float-right mt-2 flex justify-between text-[10px] text-slate-500 font-mono">
            <span>BAG CONVERSION:</span>
            <strong className="text-slate-800">{totalCapacityBags.toLocaleString()} BAGS</strong>
          </div>
        </div>

        {/* Metric 2: Occupied Volume Bags */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Occupied Volume</span>
              <h4 className="text-2xl font-black text-amber-600 tracking-tight font-mono mt-1">
                {occupiedBags.toLocaleString()} <span className="text-xs text-amber-500 font-sans">BAGS</span>
              </h4>
            </div>
            <span className="p-2 bg-amber-50 border border-amber-100/50 rounded-lg text-amber-500 shrink-0">
              <Package className="w-4.5 h-4.5" />
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>METRIC TONNAGE:</span>
            <strong className="text-slate-700">{activeSilo?.occupiedSpaceTons} TONS</strong>
          </div>
        </div>

        {/* Metric 3: In-Transit Booking Space */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">In-Transit Reservations</span>
              <h4 className="text-2xl font-black text-blue-900 tracking-tight font-mono mt-1">
                {inTransitBags.toLocaleString()} <span className="text-xs text-blue-500 font-sans">BAGS</span>
              </h4>
            </div>
            <span className="p-2 bg-blue-50 border border-blue-100/50 rounded-lg text-blue-800 shrink-0">
              <Truck className="w-4.5 h-4.5" />
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-450 font-mono">
            <span>SECURED HOLD SPACE:</span>
            <strong className="text-slate-700">{activeSilo?.reservedSpaceTons} TONS</strong>
          </div>
        </div>

        {/* Metric 4: Active Drying Bed Utilization */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Drying Bed Load</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <h4 className="text-2xl font-black text-indigo-600 tracking-tight font-mono">
                  {dryingWeightTons.toFixed(1)} <span className="text-xs text-indigo-400 font-sans">TONS</span>
                </h4>
                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1 border border-indigo-100 font-mono rounded">
                  {Math.round(dryingBags)} Bags
                </span>
              </div>
            </div>
            <span className={`p-2 rounded-lg shrink-0 ${dryingWeightTons > 0 ? 'bg-indigo-50 border border-indigo-200 text-indigo-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <Droplets className="w-4.5 h-4.5" />
            </span>
          </div>
          <div className="space-y-1 border-t border-slate-100 pt-1.5">
            <div className="flex justify-between text-[8px] font-mono text-slate-400">
              <span>DRYING BEDS ALLOC:</span>
              <span>{Math.min(100, Math.round(dryingBedPct))}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, dryingBedPct)}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* LEDGER INGESTION ENGINE GRID */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Frame title */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4.5 h-4.5 text-blue-600" />
              <span>Multi-Row Member Weight Receipt Ledger Ingestion</span>
            </h3>
            <p className="text-xs text-slate-400">Rapid-input spreadsheet matching registered agricultural cooperative members with daily scale delivery tallies.</p>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="self-start sm:self-auto bg-slate-150 border border-slate-250 hover:bg-slate-200 text-slate-800 text-[10px] uppercase tracking-wider font-extrabold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Row Element</span>
          </button>
        </div>

        {/* Form spreadsheet table wrapping */}
        <form onSubmit={handleSubmitLedger} className="p-6 space-y-6">
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
            <table className="w-full text-left text-xs whitespace-nowrap bg-white">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3 min-w-[200px]">Farmer/Cooperative Member</th>
                  <th className="px-4 py-3 min-w-[140px]">Crop Category</th>
                  <th className="px-4 py-3 w-40 text-right">Net weight receipt (Kg)</th>
                  <th className="px-4 py-3 w-40 text-right">Moisture Ratio (%)</th>
                  <th className="px-4 py-3 w-32 text-center">Status Flag</th>
                  <th className="px-4 py-3 w-16 text-center">Rem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {spreadsheetRows.map((row, index) => {
                  const numWeight = parseFloat(row.netWeightKgs);
                  const numMoisture = parseFloat(row.moisturePercentage);
                  const isMoistureHigh = !isNaN(numMoisture) && numMoisture > 13.5;
                  
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                      
                      {/* Num index */}
                      <td className="px-4 py-3.5 text-center text-slate-400 font-bold font-sans">
                        {index + 1}
                      </td>

                      {/* Farmer Select */}
                      <td className="px-4 py-1.5 font-sans">
                        <select
                          value={row.farmerId}
                          onChange={(e) => handleCellChange(row.id, 'farmerId', e.target.value)}
                          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                        >
                          {farmers.map(f => (
                            <option key={f.id} value={f.id}>{f.fullName} ({f.nin})</option>
                          ))}
                        </select>
                      </td>

                      {/* Crop Category Select */}
                      <td className="px-4 py-1.5 font-sans">
                        <select
                          value={row.cropType}
                          onChange={(e) => handleCellChange(row.id, 'cropType', e.target.value)}
                          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                        >
                          <option value="Maize">Maize (Seed)</option>
                          <option value="Coffee">Coffee Bean</option>
                          <option value="Beans">Beans (NARO-4)</option>
                          <option value="Sorghum">Sorghum</option>
                          <option value="Matooke">Matooke Stem</option>
                        </select>
                      </td>

                      {/* Weight input */}
                      <td className="px-4 py-1.5 text-right">
                        <div className="relative inline-block w-full">
                          <input
                            type="number"
                            min="10"
                            max="50000"
                            value={row.netWeightKgs}
                            placeholder="e.g. 1000"
                            onChange={(e) => handleCellChange(row.id, 'netWeightKgs', e.target.value)}
                            className={`w-full bg-white border rounded-lg p-2 pr-7 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              row.netWeightKgs && isNaN(numWeight) ? 'border-red-500' : 'border-slate-205'
                            }`}
                          />
                          <span className="absolute right-2.5 top-2.5 text-[9px] text-slate-400 font-sans font-bold">KG</span>
                        </div>
                      </td>

                      {/* Moisture input */}
                      <td className="px-4 py-1.5 text-right">
                        <div className="relative inline-block w-full">
                          <input
                            type="number"
                            step="0.1"
                            min="5"
                            max="35"
                            value={row.moisturePercentage}
                            placeholder="e.g. 13.0"
                            onChange={(e) => handleCellChange(row.id, 'moisturePercentage', e.target.value)}
                            className={`w-full bg-white border rounded-lg p-2 pr-7 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isMoistureHigh ? 'border-amber-500 bg-amber-50/10' : 'border-slate-205'
                            }`}
                          />
                          <span className="absolute right-2.5 top-2.5 text-[9px] text-slate-400 font-sans font-bold">%</span>
                        </div>
                      </td>

                      {/* Status / Warnings Column */}
                      <td className="px-4 py-1.5 text-center font-sans">
                        {row.netWeightKgs && row.moisturePercentage ? (
                          row.isValid ? (
                            isMoistureHigh ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-250 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>DRYING REQ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-250">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-550 shrink-0" />
                                <span>COMPLIANT v</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 text-red-700 text-[10.5px] font-bold">
                              <span>INVALID VALS</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">Awaiting entry</span>
                        )}
                      </td>

                      {/* Delete item */}
                      <td className="px-4 py-2 text-center text-slate-500">
                        <button
                          type="button"
                          disabled={spreadsheetRows.length <= 1}
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-650 rounded-lg text-slate-400 hover:border-red-100 border border-transparent transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Form Action Controls */}
          <div className="flex border-t border-slate-100 pt-5 flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-400 max-w-lg text-center sm:text-left leading-relaxed">
              * Compliant batches with moisture &le; 13.5% will be stored immediately under primary bins. High moisture batches (&gt; 13.5%) are cataloged for the mechanical drying queue.
            </div>

            <MutationGuard action="SILOLINK_POST_LEDGER">
              <button
                type="submit"
                disabled={spreadsheetRows.filter(r => r.isValid).length === 0 || isSubmitSuccess}
                className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-400 border border-blue-950 shadow-md shadow-blue-950/10 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Database className="w-4 h-4" />
                <span>Post Ingestion Matrix Ledger</span>
              </button>
            </MutationGuard>
          </div>

        </form>

        {/* Submission Success Portal indicator */}
        {isSubmitSuccess && (
          <div className="mx-6 mb-6 p-4 bg-[#fafdff] border border-blue-200 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-xs block font-bold text-slate-900">Success: Ingestion committed to Co-op Accounts</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Successfully appended {committedReceiptCount} receipt lines inside the secure local silo ledger.</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-105 rounded px-2.5 py-1 text-[10px] text-blue-700 font-mono font-bold uppercase shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Silos Recalculated</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
