import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAgriOS } from '@/store/AgriOSContext';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { cn } from '@/lib/utils';
import UserProfileModal from '@/components/UserProfileModal';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface MenuItem {
  name: string;
  to: string;
  icon: string;
  roles: Role[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function SecuredSidebar() {
  const { currentUser } = useAgriOS();
  const { role: authRole, user: authUser } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();

  const userRole = authRole || currentUser?.role || 'SMALLHOLDER_FARMER';

  // Normalize Farmer <-> SMALLHOLDER_FARMER clean checks
  const currentRoleClean = userRole === 'SMALLHOLDER_FARMER' ? 'Farmer' : userRole;

  const isRoleAllowed = (allowedRoles: Role[]) => {
    const cleanAllowed = allowedRoles.map(r => r === 'SMALLHOLDER_FARMER' ? 'Farmer' : r);
    return cleanAllowed.includes(currentRoleClean);
  };

  // Master Security Domain Site Map Section Lists
  const siteMap: MenuSection[] = [
    {
      title: 'Global Dashboard',
      items: [
        {
          name: 'Command Center',
          to: '/',
          icon: 'dashboard',
          roles: ['Farmer', 'SMALLHOLDER_FARMER', 'ParishChief', 'ExtensionOfficer', 'SiloOperator', 'MinistryAuditor', 'LogisticsManager', 'NAADS_DISTRIBUTOR']
        }
      ]
    },
    {
      title: 'SiloLink Logistics',
      items: [
        {
          name: 'Capacity Matrix',
          to: '/silolink/matrix',
          icon: 'storage',
          roles: ['SiloOperator', 'MinistryAuditor', 'LogisticsManager']
        },
        {
          name: 'Moisture Controller',
          to: '/silolink/moisture',
          icon: 'opacity',
          roles: ['SiloOperator', 'MinistryAuditor']
        },
        {
          name: 'Farmer Portal Booking',
          to: '/silolink/booking',
          icon: 'calendar_month',
          roles: ['Farmer', 'SMALLHOLDER_FARMER', 'MinistryAuditor']
        },
        {
          name: 'Hauler Dispatch Heatmap',
          to: '/silolink/dispatch',
          icon: 'analytics',
          roles: ['LogisticsManager', 'MinistryAuditor']
        }
      ]
    },
    {
      title: 'AgriTrace Identity',
      items: [
        {
          name: 'Parish Chief Scanner',
          to: '/agritrace/scanner',
          icon: 'qr_code_scanner',
          roles: ['ParishChief', 'MinistryAuditor']
        },
        {
          name: 'Offline Sync Queue',
          to: '/agritrace/sync',
          icon: 'sync',
          roles: ['ParishChief', 'ExtensionOfficer', 'SiloOperator', 'MinistryAuditor']
        },
        {
          name: 'NAADS Dispatch Output',
          to: '/agritrace/dispatch',
          icon: 'local_shipping',
          roles: ['NAADS_DISTRIBUTOR', 'MinistryAuditor']
        }
      ]
    },
    {
      title: 'HarvestShield Biosecurity',
      items: [
        {
          name: '3-Tap Intake Diagnostic',
          to: '/harvestshield/intake',
          icon: 'sensors',
          roles: ['ExtensionOfficer', 'MinistryAuditor']
        },
        {
          name: 'Radius Alert Broadcast',
          to: '/harvestshield/broadcast',
          icon: 'notifications_active',
          roles: ['ExtensionOfficer', 'MinistryAuditor']
        },
        {
          name: 'National Epidemiology Map',
          to: '/harvestshield/map',
          icon: 'map',
          roles: ['MinistryAuditor', 'ExtensionOfficer']
        }
      ]
    },
    {
      title: 'Executive Oversight',
      items: [
        {
          name: 'Auditor Command Console',
          to: '/ministry/command',
          icon: 'admin_panel_settings',
          roles: ['MinistryAuditor']
        }
      ]
    }
  ];

  return (
    <div className="w-60 bg-white border-r border-black/5 flex flex-col h-full shrink-0 hidden md:flex py-5 shadow-none z-20">
      {/* Brand Header */}
      <div className="px-5 pb-5 border-b border-black/5 flex items-center gap-3">
        <img 
          src="https://pub-f170a2592d2c4a1485466404c36807be.r2.dev/Tests/logoipsum-415.svg" 
          alt="AgriOS Logo" 
          style={{ filter: "brightness(0)", height: "24px" }} 
          className="object-contain"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold tracking-tight text-[#1a1a1a] leading-none">AgriOS</span>
            <span className="text-[7px] text-indigo-600 font-black border border-indigo-200/50 bg-indigo-50 px-1 rounded inline-flex self-center">RBAC</span>
          </div>
          <span className="text-[9px] uppercase font-bold text-[#888888] tracking-widest leading-none mt-1">Uganda</span>
        </div>
      </div>
      
      {/* Navigation section list - fully open to all roles for read-only transparency */}
      <div className="p-3 flex flex-col gap-1 flex-grow overflow-y-auto w-full">
        {siteMap.map((section, idx) => {
          const visibleItems = section.items; // Fully open to all logged-in profiles !
          
          if (visibleItems.length === 0) return null;

          return (
            <React.Fragment key={idx}>
              <div className="text-[9px] font-bold text-[#888888] uppercase tracking-wider mb-1 mt-3 px-2.5">
                {section.title}
              </div>
              
              {visibleItems.map((item, itemIdx) => {
                const isActive = item.to === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.to);

                return (
                  <Link 
                    key={itemIdx}
                    to={item.to} 
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                      isActive 
                        ? "bg-black/5 text-[#1a1a1a] font-bold" 
                        : "text-[#888888] hover:bg-black/2.5 hover:text-[#1a1a1a]"
                    )}
                  >
                    <span className="material-symbols-rounded text-[18px] shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* IAM User Card Switcher Info row at bottom */}
      <div className="p-2 mx-3 mb-2 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between text-[10px] font-mono select-none">
        <span className="text-slate-500 uppercase tracking-widest font-bold">SECURE SCOPE</span>
        <div className="flex items-center gap-1 text-emerald-600 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ACTIVE</span>
        </div>
      </div>

      <button 
        onClick={() => setIsProfileModalOpen(true)}
        className="p-4 border-t border-black/5 text-sm text-[#888888] flex items-center gap-2.5 cursor-pointer hover:bg-black/5 transition-all text-left w-full select-none"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 select-none">
          {(authUser?.fullName || currentUser?.fullName || 'U').split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-semibold text-[#1a1a1a] leading-tight truncate">{authUser?.fullName || currentUser?.fullName}</span>
          <span className="text-[9px] tracking-wider uppercase text-[#888888] font-black leading-none mt-1 truncate">{userRole}</span>
        </div>
      </button>

      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}
