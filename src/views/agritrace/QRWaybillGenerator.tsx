import React, { useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Package, Truck, QrCode, AlertTriangle, Printer, MapPin, 
  Plus, Check, Sparkles, Navigation, Globe, Scale, RefreshCw
} from 'lucide-react';
import type { AgriculturalBatch } from '@/types';

// Additional mock checkpoints list to choose from for custom transitions
const SAMPLE_CHECKPOINTS = [
  'Kampala Central Depot',
  'Mityana Weighbridge',
  'Luweero Station',
  'Kigumba Depot',
  'Karuma Checkpoint',
  'Gulu Regional Hub',
  'Layibi Parish Gate'
];

export default function QRWaybillGenerator() {
  const { batches } = useAgriOS();
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [localBatches, setLocalBatches] = useState<AgriculturalBatch[]>(batches);
  const [newCheckpointInput, setNewCheckpointInput] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  
  const currentBatch = localBatches.find(b => b.id === selectedBatchId) || localBatches[0];

  // Manual Checkpoint Addition
  const handleAddCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpointInput.trim() || !currentBatch) return;

    setLocalBatches(prev => prev.map(b => {
      if (b.id === currentBatch.id) {
        const currentCheckpoints = b.transitCheckpoints || [];
        if (currentCheckpoints.includes(newCheckpointInput)) return b; // Avoid duplicates
        return {
          ...b,
          transitCheckpoints: [...currentCheckpoints, newCheckpointInput],
          // Dynamically transition status if they reach layibi/parish gate
          status: newCheckpointInput === 'Layibi Parish Gate' ? 'ReceivedAtParish' : 'InTransit'
        };
      }
      return b;
    }));
    setNewCheckpointInput('');
  };

  const simulateTransitStep = (checkpoint: string) => {
    if (!currentBatch) return;
    setLocalBatches(prev => prev.map(b => {
      if (b.id === currentBatch.id) {
        const currentCheckpoints = b.transitCheckpoints || [];
        if (currentCheckpoints.includes(checkpoint)) return b;
        return {
          ...b,
          transitCheckpoints: [...currentCheckpoints, checkpoint],
          status: checkpoint === 'Layibi Parish Gate' ? 'ReceivedAtParish' : 'InTransit'
        };
      }
      return b;
    }));
  };

  // Simulated printing sticker effect
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-semibold rounded-full uppercase tracking-wider">Domain A - NAADS Supply Chain</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">NAADS Bulk Logistics Dispatch Deck</h2>
        <p className="text-slate-500 text-sm mt-0.5">Generate high-density cryptographic tracking waybill labels and trace grain/seed palettes across national corridors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Hand: Dense Procurement ledger listing cargo items */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">Central Depot - Active Supply Ledger</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select a cargo shipment below to synthesize its tracking sticker & register check-ins.</p>
              </div>
              <span className="px-2.5 py-1 bg-white text-slate-500 rounded-lg text-xs font-mono font-bold border border-slate-200 shadow-xs">
                NODE: KAMPALA_CENTRAL
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="text-slate-400 bg-slate-50/50 uppercase tracking-wider font-bold border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="p-4">SKU / Code</th>
                    <th className="p-4">Asset Family</th>
                    <th className="p-4">Volume (KG)</th>
                    <th className="p-4">Origin Hub</th>
                    <th className="p-4">Warehouse Status</th>
                    <th className="p-4 text-right">Labeling Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localBatches.map(batch => {
                    const isSelected = batch.id === selectedBatchId;
                    return (
                      <tr 
                        key={batch.id} 
                        onClick={() => setSelectedBatchId(batch.id)}
                        className={`hover:bg-slate-50 border-b border-slate-150 transition-colors cursor-pointer ${
                          isSelected ? 'bg-cyan-50/50' : ''
                        }`}
                      >
                        <td className="p-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Package className={`w-4 h-4 ${isSelected ? 'text-cyan-600' : 'text-slate-400'}`} />
                            <span>{batch.sku}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-700">{batch.assetType}</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-900 font-mono">
                          {batch.totalVolumeWeight.toLocaleString()} KG
                        </td>
                        <td className="p-4 text-slate-500">
                          {batch.originSupplier}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            batch.status === 'InTransit' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            batch.status === 'ReceivedAtParish' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}>
                            {batch.status === 'InTransit' ? 'IN TRANSITCORRIDOR' : 'RECEIVED AT PARISH'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedBatchId(batch.id); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              isSelected 
                                ? 'bg-cyan-600 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            SELECT & STICKER
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* Geospatial Checkpoint transit tracker layout */}
          {currentBatch && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-925 text-sm flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-cyan-600 animate-pulse" />
                    <span>Geospatial Corridor Route Ledger</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tracking transit check-points of supply sku <strong>{currentBatch.sku}</strong> across Uganda.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] shrink-0 font-bold uppercase text-slate-400">Add Checkpoint:</span>
                  <MutationGuard action="AGRITRACE_DISPATCH">
                    <form onSubmit={handleAddCheckpoint} className="flex gap-2">
                      <select
                        value={newCheckpointInput}
                        onChange={(e) => setNewCheckpointInput(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">-- Choose Checkpoint --</option>
                        {SAMPLE_CHECKPOINTS.map(cp => (
                          <option 
                            key={cp} 
                            value={cp} 
                            disabled={currentBatch.transitCheckpoints?.includes(cp)}
                          >
                            {cp}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={!newCheckpointInput}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </MutationGuard>
                </div>
              </div>

              {/* Graphical nodes timeline representation */}
              <div className="relative">
                {/* Horizontal line */}
                <div className="absolute top-[21px] left-6 right-6 h-0.5 bg-slate-200 pointer-events-none"></div>
                <div 
                  className="absolute top-[21px] left-6 h-0.5 bg-cyan-600 transition-all duration-500 pointer-events-none" 
                  style={{ width: `${Math.max(10, ((currentBatch.transitCheckpoints?.length || 1) / SAMPLE_CHECKPOINTS.length) * 100)}%` }}
                ></div>

                 <MutationGuard action="AGRITRACE_DISPATCH">
                   <div className="grid grid-cols-2 md:grid-cols-7 gap-y-6 md:gap-x-2 relative z-10">
                     {SAMPLE_CHECKPOINTS.map((checkpoint, index) => {
                       const isPassed = currentBatch.transitCheckpoints?.includes(checkpoint);
                       return (
                         <div 
                           key={checkpoint} 
                           className="flex flex-col items-center text-center group cursor-pointer"
                           onClick={() => simulateTransitStep(checkpoint)}
                         >
                           {/* Node sphere */}
                           <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                             isPassed 
                               ? 'bg-cyan-50 border-cyan-600 text-cyan-700 shadow shadow-cyan-100' 
                               : 'bg-white border-slate-200 text-slate-300 group-hover:border-slate-300 group-hover:text-slate-500'
                           }`}>
                             {isPassed ? (
                               <Check className="w-4.5 h-4.5 stroke-[3px]" />
                             ) : (
                               <span className="text-xs font-mono font-bold">{index + 1}</span>
                             )}
                           </div>

                           <div className="mt-2 px-1">
                             <span className={`text-[10px] block font-bold tracking-tight ${
                               isPassed ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'
                             }`}>
                               {checkpoint.split(' ').slice(0, 2).join(' ')}
                             </span>
                             <span className="text-[8px] text-slate-400 font-mono block">
                               {isPassed ? 'Verified ✓' : 'Pending'}
                             </span>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </MutationGuard>
              </div>

              {/* Transit data stats panel */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex gap-2.5 items-center">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Corridor Weight</span>
                    <strong className="text-slate-800 font-mono text-sm">{currentBatch.totalVolumeWeight.toLocaleString()} KG</strong>
                  </div>
                </div>

                <div className="flex gap-2.5 items-center">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Waybill Routing Security</span>
                    <strong className="text-slate-800 text-sm">NON-REFORGEABLE</strong>
                  </div>
                </div>

                <div className="flex gap-2.5 items-center">
                  <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Latest Stop Logged</span>
                    <strong className="text-slate-800 text-xs truncate max-w-[150px] block">
                      {currentBatch.transitCheckpoints && currentBatch.transitCheckpoints.length > 0 
                        ? currentBatch.transitCheckpoints[currentBatch.transitCheckpoints.length - 1] 
                        : 'Origin Store'}
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Hand: Cryptographic QR Waybill Sticker view */}
        <div className="lg:col-span-4">
          {currentBatch ? (
            <div className="space-y-6">
              
              {/* Sticker outer container */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-100 pb-3">
                  <span>Cryptographic Pallet Sticker</span>
                  <span className="text-[10px] text-zinc-400 font-mono">STKR_v4.5</span>
                </h4>

                {/* Printable physical sticker element representation */}
                <div className="bg-[#fcfdfa] border-2 border-dashed border-zinc-300 p-5 rounded-xl space-y-4 shadow-inner relative text-slate-900">
                  
                  {/* Holographic sticker indicator visual */}
                  <div className="absolute right-4 top-4 bg-gradient-to-tr from-cyan-400 via-yellow-400 to-indigo-500 opacity-40 rounded w-10 h-10 border border-white/60 shadow flex items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black font-mono text-slate-950 scale-75">NAADS</span>
                  </div>

                  <div className="text-center font-bold tracking-widest text-[9px] text-zinc-500 uppercase pb-1 border-b border-zinc-200">
                    NATIONAL CORRIDOR SECURITY WAYBILL
                  </div>

                  {/* High Quality SVG-like Dynamic QR code generated */}
                  <div className="flex justify-center py-4 relative group">
                    <div className="bg-white border border-zinc-200 p-3 rounded-xl shadow-sm hover:ring-2 hover:ring-cyan-500/50 transition-all duration-300 relative">
                      
                      {/* Generates a stylized high-density grid QR mock represent cryptographic layout */}
                      <div className="w-40 h-40 bg-slate-900 rounded p-1.5 flex flex-wrap content-start select-none relative overflow-hidden">
                        
                        {/* High-density grid cells for crypto effect */}
                        <div className="absolute inset-0 p-2 grid grid-cols-12 gap-0.5 bg-slate-950">
                          {Array.from({ length: 144 }).map((_, index) => {
                            // Seeded random dots to simulate real QR representation of current waybill token
                            const lengthSeed = (currentBatch.waybillCryptographicToken.length * index) % 17;
                            const isFill = lengthSeed < 9 || (index % 11 === 0) || (index < 12) || (index > 130);
                            
                            // Create the standard 3 square corners
                            const isCornerSquare = 
                              (index < 47 && (index % 12 < 4)) || // top-left
                              (index < 47 && (index % 12 >= 8)) || // top-right
                              (index >= 96 && (index % 12 < 4));   // bottom-left

                            const fillStyle = isCornerSquare || isFill ? 'bg-white' : 'bg-transparent';
                            
                            return (
                              <div 
                                key={index} 
                                className={`rounded-sm transition-all duration-300 ${fillStyle}`}
                              ></div>
                            );
                          })}
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Waybill alphanumeric details */}
                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="border-b border-zinc-150 pb-2 flex justify-between items-baseline">
                      <span className="text-[9px] text-zinc-400 uppercase">Cryptographic Waybill Token</span>
                      <strong className="text-slate-950 text-right text-xs bg-zinc-100 px-1.5 rounded">{currentBatch.waybillCryptographicToken}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] leading-relaxed">
                      <div>
                        <span className="text-[8px] text-zinc-400 block uppercase">Product SKU ID</span>
                        <strong className="text-slate-900 font-sans block">{currentBatch.sku}</strong>
                        <span className="text-[9px] text-zinc-500 font-sans">{currentBatch.assetType}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-400 block uppercase">PALLET SEGMENT</span>
                        <strong className="text-slate-900 font-sans block">1 of 12 Crates</strong>
                        <span className="text-[9px] text-zinc-500 font-sans">Net {currentBatch.totalVolumeWeight.toLocaleString()} kgs</span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-150 pt-2 flex justify-between items-center text-[9px] text-zinc-400">
                      <span>Authority: NAADS_HQ</span>
                      <span>Security: SHA_256 SIG</span>
                    </div>
                  </div>

                </div>

                {/* Print and Actions controls */}
                <div className="space-y-2">
                  <MutationGuard action="AGRITRACE_DISPATCH">
                    <button
                      onClick={handlePrint}
                      disabled={isPrinting}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                      {isPrinting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending to Dispatch Printer...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Waybill Pallet Decal</span>
                        </>
                      )}
                    </button>
                  </MutationGuard>

                  <p className="text-[10px] text-slate-400 text-center leading-normal">
                    Decal stickers are affixed onto NAADS physical delivery truck gates, verified on county checkpoint scales using standard devices.
                  </p>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 h-full flex flex-col items-center justify-center min-h-[300px]">
              <QrCode className="w-12 h-12 text-slate-350 animate-pulse mb-3" />
              <p className="text-xs">No procurement batch select for generator preview.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
