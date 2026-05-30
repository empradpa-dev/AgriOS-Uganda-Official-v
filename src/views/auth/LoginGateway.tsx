import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAgriOS } from '@/store/AgriOSContext';
import { Role } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Phone, Landmark, Key, Users, Briefcase, 
  MapPin, HelpCircle, AlertCircle, WifiOff, Wifi, ToggleLeft, ToggleRight,
  Eye, EyeOff
} from 'lucide-react';
import VerificationOverlay from './VerificationOverlay';

export default function LoginGateway() {
  const { login, isOfflineMode, simulateNetworkStatusChange, isAuthenticated } = useAuth();
  const { setCurrentUser } = useAgriOS();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Tab selector: 'field' | 'staff'
  const [activeTab, setActiveTab] = useState<'field' | 'staff'>('field');
  
  // Selected simulation/active role
  const [selectedRole, setSelectedRole] = useState<Role>('ParishChief');
  
  // Input fields
  const [identityInput, setIdentityInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // High-contrast font scaling for mobile field roles
  const [isHighContrastText, setIsHighContrastText] = useState(false);

  // States for verification timeline overlay
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [verificationError, setVerificationError] = useState<string | undefined>(undefined);

  // Live input flash style tracking
  const [isTypingSecret, setIsTypingSecret] = useState(false);

  // Synced role selection change adjustments
  useEffect(() => {
    // Inject defaults when changing roles to help users understand
    if (activeTab === 'field') {
      if (selectedRole === 'ParishChief') {
        setIdentityInput('CM0987654321ZZ');
        setSecretInput('1234');
      } else {
        setIdentityInput('+256700000001');
        setSecretInput('5555');
      }
    } else {
      if (selectedRole === 'ExtensionOfficer') {
        setIdentityInput('EXT-301');
        setSecretInput('password');
      } else if (selectedRole === 'SiloOperator') {
        setIdentityInput('SILO-778');
        setSecretInput('password');
      } else if (selectedRole === 'MinistryAuditor') {
        setIdentityInput('MINISTRY-101');
        setSecretInput('password');
      } else {
        setIdentityInput('NAADS-552');
        setSecretInput('password');
      }
    }
  }, [selectedRole, activeTab]);

  // Handler for Virtual Numeric Keypad input
  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setSecretInput('');
    } else if (val === 'BACKSPACE') {
      setSecretInput(prev => prev.slice(0, -1));
    } else {
      // Allow up to 6 digit secret/pin
      if (secretInput.length < 6) {
        setSecretInput(prev => prev + val);
      }
    }
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError(undefined);
    setIsOverlayOpen(true);
    
    const outcome = await login({
      identity: identityInput,
      secret: secretInput,
      role: selectedRole
    });

    if (!outcome.success) {
      setVerificationError(outcome.error || 'Authentication challenge failed.');
    } else {
      // Set active user in global AgriOS context for compatibility
      // The auth broker returns successfully and stores user.
      const savedUser = sessionStorage.getItem('agrios_session_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    }
  };

  // Quick Switch Operator Persona Simulation Helper
  const handleSimulateOperator = (roleType: Role, identity: string, passcode: string, tab: 'field' | 'staff') => {
    setActiveTab(tab);
    setSelectedRole(roleType);
    setIdentityInput(identity);
    setSecretInput(passcode);
    
    // Auto initiate handshake sequence
    setTimeout(() => {
      handleFormSubmit();
    }, 400);
  };

  // Determine adapt theme parameters
  // Field roles -> High-Contrast Dark Mode
  const isFieldTheme = ['ParishChief', 'Farmer', 'SMALLHOLDER_FARMER'].includes(selectedRole);

  return (
    <div className={`h-screen overflow-y-auto font-sans transition-colors duration-500 flex flex-col justify-between tracking-tight ${
      isFieldTheme 
        ? 'bg-[#052e16] text-slate-100 selection:bg-[#F59E0B]/30' 
        : 'bg-[#F8FAFC] text-slate-900 selection:bg-[#06B6D4]/30'
    }`}>
      
      {/* Top Bar Navigation Frame */}
      <header className={`px-6 py-4 flex justify-between items-center border-b ${
        isFieldTheme ? 'border-emerald-900/40 bg-[#041d0e]/25' : 'border-slate-250 bg-white/20'
      }`}>
        <div className="flex items-center gap-3">
          <img 
            src="https://pub-f170a2592d2c4a1485466404c36807be.r2.dev/Tests/logoipsum-415.svg" 
            alt="AgriOS Logo" 
            style={{ filter: isFieldTheme ? "brightness(0) invert(1)" : "brightness(0)", height: "24px" }} 
            className="object-contain"
          />
          <div>
            <h1 className={`text-sm font-black uppercase ${isFieldTheme ? 'text-white' : 'text-slate-900'}`}>AgriOS Uganda</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider">SECURE CONTEXT GATEWAY</p>
          </div>
        </div>

        {/* Network & High-contrast accessibility toggles */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Network Selector */}
          <button 
            type="button"
            onClick={() => simulateNetworkStatusChange(!isOfflineMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isOfflineMode 
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}
          >
            {isOfflineMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span>OFFLINE STATUS</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>NIRA SECURE ONLINE</span>
              </>
            )}
          </button>

          {/* Contrast scale for field accessibility */}
          {isFieldTheme && (
            <button
              onClick={() => setIsHighContrastText(!isHighContrastText)}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase py-1 text-slate-400 hover:text-white"
            >
              <span>Text Scale:</span>
              <span className="text-[#F59E0B]">{isHighContrastText ? 'PRO MAX' : 'REGULAR'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Form Center Section */}
      <div className="max-w-6xl mx-auto w-full px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-grow">
        
        {/* Left Informational Deck Column */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${
              isFieldTheme ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#06B6D4]/20 text-[#06B6D4]'
            }`}>
              Uganda Agricultural Information Engine
            </span>
            <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight font-sans">
              Enter your <br />
              <span className={isFieldTheme ? 'text-[#F59E0B]' : 'text-[#06B6D4]'}>Credential Authority</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-[13px] leading-relaxed">
              Real-time authorization gateway supporting offline cached synchronization. Select your active corporate staff division or biometric field keys to enter.
            </p>
          </motion.div>

          {/* State parameters transparency progress bar */}
          <div className={`p-4 rounded-2xl border ${
            isFieldTheme ? 'bg-[#082a17]/60 border-emerald-900/40' : 'bg-white border-slate-200'
          } space-y-3`}>
            <div className="flex justify-between items-baseline text-[10.5px]">
              <span className="font-bold text-slate-400 uppercase">Secure Handshake Buffer</span>
              <span className={`font-mono font-bold ${isFieldTheme ? 'text-amber-500' : 'text-cyan-600'}`}>99.8% AVAILABILITY</span>
            </div>
            
            {/* Visual Progress Meter */}
            <div className="h-1 bg-slate-700/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: isOfflineMode ? '40%' : '100%' }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className={`h-full ${isFieldTheme ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 'bg-gradient-to-r from-cyan-400 to-cyan-600'}`}
              />
            </div>

            <div className="flex gap-2 items-start text-[9.5px] text-slate-450 mt-1 leading-normal font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {isOfflineMode 
                  ? 'Active offline credential caching allows offline logins using locally cached secrets written during online verification.' 
                  : 'NIRA Biometric Proxy and NAADS Distribution registries are active.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Adaptive Login Component Box Column */}
        <div className="lg:col-span-7">
          <motion.div
            layout
            className={`border rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
              isFieldTheme 
                ? 'bg-[#0c4a28] border-emerald-700/80 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Form Mode Dual Tab selector */}
            <div className={`grid grid-cols-2 text-center text-xs font-bold font-sans border-b ${
              isFieldTheme ? 'border-emerald-800/60' : 'border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('field');
                  setSelectedRole('ParishChief');
                }}
                className={`py-4 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'field'
                    ? isFieldTheme 
                      ? 'bg-[#082516] text-white border-b-2 border-[#F59E0B]' 
                      : 'bg-stone-50 text-slate-900 border-b-2 border-[#06B6D4]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>LOCAL FIELD LOGIN</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff');
                  setSelectedRole('ExtensionOfficer');
                }}
                className={`py-4 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'staff'
                    ? isFieldTheme 
                      ? 'bg-[#082516] text-white border-b-2 border-[#F59E0B]' 
                      : 'bg-stone-50 text-slate-900 border-b-2 border-[#06B6D4]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>STAFF ENTERPRISE LOGIN</span>
              </button>
            </div>

            {/* Main Form Fields Container */}
            <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-6">
              
              {/* Role Selection Dropdown aligned with target model */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Assign Authorization Clearance
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeTab === 'field' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('ParishChief')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center sm:col-span-2 ${
                          selectedRole === 'ParishChief'
                            ? isFieldTheme ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white' : 'bg-[#06B6D4]/10 border-[#06B6D4] text-slate-900'
                            : isFieldTheme ? 'bg-[#082215]/40 border-emerald-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <Landmark className="w-4 h-4" />
                        <span>Parish Chief</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedRole('SMALLHOLDER_FARMER')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center sm:col-span-2 ${
                          selectedRole === 'SMALLHOLDER_FARMER'
                            ? isFieldTheme ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white' : 'bg-[#06B6D4]/10 border-[#06B6D4] text-slate-900'
                            : isFieldTheme ? 'bg-[#082215]/40 border-emerald-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <Phone className="w-4 h-4" />
                        <span>Farmer</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('ExtensionOfficer')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${
                          selectedRole === 'ExtensionOfficer'
                            ? isFieldTheme ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white' : 'bg-[#06B6D4]/10 border-[#06B6D4] text-slate-900'
                            : isFieldTheme ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <Landmark className="w-4 h-4" />
                        <span>Extension</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('SiloOperator')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${
                          selectedRole === 'SiloOperator'
                            ? isFieldTheme ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white' : 'bg-[#06B6D4]/10 border-[#06B6D4] text-slate-900'
                            : isFieldTheme ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <Key className="w-4 h-4" />
                        <span>Silo Operator</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('NAADS_DISTRIBUTOR')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${
                          selectedRole === 'NAADS_DISTRIBUTOR'
                            ? isFieldTheme ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white' : 'bg-[#06B6D4]/10 border-[#06B6D4] text-slate-900'
                            : isFieldTheme ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>NAADS Dist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('MinistryAuditor')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${
                          selectedRole === 'MinistryAuditor'
                            ? isFieldTheme ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white' : 'bg-[#06B6D4]/10 border-[#06B6D4] text-slate-900'
                            : isFieldTheme ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Auditor</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Identity Inputs Field with Adaptive Flash styling on active selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {activeTab === 'field' 
                      ? selectedRole === 'ParishChief' ? 'National NIN Identifier (NIRA Registry)' : 'Registered Contact Number (SIM OTP)'
                      : 'Corporate Employee Token ID'
                    }
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={
                        activeTab === 'field'
                          ? selectedRole === 'ParishChief' ? 'e.g. CM0987654321ZZ' : 'e.g. +256700000001'
                          : 'e.g. EXT-301, SILO-778'
                      }
                      value={identityInput}
                      onChange={(e) => setIdentityInput(e.target.value)}
                      className={`w-full bg-transparent border rounded-2xl px-4 py-3 text-xs focus:outline-none transition-all ${
                        isFieldTheme
                          ? 'border-emerald-900/60 focus:border-[#F59E0B] text-white focus:ring-1 focus:ring-[#F59E0B]'
                          : 'border-slate-250 focus:border-[#06B6D4] text-slate-900 focus:ring-1 focus:ring-[#06B6D4]'
                      } ${isHighContrastText ? 'text-sm font-bold md:text-md' : 'text-xs'}`}
                    />
                  </div>
                </div>

                {/* Secret verification security challenge */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {activeTab === 'field' ? '4-Digit Verification Secure PIN' : 'Operational Password'}
                  </label>

                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      maxLength={activeTab === 'field' ? 6 : 30}
                      placeholder={activeTab === 'field' ? '••••' : '••••••••'}
                      value={secretInput}
                      onFocus={() => setIsTypingSecret(true)}
                      onBlur={() => setIsTypingSecret(false)}
                      onChange={(e) => setSecretInput(e.target.value)}
                      className={`w-full bg-transparent border rounded-2xl pl-4 pr-12 py-3 text-xs focus:outline-none transition-all ${
                        isTypingSecret
                          ? isFieldTheme ? 'border-[#F59E0B] focus:ring-[#F59E0B]' : 'border-[#06B6D4] focus:ring-[#06B6D4]'
                          : isFieldTheme ? 'border-emerald-900/60' : 'border-slate-250'
                      } text-center font-mono tracking-widest ${isHighContrastText ? 'text-sm font-bold' : 'text-xs'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3.5 p-1 rounded-lg transition-colors cursor-pointer ${
                        isFieldTheme ? 'text-[#F59E0B] hover:text-[#f59e0b]/80' : 'text-[#06B6D4] hover:text-[#06b6d4]/80'
                      }`}
                      title={showPassword ? 'Hide verification value' : 'Show verification value'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* VIRTUAL KEYPAD for intuitive Field Operator tactile experience */}
              {activeTab === 'field' && (
                <div className={`p-4 rounded-2xl border ${
                  isFieldTheme ? 'bg-[#042010]/45 border-emerald-900/60' : 'bg-slate-50 border-slate-200'
                } space-y-3`}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tactile Keypad Entry (PIN)</span>
                    <span className="text-[8px] text-slate-500 font-mono">DPI OPTIMIZED</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'BACKSPACE', '0', 'CLEAR'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeypadPress(key)}
                        className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                          key === 'BACKSPACE' || key === 'CLEAR'
                            ? 'bg-slate-500/10 border-slate-500/20 text-slate-450 hover:bg-slate-500/20 text-[10px]'
                            : isFieldTheme 
                              ? 'bg-[#0c2e1b] border-emerald-950 hover:bg-[#123e25] text-white' 
                              : 'bg-white border-slate-250 hover:bg-stone-50 text-slate-800'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Active Authentication Handshake Button */}
              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  id="login-submit-button"
                  className={`w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-xl transition-all relative ${
                    isFieldTheme 
                      ? 'bg-[#F59E0B] hover:bg-[#D97706] text-black hover:scale-[1.015] active:scale-95 shadow-amber-500/10' 
                      : 'bg-[#06B6D4] hover:bg-[#0891B2] text-white hover:scale-[1.015] active:scale-95 shadow-cyan-500/10'
                  }`}
                >
                  {/* Glowing pulsing dot as active visual authorization indicator */}
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current"></span>
                  </span>
                  <span>INITIATE SECURE LOGIN (GATEWAY HANDSHAKE)</span>
                </button>

                {/* Secure bottom helper notes completing the form box */}
                <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2 font-mono uppercase bg-slate-500/5 p-3 rounded-xl border border-dashed border-slate-500/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Biometric NIRA Secure Switch Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hover:underline cursor-help" title="Uganda Ministry of Agriculture, Animal Industry and Fisheries">MAAIF Gated</span>
                    <span>•</span>
                    <span className="hover:underline cursor-help" title="All login handshakes are monitored and recorded under IAM framework audit trails">Audit Logged</span>
                  </div>
                </div>
              </div>

            </form>
          </motion.div>
        </div>

      </div>

      {/* FIXED OPERATOR SIMULATION CONSOLE (Sticky Bottom Section) */}
      <footer className={`border-t p-6 ${
        isFieldTheme ? 'bg-[#042010] border-emerald-950' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 pb-2 border-b border-dashed border-slate-800">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Rapid Sandbox Operator Simulator
              </p>
              <p className="text-[10px] text-slate-500">Impersonate real field units or staff to test workspace dynamic routing interfaces.</p>
            </div>
            <span className="bg-emerald-500/15 text-emerald-500 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              NIRA Sandbox Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
            
            {/* Chief Selector */}
            <button
              onClick={() => handleSimulateOperator('ParishChief', 'CM0987654321ZZ', '1234', 'field')}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isFieldTheme ? 'bg-[#082a17]/60 hover:bg-[#0c3a20] border-emerald-950 text-white' : 'bg-white hover:bg-stone-50 border-slate-220 text-slate-855'
              }`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-amber-500 block">PARISH_CHIEF_PWA</span>
                <span className="font-bold block mt-0.5 leading-tight">Betty Nambooze</span>
              </div>
              <p className="text-[9.5px] text-slate-450 mt-1.5 font-mono">PIN: 1234</p>
            </button>

            {/* Farmer Selector */}
            <button
              onClick={() => handleSimulateOperator('Farmer', '+256700000001', '5555', 'field')}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isFieldTheme ? 'bg-[#082a17]/60 hover:bg-[#0c3a20] border-emerald-950 text-white' : 'bg-white hover:bg-stone-50 border-slate-220 text-slate-855'
              }`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-amber-500 block">SMALLHOLDER_FARMER</span>
                <span className="font-bold block mt-0.5 leading-tight">Mukasa John</span>
              </div>
              <p className="text-[9.5px] text-slate-450 mt-1.5 font-mono">OTP: 5555</p>
            </button>

            {/* Extension Selector */}
            <button
              onClick={() => handleSimulateOperator('ExtensionOfficer', 'EXT-301', 'password', 'staff')}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isFieldTheme ? 'bg-[#082a17]/60 hover:bg-[#0c3a20] border-emerald-950 text-white' : 'bg-white hover:bg-stone-50 border-slate-220 text-slate-850'
              }`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-purple-400 block">EXTENSION_OFFICER</span>
                <span className="font-bold block mt-0.5 leading-tight">Samuel Odongo</span>
              </div>
              <p className="text-[9.5px] text-slate-450 mt-1.5 font-mono">PASS: password</p>
            </button>

            {/* Silo Operator Selector */}
            <button
              onClick={() => handleSimulateOperator('SiloOperator', 'SILO-778', 'password', 'staff')}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isFieldTheme ? 'bg-[#082a17]/60 hover:bg-[#0c3a20] border-emerald-950 text-white' : 'bg-white hover:bg-stone-50 border-slate-220 text-slate-850'
              }`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-cyan-500 block">SILO_OPERATOR</span>
                <span className="font-bold block mt-0.5 leading-tight">Okello Joseph</span>
              </div>
              <p className="text-[9.5px] text-slate-450 mt-1.5 font-mono">PASS: password</p>
            </button>

            {/* NAADS Distributor Selector */}
            <button
              onClick={() => handleSimulateOperator('NAADS_DISTRIBUTOR', 'NAADS-552', 'password', 'staff')}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isFieldTheme ? 'bg-[#082a17]/60 hover:bg-[#0c3a20] border-emerald-950 text-white' : 'bg-white hover:bg-stone-50 border-slate-220 text-slate-850'
              }`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-cyan-500 block">NAADS_DISTRIBUTOR</span>
                <span className="font-bold block mt-0.5 leading-tight">Frank Mugisha</span>
              </div>
              <p className="text-[9.5px] text-slate-450 mt-1.5 font-mono">PASS: password</p>
            </button>

            {/* Ministry Auditor Selector */}
            <button
              onClick={() => handleSimulateOperator('MinistryAuditor', 'MINISTRY-101', 'password', 'staff')}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isFieldTheme ? 'bg-[#082a17]/60 hover:bg-[#0c3a20] border-emerald-950 text-white' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-amber-500 block">MINISTRY_AUDITOR</span>
                <span className="font-bold block mt-0.5 leading-tight text-white">Doreen Alupo</span>
              </div>
              <p className="text-[9.5px] text-amber-400 font-bold mt-1.5 font-mono">PASS: password</p>
            </button>

          </div>
        </div>
      </footer>

      {/* Dynamic Handshake Process overlay overlay */}
      <VerificationOverlay
        isOpen={isOverlayOpen}
        identity={identityInput}
        role={selectedRole}
        isOffline={isOfflineMode}
        errorMsg={verificationError}
        onFinish={() => {
          setIsOverlayOpen(false);
          navigate('/');
        }}
        onDismissError={() => {
          setIsOverlayOpen(false);
          setVerificationError(undefined);
        }}
      />

    </div>
  );
}
