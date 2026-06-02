import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useBills } from '../../hooks/useBills';
import { Menu, Bell, Search as SearchIcon, AlertTriangle, Package, Check, User, FileText, ShieldCheck, Eye, Lock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Premium interactive widgets
import CustomCursor from '../ui/CustomCursor';
import BackgroundParticles from '../ui/BackgroundParticles';
import CommandPalette from '../ui/CommandPalette';

export const Layout = ({ children }) => {
  const { profile, isDemo, isGuest } = useAuthContext();
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { bills } = useBills();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const notificationRef = useRef(null);

  const handleSetSidebarCollapsed = (val) => {
    setIsSidebarCollapsed(val);
    localStorage.setItem('sidebar_collapsed', String(val));
  };

  useEffect(() => {
    // Show welcome modal once per session after successful login
    if (!sessionStorage.getItem('has_seen_welcome')) {
      setShowWelcomeModal(true);
      sessionStorage.setItem('has_seen_welcome', 'true');
    }
  }, []);

  const lowStockProducts = products.filter(p => p.currentQty <= p.minQty);

  // Advanced Notification Persistence Logic
  useEffect(() => {
    const lastSeenCount = parseInt(localStorage.getItem('lastSeenAlertCount') || '0', 10);
    const hasAcknowledged = localStorage.getItem('notificationsAcknowledged') === 'true';

    if (lowStockProducts.length > lastSeenCount) {
      setHasUnread(true);
      localStorage.setItem('notificationsAcknowledged', 'false');
    } else if (lowStockProducts.length > 0 && !hasAcknowledged) {
      setHasUnread(true);
    } else {
      setHasUnread(false);
    }
  }, [lowStockProducts.length]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasUnread(false);
      localStorage.setItem('lastSeenAlertCount', lowStockProducts.length.toString());
      localStorage.setItem('notificationsAcknowledged', 'true');
    }
  };

  // Close dropdowns on route change
  useEffect(() => {
    setIsSidebarOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for command palette shortcut (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasBanner = isDemo || isGuest;
  const bannerText = isDemo 
    ? "🔒 RUNNING IN DEMO MODE — READ-ONLY ACCESS | SYSTEM MODIFICATIONS RESTRICTED"
    : `👁 GUEST CLEARANCE — READ-ONLY | EXPIRES: ${(() => {
        try {
          if (!profile?.expiresAt) return 'N/A';
          const date = profile.expiresAt.toDate ? profile.expiresAt.toDate() : new Date(profile.expiresAt);
          return format(date, 'MMM dd, hh:mm a');
        } catch (e) {
          return 'N/A';
        }
      })()}`;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white selection:bg-[#00D4FF] selection:text-black font-body overflow-x-hidden relative">
      
      {/* Background Particles Canvas Layer */}
      <BackgroundParticles />

      {/* Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* Custom Interactive Cursor */}
      <CustomCursor />

      {/* Spotlight Command Search Modal */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      {hasBanner && (
        <div className={`h-[36px] bg-[#FFB800] text-black flex items-center justify-center gap-3 px-4 fixed top-0 left-0 right-0 z-[2000] shadow-[0_5px_20px_rgba(255,184,0,0.2)]`}>
          <Lock size={12} className="animate-pulse" />
          <p className="text-[0.6rem] font-black uppercase tracking-[0.25em]">
            {bannerText}
          </p>
        </div>
      )}
      
      {/* HEADER */}
      <header className={`h-[64px] fixed ${hasBanner ? 'top-[36px]' : 'top-0'} left-0 right-0 z-[1000] px-4 lg:px-8 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-[#1E2D3D] flex items-center justify-between no-print transition-all duration-300`}>
          
          {/* LEFT: Branding */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl lg:hidden transition-all active:scale-95 text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/20"
            >
              <Menu size={22} />
            </button>
            
            <div className="flex items-center flex-shrink-0 whitespace-nowrap overflow-visible group cursor-pointer" onClick={() => navigate('/dashboard')} style={{ gap: '12px' }}>
              <div className="flex-shrink-0 w-[40px] h-[40px] rounded-[12px] bg-gradient-to-tr from-[#00D4FF] to-[#0088cc] flex items-center justify-center text-[#0A0F1E] font-heading font-[800] text-[1.1rem] shadow-[0_0_20px_rgba(0,212,255,0.35)] group-hover:scale-105 transition-transform duration-300">CT</div>
              <div className="hidden sm:block">
                <h1 className="whitespace-nowrap font-heading font-[800] text-[0.95rem] uppercase tracking-normal" style={{ overflow: 'visible', textOverflow: 'clip' }}>
                  <span className="text-white">CHANDRAKANT</span> <span className="text-[#00D4FF]">{profile?.name ? profile.name.split(' ')[0] : 'ADMIN'}</span>
                </h1>
                <p className="text-white/[0.38] whitespace-nowrap font-body font-[500] text-[0.58rem] uppercase tracking-[0.18em]">MANAGEMENT SUITE</p>
              </div>
            </div>
          </div>

          {/* MIDDLE: Bloomberg Terminal search trigger */}
          <div 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0D1B2A]/90 border border-[#1E2D3D] text-[#8899A6] cursor-pointer hover:border-[#00D4FF]/40 hover:text-white transition-all w-[320px] select-none"
          >
            <SearchIcon size={15} className="text-[#00D4FF]" />
            <span className="text-[0.72rem] font-sans">Search terminal...</span>
            <span className="ml-auto text-[0.58rem] font-bold font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#8899A6]/50">Ctrl K</span>
          </div>
          
          {/* RIGHT: Actions */}
          <div className="flex items-center gap-6">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={handleNotificationClick}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 relative border ${showNotifications ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 shadow-[0_0_25px_rgba(0,212,255,0.1)]' : 'hover:bg-white/5 text-white/50 hover:text-white border-transparent hover:border-white/10'}`}
              >
                <Bell size={20} className={hasUnread ? "animate-bell-shake" : ""} />
                {hasUnread && (
                  <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3D57] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF3D57] border-2 border-[#0A0F1E]"></span>
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-4 w-[350px] rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border bg-[#0D1B2A] border-[#1E2D3D] p-4 z-50 animate-dropdown-entrance backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4 px-1 pb-3 border-b border-white/5">
                    <h4 className="text-[0.7rem] font-black uppercase tracking-[0.25em] text-[#00D4FF]">System Advisory</h4>
                    <span className="text-[0.65rem] font-bold text-white/20 uppercase tracking-widest">{lowStockProducts.length} Active Protocols</span>
                  </div>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map(p => (
                        <div key={p.id} onClick={() => navigate(`/inventory?edit=${p.id}`)} className="p-3.5 rounded-2xl flex items-start gap-4 cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#FF3D57] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <p className="text-[0.85rem] font-bold text-white leading-tight mb-1 truncate max-w-[200px]">{p.name}</p>
                            <p className="text-[0.65rem] font-black text-[#FF3D57] uppercase tracking-widest">Inventory Low: {p.currentQty}</p>
                            <p className="text-[0.55rem] font-bold text-white/20 mt-2 uppercase tracking-widest">Action Priority High</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Check size={32} className="mx-auto mb-4 text-[#00D4FF] opacity-20" />
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-white/10">Your system is running smoothly</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-4 cursor-pointer p-1 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00D4FF] to-[#0088cc] flex items-center justify-center text-[#0A0F1E] font-heading font-black text-xl shadow-[0_8px_20px_rgba(0,212,255,0.2)] group-hover:rotate-3 transition-transform">
                {profile?.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="hidden sm:block text-left pr-2">
                <p className="text-[0.8rem] font-[600] font-body text-white leading-none mb-1.5 group-hover:text-[#00D4FF] transition-colors uppercase tracking-tight">{profile?.name || 'ADMIN'}</p>
                <p className="text-[0.65rem] font-[400] font-body text-white/40 uppercase tracking-[0.08em]">{isDemo ? 'DEMO TERMINAL' : isGuest ? 'GUEST CLEARANCE' : 'SYSTEM OWNER'}</p>
              </div>
            </div>
          </div>
          
      </header>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={handleSetSidebarCollapsed}
      />
      
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[260px]'} ${hasBanner ? 'pt-[100px]' : 'pt-[64px]'} flex flex-col min-h-[100vh] relative z-10`}>
        
        {/* MAIN CONTENT WRAPPER */}
        <main className="p-8 lg:p-12 flex-1 w-full relative z-10 overflow-x-hidden">
          {children}
        </main>

      </div>

      {showWelcomeModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0A0F1E]/90 backdrop-blur-xl" onClick={() => setShowWelcomeModal(false)}></div>
          <div className="relative w-full max-w-[420px] bg-[#0D1B2A] border border-[#1E2D3D] rounded-[32px] p-10 shadow-2xl animate-[modalEntrance_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] text-center overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150px] bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.15)_0%,rgba(10,10,15,0)_70%)] pointer-events-none"></div>
            
            <div className="w-20 h-20 bg-[#00D4FF]/10 rounded-3xl flex items-center justify-center text-[#00D4FF] mx-auto mb-8 shadow-[0_0_30px_rgba(0,212,255,0.25)]">
              <ShieldCheck size={40} />
            </div>
            
            <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight leading-tight">
              Access<br/><span className="text-[#00D4FF]">Authorized</span>
            </h3>
            
            <p className="text-[0.8rem] text-white/50 font-body mt-4 leading-relaxed">
              Welcome back to the terminal, <strong className="text-white">{profile?.name || 'Admin'}</strong>. 
              Your security clearance level is <span className="uppercase text-[#00D4FF] font-bold tracking-widest">{profile?.role || 'Staff'}</span>.
            </p>
            
            <button 
              onClick={() => setShowWelcomeModal(false)}
              className="w-full mt-8 h-[54px] bg-[#00D4FF] text-[#0A0F1E] font-black text-[0.75rem] uppercase tracking-[0.2em] rounded-2xl hover:bg-[#00b2d6] transition-all shadow-xl shadow-[#00D4FF33]"
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
