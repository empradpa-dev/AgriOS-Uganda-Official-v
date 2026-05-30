import React, { useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  AlertCircle, MapPin, Activity, ShieldCheck, Thermometer, 
  Layers, Filter, Users, Pill, ShoppingBag, Landmark, ArrowUpRight, 
  Map as MapIcon, Sliders, RefreshCw, Send, Check
} from 'lucide-react';
import type { EpidemiologicalReport } from '@/types';

// Let's declare our Ugandan regions for choropleth mapping
const UGANDA_REGIONS = [
  { id: 'north', name: 'Northern Region (Gulu)', code: 'UG-N', dangerIndex: 'Red', activeCount: 4, color: 'bg-red-500', bgLight: 'bg-red-500/10', border: 'border-red-500/20', textcolor: 'text-red-400' },
  { id: 'central', name: 'Central Region (Mityana)', code: 'UG-C', dangerIndex: 'Amber', activeCount: 2, color: 'bg-amber-500', bgLight: 'bg-amber-500/10', border: 'border-amber-500/20', textcolor: 'text-amber-400' },
  { id: 'east', name: 'Eastern Region (Mbale)', code: 'UG-E', dangerIndex: 'Green', activeCount: 0, color: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500/20', textcolor: 'text-emerald-400' },
  { id: 'west', name: 'Western Region (Kabale)', code: 'UG-W', dangerIndex: 'Yellow', activeCount: 1, color: 'bg-yellow-400', bgLight: 'bg-yellow-400/10', border: 'border-yellow-400/20', textcolor: 'text-yellow-400' }
];

// Extension agent leaderboards mock stats requested
const EXTENSION_OFFICERS_LEADERBOARD = [
  { id: 'o1', name: 'Samuel Odongo', district: 'Gulu', farmsVisited: 42, resolvedAlerts: 18, points: 940, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80' },
  { id: 'o2', name: 'Betty Namaganda', district: 'Mityana', farmsVisited: 38, resolvedAlerts: 14, points: 810, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80' },
  { id: 'o3', name: 'Okello Florence', district: 'Lira', farmsVisited: 29, resolvedAlerts: 8, points: 650, avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&h=100&q=80' }
];

export default function EpidemiologicalMap() {
  const { reports, updateReportStatus } = useAgriOS();
  
  // Selection/filtering state
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');
  const [allocationStatus, setAllocationStatus] = useState<Record<string, { deploying?: boolean; success?: boolean; qty?: number; pesticideName?: string }>>({});

  // Dynamic report list based on region filter click 
  const filteredReports = reports.filter(r => {
    if (selectedRegionId === 'all') return true;
    if (selectedRegionId === 'north') {
      return r.latitude > 1.0 || r.identifiedThreatVector.includes('Coffee') === false; // Northern proxy
    }
    if (selectedRegionId === 'central') {
      return r.latitude <= 1.0 && r.latitude > 0.1; // Central proxy
    }
    if (selectedRegionId === 'west') {
      return r.latitude <= 0.1; // Western proxy
    }
    return true;
  });

  // Action: Authorize Rapid Resource Allocation
  const triggerAllocation = (reportId: string, threatVector: string) => {
    setAllocationStatus(prev => ({
      ...prev,
      [reportId]: { deploying: true }
    }));

    // Choose fitting countermeasure pesticide
    const pesticideName = threatVector.includes('Wilt') ? 'Copper-Cop Fungicide' : threatVector.includes('Armyworm') ? 'Direct Pyrethroid T20' : 'Neem-Emulsion biological';
    const volumeLiters = threatVector.includes('Wilt') ? 50 : 120;

    setTimeout(() => {
      // Execute transition state to context
      updateReportStatus(reportId, 'ResourceDeployed');
      
      setAllocationStatus(prev => ({
        ...prev,
        [reportId]: { 
          deploying: false, 
          success: true, 
          qty: volumeLiters,
          pesticideName: pesticideName
        }
      }));
    }, 1200);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Title & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded-full uppercase tracking-wider">Domain B - MAAIF Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">MAAIF National Epidemiological Threat Heatmap</h2>
          <p className="text-slate-500 text-sm mt-0.5">Underpinning crop biosecurity using interactive multi-region hazard indexes & localized pesticide stocks authorization.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Active Threats</span>
              <span className="text-lg font-mono font-black text-slate-950">
                {reports.filter(r => r.status === 'Pending').length}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Pushes Resolved</span>
              <span className="text-lg font-mono font-black text-slate-950">
                {reports.filter(r => r.status === 'ResourceDeployed').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Map & Choropleth Controls */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            
            {/* Map Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-950 text-sm flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-red-500" />
                  <span>Uganda Regional Disease Density Map</span>
                </h3>
                <p className="text-xs text-slate-400">Interactive Map. Click on any regional zone below to focus the outbreak registry filters.</p>
              </div>

              {/* Region Selector Filter Bar */}
              <div className="flex gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
                <button
                  onClick={() => setSelectedRegionId('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedRegionId === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All (Uganda)
                </button>
                {UGANDA_REGIONS.map(reg => (
                  <button
                    key={reg.id}
                    onClick={() => setSelectedRegionId(reg.id)}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      selectedRegionId === reg.id ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    {reg.code}
                  </button>
                ))}
              </div>
            </div>

            {/* INTERACTIVE VECTOR CHOROPLETH GRAPH */}
            <div className="p-6 bg-slate-950 relative h-[440px] flex items-center justify-center border-b border-slate-100 overflow-hidden">
              
              {/* Radar Grid Overlay */}
              <div className="absolute inset-x-0 h-px bg-white/5 top-1/4 pointer-events-none"></div>
              <div className="absolute inset-x-0 h-px bg-white/5 top-2/4 pointer-events-none"></div>
              <div className="absolute inset-x-0 h-px bg-white/5 top-3/4 pointer-events-none"></div>
              <div className="absolute inset-y-0 w-px bg-white/5 left-1/4 pointer-events-none"></div>
              <div className="absolute inset-y-0 w-px bg-white/5 left-2/4 pointer-events-none"></div>
              <div className="absolute inset-y-0 w-px bg-white/5 left-3/4 pointer-events-none"></div>

              {/* Layout Mock map: Styled grids of major Ugandan farming hub polygons */}
              <div className="w-full max-w-lg grid grid-cols-2 gap-4 relative z-10">
                
                {UGANDA_REGIONS.map(reg => {
                  const isSelected = selectedRegionId === reg.id || selectedRegionId === 'all';
                  return (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedRegionId(reg.id)}
                      className={`p-5 rounded-2xl text-left border relative overflow-hidden transition-all text-white group ${
                        isSelected 
                          ? `${reg.bgLight} ${reg.border} ring-1 ring-slate-800 scale-100` 
                          : 'opacity-30 border-transparent hover:opacity-50'
                      }`}
                    >
                      {/* Danger-level pill top right */}
                      <span className={`absolute top-4 right-4 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                        reg.dangerIndex === 'Red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        reg.dangerIndex === 'Amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {reg.dangerIndex} LEVEL
                      </span>

                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">{reg.code} INTERIOR</span>
                          <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-amber-450">{reg.name}</h4>
                        </div>

                        {/* Blinks and visual dots */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Threat Indicators:</span>
                          <span className={`font-mono font-bold text-sm ${reg.activeCount > 0 ? reg.textcolor : 'text-slate-500'}`}>
                            {reg.activeCount} active
                          </span>
                        </div>
                      </div>

                    </button>
                  );
                })}

              </div>

              {/* Map Floating Legend */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 p-3 rounded-xl flex justify-between text-[10px] font-mono text-slate-400 gap-4">
                <span>📍 ACTIVE GEOLOCK CORRIDOR</span>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Red Critical</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Amber Medium</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Green Safe</span>
                </div>
              </div>

            </div>

          </div>

          {/* DENSE LEADERBOARD: Extension Vector Activity Stream */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">Extension Vector Activity Stream</h3>
                <p className="text-xs text-slate-400">Monitoring field agent operational metrics reported from remote subcounties.</p>
              </div>
              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-lg text-[10px] font-mono font-black">
                FIELD AGENTS LEADERBOARD
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXTENSION_OFFICERS_LEADERBOARD.map((officer, k) => (
                <div 
                  key={officer.id} 
                  className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex gap-3.5 items-center hover:border-slate-350 transition-colors"
                >
                  <div className="relative">
                    <img 
                      src={officer.avatar} 
                      onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'; }}
                      className="w-11 h-11 rounded-full object-cover border border-slate-300 shadow" 
                      alt={officer.name} 
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-white text-white font-mono text-[9px] font-black flex items-center justify-center">
                      #{k + 1}
                    </span>
                  </div>

                  <div className="leading-tight overflow-hidden text-xs">
                    <h4 className="font-bold text-slate-900 truncate">{officer.name}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Parish: <strong className="text-slate-650">{officer.district}</strong></span>
                    
                    <div className="flex gap-3 text-[10px] text-slate-500 mt-2">
                      <span>Farms: <strong>{officer.farmsVisited}</strong></span>
                      <span>Points: <strong className="text-indigo-650">{officer.points}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Rapid Resource Allocation Deck */}
        <div className="lg:col-span-4 flex flex-col">
          
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden min-h-[500px]">
            
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-sm text-white">Rapid Resource Allocation Deck</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Authorize pesticide allocations direct to recorded report targets.</p>
              </div>
            </div>

            {/* List of active outbreaks for fast allocation action */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {filteredReports.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <span className="text-xs">No active reports match this map filter region.</span>
                  <button 
                    onClick={() => setSelectedRegionId('all')}
                    className="text-amber-400 font-bold block mx-auto text-xs"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                filteredReports.map(report => {
                  const alloc = allocationStatus[report.id] || {};
                  
                  return (
                    <div 
                      key={report.id} 
                      className="p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 transition-colors space-y-3 relative overflow-hidden"
                    >
                      {/* Severity Side marking */}
                      <span className={`absolute left-0 top-0 bottom-0 w-1 ${
                        report.severityScale === 'Critical' ? 'bg-red-500' :
                        report.severityScale === 'Medium' ? 'bg-amber-500' :
                        'bg-yellow-400'
                      }`}></span>

                      <div className="space-y-1 pl-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono text-slate-500">
                            {new Date(report.timestamp).toLocaleDateString()}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 rounded uppercase font-bold ${
                            report.severityScale === 'Critical' ? 'bg-red-500/20 text-red-400' :
                            report.severityScale === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-yellow-400/20 text-yellow-400'
                          }`}>
                            {report.severityScale}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-white uppercase">{report.identifiedThreatVector}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          📍 Lat {report.latitude}, Lng {report.longitude} • {report.targetCrop}
                        </p>
                      </div>

                      {/* Photo Thumbnail visual */}
                      <div className="relative h-20 rounded-lg overflow-hidden border border-slate-850 bg-slate-900 shadow-inner">
                        <img 
                          src={report.imageProofUrl} 
                          alt="Outbreak snap" 
                          className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                      </div>

                      {/* Intervention action row */}
                      <div className="pt-2 flex flex-col gap-2">
                        {report.status === 'ResourceDeployed' ? (
                          <div className="bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg text-[10px] space-y-1">
                            <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> ALLOCATION DISPATCHED
                            </span>
                            <p className="text-slate-400">
                              Volume: <strong className="text-white">{alloc.qty || 120} Liters</strong> of {alloc.pesticideName || 'Special fungicide'}.
                            </p>
                          </div>
                        ) : (
                          <MutationGuard action="EPIDEMIOLOGICAL_ALLOCATE">
                            <button
                              type="button"
                              onClick={() => triggerAllocation(report.id, report.identifiedThreatVector)}
                              disabled={alloc.deploying}
                              className="w-full bg-red-600 hover:bg-red-505 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg text-center cursor-pointer transition-colors"
                            >
                              {alloc.deploying ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" />
                              ) : (
                                'Authorize Local Pesticide Stock'
                              )}
                            </button>
                          </MutationGuard>
                        )}
                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
