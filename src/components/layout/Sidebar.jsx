import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, PlusSquare, FileText, 
  Users, Truck, BarChart3, Settings, LogOut, Trash2, MessageSquare
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: PlusSquare, label: 'New Bill', path: '/new-bill' },
    { icon: FileText, label: 'Terminal Archives', path: '/bills' },
    { icon: Users, label: 'Customer Network', path: '/customers' },
    { icon: Truck, label: 'Supply Chain', path: '/suppliers' },
    { icon: BarChart3, label: 'Intelligence', path: '/reports' },
    { icon: MessageSquare, label: 'Inquiries Hub', path: '/inquiries' },
    { icon: Trash2, label: 'Recycle Bin', path: '/trash' },
    { icon: Settings, label: 'System Settings', path: '/settings' },
  ];

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/login');
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
        <div className="flex flex-col h-full py-8">

          {/* Navigation */}
          <div className="px-8 mt-2 mb-4">
            <span className="text-[0.6rem] font-[600] font-body text-white/[0.26] tracking-[0.2em] uppercase">MAIN NAVIGATION</span>
          </div>
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`
                    flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-300 group
                    animate-sidebar-stagger
                    ${isActive 
                      ? 'bg-[#FF6A00]/10 text-white border-l-[3px] border-[#FF6A00] rounded-l-none rounded-r-xl shadow-none' 
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03] border-l-[3px] border-transparent rounded-l-none rounded-r-xl'}
                  `}
                  style={{ animationDelay: `${0.35 + index * 0.05}s`, animationFillMode: 'both' }}
                >
                  <item.icon size={19} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`text-[0.7rem] uppercase tracking-[0.1em] font-body ${isActive ? 'font-[700] text-white' : 'font-[600] text-white/50'}`}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 mt-auto pt-4 border-t border-white/[0.05]">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-3.5 px-5 py-3.5 w-full transition-all duration-200 ease-in-out text-red-500/[0.55] bg-transparent hover:bg-red-500/[0.08] hover:text-red-500 border-l-[2px] border-transparent hover:border-red-500/[0.70] group"
            >
              <LogOut size={19} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[0.7rem] font-body font-[600] uppercase">LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="END YOUR SESSION?" preventClose={true}>
        <div className="flex gap-4 pt-4">
          <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-4 rounded-xl bg-transparent border border-[#FF6B00]/20 font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white/70 hover:text-white hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 transition-all admin-btn-hover">Cancel</button>
          <button onClick={handleLogoutConfirm} className="flex-1 py-4 rounded-xl bg-red-500 font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-1 transition-all admin-btn-hover">Logout</button>
        </div>
      </Modal>
    </>
  );
};
