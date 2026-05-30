import React, { useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import { Smartphone, RefreshCw, Send, HelpCircle, PhoneCall, Key, ArrowLeft, ArrowRight } from 'lucide-react';

type USSDScreen = 'IDLE' | 'DIALED' | 'WELCOME' | 'PRICES' | 'SILOS' | 'SILO_INFO' | 'BOOK_CROP' | 'BOOK_WEIGHT' | 'BOOK_CONFIRM' | 'MY_RECEIPTS';

export default function USSDMenuSimulator() {
  const { silos, reserveStorage, currentUser } = useAgriOS();
  const [screen, setScreen] = useState<USSDScreen>('IDLE');
  const [dialString, setDialString] = useState('*255*4#');
  
  // Interactive navigation path states
  const [selectedSiloId, setSelectedSiloId] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [enteredWeight, setEnteredWeight] = useState<string>('');
  const [createdReceipt, setCreatedReceipt] = useState<string>('');
  const [ussdInput, setUssdInput] = useState<string>('');
  
  const [commandLog, setCommandLog] = useState<string[]>([]);

  const handleDial = () => {
    if (dialString === '*255*4#') {
      setScreen('WELCOME');
      setCommandLog(['Dialing *255*4#...', 'DPI Sec-Channel Established.']);
    } else {
      setCommandLog(['Network connection error: Invalid MMI code. Try dialing *255*4#']);
    }
  };

  const resetUSSD = () => {
    setScreen('IDLE');
    setUssdInput('');
    setSelectedSiloId('');
    setSelectedCrop('');
    setEnteredWeight('');
    setCreatedReceipt('');
  };

  const handleSendInput = (e: React.FormEvent) => {
    e.preventDefault();
    const input = ussdInput.trim();
    if (!input) return;

    setUssdInput('');
    setCommandLog(prev => [...prev, `Sent: ${input}`]);

    // Simple router-state simulator based on input and current screen state
    if (screen === 'WELCOME') {
      if (input === '1') {
        setScreen('PRICES');
      } else if (input === '2') {
        setScreen('SILOS');
      } else if (input === '3') {
        setScreen('BOOK_CROP');
      } else if (input === '4') {
        setScreen('MY_RECEIPTS');
      } else {
        setCommandLog(prev => [...prev, 'Invalid choice. Enter 1-4.']);
      }
    } else if (screen === 'PRICES') {
      if (input === '*') {
        setScreen('WELCOME');
      } else {
        setCommandLog(prev => [...prev, 'Unknown choice. Press * to draw main menu.']);
      }
    } else if (screen === 'SILOS') {
      if (input === '*') {
        setScreen('WELCOME');
      } else {
        const idx = parseInt(input) - 1;
        if (idx >= 0 && idx < silos.length) {
          setSelectedSiloId(silos[idx].id);
          setScreen('SILO_INFO');
        } else {
          setCommandLog(prev => [...prev, 'Invalid Silo number. Try again or press *.']);
        }
      }
    } else if (screen === 'SILO_INFO') {
      if (input === '*') {
        setScreen('SILOS');
      }
    } else if (screen === 'BOOK_CROP') {
      if (input === '*') {
        setScreen('WELCOME');
      } else {
        if (input === '1') setSelectedCrop('Maize');
        else if (input === '2') setSelectedCrop('Coffee Beans');
        else if (input === '3') setSelectedCrop('Beans');
        else if (input === '4') setSelectedCrop('Sorghum');
        else {
          setCommandLog(prev => [...prev, 'Invalid crop code.']);
          return;
        }
        setScreen('BOOK_WEIGHT');
      }
    } else if (screen === 'BOOK_WEIGHT') {
      if (input === '*') {
        setScreen('BOOK_CROP');
      } else {
        const wVal = parseFloat(input);
        if (isNaN(wVal) || wVal <= 0) {
          setCommandLog(prev => [...prev, 'Weight must be a positive number of kgs.']);
        } else {
          setEnteredWeight(input);
          // Allocate automatically to first matching silo
          const chosenSilo = silos[0];
          const tonnage = wVal / 1000;
          const rcpt = reserveStorage(chosenSilo.id, currentUser?.id || 'u1', tonnage);
          setCreatedReceipt(rcpt);
          setScreen('BOOK_CONFIRM');
        }
      }
    } else if (screen === 'BOOK_CONFIRM') {
      if (input === '#') {
        resetUSSD();
      } else if (input === '*') {
        setScreen('WELCOME');
      }
    } else if (screen === 'MY_RECEIPTS') {
      if (input === '*') {
        setScreen('WELCOME');
      }
    }
  };

  const handleKeypadPress = (key: string) => {
    if (screen === 'IDLE') {
      setDialString(prev => prev + key);
    } else {
      setUssdInput(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    if (screen === 'IDLE') {
      setDialString(prev => prev.slice(0, -1));
    } else {
      setUssdInput(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-w-[340px] mx-auto">
      
      {/* Device top bezel */}
      <div className="bg-slate-950 p-3 flex justify-between items-center border-b border-slate-900 shrink-0 select-none">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
          <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">USSD GSM SIMULATOR</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-3 bg-zinc-650 rounded-xs"></span>
          <span className="text-[9px] font-mono font-bold text-zinc-500">MTN UG</span>
        </div>
      </div>

      {/* Screen Area: Retro pixel-like low-tech screen display of sub-saharan menu */}
      <div className="p-4 bg-zinc-950">
        <div className="bg-[#242526] text-[#fcba03] font-mono text-xs rounded-xl p-4.5 border border-[#3b3c3d] h-[220px] flex flex-col justify-between overflow-y-auto leading-relaxed shadow-inner shadow-black/80">
          
          {screen === 'IDLE' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <PhoneCall className="w-6 h-6 text-[#fcba03] animate-pulse" />
              <div className="space-y-1">
                <span className="text-[9px] text-[#fcba03]/60 italic block">ENTER DIAL MMI CODE:</span>
                <span className="text-sm font-black tracking-widest">{dialString || '_'}</span>
              </div>
              <p className="text-[9px] text-zinc-400">Press Dial below to launch USSD server</p>
            </div>
          )}

          {screen === 'WELCOME' && (
            <div className="space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold border-b border-[#3b3c3d] pb-1 text-[#f3f5f7]">AgriOS SiloLink v1.4</p>
                <div className="space-y-1 pt-1.5 text-[11px]">
                  <p>1. Check Commodity Prices</p>
                  <p>2. Check Region Silo Free Space</p>
                  <p>3. Book Grain Storage Slot</p>
                  <p>4. Check My Warehouse Receipts</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 italic font-sans animate-pulse pt-2">Enter number option (1-4):</p>
            </div>
          )}

          {screen === 'PRICES' && (
            <div className="space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold border-b border-[#3b3c3d] pb-1 text-[#f3f5f7]">Live Commodity price Index</p>
                <div className="space-y-1 pt-2 text-[11px] font-mono text-[#fcba03]">
                  <p>• Maize: UGX 1,200/Kg</p>
                  <p>• Coffee: UGX 5,400/Kg</p>
                  <p>• Beans: UGX 2,500/Kg</p>
                  <p>• Sorghum: UGX 1,800/Kg</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 pt-2 font-mono">*. Back to main menu</p>
            </div>
          )}

          {screen === 'SILOS' && (
            <div className="space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold border-b border-[#3b3c3d] pb-1 text-[#f3f5f7]">Silo Available Space</p>
                <div className="space-y-1 pt-1.5 text-[11px]">
                  {silos.map((silo, i) => (
                    <p key={silo.id}>{i+1}. {silo.facilityName.split(' ')[0]} ({silo.district})</p>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-zinc-450 pt-2 font-mono">*. Back</p>
            </div>
          )}

          {screen === 'SILO_INFO' && (() => {
            const current = silos.find(s => s.id === selectedSiloId);
            const free = current ? current.totalCapacityTons - current.occupiedSpaceTons - current.reservedSpaceTons : 0;
            return (
              <div className="space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-bold border-b border-[#3b3c3d] pb-1 text-[#f3f5f7] truncate">{current?.facilityName || 'Facility'}</p>
                  <div className="space-y-1 pt-2 text-[11px] text-[#f7e099]">
                    <p>TOTAL CAPACITY: {current?.totalCapacityTons} TONS</p>
                    <p>OCCUPIED: {current?.occupiedSpaceTons} TONS</p>
                    <p>FREE HOLD SPACE: {free} TONS</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 pt-2 font-mono">*. Back to list</p>
              </div>
            );
          })()}

          {screen === 'BOOK_CROP' && (
            <div className="space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold border-b border-[#3b3c3d] pb-1 text-[#f3f5f7]">Select Crop for storage</p>
                <div className="space-y-1 pt-1.5 text-[11px]">
                  <p>1. Maize (White Hybrid)</p>
                  <p>2. Coffee (Robusta)</p>
                  <p>3. Red Kidney Beans</p>
                  <p>4. Sorghum</p>
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 pt-2 font-mono">*. Back Menu</p>
            </div>
          )}

          {screen === 'BOOK_WEIGHT' && (
            <div className="space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-white">Crop: {selectedCrop}</p>
                <p className="text-[11px] text-[#fcba03] mt-2">Enter estimated delivery weight in Kgs:</p>
                <p className="text-lg font-bold tracking-wider text-white bg-slate-800 p-1.5 border border-slate-700 font-mono rounded mt-2 text-right">
                  {ussdInput || '_'} <span className="text-xs text-zinc-400">KG</span>
                </p>
              </div>
              <p className="text-[9px] text-zinc-500 font-mono">*. Back</p>
            </div>
          )}

          {screen === 'BOOK_CONFIRM' && (
            <div className="space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold text-white uppercase tracking-tight text-[11px]">Reservation Registered!</p>
                <div className="text-[10px] space-y-1 mt-2 text-[#fcba03] p-2 bg-slate-900 rounded border border-slate-800">
                  <p>CROP: {selectedCrop}</p>
                  <p>WEIGHT: {enteredWeight} KG</p>
                  <p>HUB: Gulu Silo Hub</p>
                  <p className="text-white select-all text-center font-bold font-mono text-xs pt-1 border-t border-slate-800 mt-1 truncate">
                    {createdReceipt.slice(0, 10)}...
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-405 font-mono">Press # to end USSD session.</p>
            </div>
          )}

          {screen === 'MY_RECEIPTS' && (
            <div className="space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold border-b border-[#3b3c3d] pb-1 text-[#f3f5f7]">My Warehouse Receipts</p>
                <div className="space-y-1 pt-2 text-[10.5px] leading-relaxed text-[#fcba03]">
                  <p>1. Maize - 1.2 Tons [VERIFIED]</p>
                  <p>2. Coffee - 0.4 Tons [DOCK APPROVED]</p>
                  <p className="text-[9.5px] text-zinc-500 italic mt-3">Ready for microfinance credit applications</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 pt-2 font-mono">*. Back</p>
            </div>
          )}

        </div>
      </div>

      {/* Input controls underneath screen */}
      {screen !== 'IDLE' && screen !== 'BOOK_WEIGHT' && (
        <form onSubmit={handleSendInput} className="p-3 bg-zinc-950 flex gap-2 border-t border-slate-900 shrink-0">
          <input
            type="text"
            placeholder="Type input option..."
            className="flex-grow bg-[#242526] border border-slate-850 rounded-lg py-1.5 px-3 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none"
            value={ussdInput}
            onChange={e => setUssdInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#fcba03] hover:bg-[#fcba03]/85 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </form>
      )}

      {/* Dial interface buttons below */}
      <div className="p-5 bg-slate-950 grid grid-cols-3 gap-3 border-t border-slate-900 justify-items-center select-none shrink-0">
        {[
          { key: '1' }, { key: '2' }, { key: '3' },
          { key: '4' }, { key: '5' }, { key: '6' },
          { key: '7' }, { key: '8' }, { key: '9' },
          { key: '*' }, { key: '0' }, { key: '#' }
        ].map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleKeypadPress(item.key)}
            className="w-10 h-10 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-full flex items-center justify-center font-bold text-slate-200 transition-all active:scale-95 text-xs shadow-md"
          >
            {item.key}
          </button>
        ))}

        {/* Action button row */}
        <button
          type="button"
          onClick={handleBackspace}
          className="col-span-1 py-2 text-zinc-400 hover:text-white transition-colors text-xs font-black"
        >
          CLEAR
        </button>

        {screen === 'IDLE' ? (
          <button
            type="button"
            onClick={handleDial}
            className="col-span-1 bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-[0_0_8px_#10b98144]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>DIAL</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={resetUSSD}
            className="col-span-1 bg-red-600 hover:bg-red-500 border border-red-700 text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all"
          >
            <span>END</span>
          </button>
        )}

        <span className="col-span-1"></span>
      </div>

      {/* Operational Logs / Command debugging terminal inside pocket size */}
      <div className="bg-zinc-950 p-3.5 border-t border-slate-950 text-[10px] font-mono text-zinc-500 space-y-1">
        <label className="text-[8px] font-black uppercase text-zinc-600 block">Simulated Network Traffic</label>
        <div className="bg-slate-950 p-2 rounded border border-slate-900 max-h-[80px] overflow-y-auto space-y-1">
          {commandLog.length === 0 ? (
            <p className="text-zinc-600 italic">No network messages received.</p>
          ) : (
            commandLog.map((log, i) => (
              <p key={i} className="leading-tight">{log}</p>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
