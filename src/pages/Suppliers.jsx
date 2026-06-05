import React, { useState } from 'react';
import { useSuppliers } from '../hooks/useSuppliers';
import { addSupplier, updateSupplier } from '../firebase/suppliers';
import { moveToTrash } from '../firebase/trash';
import { Search, Plus, Phone, MapPin, Edit2, Trash2, Truck, Users, TrendingUp, Wallet } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { ResetArchivesButton } from '../components/ui/ResetArchivesButton';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';

const Suppliers = () => {
  const { suppliers, loading } = useSuppliers();
  const { isReadOnly } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', contactPerson: '', role: '', phone: '', 
    email: '', city: '', brand: '', gstin: '', 
    accountNumber: '', ifsc: '', address: '' 
  });

  const resetForm = () => {
    setFormData({ 
      name: '', contactPerson: '', role: '', phone: '', 
      email: '', city: '', brand: '', gstin: '', 
      accountNumber: '', ifsc: '', address: '' 
    });
    setEditingSupplier(null);
  };

  const handleEditClick = (supplier) => {
    setFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      role: supplier.role || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      city: supplier.city || '',
      brand: supplier.brand || '',
      gstin: supplier.gstin || '',
      accountNumber: supplier.accountNumber || '',
      ifsc: supplier.ifsc || '',
      address: supplier.address || ''
    });
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        toast.success('Supplier profile updated');
      } else {
        await addSupplier(formData);
        toast.success('New supplier enlisted');
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
        await moveToTrash('suppliers', isDeleting);
        toast.success('Supplier moved to Recycle Bin');
        setIsDeleting(null);
      } catch (error) {
        toast.error('Failed to move supplier to Recycle Bin');
      }
    }
  };

  const handleResetArchives = async () => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    try {
      const activeSuppliers = suppliers.filter(s => s.isDeleted !== true);
      const updatePromises = activeSuppliers.map(supplier => 
        updateDoc(doc(db, 'suppliers', supplier.id), {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          originalCollection: 'suppliers'
        })
      );
      await Promise.all(updatePromises);
      toast.success('Archives moved to Recycle Bin');
    } catch (err) {
      console.error(err);
      toast.error('Failed to move archives to Recycle Bin');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.phone || '').includes(searchTerm) ||
    (s.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Syncing Supply Chain Matrix...</div>;

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-page-entrance">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Supply Chain Core</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Manufacturer network and logistics intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <ResetArchivesButton onConfirm={handleResetArchives} subtitle="This will move all supplier records to the Recycle Bin." />
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="h-[46px] px-8 rounded-xl bg-[#FF6A00] text-white font-black text-[0.7rem] uppercase tracking-widest shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all flex items-center gap-2 admin-btn-hover cursor-pointer"
          >
            <Plus size={18} /> Enlist New Supplier
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] animate-page-entrance" style={{ animationDelay: '0.15s' }}>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search network by corporate identity or contact signature..."
            className="w-full bg-[#080C14] border border-white/10 rounded-xl py-4 pl-14 pr-6 text-[0.9rem] font-bold text-white placeholder:text-white/20 outline-none focus:border-[#FF6A00] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
        {filteredSuppliers.map((s, i) => (
          <div 
            key={s.id} 
            className="p-8 rounded-[32px] bg-[#0D1220] border border-white/[0.05] hover:border-[#FF6A00]/20 transition-all group animate-card-entrance relative overflow-hidden"
            style={{ animationDelay: `${(i + 3) * 0.05}s` }}
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-14 h-14 bg-white/5 text-[#FF6A00] rounded-2xl flex items-center justify-center group-hover:bg-[#FF6A00]/10 transition-all">
                <Truck size={28} />
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg font-body font-[700] text-[0.6rem] uppercase tracking-[0.14em] bg-white/5 text-white/40 border border-white/10">
                  {s.brand || 'MULTI-BRAND'}
                </span>
                <button 
                  onClick={() => handleEditClick(s)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/20 hover:text-white hover:bg-[#FF6A00] transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => setIsDeleting(s.id)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/20 hover:text-white hover:bg-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-1 mb-8 relative z-10">
              <h3 className="font-heading font-[700] text-[0.95rem] text-white uppercase truncate group-hover:text-[#FF6A00] transition-colors">{s.name}</h3>
              <p className="font-body font-[400] text-[0.65rem] text-white/[0.38] uppercase tracking-[0.1em] mt-1">
                {s.contactPerson || 'Authorized Rep'} • {s.role || 'Logistics Partner'}
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-3 font-body font-[400] text-[0.78rem] text-white/[0.52]">
                <Phone size={14} className="text-[#FF6A00]" /> {s.phone || 'N/A'}
              </div>
              <div className="flex items-center gap-3 font-body font-[400] text-[0.78rem] text-white/[0.52] truncate">
                <MapPin size={14} className="text-[#FF6A00] shrink-0" /> {s.city || 'Global Location'}
              </div>
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <Truck size={120} />
            </div>
          </div>
        ))}
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      >
        <form className="space-y-6 p-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Supplier Name *</label>
            <input 
              className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Brand</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Role</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Phone</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Email</label>
              <input 
                type="email"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">City</label>
            <input 
              className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
              value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} 
            />
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-[56px] rounded-xl bg-transparent border border-white/20 text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" className="flex-1 h-[56px] rounded-xl bg-[#FF6A00] text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all admin-btn-hover">Save Changes</button>
          </div>
        </form>
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

export default Suppliers;
