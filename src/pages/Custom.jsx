import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Plus, Calendar, FileText, IndianRupee, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';
import { Modal } from '../components/ui/Modal';
import { ResetArchivesButton } from '../components/ui/ResetArchivesButton';
import { moveToTrash } from '../firebase/trash';
import gsap from 'gsap';

export const Custom = () => {
  const [customBills, setCustomBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isReadOnly } = useAuthContext();
  const pageRef = useRef(null);

  // Form states
  const [billNo, setBillNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'customBills'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(bill => bill.isDeleted !== true);
      setCustomBills(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.page-header', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 });
      tl.fromTo('.search-block', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
      tl.fromTo('.table-block', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const handleResetArchives = async () => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    try {
      const updatePromises = customBills.map(bill => 
        updateDoc(doc(db, 'customBills', bill.id), {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          originalCollection: 'customBills'
        })
      );
      await Promise.all(updatePromises);
      toast.success('Archives moved to Recycle Bin');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset archives');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    try {
      await moveToTrash('customBills', id);
      toast.success('Custom bill moved to Recycle Bin');
    } catch (error) {
      toast.error('Failed to delete custom bill');
    }
  };

  const handleCreateCustomBill = async (e) => {
    e.preventDefault();
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    if (!billNo || !customerName || !amount) {
      return toast.error('Please fill in all required fields');
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'customBills'), {
        billNo: billNo.trim(),
        customerName: customerName.trim(),
        description: description.trim(),
        amount: parseFloat(amount) || 0,
        isDeleted: false,
        originalCollection: 'customBills',
        createdAt: serverTimestamp()
      });
      toast.success('Custom bill recorded successfully');
      setIsModalOpen(false);
      // Reset form
      setBillNo('');
      setCustomerName('');
      setDescription('');
      setAmount('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to record custom bill');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBills = customBills.filter(b => 
    (b.billNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-text-muted font-mono uppercase tracking-[0.2em] text-[0.75rem]">Accessing Custom Archives...</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 page-header">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase tracking-wider">Custom Billings</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-text-muted mt-1 uppercase">Miscellaneous client invoices and custom protocols</p>
        </div>
        <div className="flex items-center gap-4">
          <ResetArchivesButton onConfirm={handleResetArchives} subtitle="This will move all custom billing records to the Recycle Bin." />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-[46px] px-8 rounded-xl bg-[#FF6A00] text-white font-black text-[0.7rem] uppercase tracking-widest shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all flex items-center gap-2 admin-btn-hover cursor-pointer"
          >
            <Plus size={18} /> Create Custom Bill
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-8 rounded-[24px] bg-secondary/80 backdrop-blur-md border border-border/50 search-block shadow-lg">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search custom log registry by entity or invoice number..."
            className="w-full bg-primary/40 border border-border/50 rounded-xl py-4.5 pl-14 pr-6 text-[0.875rem] font-body font-[400] text-white placeholder:text-text-muted/60 outline-none focus:border-accent focus:shadow-glow transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 overflow-hidden table-block shadow-lg">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/20 border-b border-border/50">
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em]">LOG ID</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em]">TIMESTAMP</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em]">CLIENT ENTITY</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em]">DESCRIPTION</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em] text-right">VALUE</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em] text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="group hover:bg-primary/25 transition-all">
                  <td className="p-8">
                    <span className="font-mono font-[700] text-[0.875rem] text-white group-hover:text-accent transition-colors">#{bill.billNo}</span>
                  </td>
                  <td className="p-8">
                    <span className="font-mono font-[400] text-[0.78rem] text-white/70 flex items-center gap-2">
                      <Calendar size={14} className="text-accent" /> {formatDate(bill.createdAt || bill.date)}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="font-heading font-[600] text-[0.875rem] text-white uppercase">{bill.customerName}</div>
                  </td>
                  <td className="p-8">
                    <span className="font-body text-[0.78rem] text-white/60">{bill.description || '-'}</span>
                  </td>
                  <td className="p-8 text-right font-mono font-[700] text-[0.875rem] text-white">
                    ₹{bill.amount.toLocaleString()}
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => handleDelete(bill.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all admin-btn-hover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <div className="space-y-4 opacity-15">
                      <FileText size={48} className="mx-auto" />
                      <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white">No Custom Records Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Custom Bill Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Custom Bill">
        <form onSubmit={handleCreateCustomBill} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[0.62rem] font-heading font-black uppercase tracking-[0.16em] text-text-muted block">Invoice Number *</label>
            <input 
              type="text" 
              placeholder="e.g. C0001"
              className="w-full px-5 h-[48px] rounded-xl outline-none font-body font-[700] text-[0.82rem] bg-primary/40 border border-border/50 text-white placeholder:text-text-muted/60 focus:border-accent transition-all"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[0.62rem] font-heading font-black uppercase tracking-[0.16em] text-text-muted block">Customer Name *</label>
            <input 
              type="text" 
              placeholder="Enter Customer Name"
              className="w-full px-5 h-[48px] rounded-xl outline-none font-body font-[700] text-[0.82rem] bg-primary/40 border border-border/50 text-white placeholder:text-text-muted/60 focus:border-accent transition-all"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[0.62rem] font-heading font-black uppercase tracking-[0.16em] text-text-muted block">Description</label>
            <textarea 
              placeholder="Enter billing description..."
              className="w-full p-5 h-[100px] rounded-xl outline-none font-body font-[700] text-[0.82rem] bg-primary/40 border border-border/50 text-white placeholder:text-text-muted/60 focus:border-accent transition-all resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[0.62rem] font-heading font-black uppercase tracking-[0.16em] text-text-muted block">Billing Amount (₹) *</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full pl-10 pr-5 h-[48px] rounded-xl outline-none font-mono font-[700] text-[0.82rem] bg-primary/40 border border-border/50 text-white placeholder:text-text-muted/60 focus:border-accent transition-all"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[0.8rem]"><IndianRupee size={14} /></span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-[50px] rounded-xl bg-transparent border border-white/20 text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 h-[50px] rounded-xl bg-accent text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-primary shadow-glow hover:bg-accent/85 hover:translate-y-[-1px] transition-all flex items-center justify-center"
            >
              {isSaving ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div> : 'Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Custom;
