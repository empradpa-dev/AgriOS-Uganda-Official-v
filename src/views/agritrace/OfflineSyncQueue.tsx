import React, { useEffect, useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import { 
  WifiOff, Wifi, RefreshCw, Server, Send, AlertTriangle, 
  Database, Cpu, Clock, HardDrive, Sparkles, CheckCircle, Flame
} from 'lucide-react';
import type { InputAllocationTransaction } from '@/types';

export default function OfflineSyncQueue() {
  const { transactions, syncOfflineTransactions, users, batches } = useAgriOS();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulatedBlackout, setSimulatedBlackout] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [compressionRatio, setCompressionRatio] = useState(74); // 74% compression
  
  // Real network state listener as well as simulated
  useEffect(() => {
    const handleOnline = () => {
      if (!simulatedBlackout) setIsOnline(true);
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [simulatedBlackout]);

  // Keep simulated online state in sync
  const toggleNetworkMode = () => {
    const nextState = !simulatedBlackout;
    setSimulatedBlackout(nextState);
    if (nextState) {
      setIsOnline(false);
    } else {
      setIsOnline(navigator.onLine);
    }
  };

  // Filter local store
  const offlineTxs = transactions.filter(t => t.syncState === 'OfflineCached');
  const syncedTxs = transactions.filter(t => t.syncState === 'OnlineSync');

  // Trigger sync animation & dispatch action
  const handleForceSync = () => {
    if (offlineTxs.length === 0) return;
    setIsSyncing(true);
    setRetryAttempts(1);
    
    setTimeout(() => {
      setRetryAttempts(2);
      setTimeout(() => {
        syncOfflineTransactions();
        setIsSyncing(false);
        setRetryAttempts(0);
      }, 1200);
    }, 1000);
  };

  // Helper helper to get details of a transaction
  const getFarmerName = (id: string) => {
    const u = users.find(user => user.id === id);
    return u ? u.fullName : 'Unknown Farmer';
  };

  const getBatchLabel = (id: string) => {
    const b = batches.find(batch => batch.id === id);
    return b ? `${b.sku} (${b.assetType})` : 'Subsidized Input';
  };

  // Simulated payload sizes
  const totalRawBytes = offlineTxs.length * 480; // 480 bytes per transaction JSON
  const compressedBytes = Math.round(totalRawBytes * (1 - compressionRatio / 100));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full uppercase tracking-wider">Domain A - Resilient Operations</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Offline-First Transaction Buffer Queue</h2>
          <p className="text-slate-500 text-sm mt-0.5">Assuring LAST-MILE integrity in remote subcounties with Zero-Packet-Loss local buffer queues.</p>
        </div>
        
        {/* Toggle Simulated Blackout */}
        <button
          onClick={toggleNetworkMode}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
            simulatedBlackout 
              ? 'bg-amber-500 text-white border-amber-600 shadow shadow-amber-500/10' 
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
          }`}
        >
          {simulatedBlackout ? (
            <>
              <WifiOff className="w-4 h-4 text-white animate-pulse" />
              <span>BLACKOUT MODE ACTIVE</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>SIMULATE BLACKOUT</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Visual Status meters and statistics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Signal Integrity Dashboard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-950 text-xs tracking-wider uppercase mb-4 text-slate-500">Signal Integrity Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Antenna Link</span>
                  <span className={`text-sm font-black ${isOnline ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className={`p-2 rounded-full ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {isOnline ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
                </div>
              </div>

              {/* Heartbeat Retry timer */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Ledger Auto-Retry Beats</span>
                  {isOnline && offlineTxs.length > 0 ? (
                    <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-200 px-1.5 rounded animate-pulse">Pulsing</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-mono">Idle</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {isSyncing ? `Handshake... (Attempt ${retryAttempts}/2)` : isOnline ? 'Heartbeat: Valid (15 Sec interval)' : 'Signal Search: ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Encrypted device payload info */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Encrypted Device Storage</span>
                  <span className="text-[9px] text-emerald-600 font-mono flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    AES-256-GCM
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-2 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">Encrypted</span>
                    <span className="text-sm font-black text-amber-600 font-mono">{offlineTxs.length} items</span>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">Uploaded</span>
                    <span className="text-sm font-black text-slate-800 font-mono">{syncedTxs.length} items</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Gzip/Protobuf Compression meter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-950 text-xs tracking-wider uppercase text-slate-500">Data Compression Engine</h3>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-mono border border-indigo-100 rounded">
                GZIP STREAM
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs items-baseline">
                <span className="text-slate-500">Uncompressed Size:</span>
                <span className="font-mono text-slate-900 font-bold">{totalRawBytes} B</span>
              </div>
              <div className="flex justify-between text-xs items-baseline">
                <span className="text-slate-500">Payload to upload:</span>
                <span className="font-mono text-emerald-600 font-black">{compressedBytes} B</span>
              </div>

              <div className="relative pt-2">
                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 mb-1">
                  <span>COMPRESSION EFFICIENCY</span>
                  <span className="text-[#f97316]">{compressionRatio}% Saved</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                  <div 
                    className="bg-[#f97316] h-full" 
                    style={{ width: `${compressionRatio}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic leading-snug pt-1">
                Before remote transmission, the JSON database rows are tightly compressed into raw bytes packets to bypass high satellite packet charge parameters.
              </p>
            </div>
          </div>

        </div>

        {/* Right Hand: Interactive Queue visualizer */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-[420px]">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">Active Heartbeat Queue Cache</h3>
                <p className="text-xs text-slate-400 mt-0.5">Records in active device memory cache waiting for handshake.</p>
              </div>

              {/* Force cloud sync button */}
              <button
                type="button"
                onClick={handleForceSync}
                disabled={offlineTxs.length === 0 || !isOnline || isSyncing}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-[#059669] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:shadow-none"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting Cache...</span>
                  </>
                ) : (
                  <>
                    <Server className="w-3.5 h-3.5" />
                    <span>Flush & Push Queue ({offlineTxs.length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Queue Buffer Area list */}
            <div className="p-6 flex-grow overflow-y-auto">
              {offlineTxs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 max-w-md mx-auto">
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-950 text-sm">Parish Ledger is 100% Synced</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-normal">
                    Outstanding handovers have been cleanly logged to the central database stack. No outstanding payloads exist. 
                  </p>
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f97316] shrink-0" />
                    <span>Toggle "Blackout Mode" and trigger an intake verify scan to test offline queuing.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Warning bar for Offline Mode */}
                  {!isOnline && (
                    <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Device currently in Remote Blackout state.</span>
                        <p className="text-[11px] text-amber-700/90 mt-0.5">
                          Transactions logged now will hold securely in device storage. Central server will not reflect these until a link heartbeat recovers.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Buffer cards grid lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offlineTxs.map(tx => (
                      <div 
                        key={tx.id} 
                        className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-amber-400 transition-colors relative overflow-hidden group shadow-xs"
                      >
                        {/* Orange marker representing offline buffer */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                              CACHED OFFLINE
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(tx.handoverTimestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Farmer Beneficiary</span>
                            <span className="font-bold text-slate-900 text-sm">{getFarmerName(tx.farmerId)}</span>
                          </div>

                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Input Class Allocated</span>
                            <span className="text-xs text-slate-600 font-medium">{getBatchLabel(tx.batchId)}</span>
                          </div>
                        </div>

                        {/* Card bottom audit metadata */}
                        <div className="border-t border-slate-200/60 pt-2.5 mt-3 flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>Qty: <strong className="text-slate-800">{tx.quantityHandedOver} unit</strong></span>
                          <span>ID: {tx.smsReceiptId}</span>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Synced summary details */}
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="font-bold text-slate-950 text-xs text-slate-400 uppercase tracking-wider mb-3">Recently Synced Records (This Session)</h4>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/50 space-y-1.5 text-xs text-slate-600">
                      {syncedTxs.length === 0 ? (
                        <p className="text-slate-400 italic p-2 text-center text-xs">No transactions pushed online during this session yet.</p>
                      ) : (
                        syncedTxs.slice(-3).map(tx => (
                          <div key={tx.id} className="flex justify-between items-center py-1.5 border-b border-slate-150 last:border-0 px-2">
                            <span className="font-medium text-slate-800">{getFarmerName(tx.farmerId)}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{getBatchLabel(tx.batchId)} x{tx.quantityHandedOver}</span>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              SYNCED
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
