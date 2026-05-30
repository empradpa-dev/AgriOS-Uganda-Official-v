import React, { useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Package, MapPin, Calendar, CheckSquare, QrCode, ShieldCheck, 
  TrendingUp, Coins, Building2, User, Scale, ArrowRight, CornerDownRight, 
  Lock, Sparkles, Smartphone, Landmark, FileText, CheckCircle2
} from 'lucide-react';
import USSDMenuSimulator from './USSDMenuSimulator';

export default function StorageBookingWizard() {
  const { silos, reserveStorage, currentUser } = useAgriOS();
  const [step, setStep] = useState<number>(1);
  const [selectedCrop, setSelectedCrop] = useState<string>('Maize');
  const [volumeTons, setVolumeTons] = useState<string>('');
  const [selectedSiloId, setSelectedSiloId] = useState<string>(silos[0]?.id || '');
  const [dropoffDate, setDropoffDate] = useState<string>('');
  const [receiptToken, setReceiptToken] = useState<string>('');
  
  // Tab selector to swap on mobile screens if screen is tight, but side-by-side on desktop
  const [activeChannel, setActiveChannel] = useState<'SMARTPHONE' | 'FEATURE_PHONE'>('SMARTPHONE');

  const selectedSilo = silos.find(s => s.id === selectedSiloId) || silos[0];

  // Fair market prices to protect against middlman gating
  const cropPrices = [
    { type: 'Maize', fairPrice: 1200, middlemanExploitPrice: 750, marginImproved: 450, unit: 'Kg' },
    { type: 'Coffee Beans', fairPrice: 5405, middlemanExploitPrice: 3800, marginImproved: 1605, unit: 'Kg' },
    { type: 'Beans', fairPrice: 2500, middlemanExploitPrice: 1600, marginImproved: 900, unit: 'Kg' },
    { type: 'Sorghum', fairPrice: 1800, middlemanExploitPrice: 1100, marginImproved: 700, unit: 'Kg' }
  ];

  const handleBookingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volumeTons || !selectedSiloId) return;
    
    // Process storage reservation token inside domain context
    const volume = parseFloat(volumeTons);
    const generatedToken = reserveStorage(selectedSiloId, currentUser?.id || 'u1', volume);
    
    setReceiptToken(generatedToken);
    setStep(3);
  };

  const currentCropPriceDetails = cropPrices.find(p => p.type === selectedCrop) || cropPrices[0];
  const projectedEarningsUGX = volumeTons ? parseFloat(volumeTons) * 1000 * currentCropPriceDetails.fairPrice : 0;
  const savingsOverBrokersUGX = volumeTons ? parseFloat(volumeTons) * 1000 * currentCropPriceDetails.marginImproved : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-inter">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-900 text-xs font-semibold rounded-full uppercase tracking-wider">Domain C - Smallholder Logistics Gateway</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-cyan-600" />
            <span>Farmer Mobile & USSD Storage Portal</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Enabling smallholders to bypass exploitative middleman gates, check real-time regional warehousing capacity, and tokenise grain receipts.</p>
        </div>

        {/* Channel Selection Toggle (For mobile layout sizing helpers) */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-205 md:hidden self-start">
          <button
            onClick={() => setActiveChannel('SMARTPHONE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChannel === 'SMARTPHONE' ? 'bg-white text-cyan-950 shadow-xs' : 'text-slate-500'
            }`}
          >
            Smartphone App
          </button>
          <button
            onClick={() => setActiveChannel('FEATURE_PHONE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChannel === 'FEATURE_PHONE' ? 'bg-white text-cyan-950 shadow-xs' : 'text-slate-500'
            }`}
          >
            Feature Phone (USSD)
          </button>
        </div>
      </div>

      {/* DUAL WORKSPACE LAYOUT: Split view for smart/feature channels */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Smartphone Portal Interface + Price Feeds (8 Cols) */}
        <div className={`md:col-span-8 space-y-6 ${activeChannel === 'FEATURE_PHONE' ? 'hidden md:block' : ''}`}>
          
          {/* LIVE FAIR-MARKET PRICE MONITOR */}
          <div className="bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-800/40 pb-4 mb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                  Anti-Middleman Shield
                </span>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Live Fair-Market Price Feed</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-450 font-mono">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                <span>MAAIF Protected Index</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {cropPrices.map(item => (
                <div key={item.type} className="bg-cyan-900/20 border border-cyan-500/10 hover:border-cyan-500/30 p-3.5 rounded-xl transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-200">{item.type}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[9px] text-zinc-400 block uppercase font-mono tracking-wider">OFFICIAL RECOM:</span>
                    <strong className="text-lg font-mono font-black text-cyan-400">UGX {item.fairPrice.toLocaleString()}</strong>
                    <span className="text-[10px] text-zinc-500 block">per {item.unit}</span>
                  </div>
                  <div className="border-t border-cyan-950/40 mt-2.5 pt-2 flex justify-between text-[10px]">
                    <span className="text-zinc-500 font-mono">Broker Rate:</span>
                    <span className="text-red-400 font-bold font-mono">UGX {item.middlemanExploitPrice}</span>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-900/15 text-emerald-400 rounded-md p-1 mt-2 text-center text-[9px] font-mono leading-tight font-bold">
                    🛡️ SAVE UGX {item.marginImproved}/Kg
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-STEP STORAGE BOOKING PORTAL WIZARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px] flex flex-col justify-between">
            
            {/* Steps visual track */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] bg-blue-100 text-blue-900 font-mono rounded-md px-1.5 py-0.5 font-bold uppercase">Farmer Interface</span>
                <h3 className="font-bold text-slate-900 text-sm">3-Step Digital Logistical Reservation</h3>
              </div>
              
              {/* Stepper bubbles */}
              <div className="flex items-center gap-2">
                {[
                  { num: 1, label: 'Crop Delivery' },
                  { num: 2, label: 'Capacity Allocation' },
                  { num: 3, label: 'Token Receipt' }
                ].map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                        step === s.num 
                          ? 'bg-blue-900 border-blue-950 text-white shadow-xs' 
                          : step > s.num
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {step > s.num ? '✓' : s.num}
                      </span>
                      <span className={`text-[10px] font-bold hidden sm:inline ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                    </div>
                    {idx < 2 && <span className="w-5 h-px bg-slate-200 hidden sm:block"></span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Steps execution blocks */}
            <div className="p-6 flex-grow">
              
              {/* STEP 1: CROP SELECTION AND TONNAGE ESTIMATES */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-950 text-sm">Specify Your Harvest Classification</h4>
                    <p className="text-xs text-slate-450 leading-relaxed">Let local systems calculate expected warehouse evaluations and check immediate mechanical drying constraints.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Crop buttons selections */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono">Select Harvest Crop</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Maize', 'Coffee Beans', 'Beans', 'Sorghum'].map(c => (
                          <button
                            key={c}
                            onClick={() => setSelectedCrop(c)}
                            className={`p-3 text-xs font-bold rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                              selectedCrop === c 
                                ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs' 
                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <Package className={`w-4 h-4 ${selectedCrop === c ? 'text-cyan-600' : 'text-slate-400'}`} />
                            <span>{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Weight tonnage */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono">Projected Delivery Weight</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.05"
                            placeholder="e.g. 2.5"
                            value={volumeTons}
                            onChange={e => setVolumeTons(e.target.value)}
                            className="bg-white border border-slate-205 rounded-xl p-3 w-full font-mono text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-right pr-14 font-black"
                          />
                          <span className="absolute right-3.5 top-3.5 text-xs font-black text-slate-400">TONS</span>
                        </div>
                      </div>

                      {volumeTons && parseFloat(volumeTons) > 0 && (
                        <div className="p-3 bg-cyan-50/50 border border-cyan-100 rounded-xl space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Est. Value:</span>
                            <strong className="text-cyan-950 font-mono">UGX {projectedEarningsUGX.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between border-t border-cyan-100/50 pt-1 text-emerald-800">
                            <span className="font-medium">Middleman Shield Gain:</span>
                            <strong className="font-mono">💵 +UGX {savingsOverBrokersUGX.toLocaleString()}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end pt-4 border-t border-slate-150">
                    <button
                      type="button"
                      disabled={!volumeTons || parseFloat(volumeTons) <= 0}
                      onClick={() => setStep(2)}
                      className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
                    >
                      <span>Check Neighboring Silo Capacity</span>
                      <ArrowRight className="w-4 h-4 text-white/90" />
                    </button>
                  </div>

                </div>
              )}

              {/* STEP 2: NEIGHBORING SILO COMPARISON AND SLOT BOOKING */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-950 text-sm">Select Target Cooperative Depot Container</h4>
                    <p className="text-xs text-slate-450">Review real-time tonnage, moisture tolerances, and gate congestion profiles to book optimal drop windows.</p>
                  </div>

                  <form onSubmit={handleBookingConfirm} className="space-y-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {silos.map(s => {
                        const freeSpace = s.totalCapacityTons - s.occupiedSpaceTons - s.reservedSpaceTons;
                        const isFull = freeSpace < (parseFloat(volumeTons) || 0);

                        return (
                          <label
                            key={s.id}
                            className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors relative overflow-hidden ${
                              isFull 
                                ? 'bg-red-50/10 border-red-100 opacity-60 pointer-events-none' 
                                : selectedSiloId === s.id
                                ? 'bg-cyan-50/40 border-cyan-500 shadow-md' 
                                : 'bg-slate-5 font-medium border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="siloSelection"
                              value={s.id}
                              checked={selectedSiloId === s.id}
                              disabled={isFull}
                              onChange={() => setSelectedSiloId(s.id)}
                              className="sr-only"
                            />
                            
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                  <Building2 className={`w-3.5 h-3.5 ${selectedSiloId === s.id ? 'text-cyan-600' : 'text-slate-400'}`} />
                                  <span>{s.facilityName}</span>
                                </h5>
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-red-500" />
                                  <span>{s.district} Hub</span>
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-[8px] font-bold text-slate-400 block font-mono">AVAILABLE TONNAGE</span>
                                <strong className={`font-mono text-sm ${freeSpace > 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {freeSpace.toFixed(1)} T
                                </strong>
                              </div>
                            </div>

                            <div className="border-t border-slate-150/60 mt-3 pt-2 text-[9px] flex justify-between">
                              <span className="text-slate-400">Total Structural Space:</span>
                              <strong className="text-slate-700 font-mono">{s.totalCapacityTons} TONS</strong>
                            </div>

                            {isFull && (
                              <div className="absolute inset-0 bg-red-100/5 backdrop-blur-3xs flex items-center justify-center font-bold text-red-700 text-[10px]">
                                WARNING: INSUFFICIENT STORAGE FOR THIS BATCH
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {/* Optional Drop-Off slot scheduler */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Drop-off Schedule Window</label>
                      <input
                        type="date"
                        required
                        value={dropoffDate}
                        onChange={e => setDropoffDate(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold w-full focus:outline-none"
                      />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex border-t border-slate-150 pt-4 justify-between items-center bg-slate-50 p-4 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2 hover:bg-slate-100 rounded-lg text-slate-600 text-xs font-bold transition-colors"
                      >
                        Back to volume
                      </button>

                      <MutationGuard action="SILOLINK_BOOK_STORAGE">
                        <button
                          type="submit"
                          disabled={!selectedSiloId || !dropoffDate}
                          className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-401 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md select-none"
                        >
                          <Lock className="w-3.5 h-3.5 text-white/80" />
                          <span>Lock Storage Slot Room</span>
                        </button>
                      </MutationGuard>
                    </div>

                  </form>
                </div>
              )}

              {/* STEP 3: TOKENIZED WAREHOUSE RECEIPT CARD */}
              {step === 3 && (
                <div className="space-y-6 animate-in zoom-in duration-300">
                  <div className="space-y-1 text-center">
                    <span className="inline-flex items-center gap-1.2 bg-emerald-50 text-emerald-850 px-2.5 py-0.5 rounded-full border border-emerald-150 text-[10px] font-mono font-extrabold uppercase mb-1">
                      <CheckSquare className="w-3 h-3 text-emerald-500" />
                      <span>Security Receipt Tokenized</span>
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">Tokenized Grain Warehouse Receipt Released</h4>
                    <p className="text-xs text-slate-450 leading-relaxed max-w-lg mx-auto">
                      Your spatial hold has been allocated. This cryptographic proof protects your grain balance and can be utilized directly in local microfinance applications.
                    </p>
                  </div>

                  {/* TACTILE DIGITAL ASSET CREDIT CARD WIDGET */}
                  <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 border border-cyan-800/40 rounded-3xl overflow-hidden shadow-2xl relative text-white">
                    {/* Simulated gold grain chip & holographic elements */}
                    <div className="absolute top-5 right-5 w-12 h-8 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-lg opacity-85 shadow-md flex flex-col justify-between p-1.5 z-10 border border-yellow-200">
                      <div className="h-0.5 bg-yellow-950/20 w-3 rounded"></div>
                      <div className="h-0.5 bg-yellow-950/20 w-4 rounded"></div>
                      <div className="h-0.5 bg-yellow-950/20 w-2 rounded"></div>
                    </div>
                    {/* Golden security emblem backdrop */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    {/* Card Top Branding banner */}
                    <div className="p-6 pb-2">
                      <span className="text-[9px] font-mono font-bold tracking-widest block text-cyan-400 uppercase">AGRIOS SILOLINK ASSET PROTOCOL</span>
                      <h5 className="font-extrabold text-slate-100 tracking-wide text-sm mt-0.5 uppercase">Tokenized Digital Grain Warehouse Receipt</h5>
                    </div>

                    <div className="p-6 pt-2 space-y-4">
                      {/* Expiration badge */}
                      <div className="p-3 bg-red-950/60 border border-red-800/40 rounded-xl text-rose-350 text-[10.5px] font-sans flex items-start gap-2.5 animate-pulse">
                        <span className="text-sm shrink-0">⚠️</span>
                        <div>
                          <strong className="block uppercase text-[10px] font-bold text-red-400">TEMPORARY 24-HOUR STORAGE WINDOW TOKEN</strong>
                          <span className="text-[10px] text-slate-300 mt-0.5 block leading-normal">
                            This room slot expires 24 hours from booking. Deliver your crop to the co-op gateway before: <strong className="text-amber-400 font-mono block mt-0.5">{new Date(Date.now() + 86400000).toLocaleDateString()} {new Date(Date.now() + 86400000).toLocaleTimeString()}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Flex grid detail */}
                      <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-3 text-xs leading-relaxed">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono">ASSET OWNER:</span>
                          <span className="font-bold text-slate-100">{currentUser?.fullName || 'Mukasa John'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono">COMMODITY CATEGORY:</span>
                          <span className="font-bold text-slate-100">{selectedCrop}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-450 block font-mono">CERTIFIED NET WEIGHT:</span>
                          <span className="font-bold text-slate-100">{volumeTons} TONS</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-450 block font-mono">COLLATERAL VALUATION:</span>
                          <span className="font-bold text-emerald-400 font-mono text-xs">UGX {projectedEarningsUGX.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* QR code container */}
                      <div className="bg-slate-950/80 p-3.5 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3 shadow-inner">
                        <div className="w-28 h-28 bg-white border border-slate-205 relative flex items-center justify-center p-2 rounded-xl">
                          <QrCode className="w-full h-full text-slate-900" />
                          <div className="absolute inset-0 border border-cyan-500/35 m-2 rounded-md pointer-events-none animate-pulse"></div>
                        </div>

                        <div className="w-full text-center">
                          <span className="text-[8px] text-slate-500 uppercase font-mono block font-bold">CRYPTOGRAPHIC SECURE SIGNATURE (UUID):</span>
                          <span className="text-[10.5px] font-mono font-bold select-all bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-lg text-amber-400 inline-block truncate max-w-[280px] mt-1 shadow-sm">
                            {receiptToken}
                          </span>
                        </div>
                      </div>

                      {/* MICROCREDIT SHAPE */}
                      <div className="bg-emerald-950/40 border border-emerald-920/30 text-emerald-350 p-3 rounded-xl flex items-center gap-3">
                        <Landmark className="w-5 h-5 shrink-0 text-emerald-400" />
                        <div className="leading-tight text-[10.5px] font-sans">
                          <span className="font-extrabold text-slate-100 block">Bank Evaluation Signed ✔</span>
                          <span className="text-slate-400/90 block mt-0.5">Approved collateral receipt automatically linked to cooperative lenders.</span>
                        </div>
                      </div>

                    </div>

                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setVolumeTons('');
                        setReceiptToken('');
                        setDropoffDate('');
                      }}
                      className="text-xs font-bold text-blue-900 border border-blue-200 hover:bg-slate-50 py-2.5 px-6 rounded-xl transition-all"
                    >
                      Book Another Storage Slot
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Retro Feature-Phone USSD Simulator Panel (4 Cols) */}
        <div className={`md:col-span-4 ${activeChannel === 'SMARTPHONE' ? 'hidden md:block' : ''}`}>
          
          <div className="bg-slate-50/50 border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="space-y-0.5 text-center">
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-905 text-[9px] font-mono font-bold rounded">
                USSD GATEWAY ACCESS
              </span>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mt-1.5">Offline Network Emulator</h3>
              <p className="text-[10.5px] text-slate-450 leading-relaxed">
                Rural smallholders navigate feature-phones with basic GSM menus. Test pricing queries and inventory bookings using the live emulator below.
              </p>
            </div>

            <USSDMenuSimulator />
          </div>

        </div>

      </div>

    </div>
  );
}
