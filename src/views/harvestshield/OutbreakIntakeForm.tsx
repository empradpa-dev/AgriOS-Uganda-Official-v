import React, { useState, useRef, useEffect } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import MutationGuard from '@/components/auth/MutationGuard';
import { 
  Camera, MapPin, Send, AlertTriangle, CheckCircle, 
  Upload, Trash2, Cpu, HelpCircle, Activity, Image as ImageIcon, Sparkles,
  Wifi, WifiOff, Database, HardDrive, Sliders
} from 'lucide-react';

const THREAT_VECTORS = [
  { 
    id: 'cw', 
    label: 'Coffee Wilt Disease', 
    targetCrop: 'Coffee',
    description: 'Fungal colonization choking vascular tissue. Leads to leaf chlorosis and premature cherry drop.', 
    bg: 'bg-amber-950', 
    border: 'border-amber-600',
    color: 'text-amber-100',
    accentColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    sampleImage: 'https://images.unsplash.com/photo-1596704017254-9b121068fb29?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'fa', 
    label: 'Fall Armyworm', 
    targetCrop: 'Maize',
    description: 'Aggressive pest ravaging healthy maize whorls. Destroys grain development segments within 48h.', 
    bg: 'bg-emerald-950', 
    border: 'border-emerald-600',
    color: 'text-emerald-100',
    accentColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    sampleImage: 'https://images.unsplash.com/photo-153451009808-df61512b394f?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'bbw', 
    label: 'Banana Bacterial Wilt', 
    targetCrop: 'Banana (Matooke)',
    description: 'Xanthomonas bacterial infection. Causes golden yellow vascular discoloration and quick death of stems.', 
    bg: 'bg-yellow-950', 
    border: 'border-yellow-600',
    color: 'text-yellow-105',
    accentColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    sampleImage: 'https://images.unsplash.com/photo-1565191942478-f48ef166a012?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'cbs', 
    label: 'Cassava Brown Streak', 
    targetCrop: 'Cassava',
    description: 'Viral degeneration altering root quality and starch structure. Manifests as necrotic lesions on foliage.', 
    bg: 'bg-orange-950', 
    border: 'border-orange-600',
    color: 'text-orange-100',
    accentColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    sampleImage: 'https://images.unsplash.com/photo-1628156172605-6fbf3cbdff4e?auto=format&fit=crop&q=80&w=400'
  }
];

export default function OutbreakIntakeForm() {
  const { submitReport, currentUser } = useAgriOS();
  
  // Wizard States
  const [step, setStep] = useState(1);
  const [selectedThreatId, setSelectedThreatId] = useState('');
  const [severity, setSeverity] = useState<'Low'|'Medium'|'Critical'>('Medium');
  
  // Photo states & handling
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Geolocation and telemetry states
  const [lat, setLat] = useState(1.2921);
  const [lng, setLng] = useState(32.2903);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(4); // meters accuracy
  const [gpsStatus, setGpsStatus] = useState<'IDLE'|'FETCHING'|'LOCKED'>('LOCKED');
  const [lastMillisecond, setLastMillisecond] = useState<string>('');

  // Low-Bandwidth Sync Queue and Compression States
  const [bandwidthMode, setBandwidthMode] = useState<'2G_EDGE' | 'GPRS_3G' | 'SATELLITE'>('2G_EDGE');
  const [compressorStatus, setCompressorStatus] = useState<'IDLE' | 'COMPRESSING' | 'SENDING' | 'SYNCED'>('IDLE');
  const [panelOpen, setPanelOpen] = useState(true);
  const [rawSizeMb, setRawSizeMb] = useState<number>(4.85);
  const [compressionProgress, setCompressionProgress] = useState(0);
  
  // Local queue items simulation
  const [localQueue, setLocalQueue] = useState<Array<{
    id: string;
    threat: string;
    crop: string;
    severity: string;
    rawSize: string;
    compressedSize: string;
    status: 'Cached' | 'Synced';
    timestamp: string;
  }>>([
    { id: 'q1', threat: 'Coffee Wilt Disease', crop: 'Coffee', severity: 'Critical', rawSize: '5.2 MB', compressedSize: '31 KB', status: 'Synced', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'q2', threat: 'Fall Armyworm', crop: 'Maize', severity: 'Medium', rawSize: '3.9 MB', compressedSize: '24 KB', status: 'Cached', timestamp: new Date(Date.now() - 7200000).toISOString() }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger automatic GPS telemetry when form mounts or updates
  useEffect(() => {
    harvestGpsTelemetry();
  }, []);

  const harvestGpsTelemetry = () => {
    setGpsStatus('FETCHING');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(parseFloat(position.coords.latitude.toFixed(6)));
          setLng(parseFloat(position.coords.longitude.toFixed(6)));
          setGpsAccuracy(Math.round(position.coords.accuracy || 3));
          setGpsStatus('LOCKED');
        },
        (error) => {
          // Provide randomized, realistic Ugandan coordinates as a fallback in sandbox
          const randomizedUgandaLat = 0.3476 + (Math.random() - 0.5) * 0.1;
          const randomizedUgandaLng = 32.5825 + (Math.random() - 0.5) * 0.1;
          setLat(parseFloat(randomizedUgandaLat.toFixed(6)));
          setLng(parseFloat(randomizedUgandaLng.toFixed(6)));
          setGpsAccuracy(7);
          setGpsStatus('LOCKED');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsStatus('LOCKED');
    }
  };

  // Drag and Drop files handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setImageName(file.name);
    const bytesToMb = file.size ? file.size / (1024 * 1024) : (3.5 + Math.random() * 3.5);
    setRawSizeMb(parseFloat(bytesToMb.toFixed(2)));
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImage(null);
    setImageName(null);
    setRawSizeMb(4.85);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Quick field simulator preset upload images
  const setQuickSampleImage = (url: string, name: string) => {
    setUploadedImage(url);
    setImageName(name);
    setRawSizeMb(3.0 + Math.random() * 2.5);
  };

  const handleDiagnose = () => {
    const matchedThreat = THREAT_VECTORS.find(t => t.id === selectedThreatId);
    if (!matchedThreat) return;

    // Trigger local queue compression sequence!
    setCompressorStatus('COMPRESSING');
    setCompressionProgress(0);
    
    // Simulate active binary wavelet decimation
    const compInterval = setInterval(() => {
      setCompressionProgress(prev => {
        if (prev >= 100) {
          clearInterval(compInterval);
          setCompressorStatus('SENDING');
          
          // Next phase: simulate GSM 2G edge chunk transmission
          setTimeout(() => {
            const submissionMs = new Date().toISOString();
            setLastMillisecond(submissionMs);

            // Execute the actual submit report context hook
            submitReport({
              officerId: currentUser?.id || 'sys',
              targetCrop: matchedThreat.targetCrop,
              identifiedThreatVector: matchedThreat.label,
              imageProofUrl: uploadedImage || matchedThreat.sampleImage,
              latitude: lat,
              longitude: lng,
              severityScale: severity,
            });

            // Put a new item into our local queue status representing immediate receipt sync!
            const rawSizeStr = `${rawSizeMb.toFixed(2)} MB`;
            const compRate = bandwidthMode === '2G_EDGE' ? 99.4 : bandwidthMode === 'GPRS_3G' ? 98.7 : 99.1;
            const compressedKb = Math.round(rawSizeMb * 1024 * (1 - (compRate / 100)));
            const compSizeStr = `${compressedKb} KB`;
            
            setLocalQueue(prevQueue => [
              {
                id: Math.random().toString(),
                threat: matchedThreat.label,
                crop: matchedThreat.targetCrop,
                severity: severity,
                rawSize: rawSizeStr,
                compressedSize: compSizeStr,
                status: 'Synced',
                timestamp: submissionMs
              },
              ...prevQueue
            ]);
            
            setCompressorStatus('SYNCED');
            setStep(4); // Finally advance to the completion panel!
          }, 1200);
          
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full uppercase tracking-wider">Domain B - Epidemiological Watch</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Extension Officer 3-Tap Diagnostic Wizard</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time biosecurity telemetry capturing crop vectors directly in the field with digital trace trails.</p>
        </div>

        {/* GPS Quality Indicators */}
        <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm text-xs">
          <MapPin className={`w-5 h-5 ${gpsStatus === 'LOCKED' ? 'text-emerald-600' : 'text-amber-500 animate-pulse'}`} />
          <div>
            <span className="font-semibold block text-slate-800">Field GPS Harvester</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {gpsStatus === 'LOCKED' ? `ACCURACY: ±${gpsAccuracy}m` : 'POLING HARVEST SAT...'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Step Indicator Panel */}
        <div className="md:col-span-3 space-y-2">
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Wizard Journey</span>
            <div className="space-y-3 pt-2">
              {[
                { s: 1, title: 'Photo Capture', desc: 'Visual Crop Evidence' },
                { s: 2, title: 'Threat Vector', desc: 'Identify Crop Anomaly' },
                { s: 3, title: 'Crisis Gravity', desc: 'Assess Severity & Log' }
              ].map(item => {
                const isCurrent = step === item.s;
                const isDone = step > item.s;
                return (
                  <div key={item.s} className="flex gap-3 items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs shrink-0 transition-all ${
                      isCurrent 
                        ? 'bg-amber-500 text-white shadow shadow-amber-500/10' 
                        : isDone 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isDone ? '✓' : item.s}
                    </div>
                    <div>
                      <span className={`text-xs block font-bold leading-none ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{item.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[10px] text-slate-400 leading-normal">
            <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">GPS Telemetry Signal</span>
            <div className="font-mono text-slate-600 space-y-1 bg-white p-2 rounded-lg border border-slate-200/50">
              <p>Lat: <span className="font-bold text-slate-800">{lat}</span></p>
              <p>Lng: <span className="font-bold text-slate-800">{lng}</span></p>
              <p>Alt: 1,148m ASL</p>
            </div>
            <button 
              onClick={harvestGpsTelemetry}
              className="mt-2 text-amber-600 font-semibold hover:text-amber-700 block text-left"
            >
              Re-harvest Telemetry Link
            </button>
          </div>
        </div>

        {/* Wizard Panel Area */}
        <div className="md:col-span-9 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[460px]">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-bold text-slate-950 text-sm">
                {step === 1 && 'Crop Health Photograph Capture'}
                {step === 2 && 'Biological Pest/Disease Classifier'}
                {step === 3 && 'Submit Outbreak Severity Metric'}
                {step === 4 && 'DPI Biosecurity Handshake Complete'}
              </h3>
              <p className="text-xs text-slate-500">Step {Math.min(3, step)} of 3 • Outdoor-optimized visual controls</p>
            </div>
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(Math.min(3, step) / 3) * 100}%` }}></div>
            </div>
          </div>

          <div className="p-6 flex-grow flex flex-col justify-between">
            
            {/* Step 1: Drag & Drop Photo Upload */}
            {step === 1 && (
              <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drag and Drop Visual Evidence</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Supply-chain disease tracking requires verification photos of agricultural anomalies.</p>
                </div>

                 {/* Drop Zone Box */}
                 <MutationGuard action="HARVESTSHIELD_INTAKE">
                   <div
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                     onClick={triggerSelectFile}
                     className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px] ${
                       isDragging 
                         ? 'border-amber-500 bg-amber-50/50' 
                         : uploadedImage 
                         ? 'border-emerald-400 bg-emerald-50/5' 
                         : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                     }`}
                   >
                     <input
                       type="file"
                       ref={fileInputRef}
                       onChange={handleFileChange}
                       accept="image/*"
                       className="hidden"
                     />

                     {uploadedImage ? (
                       <div className="space-y-3 relative">
                         <div className="relative w-40 h-28 mx-auto rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                           <img 
                             src={uploadedImage} 
                             alt="Crop anomaly evidence" 
                             className="w-full h-full object-cover"
                           />
                           <button
                             onClick={removeImage}
                             className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow"
                             title="Remove image"
                           >
                             <Trash2 className="w-3" />
                           </button>
                         </div>
                         <div>
                           <span className="text-xs font-semibold text-slate-800 block truncate max-w-xs mx-auto">
                             {imageName || 'custom_upload_proof.jpeg'}
                           </span>
                           <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center justify-center gap-1 mt-0.5">
                             <CheckCircle className="w-3.5 h-3.5" /> EVIDENCE INGESTED
                           </span>
                         </div>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-sm text-slate-400">
                           <Upload className="w-5 h-5" />
                         </div>
                         <div>
                           <span className="text-xs font-bold text-slate-800 block">Drag & Drop Image File or click inside grid area</span>
                           <span className="text-[11px] text-slate-400 block mt-0.5">Supports PNG, JPEG, HEIC up to 10MB</span>
                         </div>
                       </div>
                     )}
                   </div>
                 </MutationGuard>

                {/* Pre-made quick field snapshots for rapid simulation */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Simulate Field Snapshots (Click to fill)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {THREAT_VECTORS.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setQuickSampleImage(v.sampleImage, `${v.targetCrop.toLowerCase()}_sample.jpg`)}
                        className={`text-left p-1.5 border hover:border-slate-300 rounded-lg bg-slate-50 active:scale-95 transition-all text-xs flex gap-2 items-center ${
                          uploadedImage === v.sampleImage ? 'border-amber-500 bg-amber-50/20 shadow-xs' : 'border-slate-200'
                        }`}
                      >
                        <img 
                          src={v.sampleImage} 
                          alt="Sample Thumbnail" 
                          className="w-10 h-10 object-cover rounded border border-slate-200" 
                        />
                        <div className="leading-tight overflow-hidden">
                          <span className="font-bold block text-slate-705 truncate">{v.targetCrop}</span>
                          <span className="text-[9px] text-slate-400">Ready</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next button */}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!uploadedImage}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-lg transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                  >
                    Next: Identify Threat Vector
                  </button>
                </div>

              </div>
            )}

            {/* Step 2: High Contrast Outdoor Visible Threat Vector Grid */}
            {step === 2 && (
              <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Regional Bio-Disease Vector</h4>
                  <p className="text-slate-500 text-sm">Tap on the identified vector pathogen affecting plants in this county.</p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {THREAT_VECTORS.map(threat => {
                    const isSelected = selectedThreatId === threat.id;
                    return (
                      <button
                        key={threat.id}
                        type="button"
                        onClick={() => setSelectedThreatId(threat.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/10' 
                            : 'border-slate-200 hover:border-slate-350 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${threat.accentColor} border`}>
                            {threat.targetCrop.toUpperCase()}
                          </span>
                          {isSelected && <span className="h-2 w-2 rounded-full bg-amber-500"></span>}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{threat.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {threat.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Back and Next */}
                <div className="pt-6 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-lg transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedThreatId}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-lg transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                  >
                    Next: Assess Gravity
                  </button>
                </div>

              </div>
            )}

            {/* Step 3: Outbreak gravity details and GPS confirmation */}
            {step === 3 && (
              <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outbreak Severity Level & Transmit</h4>
                    <p className="text-slate-500 text-xs mt-0.5">Flag the biological risk parameter. MAAIF triggers localized radius broadcasts based on this scale.</p>
                  </div>

                  {/* Level selection */}
                  <div className="space-y-2">
                    {[
                      { 
                        level: 'Low' as const, 
                        desc: 'Localized outbreak, isolated under 1 acre of total plant foliage.',
                        bg: 'border-blue-200 hover:border-blue-400',
                        checkedBg: 'border-blue-500 bg-blue-50/25',
                        accent: 'text-blue-600 bg-blue-50 border border-blue-100'
                      },
                      { 
                        level: 'Medium' as const, 
                        desc: 'Widespread coverage impacting over 10 separate block gardens.',
                        bg: 'border-amber-200 hover:border-amber-400',
                        checkedBg: 'border-amber-500 bg-amber-50/25',
                        accent: 'text-amber-700 bg-amber-50 border border-amber-100'
                      },
                      { 
                        level: 'Critical' as const, 
                        desc: 'Epidemic levels! High vector propagation threatening local subcounty yield integrity.',
                        bg: 'border-red-200 hover:border-red-400',
                        checkedBg: 'border-red-500 bg-red-50/25 shadow-sm',
                        accent: 'text-red-700 bg-red-50 border border-red-100 animate-pulse'
                      }
                    ].map(item => (
                      <label 
                        key={item.level} 
                        className={`p-4 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                          severity === item.level ? item.checkedBg : `bg-white ${item.bg}`
                        }`}
                      >
                        <input
                          type="radio"
                          name="outbreak_severity"
                          value={item.level}
                          checked={severity === item.level}
                          onChange={() => setSeverity(item.level)}
                          className="w-4 h-4 mt-0.5 accent-amber-500"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm uppercase tracking-wider">{item.level} Severity</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${item.accent}`}>
                              RISK RATING
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Final secure audit checklist */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-[11px] text-slate-500 font-mono">
                    <p>✓ Photo evidence attached</p>
                    <p>✓ Coordinate lock established</p>
                    <p>✓ Classification determined</p>
                    <p>✓ Secure MAAIF Handshake signed</p>
                  </div>

                </div>

                {/* Actions */}
                <div className="pt-6 flex justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-lg transition-all"
                  >
                    Back
                  </button>

                   <MutationGuard action="HARVESTSHIELD_INTAKE">
                     <button
                       onClick={handleDiagnose}
                       className="bg-amber-600 hover:bg-amber-500 border border-amber-700 shadow-md shadow-amber-900/10 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                     >
                       <Send className="w-4 h-4" />
                       <span>Authorize & Decal Transmit</span>
                     </button>
                   </MutationGuard>
                </div>

              </div>
            )}

            {/* Step 4: Completion and millisecond handshake confirmation screen */}
            {step === 4 && (
              <div className="space-y-6 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 py-12 max-w-md mx-auto">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow shadow-emerald-500/10">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200">
                    TRANSMISSION SUCCESSFUL
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Geospatial Telemetry Anchored</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-sans">
                    The infestation log signature has been successfully transmitted and registered inside the MAAIF National Intelligence Hub database.
                  </p>
                </div>

                {/* Millisecond timestamp confirmation block requested */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] font-mono text-slate-600 space-y-1 bg-gradient-to-tr from-emerald-950/5 to-indigo-950/5">
                  <div className="flex justify-between items-center text-[9px] text-emerald-700 font-bold border-b border-slate-200 pb-1 mb-1.5 uppercase font-sans">
                    <span>SECURITY TRANSACTION HANDSHAKE</span>
                    <span>ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SECURE TIMESTAMP:</span>
                    <strong className="text-slate-900 text-right font-bold">{lastMillisecond || new Date().toISOString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SECTOR STATUS:</span>
                    <strong className="text-emerald-600 text-right">LOCKED & VERIFIED</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>VECTOR ID BRAND:</span>
                    <strong className="text-slate-900 text-right uppercase">
                      {THREAT_VECTORS.find(t => t.id === selectedThreatId)?.label ? THREAT_VECTORS.find(t => t.id === selectedThreatId)?.label : 'Unknown Disease'}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedThreatId('');
                    setUploadedImage(null);
                    setImageName(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3 px-8 rounded-lg transition-all mt-4 cursor-pointer"
                >
                  Log Another Field Vector
                </button>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* 
        DATA ROUTING CONSOLE: MULTI-TIER SYNC QUEUE 
        Includes real-time compression ratio calculation & cellular network stream speed simulator
      */}
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white transition-all duration-300">
        <div className="p-4 bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rose-950/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <Cpu className={`w-5 h-5 ${compressorStatus === 'COMPRESSING' || compressorStatus === 'SENDING' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Edge Packet Compression & Multi-Tier Sync Queue</h4>
              <p className="text-[11px] text-slate-400 font-sans">Optimization layer for remote rural operations with weak or zero telecom bars.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
              <button 
                type="button"
                onClick={() => setBandwidthMode('2G_EDGE')}
                className={`px-2 py-1 rounded font-bold transition-all ${bandwidthMode === '2G_EDGE' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                2G EDGE
              </button>
              <button 
                type="button"
                onClick={() => setBandwidthMode('GPRS_3G')}
                className={`px-2 py-1 rounded font-bold transition-all ${bandwidthMode === 'GPRS_3G' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                3G GPRS
              </button>
              <button 
                type="button"
                onClick={() => setBandwidthMode('SATELLITE')}
                className={`px-2 py-1 rounded font-bold transition-all ${bandwidthMode === 'SATELLITE' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                SAT UPLINK
              </button>
            </div>
            
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase rounded-lg transition-colors border border-slate-700"
            >
              {panelOpen ? 'Collapse Data Desk' : 'Expand Data Desk'}
            </button>
          </div>
        </div>

        {panelOpen && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6 bg-gradient-to-br from-slate-900 to-slate-950">
            {/* Left side: Compression Calculator */}
            <div className="md:col-span-5 space-y-4 border-r border-slate-800/60 pr-0 md:pr-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">Live Packet Reducer</span>
                <h5 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  <span>Image Wavelet Compression Calculator</span>
                </h5>
              </div>

              {uploadedImage ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Original Proof Size:</span>
                    <strong className="text-slate-200 font-mono text-sm">{rawSizeMb.toFixed(2)} MB</strong>
                  </div>

                  {(() => {
                    const compRate = bandwidthMode === '2G_EDGE' ? 99.4 : bandwidthMode === 'GPRS_3G' ? 98.7 : 99.1;
                    const compressedKb = Math.round(rawSizeMb * 1024 * (1 - (compRate / 100)));
                    const compressionFactor = Math.floor(100 / (100 - compRate));
                    const edgeSpeed = bandwidthMode === '2G_EDGE' ? 9.6 : bandwidthMode === 'GPRS_3G' ? 128 : 64; // kbps
                    const etaSeconds = parseFloat(((compressedKb * 8) / edgeSpeed).toFixed(1));
                    const rawEtaMinutes = parseFloat(((rawSizeMb * 1024 * 8) / edgeSpeed).toFixed(1));

                    return (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium font-sans">Compressed Binary Vector:</span>
                          <strong className="text-amber-400 font-mono text-sm">
                            {compressedKb} KB <span className="text-[10px] text-slate-500">({compRate}% less)</span>
                          </strong>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                          <div className="flex justify-between">
                            <span>REDUCTION RATIO:</span>
                            <span className="text-emerald-400 font-bold">{compressionFactor}x Fold Decimation</span>
                          </div>
                          <div className="flex justify-between">
                            <span>COMPRESSION ALGORITHM:</span>
                            <span className="text-slate-200 uppercase font-sans font-bold text-[9px] bg-slate-900 border border-slate-800 px-1 py-0.2 rounded">
                              {bandwidthMode === '2G_EDGE' ? 'Discrete Wavelet (DWD)' : bandwidthMode === 'GPRS_3G' ? 'Run-Length Huffman (RLH)' : 'LZMA Vector Block'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>CARRIER BANDWIDTH:</span>
                            <span className="text-slate-350">{edgeSpeed} kbps limit</span>
                          </div>
                          <div className="flex justify-between items-baseline pt-1">
                            <span>STREAM DURATION:</span>
                            <span className="text-emerald-400 font-bold text-xs bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30">
                              {etaSeconds}s <span className="text-[9px] text-slate-500 font-normal line-through">vs {rawEtaMinutes}s raw</span>
                            </span>
                          </div>
                        </div>

                        {/* Compressor status and animation bar */}
                        {compressorStatus !== 'IDLE' && (
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[9px] font-mono">
                              <span>STATUS: <strong className="text-amber-400">{compressorStatus}</strong></span>
                              <span>{compressionProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${compressionProgress}%` }}></div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs py-10 space-y-2">
                  <Camera className="w-8 h-8 text-slate-700 mx-auto" />
                  <p>Awaiting crop proof image capture in Step 1 to boot compression calculator...</p>
                </div>
              )}
            </div>

            {/* Right side: Local Intake Cache List */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <h6 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-sans">Local Cached Field Reports</h6>
                  <p className="text-[10px] text-slate-400 font-sans">Offline buffer queue synced in batches to conserve battery and cell signal costs.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Simulate purging sync cache
                    setLocalQueue(prev => prev.map(q => ({ ...q, status: 'Synced' as const })));
                  }}
                  className="text-amber-400 font-bold text-[10px] hover:underline"
                >
                  Force Synced Handshake
                </button>
              </div>

              {localQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-600 text-xs border border-slate-800 rounded-xl bg-slate-950 font-mono">
                  Buffer Cache Empty
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {localQueue.map(item => (
                    <div key={item.id} className="p-3 bg-slate-950 border border-slate-800/85 rounded-xl flex items-center justify-between text-xs transition-colors hover:border-slate-750">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-100 font-semibold">{item.threat}</strong>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                            item.severity === 'Critical' ? 'bg-red-950/65 text-red-400 border border-red-900/30' :
                            item.severity === 'Medium' ? 'bg-amber-950/65 text-amber-400 border border-amber-950/30' :
                            'bg-blue-950/45 text-blue-400 border border-blue-955/35'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                          <span>Target Crop: <strong className="text-slate-350">{item.crop}</strong></span>
                          <span>Pkg: <span className="text-amber-500 font-bold font-mono">{item.compressedSize}</span> <span className="line-through">({item.rawSize})</span></span>
                          <span>Time: {new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.status === 'Synced' ? (
                          <span className="text-[9px] font-mono font-bold bg-emerald-950/50 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-900/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> SYNCED
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold bg-amber-950/50 text-amber-500 px-2 py-0.5 rounded-lg border border-amber-900/30 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-now"></span> CACHED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
