import React, { useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Truck, Map, Clock, AlertCircle, Sparkles, Navigation, 
  MapPin, CheckCircle, RefreshCw, ChevronRight, Play, AlertTriangle 
} from 'lucide-react';
import { generateUUID } from '@/lib/utils';

interface RegionalSurgeZone {
  id: string;
  region: string;
  district: string;
  cropType: string;
  surgeLevelPct: number; // 0 to 100
  recommendedAction: string;
  nearbySiloName: string;
  haulerReadyCount: number;
}

interface TimetableSlot {
  id: string;
  siloId: string;
  driverName: string;
  licensePlate: string;
  cropCategory: string;
  eta: string; // e.g. "14:15"
  netWeightTons: number;
  status: 'InTransit' | 'AtWeighbridge' | 'Cleared' | 'Delayed';
}

export default function HarvestGlutHeatmap() {
  const { silos, jobs } = useAgriOS();
  
  // Interactive Surge Zones list
  const [surgeZones, setSurgeZones] = useState<RegionalSurgeZone[]>([
    { id: 'z1', region: 'Northern Area Group', district: 'Gulu', cropType: 'Maize (Surge)', surgeLevelPct: 92, recommendedAction: 'Deploy high-capacity trailers immediately', nearbySiloName: 'Gulu Grain Silo', haulerReadyCount: 3 },
    { id: 'z2', region: 'Central Hub Region', district: 'Mityana', cropType: 'Beans (Sub-Critical)', surgeLevelPct: 68, recommendedAction: 'Route mid-capacity trucks as backup', nearbySiloName: 'Mityana Farmers Hub', haulerReadyCount: 1 },
    { id: 'z3', region: 'Southwestern Belt', district: 'Masaka', cropType: 'Coffee Surge', surgeLevelPct: 84, recommendedAction: 'Redirect empty reefers from Kampala depots', nearbySiloName: 'Masaka Local Depot', haulerReadyCount: 2 }
  ]);

  // Dispatch queue state
  const [localJobs, setLocalJobs] = useState(jobs);
  const [dispatchedCount, setDispatchedCount] = useState(2);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Timetable queue synchronization feed slots
  const [timetable, setTimetable] = useState<TimetableSlot[]>([
    { id: 'sl-1', siloId: 's1', driverName: 'Kato Patrick', licensePlate: 'UBA 485X', cropCategory: 'Maize', eta: '14:20', netWeightTons: 12.0, status: 'InTransit' },
    { id: 'sl-2', siloId: 's1', driverName: 'Odoki Walter', licensePlate: 'UBC 112W', cropCategory: 'Maize', eta: '14:45', netWeightTons: 8.5, status: 'AtWeighbridge' },
    { id: 'sl-3', siloId: 's2', driverName: 'Namusoke Proscovia', licensePlate: 'UAF 909Z', cropCategory: 'Beans', eta: '15:15', netWeightTons: 15.0, status: 'InTransit' },
    { id: 'sl-4', siloId: 's1', driverName: 'Sematimba Robert', licensePlate: 'UBF 582T', cropCategory: 'Maize', eta: '15:40', netWeightTons: 10.0, status: 'Delayed' },
    { id: 'sl-5', siloId: 's2', driverName: 'Kasule Ibrahim', licensePlate: 'UBB 344L', cropCategory: 'Coffee', eta: '16:00', netWeightTons: 6.0, status: 'Cleared' }
  ]);

  // Active farmer booking requests needing hauler transit assignment
  const [farmerBookings, setFarmerBookings] = useState([
    { id: 'fb-1', farmerName: 'Kakooza Isaac', district: 'Gulu', cropType: 'Maize', weightTons: 8.5, status: 'Awaiting Truck' },
    { id: 'fb-2', farmerName: 'Nassanga Ruth', district: 'Mityana', cropType: 'Beans', weightTons: 4.5, status: 'Awaiting Truck' },
    { id: 'fb-3', farmerName: 'Owor Peter', district: 'Gulu', cropType: 'Coffee', weightTons: 11.0, status: 'Awaiting Truck' }
  ]);

  // Empty transport haulers waiting for dispatch assignments
  const [truckInventory, setTruckInventory] = useState([
    { id: 'tr-1', driverName: 'Ssekabira David', licensePlate: 'UBD 725E', capacityTons: 10, currentDistrict: 'Gulu', status: 'Idle' },
    { id: 'tr-2', driverName: 'Nassolo Brenda', licensePlate: 'UBC 482B', capacityTons: 12, currentDistrict: 'Mityana', status: 'Idle' },
    { id: 'tr-3', driverName: 'Mukibi Frank', licensePlate: 'UAG 102M', capacityTons: 15, currentDistrict: 'Gulu', status: 'Idle' }
  ]);

  // Selected pairings state mapping for forms
  const [selectedTrucks, setSelectedTrucks] = useState<Record<string, string>>({});

  const handleMatchLogistics = (bookingId: string) => {
    const truckId = selectedTrucks[bookingId];
    if (!truckId) return;

    const booking = farmerBookings.find(b => b.id === bookingId);
    const truck = truckInventory.find(t => t.id === truckId);
    if (!booking || !truck) return;

    // Check capacity match
    if (truck.capacityTons < booking.weightTons) {
      setActiveNotification(`WARNING: Truck capacity (${truck.capacityTons}T) is smaller than crop volume (${booking.weightTons}T)!`);
      setTimeout(() => setActiveNotification(null), 3000);
      return;
    }

    // Assign status
    setFarmerBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Matched' } : b));
    setTruckInventory(prev => prev.map(t => t.id === truckId ? { ...t, status: 'Deployed' } : t));

    // Calculate a dynamic future arrival ETA
    const now = new Date();
    now.setMinutes(now.getMinutes() + 45 + Math.floor(Math.random() * 30));
    const etaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Map booking district to relevant silo node
    const destinationSiloId = booking.district === 'Gulu' ? 's1' : 's2';

    // Spawn en-route queue slot
    const newSlot: TimetableSlot = {
      id: `dynamic-${Date.now()}`,
      siloId: destinationSiloId,
      driverName: truck.driverName,
      licensePlate: truck.licensePlate,
      cropCategory: booking.cropType,
      eta: etaStr,
      netWeightTons: booking.weightTons,
      status: 'InTransit'
    };

    setTimetable(prev => [newSlot, ...prev]);
    setDispatchedCount(prev => prev + 1);
    setActiveNotification(`MATCH DEPLOYED: Deployed ${truck.driverName} (${truck.licensePlate}) to collect grain from ${booking.farmerName}!`);
    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
  };

  const [activeSiloFilter, setActiveSiloFilter] = useState<string>('s1');

  // Trigger empty hauler dispatch toward peak surge
  const handleDispatchHauler = (zoneId: string, district: string) => {
    setSurgeZones(prev => prev.map(z => {
      if (z.id === zoneId) {
        return { 
          ...z, 
          surgeLevelPct: Math.max(20, z.surgeLevelPct - 15),
          haulerReadyCount: Math.max(0, z.haulerReadyCount - 1)
        };
      }
      return z;
    }));

    setDispatchedCount(prev => prev + 1);
    setActiveNotification(`DISPATCHED: Hauler scheduled for urgent transit queue collection in ${district}!`);
    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
  };

  // Resolve gate delays dynamically
  const handleUpdateSlotStatus = (slotId: string, newStatus: TimetableSlot['status']) => {
    setTimetable(prev => prev.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, status: newStatus };
      }
      return slot;
    }));
  };

  // Recalculate gate delay metrics
  const filteredTimeSlots = timetable.filter(slot => slot.siloId === activeSiloFilter);
  const delayedCount = filteredTimeSlots.filter(s => s.status === 'Delayed').length;
  const inTransitCount = filteredTimeSlots.filter(s => s.status === 'InTransit').length;
  const clearedCount = filteredTimeSlots.filter(s => s.status === 'Cleared').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-inter">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-rose-100 text-rose-900 text-xs font-semibold rounded-full uppercase tracking-wider">Domain C - Regional Logistics Control</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-rose-600 animate-pulse" />
            <span>Harvest Glut & Logistics Dispatch Board</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Dual-screen coordinator mapping regional harvest surges to deploy empty haulers and optimize silo gate arrivals dynamically.</p>
        </div>

        {/* Real-time stats header strip */}
        <div className="flex items-center gap-4 bg-white p-3 border border-slate-250 rounded-xl shadow-xs text-xs">
          <div className="divide-x divide-slate-100 flex gap-4">
            <div className="pr-1">
              <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">HAULERS ROUTED</span>
              <strong className="text-sm font-black text-slate-800">{dispatchedCount} VANS</strong>
            </div>
            <div className="pl-4">
              <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">PENDING SILO QUEUES</span>
              <strong className="text-sm font-black text-amber-600">{delayedCount} CONGESTIONS</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Reactive Floating Dispatch Indicator alerts */}
      {activeNotification && (
        <div className="p-4 bg-emerald-950 text-emerald-200 border border-emerald-900 rounded-xl flex items-center justify-between font-mono text-xs shadow-lg animate-in slide-in-from-top-4 duration-305">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{activeNotification}</span>
          </div>
          <span className="text-[9px] bg-emerald-900/30 border border-emerald-800/40 text-emerald-400 px-1.5 py-0.5 font-bold uppercase rounded">
            Hauler Mobilized
          </span>
        </div>
      )}

      {/* PRIMARY GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Harvest Glut Distribution Map & Surge Zones (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* HARVEST GLUT HEATMAP COORDINATE REPRESENTATION */}
          <div className="bg-slate-950 rounded-2xl border border-slate-900 shadow-xl overflow-hidden relative flex flex-col h-[340px]">
            
            {/* Overlay coordinate branding details */}
            <div className="p-4 bg-slate-940 border-b border-slate-910 flex justify-between items-center z-10 shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-slate-100 font-mono text-xs">
                <Navigation className="w-4 h-4 text-rose-500 animate-bounce" />
                <span>Harvest Surge Heatmap Coordinates</span>
              </h3>
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 font-mono text-[9px] font-black border border-rose-500/20 rounded uppercase">
                Active Spatial Tracking
              </span>
            </div>

            {/* Custom vector-textured grid layout mimicking map plotting */}
            <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-zinc-950 p-6 select-none overflow-hidden flex items-center justify-center">
              
              {/* Map grid lines simulation */}
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

              {/* Peak Spoilage Danger High-Heat Glow Zones centered around coordinate nodes */}
              {surgeZones.map(zone => {
                // Determine placement based on id offsets
                let left = '25%';
                let top = '30%';
                if (zone.id === 'z2') { left = '65%'; top = '35%'; }
                if (zone.id === 'z3') { left = '45%'; top = '70%'; }

                return (
                  <React.Fragment key={zone.id}>
                    {/* Pulsing heat circles */}
                    <div 
                      className={`absolute rounded-full blur-xl animate-pulse pointer-events-none opacity-45 `}
                      style={{ 
                        left: `calc(${left} - 40px)`, 
                        top: `calc(${top} - 40px)`,
                        width: `${zone.surgeLevelPct * 1.5}px`,
                        height: `${zone.surgeLevelPct * 1.5}px`,
                        backgroundColor: zone.surgeLevelPct > 80 ? '#f43f5e' : zone.surgeLevelPct > 60 ? '#f59e0b' : '#3b82f6'
                      }}
                    ></div>

                    {/* Coordinate Visual Node Marker */}
                    <div 
                      className="absolute group flex flex-col items-center select-none"
                      style={{ left, top }}
                    >
                      <div className="relative">
                        <MapPin className={`w-6 h-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${
                          zone.surgeLevelPct > 80 ? 'text-rose-500' : 'text-amber-500'
                        }`} />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                      </div>

                      {/* Floating marker summary strip */}
                      <div className="bg-slate-900/95 border border-slate-800 text-white rounded-lg p-2 mt-1 shadow-lg text-[9px] font-mono leading-none flex flex-col space-y-1 z-30 pointer-events-auto">
                        <span className="font-bold text-zinc-300">{zone.district} ({zone.cropType.split(' ')[0]})</span>
                        <strong className={zone.surgeLevelPct > 80 ? 'text-rose-400' : 'text-amber-400'}>
                          Surge Load: {zone.surgeLevelPct}%
                        </strong>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* In-Transit simulated trailer positions */}
              <div className="absolute top-2/3 left-1/3 animate-pulse bg-white p-1 rounded-full border border-slate-200">
                <Truck className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="absolute top-1/3 left-2/3 animate-bounce bg-white p-1 rounded-full border border-slate-200">
                <Truck className="w-3.5 h-3.5 text-cyan-600" />
              </div>

            </div>

          </div>

          {/* ACTIVE REGIONAL SURGE DEPLOYMENT PANELS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-950 text-xs font-mono uppercase tracking-wider">Active Regional Harvest Surges</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Peak harvest aggregations waiting for transport extraction from fields.</p>
            </div>

            <div className="space-y-3">
              {surgeZones.map(zone => {
                const isCritical = zone.surgeLevelPct > 80;
                
                return (
                  <div 
                    key={zone.id} 
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                      isCritical ? 'bg-rose-50/20 border-rose-200 shadow-inner' : 'bg-slate-50/40 border-slate-150'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 select-text">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          isCritical ? 'bg-rose-100 text-rose-900 border border-rose-250 animate-pulse' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {zone.surgeLevelPct}% surge
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">{zone.district} • {zone.region}</h4>
                      </div>
                      <p className="text-slate-600 font-medium text-xs">Target Crop Category: <strong className="text-slate-900">{zone.cropType}</strong></p>
                      <p className="text-[10.5px] text-slate-450 italic leading-snug font-mono">⚡ Action: {zone.recommendedAction}</p>
                    </div>

                    <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-mono block">HAULERS STATIONED</span>
                        <strong className="text-sm font-black font-mono text-zinc-800">{zone.haulerReadyCount}</strong>
                      </div>
                      
                      <MutationGuard action="SILOLINK_DISPATCH_HAULER">
                        <button
                          type="button"
                          onClick={() => handleDispatchHauler(zone.id, zone.district)}
                          disabled={zone.haulerReadyCount === 0}
                          className={`font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                            isCritical 
                              ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          } disabled:opacity-40 disabled:hover:bg-transparent disabled:text-slate-400`}
                        >
                          <Play className="w-3 h-3 text-white/90" />
                          <span>Signal Dispatch</span>
                        </button>
                      </MutationGuard>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Queue Symchronization Feed & Gate Coordinator Timetable (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* COOPERATIVE TRANSPORT MARSHALLING CONSOLE */}
          <div className="bg-white border border-slate-205 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 text-[9px] font-mono font-black rounded uppercase tracking-wider">Logistics Marshalling Console</span>
              <h3 className="font-bold text-slate-950 text-xs mt-1 uppercase font-mono">Empty Truck & Farmer Booking Matcher</h3>
              <p className="text-[11px] text-slate-450 mt-0.5 leading-normal">Satisfy farmer space bookings by provisioning transport links with compatible payload volume limits.</p>
            </div>

            <div className="space-y-3">
              {farmerBookings.filter(b => b.status === 'Awaiting Truck').length === 0 ? (
                <div className="p-4 bg-emerald-50/20 border border-emerald-150 rounded-xl text-center text-emerald-805 text-xs py-5 font-bold">
                  🎉 ALL FARMER SPACE BOOKINGS MATCHED WITH SHRUBS & HAULERS SECURELY
                </div>
              ) : (
                farmerBookings.map(booking => {
                  const availableTrucks = truckInventory.filter(t => t.status === 'Idle');
                  
                  return (
                    <div key={booking.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] font-mono text-zinc-450 uppercase font-bold">FARM BOOKING REF: {booking.id} ({booking.district})</span>
                          <h4 className="font-bold text-slate-900 uppercase mt-0.5">{booking.farmerName}</h4>
                          <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium">
                            Category: <strong className="text-slate-800">{booking.cropType}</strong> • Volume: <strong className="text-slate-800">{booking.weightTons} TONS</strong>
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/50 rounded font-mono text-[9px] font-black uppercase shrink-0">
                          {booking.status}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-dashed border-slate-200">
                        <div className="flex-grow">
                          <select
                            value={selectedTrucks[booking.id] || ''}
                            onChange={(e) => setSelectedTrucks(prev => ({ ...prev, [booking.id]: e.target.value }))}
                            className="w-full bg-white border border-slate-250 hover:bg-slate-50 p-2 rounded-lg text-xs font-semibold text-slate-850 focus:outline-none"
                          >
                            <option value="">-- SELECT IDLE CARRIER VEHICLE --</option>
                            {availableTrucks.map(truck => (
                              <option key={truck.id} value={truck.id}>
                                {truck.driverName} ({truck.licensePlate}) - Cap: {truck.capacityTons}T
                              </option>
                            ))}
                          </select>
                        </div>

                        <MutationGuard action="SILOLINK_ASSIGN_TRUCK">
                          <button
                            type="button"
                            onClick={() => handleMatchLogistics(booking.id)}
                            disabled={!selectedTrucks[booking.id]}
                            className="bg-zinc-900 hover:bg-zinc-805 active:scale-98 disabled:opacity-40 disabled:hover:bg-zinc-900 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-lg shrink-0 flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Play className="w-3" />
                            <span>Assign</span>
                          </button>
                        </MutationGuard>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Deployed Trucks list */}
            {truckInventory.some(t => t.status === 'Deployed') && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase block mb-1.5">ACTIVE CO-OP LOGISTICS TRANSIT LINKS:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono leading-tight">
                  {truckInventory.filter(t => t.status === 'Deployed').map(truck => (
                    <div key={truck.id} className="p-2 bg-blue-50/40 border border-blue-105/50 rounded-lg flex items-center justify-between text-blue-905">
                      <span>🚚 {truck.driverName}</span>
                      <strong className="text-blue-700">EN ROUTE</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* SILO TIMETABLE SYNC PANEL */}
          <div className="bg-white border border-slate-205 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[480px]">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-950 text-xs uppercase font-mono tracking-wider flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-blue-600" />
                  <span>Silo Queue Arrival Sync Feed</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Enforcing reserved drop windows to eliminate weighbridge lines and bottlenecks.</p>
              </div>

              {/* Silo Node selectors */}
              <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex gap-1">
                {silos.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSiloFilter(s.id)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${
                      activeSiloFilter === s.id ? 'bg-zinc-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {s.district}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Summary counters */}
            <div className="p-4 border-b border-slate-100 bg-blue-50/20 grid grid-cols-3 gap-2 text-center text-xs divide-x divide-slate-100 uppercase font-mono font-bold">
              <div>
                <span className="text-[8px] text-slate-400 block pb-0.5">Gate Clear</span>
                <span className="text-emerald-600 text-xs flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>{clearedCount} Trucks</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-400 block pb-0.5">En Route</span>
                <span className="text-cyan-600 text-xs flex items-center justify-center gap-1">
                  <Truck className="w-3 h-3 text-cyan-500 animate-pulse" />
                  <span>{inTransitCount} EnRoute</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-400 block pb-0.5">Predicted Delay</span>
                <span className="text-amber-600 text-xs flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3" />
                  <span>{delayedCount} Delayed</span>
                </span>
              </div>
            </div>

            {/* The shared Timetable Feed list */}
            <div className="p-5 flex-grow overflow-y-auto divide-y divide-slate-100 max-h-[360px] space-y-2.5">
              
              {filteredTimeSlots.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  No haulers scheduled for this node shift today.
                </div>
              ) : (
                filteredTimeSlots.map(slot => {
                  const isDelayed = slot.status === 'Delayed';
                  const isCleared = slot.status === 'Cleared';
                  const isInTransit = slot.status === 'InTransit';
                  
                  return (
                    <div 
                      key={slot.id} 
                      className={`pt-2.5 ${
                        isDelayed ? 'bg-amber-50/10 border-l-2 border-l-amber-500 pl-2' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-slate-900">{slot.eta}</span>
                            <span className="text-[10px] text-zinc-400">•</span>
                            <span className="font-mono text-[10px] text-zinc-500 font-bold bg-slate-100 rounded px-1.2">{slot.licensePlate}</span>
                          </div>
                          
                          <p className="text-slate-800 text-xs font-bold uppercase mt-1">
                            {slot.driverName} • <span className="text-slate-500">{slot.cropCategory} ({slot.netWeightTons} Tons)</span>
                          </p>
                        </div>

                        {/* Status Label controls */}
                        <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                          {isDelayed ? (
                            <span className="inline-flex items-center gap-1.2 font-mono text-[9px] text-amber-800 bg-amber-50 border border-amber-200 py-0.5 px-2 rounded-full font-bold animate-pulse">
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Gate Delay Expected</span>
                            </span>
                          ) : isCleared ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-100 py-0.5 px-2 rounded-full font-bold">
                              <CheckCircle className="w-3 h-3 text-emerald-550 shrink-0" />
                              <span>Discharged Log</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-blue-700 bg-blue-50 border border-blue-105 py-0.5 px-2 rounded-full font-bold">
                              <RefreshCw className="w-3 h-3 text-blue-600 animate-spin shrink-0" />
                              <span>En Route</span>
                            </span>
                          )}

                          {/* Quick clearance Actions block */}
                          {!isCleared && (
                            <MutationGuard action="SILOLINK_GATE_CONTROL">
                              <div className="flex gap-1.5">
                                {isInTransit && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSlotStatus(slot.id, 'Delayed')}
                                    className="text-[8px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded pointer-events-auto"
                                  >
                                    Flag Delay
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSlotStatus(slot.id, 'Cleared')}
                                  className="text-[8px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 font-bold px-2 py-0.5 rounded transition-all pointer-events-auto"
                                >
                                  Approve Clearance
                                </button>
                              </div>
                            </MutationGuard>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}

            </div>

            {/* Note instructions section footer */}
            <div className="p-4.5 bg-slate-50 border-t border-slate-100 text-[10px] leading-relaxed text-slate-450 italic">
              * Gate clearances automatically update the structural silos unoccupied/occupied spaces. Real-time truck sensors transmit ETAs via LoRa gateways.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
