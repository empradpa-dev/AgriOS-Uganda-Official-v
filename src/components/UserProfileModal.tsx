import React, { useState } from 'react';
import { useAgriOS } from '@/store/AgriOSContext';
import { useAuth } from '@/context/AuthContext';
import { User, Role } from '@/types';
import { 
  X, Check, ShieldCheck, User2, MapPin, 
  Phone, Globe, RefreshCcw, Award, AlertCircle, FileSpreadsheet, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { currentUser, setCurrentUser, users } = useAgriOS();
  const auth = useAuth();
  
  // Local edit states
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [nin, setNin] = useState(currentUser?.nin || '');
  const [contactNumber, setContactNumber] = useState(currentUser?.contactNumber || '');
  const [district, setDistrict] = useState(currentUser?.district || '');
  const [subCounty, setSubCounty] = useState(currentUser?.subCounty || '');
  const [parish, setParish] = useState(currentUser?.parish || '');
  const [role, setRole] = useState<Role>(currentUser?.role || 'ParishChief');
  
  // Custom states
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Presets of other users to quick-switch
  const handleQuickSwitch = (selectedUser: User) => {
    setCurrentUser(selectedUser);
    setFullName(selectedUser.fullName);
    setNin(selectedUser.nin);
    setContactNumber(selectedUser.contactNumber);
    setDistrict(selectedUser.district);
    setSubCounty(selectedUser.subCounty);
    setParish(selectedUser.parish);
    setRole(selectedUser.role);
    
    // Brief animation indicator
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
    }, 400);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    setTimeout(() => {
      // Create new updated user
      const updatedUser: User = {
        ...currentUser,
        fullName,
        nin,
        contactNumber,
        district,
        subCounty,
        parish,
        role
      };
      
      setCurrentUser(updatedUser);
      setIsUpdating(false);
      setUpdateSuccess(true);
      
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 2000);
    }, 600);
  };

  const getRoleBadgeColor = (roleType: Role) => {
    switch (roleType) {
      case 'Farmer': return 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
      case 'ParishChief': return 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]';
      case 'ExtensionOfficer': return 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getRoleDescription = (roleType: Role) => {
    switch (roleType) {
      case 'Farmer': return 'Manages inputs quota allocation & schedules warehouse deposits.';
      case 'ParishChief': return 'Validates national ID scanning, authorizes inputs distribution, logs transactions.';
      case 'ExtensionOfficer': return 'Files epidemiological crop diagnostic scans, targets biosecurity alerts.';
      default: return 'Standard administrative operator.';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-black/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-[#1a1a1a] p-6 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl text-white">
                <User2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">National Citizen Profile Command</h3>
                <p className="text-[10px] text-slate-400">Authenticated via Uganda National Identification and Registration Authority (NIRA)</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: National ID and Switcher */}
              <div className="md:col-span-6 space-y-6">
                <div>
                  <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-450 mb-2.5">Registered ID Card Certificate</h4>
                  
                  {/* National ID Card simulator decoration */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#FAFBF8] via-[#F5F7F3] to-[#EEF1EB] border-2 border-stone-300 p-5 rounded-2xl shadow-sm text-xs font-mono space-y-4">
                    {/* Card Title & Coat of Arms simulation */}
                    <div className="flex justify-between items-start border-b border-stone-300 pb-3">
                      <div className="flex gap-2">
                        <div className="w-10 h-10 bg-gradient-to-b from-yellow-300 via-red-500 to-black rounded-lg shrink-0 flex items-center justify-center border border-stone-250">
                          <span className="text-[9px] font-bold text-white font-sans text-center leading-tight">UGA</span>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-stone-800 leading-tight">Republic of Uganda</h4>
                          <p className="text-[8px] text-stone-500 uppercase font-sans">National Identity Card</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end text-right">
                        <span className="bg-[#15803d]/15 border border-[#15803d]/30 text-[#15803d] px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> NIRA REAL-TIME
                        </span>
                        <span className="text-[7px] text-stone-400 mt-1 uppercase">DPI ID: VALIDATED</span>
                      </div>
                    </div>

                    {/* Card Photo & Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      {/* Visual Avatar frame */}
                      <div className="sm:col-span-3 flex flex-col items-center justify-center space-y-2">
                        <div className="w-20 h-20 rounded-xl bg-stone-200 border-2 border-stone-300 flex items-center justify-center font-bold text-[#1a1a1a] text-xl overflow-hidden relative group">
                          <span className="text-2xl font-bold select-none">{fullName.split(' ').map(n => n[0]).join('')}</span>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] cursor-pointer">
                            RFID VERIFIED
                          </div>
                        </div>
                        <span className="text-[7px] text-stone-400 uppercase tracking-widest leading-none font-bold">CARD: UGA-38192</span>
                      </div>

                      {/* Persona Data Grid */}
                      <div className="sm:col-span-9 grid grid-cols-2 gap-y-3 gap-x-4">
                        <div className="space-y-0.5 col-span-2">
                          <span className="text-[8px] text-stone-400 uppercase">Surname / Given Names</span>
                          <p className="text-xs font-black text-stone-900 font-sans tracking-tight">{fullName}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-stone-400 uppercase">National ID (NIN)</span>
                          <p className="text-[11px] font-bold text-stone-850 font-mono">{nin || 'N/A'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-stone-400 uppercase">Contact Link</span>
                          <p className="text-[11px] font-bold text-stone-800 font-sans">{contactNumber || 'No Phone'}</p>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <span className="text-[8px] text-stone-400 uppercase">Active AgriOS Authorization Level</span>
                          <div className="flex">
                            <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-bold font-sans ${getRoleBadgeColor(role)}`}>
                              {role} (DPI Node)
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 grid grid-cols-3 gap-2 pt-2 border-t border-stone-250">
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-stone-400 uppercase">District</span>
                            <p className="text-[9.5px] font-bold text-stone-900 font-sans truncate">{district}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-stone-400 uppercase">Sub-County</span>
                            <p className="text-[9.5px] font-bold text-stone-900 font-sans truncate">{subCounty}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-stone-400 uppercase">Parish</span>
                            <p className="text-[9.5px] font-bold text-stone-900 font-sans truncate">{parish}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick-switch simulated system simulation user options */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex justify-between items-baseline">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Operative Account Switcher
                    </label>
                    <span className="text-[8px] text-emerald-600 font-mono font-bold tracking-wider">SECURE SHIFT</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleQuickSwitch(u)}
                        type="button"
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          currentUser.id === u.id
                            ? 'bg-slate-950 text-white border-slate-900 shadow-sm'
                            : 'bg-[#fafbfc] text-stone-850 hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-black font-sans leading-none truncate max-w-[200px]">{u.fullName}</span>
                          <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase font-mono ${
                            currentUser.id === u.id ? 'bg-white/10 text-white border-white/20' : getRoleBadgeColor(u.role)
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className={`text-[9px] mt-2 font-sans leading-relaxed ${currentUser.id === u.id ? 'text-slate-400' : 'text-slate-500'}`}>
                          {getRoleDescription(u.role)}
                        </p>
                        {currentUser.id === u.id && (
                          <span className="absolute bottom-3.5 right-3.5 flex w-2 h-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Profile Settings Form */}
              <div className="md:col-span-6 space-y-5 bg-stone-50 p-5 md:p-6 rounded-2xl border border-stone-200/60 shadow-inner">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-stone-200 pb-3">
                    <Award className="w-4 h-4 text-[#1a1a1a]" />
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]">Modify Passport Particulars</h4>
                      <p className="text-[9px] text-[#888888]">Synchronize updates locally with central DPI services</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500">Citizen Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950 font-sans shadow-sm"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500">National Identification (NIN)</label>
                      <input
                        type="text"
                        required
                        value={nin}
                        onChange={(e) => setNin(e.target.value)}
                        className="w-full text-xs bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono uppercase tracking-wider shadow-sm"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500">Primary Contact Line</label>
                      <input
                        type="text"
                        required
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="w-full text-xs bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500">Home District</label>
                        <input
                          type="text"
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full text-xs bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950 shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500">Sub-County</label>
                        <input
                          type="text"
                          required
                          value={subCounty}
                          onChange={(e) => setSubCounty(e.target.value)}
                          className="w-full text-xs bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950 shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500">Parish Unit</label>
                        <input
                          type="text"
                          required
                          value={parish}
                          onChange={(e) => setParish(e.target.value)}
                          className="w-full text-xs bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-950 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Role Indicator */}
                  <div className="p-3.5 bg-yellow-50 border border-yellow-250/70 rounded-xl text-[10.5px] leading-relaxed text-yellow-900 flex gap-2.5 items-start shadow-sm pt-2 mt-4">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Automatic DPI Quota Validation:</strong>
                      Changing district/parish attributes alters the NAADS fertilizer voucher entitlement codes generated by your scan tasks.
                    </div>
                  </div>

                  {/* Save & Logout Buttons Group */}
                  <div className="space-y-2 mt-4">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full bg-[#1a1a1a] hover:bg-black font-extrabold py-3.5 px-4 rounded-xl text-xs text-white uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all active:scale-98"
                    >
                      {isUpdating ? 'Synchronizing with NIRA...' : updateSuccess ? 'Handshake complete! ✓' : 'Update Authenticated Profile'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        auth.logout();
                        onClose();
                      }}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-extrabold py-3 px-4 border border-red-200 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Terminate Active Session (Log Out)</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center text-[10px] text-slate-450 px-6 shrink-0 font-mono">
            <span>UGANDA NATIONAL REGISTRY API</span>
            <span>SECURE IDENTITY GATEWAY</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
