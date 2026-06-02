import React, { useState, useEffect } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { addCustomer, updateCustomer } from '../firebase/customers';
import { moveToTrash } from '../firebase/trash';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { Search, UserPlus, Phone, CreditCard, ChevronRight, TrendingUp, Users, Wallet, ArrowRight, Edit2, Trash2, Eye } from 'lucide-react';
import { validateGSTIN, validatePAN, extractPANFromGSTIN } from '../utils/gstValidation';

const Customers = () => {
  const { customers, loading } = useCustomers();
  const { isReadOnly } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', creditLimit: 0, balance: 0, transporter: '', bankName: '', accountNumber: '', ifscCode: '', notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.gstin || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', vehicleNo: '', gstin: '', pan: '', creditLimit: 0, balance: 0, transporter: '', bankName: '', accountNumber: '', ifscCode: '', notes: '' });
    setFormErrors({});
    setEditingCustomer(null);
  };

  const handleEditClick = (customer) => {
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      vehicleNo: customer.vehicleNo || '',
      gstin: customer.gstin || '',
      pan: customer.pan || '',
      transporter: customer.transporter || '',
      bankName: customer.bankName || '',
      accountNumber: customer.accountNumber || '',
      ifscCode: customer.ifscCode || '',
      creditLimit: customer.creditLimit || 0,
      balance: customer.balance || 0,
      notes: customer.notes || ''
    });
    setFormErrors({});
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleGSTINChange = (e) => {
    const val = e.target.value.toUpperCase();
    const newFormData = { ...formData, gstin: val };
    if (val.length >= 15) {
      newFormData.pan = extractPANFromGSTIN(val);
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }

    const errors = {};
    if (!formData.name) errors.name = 'Required';
    if (!formData.phone) errors.phone = 'Required';
    if (!formData.address) errors.address = 'Required';
    if (!formData.vehicleNo) errors.vehicleNo = 'Required';
    
    if (formData.gstin) {
      const gstVal = validateGSTIN(formData.gstin);
      if (!gstVal.valid) errors.gstin = gstVal.error;
      if (!formData.pan) errors.pan = 'PAN is required when GSTIN is provided';
    }
    
    if (formData.pan) {
      const panVal = validatePAN(formData.pan);
      if (!panVal.valid) errors.pan = panVal.error;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        toast.success('Customer profile updated');
      } else {
        await addCustomer({ ...formData, totalBillsCount: 0, lastBillDate: null });
        toast.success('New customer added');
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
        toast.success('Customer moved to Recycle Bin');
        setIsDeleting(null);
      } catch (error) {
        toast.error('Failed to move customer to Recycle Bin');
      }
    }
  };

  const safeFormatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      {/* Controls */}
      <div className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] animate-page-entrance" style={{ animationDelay: '0.1s' }}>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by customer name, phone, or GSTIN..."
            className="w-full bg-[#080C14] border border-white/10 rounded-xl py-4 pl-14 pr-6 text-[0.9rem] font-bold text-white placeholder:text-white/20 outline-none focus:border-[#FF6A00] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-[32px] bg-[#0D1220] border border-white/[0.05] overflow-hidden animate-page-entrance" style={{ animationDelay: '0.2s' }}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/[0.05]">
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em]">Customer Name</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em]">Phone Number</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em]">Vehicle Number</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em]">GSTIN</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-center">Total Bills</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-right">Lifetime Billed</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-right">Outstanding Balance</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-center">Last Bill Date</th>
                <th className="p-6 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredCustomers.map((customer, i) => (
                <tr 
                  key={customer.id} 
                  className="group hover:bg-white/[0.02] transition-all animate-row-entrance"
                  style={{ animationDelay: `${i * 0.025}s` }}
                >
                  <td className="p-6">
                    <span className="font-body font-[700] text-[0.875rem] text-white uppercase group-hover:text-[#FF6A00] transition-colors">{customer.name}</span>
                  </td>
                  <td className="p-6">
                    <span className="font-body font-[400] text-[0.8rem] text-white/[0.6]">{customer.phone || '-'}</span>
                  </td>
                  <td className="p-6">
                    <span className="font-body font-[400] text-[0.8rem] text-white/[0.6] uppercase">{customer.vehicleNo || '-'}</span>
                  </td>
                  <td className="p-6">
                    {customer.gstin ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-body font-[600] text-[0.7rem] text-white">{customer.gstin}</span>
                        <span className="px-2 py-0.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded text-[0.55rem] font-black uppercase tracking-widest">GST Registered</span>
                      </div>
                    ) : (
                      <span className="font-body font-[400] text-[0.8rem] text-white/[0.3]">-</span>
                    )}
                  </td>
                  <td className="p-6 text-center">
                    <span className="font-body font-[600] text-[0.8rem] text-white/[0.6]">{customer.totalBillsCount || 0}</span>
                  </td>
                  <td className="p-6 text-right font-mono font-[700] text-[0.9rem] text-[#00D4FF]">
                    ₹{(customer.totalPurchased || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-6 text-right">
                    <div className={`font-heading font-[700] text-[0.95rem] ${customer.balance > 0 ? 'text-[#FF6A00]' : 'text-[#10B981]'}`}>
                      ₹{(customer.balance || 0).toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="font-body font-[400] text-[0.75rem] text-white/[0.5]">{safeFormatDate(customer.lastBillDate)}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => navigate(`/customers/${customer.id}`)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-[#10B981] hover:border-[#10B981]/50 transition-all admin-btn-hover" title="View Profile"><Eye size={16} /></button>
                      <button onClick={() => navigate('/new-bill')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-[#FF6A00] hover:border-[#FF6A00]/50 transition-all admin-btn-hover" title="New Bill"><ArrowRight size={16} /></button>
                      <button onClick={() => handleEditClick(customer)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-blue-500 hover:border-blue-500/50 transition-all admin-btn-hover" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => setIsDeleting(customer.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all admin-btn-hover" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center font-body font-[400] text-[0.8rem] text-white/30 uppercase tracking-widest">No customers found in registry.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        maxWidth="800px"
      >
        <form className="space-y-6 p-2" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Customer Full Name *</label>
              <input 
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border ${formErrors.name ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); setFormErrors({...formErrors, name: null}); }} 
              />
              {formErrors.name && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Phone Number *</label>
              <input 
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border ${formErrors.phone ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={formData.phone} onChange={e => { setFormData({...formData, phone: e.target.value}); setFormErrors({...formErrors, phone: null}); }} 
              />
              {formErrors.phone && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Email Address (Optional)</label>
              <input 
                type="email"
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Vehicle Number *</label>
              <input 
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.vehicleNo ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={formData.vehicleNo} onChange={e => { setFormData({...formData, vehicleNo: e.target.value}); setFormErrors({...formErrors, vehicleNo: null}); }} 
                placeholder="e.g. GJ-18-AB-1234"
              />
              {formErrors.vehicleNo && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.vehicleNo}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Address *</label>
            <textarea 
              className={`w-full h-[80px] p-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border ${formErrors.address ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus resize-none`}
              value={formData.address} onChange={e => { setFormData({...formData, address: e.target.value}); setFormErrors({...formErrors, address: null}); }} 
            />
            {formErrors.address && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">GSTIN / GST Number (Optional)</label>
              <input 
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.gstin ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={formData.gstin} onChange={handleGSTINChange} 
                placeholder="e.g. 24ABCDE1234F1Z5"
              />
              {formErrors.gstin ? (
                <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.gstin}</p>
              ) : (
                <p className="text-white/30 text-[0.65rem] ml-1 italic">Leave blank if customer does not have GST</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">PAN Number {formData.gstin && '*'}</label>
              <input 
                className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.pan ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus`}
                value={formData.pan} onChange={e => { setFormData({...formData, pan: e.target.value.toUpperCase()}); setFormErrors({...formErrors, pan: null}); }} 
                placeholder="e.g. ABCDE1234F"
              />
              {formErrors.pan ? (
                <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.pan}</p>
              ) : (
                <p className="text-white/30 text-[0.65rem] ml-1 italic">Required if GSTIN is provided</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Opening Balance (₹)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">₹</span>
                <input 
                  type="number"
                  className="w-full h-[52px] pl-9 pr-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                  value={formData.balance} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Transporter (Optional)</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={formData.transporter} onChange={e => setFormData({...formData, transporter: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Bank Name (Optional)</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Account Number (Optional)</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">IFSC Code (Optional)</label>
              <input 
                className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
                value={formData.ifscCode} onChange={e => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Special Notes / Remarks (Optional)</label>
            <textarea 
              className="w-full h-[80px] p-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus resize-none"
              value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="e.g. Special pricing, preferred delivery agent, credit guidelines..."
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

export default Customers;
