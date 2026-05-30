/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AgriOSPovider, useAgriOS } from '@/store/AgriOSContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// Import IAM gateways and layers
import LoginGateway from '@/views/auth/LoginGateway';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Import views
import NIRAIdentityScanner from '@/views/agritrace/NIRAIdentityScanner';
import OfflineSyncQueue from '@/views/agritrace/OfflineSyncQueue';
import QRWaybillGenerator from '@/views/agritrace/QRWaybillGenerator';

import OutbreakIntakeForm from '@/views/harvestshield/OutbreakIntakeForm';
import RadiusBroadcast from '@/views/harvestshield/RadiusBroadcast';
import EpidemiologicalMap from '@/views/harvestshield/EpidemiologicalMap';

import CapacityMatrixView from '@/views/silolink/CapacityMatrixView';
import MoistureControlAlert from '@/views/silolink/MoistureControlAlert';
import StorageBookingWizard from '@/views/silolink/StorageBookingWizard';
import HarvestGlutHeatmap from '@/views/silolink/HarvestGlutHeatmap';

import AgriOSCommandCenter from '@/views/ministry/AgriOSCommandCenter';

// Import components
import EmergencyDispatchModal from '@/components/EmergencyDispatchModal';
import UserProfileModal from '@/components/UserProfileModal';

function NavLink({ to, children, icon }: { to: string; children: React.ReactNode; icon: string }) {
  const location = useLocation();
  const isActive = to === '/' 
    ? location.pathname === '/' 
    : location.pathname.startsWith(to);
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
        isActive 
          ? "bg-black/5 text-[#1a1a1a] shadow-none" 
          : "text-[#888888] hover:bg-black/2.5 hover:text-[#1a1a1a]"
      )}
    >
      <span className="material-symbols-rounded text-[18px] shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

function Sidebar() {
  const { currentUser } = useAgriOS();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  return (
    <div className="w-60 glass-panel border-r border-black/5 flex flex-col h-full shrink-0 hidden md:flex py-5 shadow-none z-20">
      <div className="px-5 pb-5 border-b border-black/5 flex items-center gap-3">
        <img 
          src="https://pub-f170a2592d2c4a1485466404c36807be.r2.dev/Tests/logoipsum-415.svg" 
          alt="AgriOS Logo" 
          style={{ filter: "brightness(0)", height: "24px" }} 
          className="object-contain"
        />
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-tight text-[#1a1a1a] leading-none">AgriOS</span>
          <span className="text-[9px] uppercase font-bold text-[#888888] tracking-widest leading-none mt-1">Uganda</span>
        </div>
      </div>
      
      <div className="p-3 flex flex-col gap-1 flex-grow overflow-y-auto w-full">
        <div className="text-[9px] font-bold text-[#888888] uppercase tracking-wider mb-1 mt-2 px-2.5">Dashboard</div>
        <NavLink to="/" icon="dashboard">Dashboard</NavLink>

        <div className="text-[9px] font-bold text-[#888888] uppercase tracking-wider mb-1 mt-4 px-2.5">SiloLink</div>
        <NavLink to="/silolink/matrix" icon="storage">Capacity Console</NavLink>
        <NavLink to="/silolink/moisture" icon="opacity">Moisture Ledger</NavLink>
        <NavLink to="/silolink/booking" icon="calendar_month">Farmer Booking</NavLink>
        <NavLink to="/silolink/dispatch" icon="analytics">Hauler Dispatch</NavLink>

        <div className="text-[9px] font-bold text-[#888888] uppercase tracking-wider mb-1 mt-4 px-2.5">AgriTrace</div>
        <NavLink to="/agritrace/scanner" icon="qr_code_scanner">Parish Scanner</NavLink>
        <NavLink to="/agritrace/sync" icon="sync">Offline Queue</NavLink>
        <NavLink to="/agritrace/dispatch" icon="local_shipping">NAADS Dispatch</NavLink>
        
        <div className="text-[9px] font-bold text-[#888888] uppercase tracking-wider mb-1 mt-4 px-2.5">HarvestShield</div>
        <NavLink to="/harvestshield/intake" icon="sensors">3-Tap Diagnostic</NavLink>
        <NavLink to="/harvestshield/broadcast" icon="notifications_active">Radius Alert</NavLink>
        <NavLink to="/harvestshield/map" icon="map">Threat Heatmap</NavLink>

        <div className="text-[9px] font-bold text-[#888888] uppercase tracking-wider mb-1 mt-4 px-2.5">Ministry</div>
        <NavLink to="/ministry/command" icon="admin_panel_settings">AgriOS Command</NavLink>
      </div>

      <button 
        onClick={() => setIsProfileModalOpen(true)}
        className="p-4 border-t border-black/5 text-sm text-[#888888] flex items-center gap-2.5 cursor-pointer hover:bg-black/5 transition-all text-left w-full select-none"
      >
        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center font-bold text-[#1a1a1a] text-xs shrink-0 select-none">
          {currentUser?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-semibold text-[#1a1a1a] leading-tight truncate">{currentUser?.fullName}</span>
          <span className="text-[9px] tracking-wider uppercase text-[#888888] font-bold leading-none mt-0.5">{currentUser?.role}</span>
        </div>
      </button>

      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAgriOS();
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-transparent text-[#1a1a1a] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 relative bg-transparent">
        <header className="h-14 bg-white/70 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-black/5 text-[#888888] rounded text-[10px] font-mono font-medium border border-black/5">DPI_V2.04_PRD</span>
          </div>
          <div className="flex items-center gap-5">
             <div className="flex items-center gap-1.5 hidden sm:flex">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500"></span>
               <span className="text-[11px] font-semibold tracking-wide text-[#888888]">NIRA API: CONNECTED</span>
             </div>
             <div className="h-6 w-px bg-black/5 hidden sm:block"></div>
             
             {/* Small clickable active avatar portrait in header */}
             <button
               onClick={() => setIsProfileModalOpen(true)}
               className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 transition-all flex items-center justify-center font-bold text-[#1a1a1a] text-xs shrink-0 select-none cursor-pointer"
               title="View NIRA Registered Profile & Switching Menu"
             >
               {currentUser?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
             </button>

             <button 
               onClick={() => setIsEmergencyModalOpen(true)}
               className="bg-[#1a1a1a] text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-black/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
             >
               <span className="material-symbols-rounded text-[14px]">bolt</span>
               Emergency Dispatch
             </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-transparent relative">
          {children}
        </main>
        <EmergencyDispatchModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
        <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      </div>
    </div>
  );
}

import { MutationProvider } from '@/context/MutationContext';
import UnifiedAppGrid from '@/components/layout/UnifiedAppGrid';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Path */}
      <Route path="/login" element={<LoginGateway />} />

      {/* Role-Gated Secure Console Pathways */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <UnifiedAppGrid>
              <Routes>
                <Route path="/" element={<AgriOSCommandCenter />} />
                
                {/* AgriTrace Workspace */}
                <Route path="/agritrace/scanner" element={<NIRAIdentityScanner />} />
                <Route path="/agritrace/sync" element={<OfflineSyncQueue />} />
                <Route path="/agritrace/dispatch" element={<QRWaybillGenerator />} />

                {/* HarvestShield Diagnostics */}
                <Route path="/harvestshield/intake" element={<OutbreakIntakeForm />} />
                <Route path="/harvestshield/broadcast" element={<RadiusBroadcast />} />
                <Route path="/harvestshield/map" element={<EpidemiologicalMap />} />

                {/* SiloLink Grain Logistics */}
                <Route path="/silolink/matrix" element={<CapacityMatrixView />} />
                <Route path="/silolink/moisture" element={<MoistureControlAlert />} />
                <Route path="/silolink/booking" element={<StorageBookingWizard />} />
                <Route path="/silolink/dispatch" element={<HarvestGlutHeatmap />} />

                {/* Ministry Oversight */}
                <Route path="/ministry/command" element={<AgriOSCommandCenter />} />
              </Routes>
            </UnifiedAppGrid>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MutationProvider>
        <AgriOSPovider>
          <Router>
            <AppRoutes />
          </Router>
        </AgriOSPovider>
      </MutationProvider>
    </AuthProvider>
  );
}

