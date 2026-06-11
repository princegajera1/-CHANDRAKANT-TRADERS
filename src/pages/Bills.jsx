import React, { useState, useEffect, useRef } from 'react';
import { useBills } from '../hooks/useBills';
import { Printer, Eye, Link as LinkIcon, Download, Search, Calendar, Trash2, Share2, AlertTriangle, Clock, Copy, PlusSquare, Edit2 } from 'lucide-react';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { cancelBill, updateBill } from '../firebase/bills';
import { moveToTrash } from '../firebase/trash';
import { generateBillPDF } from '../utils/generatePDF';
import { shareOnWhatsApp } from '../utils/whatsapp';
import { db } from '../firebase/config';
import { useAuthContext } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Modal } from '../components/ui/Modal';
import { PrintInvoice } from '../components/ui/PrintInvoice';
import { ResetArchivesButton } from '../components/ui/ResetArchivesButton';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

const Bills = () => {
  const { bills, loading } = useBills();
  const { isReadOnly, isSuperAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [shopSettings, setShopSettings] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [sharingBillId, setSharingBillId] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [editGrandTotal, setEditGrandTotal] = useState('');
  const [editAmountPaid, setEditAmountPaid] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleEditSave = async () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    const newGrandTotal = parseFloat(editGrandTotal);
    const newAmountPaid = parseFloat(editAmountPaid);
    
    if (isNaN(newGrandTotal) || newGrandTotal < 0) {
      toast.error('Please enter a valid grand total');
      return;
    }
    if (isNaN(newAmountPaid) || newAmountPaid < 0) {
      toast.error('Please enter a valid amount paid');
      return;
    }
    
    setIsSavingEdit(true);
    try {
      await updateBill(editingBill.id, newGrandTotal, newAmountPaid);
      toast.success('Bill updated successfully');
      setEditingBill(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update bill');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetArchives = async () => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    try {
      const activeBills = bills.filter(b => b.isDeleted !== true);
      const updatePromises = activeBills.map(bill => 
        updateDoc(doc(db, 'bills', bill.id), {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          originalCollection: 'bills'
        })
      );
      await Promise.all(updatePromises);
      toast.success('Archives moved to Recycle Bin');
    } catch (err) {
      console.error(err);
      toast.error('Failed to move archives to Recycle Bin');
    }
  };

  const pageRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'shop'));
      if (snap.exists()) setShopSettings(snap.data());
    };
    fetchSettings();
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.page-header', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 }
      );
      tl.fromTo('.search-block', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.4'
      );
      tl.fromTo('.table-block', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      );
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  // GSAP stagger animations on row renders/search changes
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('tbody tr', 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.02, duration: 0.4, ease: 'power3.out' }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [searchTerm, startDate, endDate, loading]);

  const filteredBills = bills.filter(b => {
    const matchesSearch = (b.billNo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (startDate || endDate) {
      const billDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      if (isNaN(billDate.getTime())) return true;
      
      const yyyy = billDate.getFullYear();
      const mm = String(billDate.getMonth() + 1).padStart(2, '0');
      const dd = String(billDate.getDate()).padStart(2, '0');
      const formattedBillDate = `${yyyy}-${mm}-${dd}`;
      
      if (startDate && formattedBillDate < startDate) return false;
      if (endDate && formattedBillDate > endDate) return false;
    }
    
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    if (isDeleting) {
      try {
        await cancelBill(isDeleting.id); // Cancel bill to reverse stock/balance
        await moveToTrash('bills', isDeleting.id); // Move to trash
        toast.success('Invoice moved to Recycle Bin');
        setIsDeleting(null);
      } catch (error) {
        toast.error('Void operation failed');
      }
    }
  };

  const openViewModal = (bill) => {
    setSelectedBill(bill);
    setIsViewModalOpen(true);
  };

  const safeFormatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const safeFormatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handlePrint = (bill) => {
    setSelectedBill(bill);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleWhatsAppShare = async (e, bill) => {
    e.stopPropagation();
    setSharingBillId(bill.id);
    try {
      await shareOnWhatsApp(bill, shopSettings);
    } catch (err) {
      console.error(err);
    } finally {
      setSharingBillId(null);
    }
  };

  const numberToWords = (num) => {
    if (!num) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
    return str;
  };

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
      <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      <p className="text-text-muted font-mono uppercase tracking-[0.2em] text-[0.75rem]">Accessing Terminal Archives...</p>
    </div>
  );

  return (
    <div ref={pageRef} className="space-y-10 pb-16">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 page-header">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase tracking-wider">Terminal Archives</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-text-muted mt-1 uppercase">Authorized invoice logs and financial history</p>
        </div>
        {isSuperAdmin && (
          <ResetArchivesButton onConfirm={handleResetArchives} subtitle="This will move all invoice records to the Recycle Bin." />
        )}
      </div>

      <div className="p-8 rounded-[24px] bg-secondary/80 backdrop-blur-md border border-border/50 search-block">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
          <div className="relative lg:col-span-6 group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by Invoice Number or Client Identity..."
              className="w-full bg-primary/40 border border-border/50 rounded-xl py-4.5 pl-14 pr-6 text-[0.875rem] font-body font-[400] text-white placeholder:text-text-muted/60 outline-none focus:border-accent focus:shadow-glow transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative lg:col-span-2 group flex items-center bg-primary/40 border border-border/50 rounded-xl px-4 py-2.5 w-full">
            <div className="flex flex-col w-full">
              <span className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">From Date</span>
              <input
                type="date"
                className="bg-transparent text-[0.85rem] text-white font-mono font-bold outline-none cursor-pointer w-full mt-0.5"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="relative lg:col-span-2 group flex items-center bg-primary/40 border border-border/50 rounded-xl px-4 py-2.5 w-full">
            <div className="flex flex-col w-full">
              <span className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">To Date</span>
              <input
                type="date"
                className="bg-transparent text-[0.85rem] text-white font-mono font-bold outline-none cursor-pointer w-full mt-0.5"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="lg:col-span-2 flex gap-2 w-full h-full min-h-[50px]">
            <button
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full py-4.5 rounded-xl bg-primary/40 border border-border/50 text-[0.7rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-center gap-1.5"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] bg-secondary/80 backdrop-blur-md border border-border/50 overflow-hidden table-block shadow-lg">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/20 border-b border-border/50">
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em]">LOG ID</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em]">TIMESTAMP</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em]">CLIENT ENTITY</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em] text-right">VALUE</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em] text-center">PROTOCOL</th>
                <th className="p-8 font-heading font-[600] text-[0.65rem] text-text-muted uppercase tracking-[0.14em] text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredBills.map((bill) => (
                <tr 
                  key={bill.id} 
                  onClick={() => openViewModal(bill)}
                  className={`group hover:bg-primary/25 cursor-pointer transition-all ${bill.status === 'cancelled' ? 'opacity-30' : ''}`}
                >
                  <td className="p-8">
                    <span className="font-mono font-[700] text-[0.875rem] text-white group-hover:text-accent transition-colors">#{bill.billNo}</span>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-[400] text-[0.78rem] text-white/70 flex items-center gap-2">
                        <Calendar size={14} className="text-accent" /> {safeFormatDate(bill.createdAt)}
                      </span>
                      <span className="font-mono font-[400] text-[0.72rem] text-text-muted ml-[22px] flex items-center gap-1.5">
                        <Clock size={12} className="text-text-muted/60" /> {safeFormatTime(bill.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="font-heading font-[600] text-[0.875rem] text-white uppercase">{bill.customerName}</div>
                    <div className="font-mono font-[400] text-[0.7rem] text-text-muted mt-1 tracking-widest uppercase">{bill.customerPhone}</div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="font-mono font-[700] text-[0.95rem] text-accent">
                      ₹{bill.grandTotal.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <div className="flex flex-col items-center gap-1.5 justify-center">
                      <span className={`px-4 py-1.5 rounded-lg font-mono font-[700] text-[0.62rem] uppercase tracking-[0.08em] border ${bill.paymentMode === 'Credit' ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' : 'bg-accent-green/10 text-accent-green border-accent-green/20'}`}>
                        {bill.paymentMode}
                      </span>
                      {bill.status === 'cancelled' && (
                        <span className="px-3 py-1 rounded-lg font-mono font-[700] text-[0.55rem] uppercase tracking-[0.08em] border bg-accent-red/10 text-accent-red border-accent-red/20 flex items-center gap-1">
                          <AlertTriangle size={10} /> Voided
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex justify-end gap-3 no-print" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); openViewModal(bill); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/40 border border-border/50 text-text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all" title="Quick View"><Eye size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handlePrint(bill); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/40 border border-border/50 text-text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all" title="Direct Print"><Printer size={18} /></button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toast.success('Generating PDF...');
                          generateBillPDF(bill, shopSettings); 
                        }} 
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/40 border border-border/50 text-text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
                        title="Download PDF"
                      ><Download size={18} /></button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate('/new-bill', { state: { duplicateBill: bill } }); 
                        }} 
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/40 border border-border/50 text-text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
                        title="Duplicate Bill (Pre-filled)"
                      ><Copy size={18} /></button>
                      <button 
                        onClick={(e) => handleWhatsAppShare(e, bill)}
                        disabled={sharingBillId === bill.id}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/40 border border-border/50 text-text-muted hover:text-accent-green hover:border-accent-green/40 hover:bg-accent-green/5 transition-all disabled:opacity-50"
                        title="Share on WhatsApp"
                      >
                        {sharingBillId === bill.id ? (
                          <div className="w-4 h-4 border-2 border-accent-green/20 border-t-accent-green rounded-full animate-spin"></div>
                        ) : (
                          <Share2 size={18} />
                        )}
                      </button>
                      {bill.status !== 'cancelled' && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingBill(bill); 
                            setEditGrandTotal(bill.grandTotal); 
                            setEditAmountPaid(bill.amountPaid); 
                          }} 
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/40 border border-border/50 text-text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all" 
                          title="Edit Bill"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setIsDeleting(bill); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/40 border border-border/50 text-text-muted hover:text-accent-red hover:border-accent-red/40 hover:bg-accent-red/5 transition-all" title="Void & Revert stock"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-text-muted font-heading uppercase tracking-[0.16em]">
                    No Logs cataloged in this sector
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Invoice #${selectedBill?.billNo}`}
        maxWidth="600px"
        footer={
          <div className="flex gap-4 w-full">
            <button onClick={() => setIsViewModalOpen(false)} className="flex-1 py-4 rounded-xl bg-transparent border border-border/50 text-[0.75rem] font-heading font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all">Close</button>
            <button onClick={() => handlePrint(selectedBill)} className="flex-1 py-4 rounded-xl bg-accent text-[0.75rem] font-heading font-black uppercase tracking-widest text-primary shadow-glow hover:bg-accent/80 transition-all flex items-center justify-center gap-2">
              <Printer size={18} /> Print
            </button>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-8 p-1">
            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl bg-primary/40 border border-border/50">
                <p className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest mb-2">Authorized Recipient</p>
                <p className="text-[1.1rem] font-heading font-black text-white uppercase leading-tight">{selectedBill.customerName}</p>
                <p className="text-[0.75rem] font-mono font-bold text-accent mt-2">{selectedBill.customerPhone}</p>
              </div>
              <div className="p-6 rounded-2xl bg-primary/40 border border-border/50 text-right">
                <p className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest mb-2">Issue Timestamp</p>
                <p className="text-[1.1rem] font-mono font-black text-white">{safeFormatDate(selectedBill.createdAt)}</p>
                <p className="text-[0.65rem] font-mono font-black text-accent-green mt-2 uppercase tracking-widest">{selectedBill.paymentMode} PROTOCOL</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/50 overflow-hidden bg-primary/20">
              <table className="w-full text-left">
                <thead className="bg-primary/40 border-b border-border/30">
                  <tr>
                    <th className="p-5 text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">Asset Details</th>
                    <th className="p-5 text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest text-center">Qty</th>
                    <th className="p-5 text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest text-right">Net Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-primary/10">
                      <td className="p-5">
                        <p className="text-[0.85rem] font-heading font-black text-white uppercase">{item.productName}</p>
                        <p className="text-[0.65rem] font-mono font-bold text-text-muted mt-1 uppercase tracking-widest">Rate: ₹{item.unitPrice}</p>
                      </td>
                      <td className="p-5 text-center font-mono font-black text-white/60 text-[0.9rem]">{item.quantity}</td>
                      <td className="p-5 text-right font-mono font-black text-accent text-[0.95rem]">₹{item.itemTotal?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-accent/5 p-8 rounded-[24px] border border-accent/20">
              <div className="flex justify-between mb-3">
                <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest">Log Aggregate</span>
                <span className="text-[0.9rem] font-mono font-black text-white/70">₹{selectedBill.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {selectedBill.customerGstin && (
                <>
                  <div className="flex justify-between mb-3">
                    <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest">CGST (9%)</span>
                    <span className="text-[0.9rem] font-mono font-black text-white/70">₹{(selectedBill.subtotal * 0.09)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest">SGST (9%)</span>
                    <span className="text-[0.9rem] font-mono font-black text-white/70">₹{(selectedBill.subtotal * 0.09)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              {selectedBill.discountAmount > 0 && (
                <div className="flex justify-between mb-3">
                  <span className="text-[0.7rem] font-heading font-black text-accent-gold uppercase tracking-widest">Discount (18%)</span>
                  <span className="text-[0.9rem] font-mono font-black text-accent-gold">₹{selectedBill.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-border/30 pt-5 mt-5">
                <div className="flex justify-between items-center">
                  <span className="text-[0.8rem] font-heading font-black text-white uppercase tracking-widest">Terminal Total</span>
                  <span className="text-[2rem] font-mono font-black text-accent leading-none drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]">₹{selectedBill.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <PrintInvoice bill={selectedBill} shopSettings={shopSettings} safeFormatDate={safeFormatDate} numberToWords={numberToWords} />

      <Modal
        isOpen={!!editingBill}
        onClose={() => setEditingBill(null)}
        title={`EDIT BILL #${editingBill?.billNo}`}
        maxWidth="500px"
        footer={
          <div className="flex gap-4 w-full">
            <button 
              type="button"
              onClick={() => setEditingBill(null)} 
              disabled={isSavingEdit}
              className="flex-1 py-4 rounded-xl bg-transparent border border-border/50 text-[0.75rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleEditSave} 
              disabled={isSavingEdit}
              className="flex-1 py-4 rounded-xl bg-accent text-[0.75rem] font-heading font-black uppercase tracking-widest text-primary shadow-glow hover:bg-accent/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSavingEdit ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              ) : 'Save Changes'}
            </button>
          </div>
        }
      >
        {editingBill && (
          <div className="space-y-6 p-1">
            <div className="p-4 rounded-xl bg-primary/40 border border-border/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-[0.65rem] font-heading font-black text-text-muted uppercase tracking-widest">Client</span>
                <span className="text-[0.8rem] font-heading font-black text-white uppercase">{editingBill.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[0.65rem] font-heading font-black text-text-muted uppercase tracking-widest">Subtotal</span>
                <span className="text-[0.85rem] font-mono font-bold text-white/70">₹{editingBill.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {editingBill.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[0.65rem] font-heading font-black text-accent-gold uppercase tracking-widest">Original Discount</span>
                  <span className="text-[0.85rem] font-mono font-bold text-accent-gold">₹{editingBill.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted">Grand Total</label>
                <div className="relative">
                  <input
                    type="number"
                    value={editGrandTotal}
                    onChange={(e) => setEditGrandTotal(e.target.value)}
                    className="w-full h-[56px] pl-5 pr-6 rounded-xl bg-primary/40 border border-border/50 text-white text-[1.1rem] font-black font-mono outline-none focus:border-accent focus:shadow-glow transition-all"
                    placeholder="Enter Grand Total"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-muted">Settlement Amount (Amount Paid)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(e.target.value)}
                    className="w-full h-[56px] pl-5 pr-6 rounded-xl bg-primary/40 border border-border/50 text-white text-[1.1rem] font-black font-mono outline-none focus:border-accent focus:shadow-glow transition-all"
                    placeholder="Enter Settlement Amount"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-accent/5 border border-accent/20">
                <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest">Calculated Balance Due</span>
                <span className={`text-[0.95rem] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                  (parseFloat(editGrandTotal) - parseFloat(editAmountPaid)) > 0 ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' : 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                }`}>
                  ₹{Math.max(0, (parseFloat(editGrandTotal) || 0) - (parseFloat(editAmountPaid) || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!isDeleting} onClose={() => setIsDeleting(null)} title={`VOID BILL #${isDeleting?.billNo}?`}>
        <div className="p-4 text-center space-y-6">
          <p className="text-text-muted text-[0.9rem] font-medium leading-relaxed">This action cannot be undone. System resources will automatically revert the stock quantities to inventory records.</p>
          <div className="flex gap-4 pt-2">
            <button onClick={() => setIsDeleting(null)} className="flex-1 py-4 rounded-xl bg-transparent border border-border/50 text-[0.75rem] font-heading font-black uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={handleDeleteConfirm} className="flex-1 py-4 rounded-xl bg-accent-red text-[0.75rem] font-heading font-black uppercase tracking-widest text-white shadow-glow-red hover:bg-accent-red/80 transition-all">Void Bill</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bills;
