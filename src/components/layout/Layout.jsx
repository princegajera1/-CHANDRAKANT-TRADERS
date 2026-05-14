import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useBills } from '../../hooks/useBills';
import { Menu, Bell, Search as SearchIcon, AlertTriangle, Package, Check, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Layout = ({ children }) => {
  const { profile } = useAuthContext();
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

  // Notification badge logic
  useEffect(() => {
    const lastSeenCount = parseInt(localStorage.getItem('lastSeenLowStockCount') || '0', 10);
    // Show dot if the current low stock count is different/greater than what was last seen
    if (lowStockProducts.length > 0 && lowStockProducts.length !== lastSeenCount && !showNotifications) {
      setHasUnread(true);
    }
  }, [lowStockProducts.length, showNotifications]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasUnread(false);
      localStorage.setItem('lastSeenLowStockCount', lowStockProducts.length.toString());
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

  return (
    <div className="min-h-screen bg-[#080C14] text-white selection:bg-[#FF6A00] selection:text-white font-body overflow-x-hidden">
      {/* HEADER */}
      <header className="h-[64px] fixed top-0 left-0 right-0 z-[1000] px-4 lg:px-8 bg-[#080C14]/90 backdrop-blur-[20px] border-b border-white/[0.05] flex items-center justify-between no-print transition-all duration-300 animate-header-entrance">
          
          {/* LEFT: Branding */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl lg:hidden transition-all active:scale-95 text-[#FF6A00] bg-[#FF6A00]/10 border border-[#FF6A00]/20"
            >
              <Menu size={22} />
            </button>
            
            <div className="flex items-center flex-shrink-0 whitespace-nowrap overflow-visible group cursor-pointer" onClick={() => navigate('/dashboard')} style={{ gap: '10px' }}>
              <div className="flex-shrink-0 w-[40px] h-[40px] rounded-[10px] bg-[#FF6A00] flex items-center justify-center text-white font-body font-[800] text-[0.85rem] shadow-[0_8px_20px_rgba(255,106,0,0.3)] group-hover:scale-105 transition-transform duration-300">CT</div>
              <div className="hidden sm:block">
                <h1 className="whitespace-nowrap font-heading font-[800] text-[0.95rem] uppercase tracking-normal" style={{ overflow: 'visible', textOverflow: 'clip' }}>
                  <span className="text-white">CHANDRAKANT</span> <span className="text-[#FF6A00]">ADMIN</span>
                </h1>
                <p className="text-white/[0.38] whitespace-nowrap font-body font-[500] text-[0.58rem] uppercase tracking-[0.18em]">MANAGEMENT SUITE</p>
              </div>
            </div>
          </div>
          
          {/* RIGHT: Actions (Change 2 cleanup - no search) */}
          <div className="flex items-center gap-6">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={handleNotificationClick}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative ${showNotifications ? 'bg-[#FF6A00]/10 text-[#FF6A00] shadow-[0_0_20px_rgba(255,106,0,0.1)]' : 'hover:bg-white/5 text-white/50 hover:text-white border border-transparent hover:border-white/10'}`}
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
                <div className="absolute right-0 mt-4 w-[350px] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border bg-[#0D1220] border-white/10 p-4 z-50 animate-dropdown-entrance">
                  <div className="flex items-center justify-between mb-4 px-1 pb-3 border-b border-white/5">
                    <h4 className="text-[0.75rem] font-black uppercase tracking-[0.2em] text-[#FF6A00]">System Alerts</h4>
                    <span className="text-[0.65rem] font-bold text-white/30 uppercase tracking-widest">{lowStockProducts.length} Items</span>
                  </div>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map(p => (
                        <div key={p.id} onClick={() => navigate(`/inventory?edit=${p.id}`)} className="p-3.5 rounded-xl flex items-start gap-4 cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <p className="text-[0.85rem] font-bold text-white leading-tight mb-1 truncate max-w-[200px]">{p.name}</p>
                            <p className="text-[0.7rem] font-black text-red-500/80 uppercase tracking-widest">Inventory Depleted: {p.currentQty}</p>
                            <p className="text-[0.6rem] font-bold text-white/20 mt-2 uppercase tracking-tighter">Action Required Immediate</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Check size={32} className="mx-auto mb-4 text-[#10B981] opacity-20" />
                        <p className="text-[0.75rem] font-black uppercase tracking-[0.2em] text-white/20">All Systems Nominal</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-4 cursor-pointer p-1.5 pr-5 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF8C38] flex items-center justify-center text-white font-heading font-black text-xl shadow-[0_8px_15px_rgba(255,106,0,0.2)] group-hover:rotate-6 transition-transform">
                {profile?.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[0.8rem] font-[600] font-body text-white leading-none mb-1.5 group-hover:text-[#FF6A00] transition-colors">{profile?.name || 'PRINCE'}</p>
                <p className="text-[0.65rem] font-[400] font-body text-white/40 uppercase tracking-[0.08em]">SYSTEM OWNER</p>
              </div>
            </div>
          </div>
          
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="lg:ml-[260px] pt-[64px] flex flex-col min-h-[100vh] relative z-10">
        
        {/* MAIN CONTENT WRAPPER */}
        <main className="p-8 lg:p-10 flex-1 w-full relative z-10 overflow-x-hidden">
          {children}
        </main>
        
      </div>
    </div>
  );
};

export default Layout;
