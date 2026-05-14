import React, { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useNavigate } from 'react-router-dom';
import { addCustomer, updateCustomer } from '../firebase/customers';
import { moveToTrash } from '../firebase/trash';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { Search, UserPlus, Phone, CreditCard, ChevronRight, TrendingUp, Users, Wallet, ArrowRight, Edit2, Trash2 } from 'lucide-react';

const Customers = () => {
  const { customers, loading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statModal, setStatModal] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', phone: '', email: '', address: '', creditLimit: 0, balance: 0 
  });
  const navigate = useNavigate();

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || '').includes(searchTerm)
  );

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', creditLimit: 0, balance: 0 });
    setEditingCustomer(null);
  };

  const handleEditClick = (customer) => {
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit || 0,
      balance: customer.balance || 0
    });
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        toast.success('Client profile updated');
      } else {
        await addCustomer(formData);
        toast.success('New client enlisted');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Data synchronization failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) {
      try {
        await moveToTrash('customers', isDeleting);
        toast.success('Client moved to Recycle Bin');
        setIsDeleting(null);
      } catch (error) {
        toast.error('Failed to move client to Recycle Bin');
      }
    }
  };

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Syncing Customer Network...</div>;

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-page-entrance">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Customer Network</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Global client registry and account intelligence</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          className="h-[46px] px-8 rounded-xl bg-[#FF6A00] text-white font-black text-[0.7rem] uppercase tracking-widest shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all flex items-center gap-2 admin-btn-hover"
        >
          <UserPlus size={18} /> Enlist New Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div style={{ animationDelay: '0s' }} onClick={() => setStatModal('Total Clients')} className="cursor-pointer">
          <StatCard title="Total Clients" value={customers.length} icon={Users} color="orange" />
        </div>
        <div style={{ animationDelay: '0.08s' }} onClick={() => setStatModal('Active Exposure')} className="cursor-pointer">
          <StatCard title="Active Exposure" value={customers.reduce((acc, c) => acc + (c.balance || 0), 0)} isCurrency={true} icon={TrendingUp} color="green" />
        </div>
        <div style={{ animationDelay: '0.16s' }} onClick={() => setStatModal('Network Integrity')} className="cursor-pointer">
          <StatCard title="Network Integrity" value={customers.length > 0 ? customers.length : 0} icon={Wallet} color="blue" />
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] animate-page-entrance" style={{ animationDelay: '0.2s' }}>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search network by client identity or contact signature..."
            className="w-full bg-[#080C14] border border-white/10 rounded-xl py-4 pl-14 pr-6 text-[0.9rem] font-bold text-white placeholder:text-white/20 outline-none focus:border-[#FF6A00] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
        {filteredCustomers.map((customer, i) => (
          <div 
            key={customer.id} 
            className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05] hover:border-[#FF6A00]/20 transition-all group animate-card-entrance relative overflow-hidden"
            style={{ animationDelay: `${(i + 4) * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-8">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-body font-[800] text-[1rem] text-white group-hover:bg-[#FF6A00]/10 transition-all">
                {customer.name[0]?.toUpperCase() || 'C'}
              </div>
              <div className="text-right">
                <p className="font-body font-[600] text-[0.6rem] text-white/40 uppercase tracking-[0.18em] mb-1">EXPOSURE BALANCE</p>
                <p className={`font-heading font-[700] text-[1.25rem] leading-none ${customer.balance > 0 ? 'text-[#FF6A00]' : 'text-[#10B981]'}`}>
                  ₹{customer.balance?.toLocaleString('en-IN') || 0}
                </p>
              </div>
            </div>
            
            <div className="space-y-1 mb-8">
              <h3 className="font-heading font-[700] text-[0.95rem] text-white uppercase truncate group-hover:text-[#FF6A00] transition-colors">{customer.name}</h3>
              <div className="flex items-center gap-2 font-body font-[400] text-[0.78rem] text-white/[0.52]">
                <Phone size={14} className="text-[#FF6A00]" /> {customer.phone || 'No Contact'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="flex-1 h-[42px] rounded-xl border border-white/5 bg-white/[0.02] text-white font-black text-[0.65rem] uppercase tracking-widest flex items-center justify-center hover:bg-white/5 transition-all group-hover:border-white/10"
              >
                Access Profile <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => handleEditClick(customer)}
                className="w-[42px] h-[42px] flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-white hover:bg-blue-500 transition-all admin-btn-hover"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => setIsDeleting(customer.id)}
                className="w-[42px] h-[42px] flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-white hover:bg-red-500 transition-all admin-btn-hover"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <Users size={120} />
            </div>
          </div>
        ))}
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form className="space-y-6 p-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Full Operational Name</label>
            <input 
              className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Secure Contact Channel</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required 
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Email Designation</label>
              <input 
                type="email"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Initial Exposure</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">₹</span>
                <input 
                  type="number"
                  className="w-full h-[52px] pl-9 pr-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                  value={formData.balance} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Physical Base Address</label>
            <textarea 
              className="w-full h-[100px] p-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus resize-none placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
              value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Credit Limit</label>
            <input 
              type="number"
              className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
              value={formData.creditLimit || ''} onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} 
            />
          </div>
          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-[56px] rounded-xl bg-transparent border border-white/20 text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" className="flex-1 h-[56px] rounded-xl bg-[#FF6A00] text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all admin-btn-hover">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Stat Detail Modal */}
      <Modal isOpen={!!statModal} onClose={() => setStatModal(null)} title={statModal} maxWidth="600px">
        <div className="space-y-4">
          <p className="text-[#FF6A00] text-[0.65rem] font-black uppercase tracking-[0.2em] mb-4">Detailed View - {statModal}</p>
          <div className="overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
            {statModal === 'Total Clients' && customers.map(c => (
              <div key={c.id} className="p-4 bg-[#080C14] border border-white/5 rounded-xl mb-2 flex justify-between items-center cursor-pointer hover:border-[#FF6A00]/30 transition-all" onClick={() => { setStatModal(null); navigate(`/customers/${c.id}`); }}>
                <div>
                  <h4 className="font-bold text-white text-sm uppercase">{c.name}</h4>
                  <p className="text-white/40 text-xs">{c.phone || 'No Contact'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${c.balance > 0 ? 'text-[#FF6A00]' : 'text-green-500'}`}>₹{c.balance?.toLocaleString('en-IN') || 0}</p>
                </div>
              </div>
            ))}
            {statModal === 'Active Exposure' && customers.filter(c => c.balance > 0).map(c => (
              <div key={c.id} className="p-4 bg-[#080C14] border border-white/5 rounded-xl mb-2 flex justify-between items-center cursor-pointer hover:border-[#FF6A00]/30 transition-all" onClick={() => { setStatModal(null); navigate(`/customers/${c.id}`); }}>
                <div>
                  <h4 className="font-bold text-white text-sm uppercase">{c.name}</h4>
                  <p className="text-white/40 text-xs">{c.phone || 'No Contact'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#FF6A00]">₹{c.balance?.toLocaleString('en-IN') || 0}</p>
                  <p className="text-[#FF6A00]/50 text-[0.65rem] uppercase tracking-widest mt-1">Pending</p>
                </div>
              </div>
            ))}
            {statModal === 'Network Integrity' && customers.filter(c => c.balance <= 0).map(c => (
              <div key={c.id} className="p-4 bg-[#080C14] border border-white/5 rounded-xl mb-2 flex justify-between items-center cursor-pointer hover:border-[#FF6A00]/30 transition-all" onClick={() => { setStatModal(null); navigate(`/customers/${c.id}`); }}>
                <div>
                  <h4 className="font-bold text-white text-sm uppercase">{c.name}</h4>
                  <p className="text-white/40 text-xs">{c.phone || 'No Contact'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-500">Settled</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!isDeleting} onClose={() => setIsDeleting(null)} title="Move to Recycle Bin?">
        <div className="p-4 text-center space-y-6">
          <p className="font-body font-[400] text-[0.875rem] text-white/60 leading-relaxed sentence-case">This item will be moved to the recycle bin. You can restore it later.</p>
          <div className="flex gap-4 pt-2">
            <button onClick={() => setIsDeleting(null)} className="flex-1 h-[56px] rounded-xl bg-transparent border border-white/20 text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={handleDeleteConfirm} className="flex-1 h-[56px] rounded-xl bg-red-500 text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white shadow-lg shadow-red-500/30 hover:translate-y-[-2px] transition-all admin-btn-hover">Confirm</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
