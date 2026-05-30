import React, { useState, useEffect } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Radio, Users, Map as MapIcon, Send, Sparkles, Check, 
  Layers, Volume2, ShieldAlert, FileText, Smartphone, RefreshCw,
  Shield, DollarSign, TrendingDown, Activity
} from 'lucide-react';

const SMS_TEMPLATES = [
  {
    id: 'cw_template',
    label: 'Coffee Wilt Advisory',
    threat: 'Coffee Wilt Disease',
    message: 'MAAIF URGENT: Coffee Wilt Disease identified within your parish/radius. Do NOT transport uncertified coffee seedlings out. Apply protective copper fungicide immediately. Report active symptoms.'
  },
  {
    id: 'fa_template',
    label: 'Armyworm Strike Spray',
    threat: 'Fall Armyworm',
    message: 'MAAIF ALERT: Fall Armyworm moths detected nearby. Inspect maize whorls daily. Spray neem-based biological or pyrethroid crop treatments at first sign of pinholes in leaves. Keep fields clear.'
  },
  {
    id: 'bbw_template',
    label: 'Banana Wilt Control',
    threat: 'Banana Bacterial Wilt',
    message: 'MAAIF CONTROL: Banana Bacterial Wilt (BBW) spot confirmed in subcounty. Sterilize matooke harvesting knives with fire after each stem. De-bud male buds early with organic forks.'
  },
  {
    id: 'cbs_template',
    label: 'Cassava virus Alert',
    threat: 'Cassava Brown Streak',
    message: 'MAAIF ALERT: Cassava Brown Streak viral infestation logged. Uproot infected stems immediately & burn on-site to disrupt whitefly vectors. Plant only certified resilient stock.'
  }
];

export default function RadiusBroadcast() {
  const { broadcastAlert, users } = useAgriOS();
  const [radius, setRadius] = useState<number>(8); // Default 8km
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [concentricPulse, setConcentricPulse] = useState(true);

  // Chemical & Sprayer Fleet Inventory State
  const [chemicalInventory, setChemicalInventory] = useState([
    { id: 'sec1', depot: 'Gulu Central Depository', squad: 'Locust Shield (Alpha)', activeCount: 12, chemical: 'Direct Pyrethroid T20 Alpha', stock: 4200, status: 'Ready', funds: 12500000 },
    { id: 'sec2', depot: 'Mityana Sector Hub', squad: 'Swarm Busters (Beta)', activeCount: 8, chemical: 'Copper-Cop Fungicide', stock: 1850, status: 'Ready', funds: 8000000 },
    { id: 'sec3', depot: 'Fort Portal Western Depot', squad: 'Matooke Protectors', activeCount: 15, chemical: 'Xanthomonas Disinfectant', stock: 3400, status: 'Ready', funds: 15000000 },
    { id: 'sec4', depot: 'Mbale Eastern Depot', squad: 'Fungal Sentry (Gamma)', activeCount: 5, chemical: 'Neem Bio-Emulsion', stock: 1200, status: 'Ready', funds: 4500000 }
  ]);

  const [lastAllocFeedback, setLastAllocFeedback] = useState<string | null>(null);

  const deployChemical = (id: string, amount: number) => {
    setChemicalInventory(prev => prev.map(sec => {
      if (sec.id === id) {
        const newStock = Math.max(0, sec.stock - amount);
        setLastAllocFeedback(`Successfully dispatched ${amount}L of "${sec.chemical}" from ${sec.depot} stockpile.`);
        return {
          ...sec,
          stock: newStock,
          status: 'Deployed',
          funds: Math.max(0, sec.funds - 450000) // subtract travel & squad operational fee of 450,000 USh live
        };
      }
      return sec;
    }));
    
    setTimeout(() => {
      setLastAllocFeedback(null);
    }, 4000);
  };

  // Periodic visual ping effects
  useEffect(() => {
    const interval = setInterval(() => {
      setConcentricPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = SMS_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setMessage(tmpl.message);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    
    setIsTransmitting(true);
    setResult(null);

    // Dynamic math trick to find mock farmers impacted based on user database size and selected radius scale!
    // We can count actual farmers, then map scale proportional to radius/15.
    const registeredFarmers = users.filter(u => u.role === 'Farmer').length * 215; // simulate wider area statistics
    const simulatedCountOffset = Math.round((radius / 15) * registeredFarmers) + 42;

    setTimeout(() => {
      const targets = broadcastAlert(1.2921, 32.2903, radius, message);
      setResult(simulatedCountOffset);
      setIsTransmitting(false);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-orange-100 text-orange-850 text-xs font-semibold rounded-full uppercase tracking-wider">Domain B - Last-Mile Defense</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Emergency Radius Alert Notification Launcher</h2>
          <p className="text-slate-500 text-sm mt-0.5">Blast pre-formatted mitigation instruction briefs directly to regional smallholder clusters within active pest corridors.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm text-xs text-slate-500">
          <Smartphone className="w-5 h-5 text-orange-600 animate-bounce" />
          <div>
            <span className="font-semibold block text-slate-800">Parish SMS Broadcast Link</span>
            <span className="text-[10px] text-orange-600 font-mono">DPI_CELLULAR_SMPP_GATEWAY</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left hand: Radial Slider controls & Wave visualizing graphics */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Radio className="w-4.5 h-4.5 text-orange-600" />
                <span>Radius Wave visualizer</span>
              </h3>
              <span className="text-xs bg-orange-50 font-mono text-orange-700 px-2 py-0.5 rounded border border-orange-100">
                MAX 15.0 KMS
              </span>
            </div>

            {/* Adjustable Slider component up to 15km */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Blast Advisory Range</label>
                <div className="text-right">
                  <span className="font-black text-2xl text-slate-950 block font-mono">{radius} <span className="text-sm font-semibold text-slate-400">KM</span></span>
                </div>
              </div>
              
              <input 
                type="range"
                min="1"
                max="15"
                step="1"
                value={radius}
                onChange={(e) => {
                  setRadius(parseInt(e.target.value));
                  setResult(null); // Clear previous results on tweak
                }}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Parish Gate (1k)</span>
                <span>Subcounty (7k)</span>
                <span>District Sector (15k)</span>
              </div>
            </div>

            {/* Simulated Radar Core Ring Effect */}
            <div className="relative aspect-square max-w-[280px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-center items-center">
              
              {/* Radar Grid Circles */}
              <div className="absolute inset-4 border border-zinc-500/10 rounded-full"></div>
              <div className="absolute inset-12 border border-zinc-500/10 rounded-full"></div>
              <div className="absolute inset-20 border border-zinc-500/10 rounded-full"></div>
              <div className="absolute inset-28 border border-zinc-500/15 rounded-full"></div>

              {/* Dynamic Concentric Waves */}
              <div 
                className="absolute border border-orange-500 rounded-full transition-all duration-1000 ease-out opacity-25"
                style={{
                  width: `${(radius / 15) * 100}%`,
                  height: `${(radius / 15) * 100}%`,
                  transform: concentricPulse ? 'scale(1.08)' : 'scale(1)',
                }}
              ></div>

              {/* Radar sweep laser */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-orange-500/5 animate-spin"></div>

              {/* Target blips representing localized crop smallholders */}
              <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full left-1/4 top-1/3 animate-ping"></div>
              <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full right-1/3 top-1/4 shadow-[0_0_8px_#f97316]"></div>
              <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full left-1/3 bottom-1/4 shadow-[0_0_8px_#f97316]"></div>
              <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full right-1/4 bottom-1/3 animate-pulse"></div>

              <div className="z-10 text-center space-y-1 p-4 bg-slate-900/40 backdrop-blur-xs rounded-xl border border-slate-800/60 max-w-[180px]">
                <span className="text-[9px] font-mono font-black text-slate-500 block uppercase tracking-wider">SMS Blast Reach</span>
                <strong className="text-orange-400 font-mono text-base font-black">
                  {Math.round((radius / 15) * 860) + 42} Areas
                </strong>
                <span className="text-[8px] text-slate-400 leading-none block font-semibold">GSM Towers Engaged</span>
              </div>

            </div>

          </div>

        </div>

        {/* Right hand: SMS Template selector choices and quick action composer */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            {/* SMS Template Engine selection header */}
            <div className="space-y-1">
              <h3 className="font-bold text-slate-950 text-base">SMS Outbreak Mitigation Template Engine</h3>
              <p className="text-xs text-slate-500">Pick an expertly formulated biosecurity leaflet template below to auto-populate the Advisory field.</p>
            </div>

            {/* Template Selector grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SMS_TEMPLATES.map(tmpl => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => selectTemplate(tmpl.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50/25 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/20'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 bg-orange-500 rounded-full p-0.5 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-slate-440 block mb-1">
                      {tmpl.threat}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{tmpl.label}</h4>
                  </button>
                );
              })}
            </div>

            {/* Textarea Composer block representing final Advisory Message */}
            <MutationGuard action="HARVESTSHIELD_BROADCAST">
              <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex justify-between">
                    <span>Custom Advisory Message (max 160 chars)</span>
                    <span className={`${message.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                      {message.length} / 160 Characters
                    </span>
                  </label>
                  
                  <textarea
                    rows={4}
                    maxLength={200}
                    placeholder="Draft your local biosecurity advice here... Select a template above or type a clear, outdoor-visible SMS guideline."
                    className="w-full bg-[#fdfdfd] border border-slate-200 shadow-inner rounded-xl p-3.5 text-slate-950 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-xs resize-none font-sans leading-relaxed"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setSelectedTemplateId(''); // custom edit clears selected
                    }}
                  ></textarea>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!message || isTransmitting}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none border border-orange-700 shadow-md shadow-orange-950/10 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-98"
                  >
                    {isTransmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Transmitting GSM Broadcast Channels...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Engage Broadcast Blast to {Math.round((radius / 15) * 860) + 42} Familiars</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </MutationGuard>

            {/* Broadcast Results block */}
            {result !== null && (
              <div className="mt-4 p-5 bg-[#fafdf5] border-2 border-dashed border-emerald-300 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300 shadow-inner">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>BULK SMS MITIGATION BLAST SENT</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1 leading-normal max-w-sm">
                    Pre-alerts have been dispatched via Gulu/Mityana satellite cells. Emergency logs are cataloged in sector security reports.
                  </p>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight flex items-center justify-end gap-1 leading-none">
                    <Users className="w-5 h-5 text-emerald-400" />
                    +{result}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Farmers Notified</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 
        DENSE TABULAR LEDGER: PESTICIDE & SPRAYER FLEET ALLOCATION DECK
        Supports active deduction of chemical caches and real-time funding balance monitoring
      */}
      <div className="mt-8 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom duration-300">
        
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20 mr-1">
              <Shield className="w-5 h-5 font-bold text-rose-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-200 font-sans">National Pesticide Reservoirs & Operator Fleet Ledger</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Tactical biosecurity warehouse depots. Deploy chemical solutions & mobilize on-site spray operator payrolls direct from local reserve pools.</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>DEPOTS ACTIVE: 4/4</span>
            </span>
          </div>
        </div>

        {/* Action feedback flash bar */}
        {lastAllocFeedback && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-400 font-sans flex items-center justify-between animate-pulse">
            <span className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {lastAllocFeedback}
            </span>
            <span className="text-[10px] font-mono uppercase font-black tracking-widest text-emerald-500">Resource Dispatched</span>
          </div>
        )}

        {/* Main Grid table */}
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                <th className="pb-3.5 pl-2">Response Sector Depot</th>
                <th className="pb-3.5 font-semibold">Assigned Target Fleet</th>
                <th className="pb-3.5 font-semibold">Active Operators</th>
                <th className="pb-3.5 font-semibold">Pathogen Counter-Chemical</th>
                <th className="pb-3.5 text-right font-semibold">Available Stock</th>
                <th className="pb-3.5 text-right font-semibold">Sector Fund Pool</th>
                <th className="pb-3.5 text-center pr-2 font-semibold">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs text-slate-350">
              {chemicalInventory.map(sec => (
                <tr key={sec.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 pl-2 font-bold font-sans text-slate-200">
                    <div className="flex flex-col">
                      <span>{sec.depot}</span>
                      <span className="text-[10px] text-slate-500 font-normal mt-0.5">MAAIF Sector ID: REG-{sec.id.toUpperCase()}</span>
                    </div>
                  </td>
                  
                  <td className="py-4 font-mono font-bold text-indigo-400">
                    {sec.squad}
                  </td>
                  
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-bold text-slate-450 font-sans">
                      {sec.activeCount} Mobilized Men
                    </span>
                  </td>

                  <td className="py-4 font-medium text-slate-300">
                    {sec.chemical}
                  </td>

                  <td className="py-4 text-right font-mono font-extrabold">
                    {sec.stock > 0 ? (
                      <span className={`${sec.stock < 1500 ? 'text-amber-400 font-bold' : 'text-slate-200 font-bold'}`}>
                        {sec.stock.toLocaleString()} Liters
                      </span>
                    ) : (
                      <span className="text-red-500 bg-red-950/20 border border-red-900/30 px-1.5 py-0.2 rounded font-sans uppercase font-bold text-[9px]">
                        OUT OF STOCK
                      </span>
                    )}
                  </td>

                  <td className="py-4 text-right font-mono font-bold text-emerald-400">
                    USh {sec.funds.toLocaleString()}
                  </td>

                  <td className="py-4 text-center pr-2">
                    <div className="flex gap-1.5 justify-center">
                      <MutationGuard action="HARVESTSHIELD_BROADCAST">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => deployChemical(sec.id, 100)}
                            disabled={sec.stock < 100}
                            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors active:scale-95 disabled:bg-slate-900 disabled:text-slate-700 cursor-pointer"
                          >
                            Deploy 100L
                          </button>
                          <button
                            type="button"
                            onClick={() => deployChemical(sec.id, 500)}
                            disabled={sec.stock < 500}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors active:scale-101 disabled:bg-slate-900 disabled:text-slate-700 cursor-pointer"
                          >
                            Mass 500L
                          </button>
                        </div>
                      </MutationGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic emergency overview metrics bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs font-mono">
          <div className="p-2 border-r border-slate-850">
            <span className="text-[10px] text-slate-500 block uppercase font-bold text-center">Pesticide Reserves sum</span>
            <strong className="text-slate-200 text-sm">
              {chemicalInventory.reduce((acc, c) => acc + c.stock, 0).toLocaleString()} Liters
            </strong>
          </div>
          <div className="p-2 border-r border-slate-850">
            <span className="text-[10px] text-slate-400 block uppercase font-bold text-center">Active Sprayer Fleets</span>
            <strong className="text-indigo-400 text-sm">4 Operative Squads</strong>
          </div>
          <div className="p-2 border-r border-slate-850">
            <span className="text-[10px] text-slate-500 block uppercase font-bold text-center">Defensive Personnel mobilized</span>
            <strong className="text-slate-205 text-sm font-bold">
              {chemicalInventory.reduce((acc, c) => acc + c.activeCount, 0)} certified agents
            </strong>
          </div>
          <div className="p-2">
            <span className="text-[10px] text-slate-550 block uppercase font-bold text-center font-sans font-bold text-slate-400">Liquid Reserve funding</span>
            <strong className="text-emerald-400 text-sm">
              USh {chemicalInventory.reduce((acc, c) => acc + c.funds, 0).toLocaleString()}
            </strong>
          </div>
        </div>

      </div>

    </div>
  );
}
