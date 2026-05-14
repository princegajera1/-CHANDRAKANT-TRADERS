import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useBills } from '../../hooks/useBills';
import { Menu, Bell, Search as SearchIcon, AlertTriangle, Package, Check, User, FileText, ShieldCheck, Eye, Lock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const Layout = ({ children }) => {
  const { profile, isDemo, isGuest } = useAuthContext();
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { bills } = useBills();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  const notificationRef = useRef(null);

  const lowStockProducts = products.filter(p => p.currentQty <= p.minQty);

  // Advanced Notification Persistence Logic
  useEffect(() => {
    const lastSeenCount = parseInt(localStorage.getItem('lastSeenAlertCount') || '0', 10);
    const hasAcknowledged = localStorage.getItem('notificationsAcknowledged') === 'true';

    // Show dot if count has increased or if it's the first time and they haven't seen them
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
    <div className="min-h-screen bg-[#080C14] text-white selection:bg-[#FF6A00] selection:text-black font-body overflow-x-hidden">
      {hasBanner && (
        <div className={`h-[36px] bg-[#FF6A00] text-black flex items-center justify-center gap-3 px-4 fixed top-0 left-0 right-0 z-[2000] shadow-[0_5px_20px_rgba(255,184,0,0.2)]`}>
          <Lock size={12} className="animate-pulse" />
          <p className="text-[0.6rem] font-black uppercase tracking-[0.25em]">
            {bannerText}
          </p>
        </div>
      )}
      {/* HEADER */}
      <header className={`h-[64px] fixed ${hasBanner ? 'top-[36px]' : 'top-0'} left-0 right-0 z-[1000] px-4 lg:px-8 bg-[#080C14]/80 backdrop-blur-xl border-b border-white/[0.03] flex items-center justify-between no-print transition-all duration-300 animate-header-entrance`}>
          
          {/* LEFT: Branding */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl lg:hidden transition-all active:scale-95 text-[#FF6A00] bg-[#FF6A00]/10 border border-[#FF6A00]/20"
            >
              <Menu size={22} />
            </button>
            
            <div className="flex items-center flex-shrink-0 whitespace-nowrap overflow-visible group cursor-pointer" onClick={() => navigate('/dashboard')} style={{ gap: '10px' }}>
              <div className="flex-shrink-0 w-[40px] h-[40px] rounded-[12px] bg-[#FF6A00] flex items-center justify-center text-white font-heading font-[800] text-[1.1rem] shadow-[0_8px_25px_rgba(255,106,0,0.3)] group-hover:scale-105 transition-transform duration-300">CT</div>
              <div className="hidden sm:block">
                <h1 className="whitespace-nowrap font-heading font-[800] text-[0.95rem] uppercase tracking-normal" style={{ overflow: 'visible', textOverflow: 'clip' }}>
                  <span className="text-white">CHANDRAKANT</span> <span className="text-[#FF6A00]">ADMIN</span>
                </h1>
                <p className="text-white/[0.38] whitespace-nowrap font-body font-[500] text-[0.58rem] uppercase tracking-[0.18em]">MANAGEMENT SUITE</p>
              </div>
            </div>
          </div>
          
          {/* RIGHT: Actions */}
          <div className="flex items-center gap-6">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={handleNotificationClick}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 relative ${showNotifications ? 'bg-[#FF6A00]/10 text-[#FF6A00] shadow-[0_0_25px_rgba(255,106,0,0.1)]' : 'hover:bg-white/5 text-white/50 hover:text-white border border-transparent hover:border-white/10'}`}
              >
                <Bell size={20} className={hasUnread ? "animate-bell-shake" : ""} />
                {hasUnread && (
                  <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6A00] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6A00] border-2 border-[#080C14]"></span>
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-4 w-[350px] rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border bg-[#121A2D] border-white/5 p-4 z-50 animate-dropdown-entrance">
                  <div className="flex items-center justify-between mb-4 px-1 pb-3 border-b border-white/5">
                    <h4 className="text-[0.7rem] font-black uppercase tracking-[0.25em] text-[#FF6A00]">System Advisory</h4>
                    <span className="text-[0.65rem] font-bold text-white/20 uppercase tracking-widest">{lowStockProducts.length} Active Protocols</span>
                  </div>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map(p => (
                        <div key={p.id} onClick={() => navigate(`/inventory?edit=${p.id}`)} className="p-3.5 rounded-2xl flex items-start gap-4 cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <p className="text-[0.85rem] font-bold text-white leading-tight mb-1 truncate max-w-[200px]">{p.name}</p>
                            <p className="text-[0.65rem] font-black text-red-500/80 uppercase tracking-widest">Inventory Low: {p.currentQty}</p>
                            <p className="text-[0.55rem] font-bold text-white/20 mt-2 uppercase tracking-widest">Action Priority High</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Check size={32} className="mx-auto mb-4 text-[#FF6A00] opacity-20" />
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
              <div className="w-10 h-10 rounded-xl bg-[#FF6A00] flex items-center justify-center text-white font-heading font-black text-xl shadow-[0_8px_20px_rgba(255,106,0,0.2)] group-hover:rotate-3 transition-transform">
                {profile?.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="hidden sm:block text-left pr-2">
                <p className="text-[0.8rem] font-[600] font-body text-white leading-none mb-1.5 group-hover:text-[#FF6A00] transition-colors uppercase tracking-tight">{profile?.name || 'ADMIN'}</p>
                <p className="text-[0.65rem] font-[400] font-body text-white/40 uppercase tracking-[0.08em]">{isDemo ? 'DEMO TERMINAL' : isGuest ? 'GUEST CLEARANCE' : 'SYSTEM OWNER'}</p>
              </div>
            </div>
          </div>
          
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className={`lg:ml-[260px] ${hasBanner ? 'pt-[100px]' : 'pt-[64px]'} flex flex-col min-h-[100vh] relative z-10`}>
        
        {/* MAIN CONTENT WRAPPER */}
        <main className="p-8 lg:p-12 flex-1 w-full relative z-10 overflow-x-hidden">
          {children}
        </main>

        
      </div>
    </div>
  );
};

export default Layout;
