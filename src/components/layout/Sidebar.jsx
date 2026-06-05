import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, PlusSquare, FileText, 
  Users, Truck, BarChart3, Settings, LogOut, Trash2, MessageSquare, Key, ShieldCheck,
  Home, Globe, Bell, Shield, History, Database, Box, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const Sidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { logout, user, profile, isSuperAdmin } = useAuthContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [recycleBinCount, setRecycleBinCount] = React.useState(0);

  React.useEffect(() => {
    const q1 = query(collection(db, 'bills'), where('isDeleted', '==', true));
    const q2 = query(collection(db, 'customers'), where('isDeleted', '==', true));
    const q3 = query(collection(db, 'suppliers'), where('isDeleted', '==', true));
    const q4 = query(collection(db, 'customBills'), where('isDeleted', '==', true));

    let count1 = 0;
    let count2 = 0;
    let count3 = 0;
    let count4 = 0;

    const updateCount = () => {
      setRecycleBinCount(count1 + count2 + count3 + count4);
    };

    const unsub1 = onSnapshot(q1, snap => { count1 = snap.size; updateCount(); });
    const unsub2 = onSnapshot(q2, snap => { count2 = snap.size; updateCount(); });
    const unsub3 = onSnapshot(q3, snap => { count3 = snap.size; updateCount(); });
    const unsub4 = onSnapshot(q4, snap => { count4 = snap.size; updateCount(); });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  const userRole = profile?.role || (isSuperAdmin ? 'superadmin' : 'viewer');

  const mainNavigation = [
    { icon: LayoutDashboard, label: 'DASHBOARD', path: '/dashboard', roles: ['owner', 'superadmin', 'admin', 'manager', 'staff', 'viewer'] },
    { icon: Box, label: 'INVENTORY', path: '/inventory', roles: ['owner', 'superadmin', 'admin', 'manager', 'viewer'] },
    { icon: PlusSquare, label: 'NEW BILL', path: '/new-bill', roles: ['owner', 'superadmin', 'admin', 'manager', 'staff'] },
    { icon: FileText, label: 'TERMINAL ARCHIVES', path: '/bills', roles: ['owner', 'superadmin', 'admin', 'manager', 'staff', 'viewer'] },
    { icon: FileText, label: 'CUSTOM BILLINGS', path: '/custom', roles: ['owner', 'superadmin', 'admin', 'manager', 'viewer'] },
    { icon: Users, label: 'CUSTOMER NETWORK', path: '/customers', roles: ['owner', 'superadmin', 'admin', 'manager', 'viewer'] },
    { icon: Truck, label: 'SUPPLY CHAIN', path: '/suppliers', roles: ['owner', 'superadmin', 'admin', 'manager', 'viewer'] },
    { icon: BarChart3, label: 'INTELLIGENCE', path: '/reports', roles: ['owner', 'superadmin', 'admin', 'manager', 'viewer'] },
    { icon: MessageSquare, label: 'INQUIRIES HUB', path: '/inquiries', roles: ['owner', 'superadmin', 'admin', 'manager'] },
    { icon: Trash2, label: 'RECYCLE BIN', path: '/recycle-bin', roles: ['owner', 'superadmin', 'admin'] },
  ];

  const gridNavigation = [
    { icon: Home, label: 'Shop Profile', path: '/settings', roles: ['owner', 'superadmin', 'admin', 'manager'] },
    { icon: Globe, label: 'Digital Matrix', path: '/matrix', roles: ['owner', 'superadmin', 'admin', 'manager'] },
    { icon: Bell, label: 'Alert Protocols', path: '/alerts', roles: ['owner', 'superadmin', 'admin', 'manager'] },
    { icon: Shield, label: 'Security Grid', path: '/security', roles: ['owner', 'superadmin', 'admin', 'manager'] },
    { icon: ShieldCheck, label: 'Admin Network', path: '/users', roles: ['owner', 'superadmin'] },
    { icon: History, label: 'Activity Logs', path: '/logs', roles: ['owner', 'superadmin', 'admin'] },
    { icon: Database, label: 'Data Registry', path: '/registry', roles: ['owner', 'superadmin', 'admin'] },
  ];

  const hasAccess = (item) => {
    if (isSuperAdmin) return true;
    if (item.roles && !item.roles.includes(userRole)) return false;
    return true;
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1100] lg:hidden animate-backdrop-fade"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-[#0D1B2A] border-r border-[#1E2D3D] z-[1200]
        transition-all duration-300 ease-[cubic-bezier(0.25, 0.8, 0.25, 1)]
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}
      `}>
        {/* Desktop Collapse Toggle Handle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#0D1B2A] border border-[#1E2D3D] items-center justify-center text-accent hover:bg-accent/10 hover:text-white active:scale-95 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] z-[1001]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex flex-col h-full py-6">

          {/* Header Section */}
          <div className={`px-8 mt-2 mb-4 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
            <span className="text-[0.6rem] font-[600] font-body text-[#8899A6] tracking-[0.2em] uppercase">MAIN NAVIGATION</span>
          </div>

          <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
            {mainNavigation.filter(hasAccess).map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`
                    flex items-center rounded-xl transition-all duration-300 group relative
                    ${isCollapsed ? 'justify-center py-3.5 px-0' : 'px-5 py-3.5'}
                    ${isActive 
                      ? 'bg-accent/10 text-white border-l-[3px] border-accent rounded-l-none rounded-r-xl shadow-[0_0_20px_rgba(255,107,0,0.08)]' 
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03] border-l-[3px] border-transparent rounded-l-none rounded-r-xl'}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon size={19} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-accent' : 'group-hover:scale-110 text-white/50 group-hover:text-accent'}`} />
                  <span className={`
                    text-[0.7rem] uppercase tracking-[0.1em] font-body transition-all duration-300 whitespace-nowrap
                    ${isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 ml-3.5'}
                    ${isActive ? 'font-[700] text-white' : 'font-[600] text-[#8899A6]'}`}
                  >
                    {item.label}
                  </span>
                  {item.path === '/recycle-bin' && recycleBinCount > 0 && !isCollapsed && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white font-mono text-[0.58rem] font-[800] flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                      {recycleBinCount}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Expandable Settings Section */}
            {gridNavigation.some(hasAccess) && (
              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`
                    w-full flex items-center rounded-xl transition-all duration-300 group
                    ${isCollapsed ? 'justify-center py-3.5 px-0' : 'justify-between px-5 py-3.5'}
                    ${isSettingsOpen ? 'bg-white/[0.05] text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'}
                  `}
                  title={isCollapsed ? "SYSTEM SETTINGS" : undefined}
                >
                  <div className="flex items-center">
                    <Settings size={19} className={`transition-transform duration-500 ${isSettingsOpen ? 'rotate-90 text-accent' : 'text-white/50 group-hover:text-accent'}`} />
                    <span className={`
                      text-[0.7rem] uppercase tracking-[0.1em] font-[700] transition-all duration-300 whitespace-nowrap
                      ${isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 ml-3.5'}`}
                    >
                      SYSTEM SETTINGS
                    </span>
                  </div>
                  {!isCollapsed && <ChevronDown size={16} className={`transition-transform duration-500 ${isSettingsOpen ? 'rotate-180 text-white/50' : 'text-white/30'}`} />}
                </button>

                <div className={`
                  overflow-hidden transition-all duration-500 ease-in-out
                  ${isSettingsOpen && !isCollapsed ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}
                `} style={{ maxHeight: isSettingsOpen && !isCollapsed ? '500px' : '0' }}>
                  <div className="space-y-1.5 pl-4 border-l border-white/[0.05] ml-7">
                    {gridNavigation
                      .filter(hasAccess)
                      .map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={`
                              flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group
                              ${isActive 
                                ? 'bg-accent/10 text-white border border-accent/20 shadow-[0_0_15px_rgba(255,107,0,0.05)]' 
                                : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'}
                            `}
                          >
                            <item.icon size={16} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-accent' : 'group-hover:scale-110 group-hover:text-accent'}`} />
                            <span className={`text-[0.68rem] uppercase tracking-[0.1em] font-body ${isActive ? 'font-[700] text-white' : 'font-[600] text-[#8899A6]'}`}>{item.label}</span>
                          </NavLink>
                        );
                    })}
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Logout Button */}
          <div className="px-3 pt-4 border-t border-white/[0.05]">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className={`
                flex items-center w-full transition-all duration-200 ease-in-out text-red-500/[0.4] bg-transparent hover:bg-red-500/[0.08] hover:text-red-500 border-l-[2px] border-transparent hover:border-red-500/[0.70] group
                ${isCollapsed ? 'justify-center py-3.5 px-0' : 'px-5 py-3.5'}
              `}
              title={isCollapsed ? "LOGOUT" : undefined}
            >
              <LogOut size={19} className="group-hover:-translate-x-1 transition-transform" />
              <span className={`
                text-[0.7rem] font-body font-[600] uppercase transition-all duration-300 whitespace-nowrap
                ${isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 ml-3.5'}`}
              >
                LOGOUT
              </span>
            </button>
          </div>
        </div>
      </aside>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="END YOUR SESSION?" preventClose={true}>
        <div className="flex gap-4 pt-4">
          <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-4 rounded-xl bg-transparent border border-accent/20 font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white/70 hover:text-white hover:border-accent hover:bg-accent/5 transition-all admin-btn-hover">Cancel</button>
          <button onClick={handleLogoutConfirm} className="flex-1 py-4 rounded-xl bg-[#FF3D57] font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white shadow-[0_0_20px_rgba(255,61,87,0.3)] hover:bg-red-600 hover:-translate-y-1 transition-all admin-btn-hover">Logout</button>
        </div>
      </Modal>
    </>
  );
};
