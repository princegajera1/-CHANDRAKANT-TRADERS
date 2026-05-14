import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, PlusSquare, FileText, 
  Users, Truck, BarChart3, Settings, LogOut, Trash2, MessageSquare, Key, ShieldCheck,
  Home, Globe, Bell, Shield, History, Database, Box, ChevronDown
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { logout, user, profile, isSuperAdmin } = useAuthContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  const mainNavigation = [
    { icon: LayoutDashboard, label: 'DASHBOARD', path: '/dashboard' },
    { icon: Box, label: 'INVENTORY', path: '/inventory' },
    { icon: PlusSquare, label: 'NEW BILL', path: '/new-bill' },
    { icon: FileText, label: 'TERMINAL ARCHIVES', path: '/bills' },
    { icon: Users, label: 'CUSTOMER NETWORK', path: '/customers' },
    { icon: Truck, label: 'SUPPLY CHAIN', path: '/suppliers' },
    { icon: BarChart3, label: 'INTELLIGENCE', path: '/reports' },
    { icon: MessageSquare, label: 'INQUIRIES HUB', path: '/inquiries' },
    { icon: Trash2, label: 'RECYCLE BIN', path: '/trash' },
  ];

  const gridNavigation = [
    { icon: Home, label: 'Shop Profile', path: '/settings' },
    { icon: Globe, label: 'Digital Matrix', path: '/matrix' },
    { icon: Bell, label: 'Alert Protocols', path: '/alerts' },
    { icon: Shield, label: 'Security Grid', path: '/security' },
    { icon: ShieldCheck, label: 'Admin Network', path: '/users', superAdminOnly: true },
    { icon: History, label: 'Activity Logs', path: '/logs' },
    { icon: Database, label: 'Data Registry', path: '/registry' },
  ];

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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden animate-backdrop-fade"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-[64px] left-0 h-[calc(100vh-64px)] w-[260px] min-w-[260px] bg-[#0D1220] border-r border-white/[0.05] z-[900]
        transition-transform duration-500 ease-[cubic-bezier(0.33, 1, 0.68, 1)]
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full py-6">

          {/* Header Section */}
          <div className="px-8 mt-2 mb-4">
            <span className="text-[0.6rem] font-[600] font-body text-white/[0.26] tracking-[0.2em] uppercase">MAIN NAVIGATION</span>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {mainNavigation.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`
                    flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-[#FF6A00]/10 text-white border-l-[3px] border-[#FF6A00] rounded-l-none rounded-r-xl shadow-none' 
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03] border-l-[3px] border-transparent rounded-l-none rounded-r-xl'}
                  `}
                >
                  <item.icon size={19} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`text-[0.7rem] uppercase tracking-[0.1em] font-body ${isActive ? 'font-[700] text-white' : 'font-[600] text-white/50'}`}>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Expandable Settings Section */}
            <div className="mt-4 pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`
                  w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 group
                  ${isSettingsOpen ? 'bg-white/[0.05] text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'}
                `}
              >
                <div className="flex items-center gap-3.5">
                  <Settings size={19} className={`transition-transform duration-500 ${isSettingsOpen ? 'rotate-90' : ''}`} />
                  <span className="text-[0.7rem] uppercase tracking-[0.1em] font-[700]">SYSTEM SETTINGS</span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-500 ${isSettingsOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`
                overflow-hidden transition-all duration-500 ease-in-out
                ${isSettingsOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}
              `} style={{ maxHeight: isSettingsOpen ? '500px' : '0' }}>
                <div className="space-y-1.5 pl-4 border-l-2 border-white/[0.05] ml-7">
                  {gridNavigation
                    .filter(item => !item.superAdminOnly || isSuperAdmin)
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
                              ? 'bg-[#FF6A00]/10 text-white border border-[#FF6A00]/20' 
                              : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'}
                          `}
                        >
                          <item.icon size={16} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-[#FF6A00]' : 'group-hover:scale-110 group-hover:text-[#FF6A00]'}`} />
                          <span className={`text-[0.68rem] uppercase tracking-[0.1em] font-body ${isActive ? 'font-[700] text-white' : 'font-[600]'}`}>{item.label}</span>
                        </NavLink>
                      );
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="px-4 pt-4 border-t border-white/[0.05]">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-3.5 px-5 py-3.5 w-full transition-all duration-200 ease-in-out text-red-500/[0.4] bg-transparent hover:bg-red-500/[0.08] hover:text-red-500 border-l-[2px] border-transparent hover:border-red-500/[0.70] group"
            >
              <LogOut size={19} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[0.7rem] font-body font-[600] uppercase">LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="END YOUR SESSION?" preventClose={true}>
        <div className="flex gap-4 pt-4">
          <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-4 rounded-xl bg-transparent border border-[#FF6A00]/20 font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white/70 hover:text-white hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-all admin-btn-hover">Cancel</button>
          <button onClick={handleLogoutConfirm} className="flex-1 py-4 rounded-xl bg-red-500 font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:bg-red-600 hover:-translate-y-1 transition-all admin-btn-hover">Logout</button>
        </div>
      </Modal>
    </>
  );
};
