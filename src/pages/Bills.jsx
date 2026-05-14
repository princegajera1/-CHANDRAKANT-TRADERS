import React, { useState, useEffect } from 'react';
import { useBills } from '../hooks/useBills';
import { Printer, Eye, Link as LinkIcon, Download, Search, Calendar, Trash2, Share2, AlertTriangle } from 'lucide-react';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { cancelBill } from '../firebase/bills';
import { moveToTrash } from '../firebase/trash';
import { generateBillPDF } from '../utils/generatePDF';
import { shareOnWhatsApp } from '../utils/whatsapp';
import { db } from '../firebase/config';
import { useAuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { Modal } from '../components/ui/Modal';
import { PrintInvoice } from '../components/ui/PrintInvoice';
import { toast } from 'react-hot-toast';

const Bills = () => {
  const { bills, loading } = useBills();
  const { isReadOnly } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [shopSettings, setShopSettings] = useState(null);
  const [shareDropdownOpenId, setShareDropdownOpenId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'shop'));
      if (snap.exists()) setShopSettings(snap.data());
    };
    fetchSettings();
  }, []);

  const filteredBills = bills.filter(b => 
    (b.billNo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDownloadPDF = async (bill) => {
    try {
      await generateBillPDF(bill, shopSettings);
      toast.success('PDF Invoice generated');
    } catch (err) {
      toast.error('PDF Generation failed');
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

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Syncing Terminal Archives...</div>;

  return (
    <div className="space-y-10 pb-16">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-page-entrance">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Terminal Archives</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Authorized invoice logs and financial history</p>
        </div>
      </div>

      <div className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] animate-page-entrance" style={{ animationDelay: '0.1s' }}>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by Invoice Number or Client Identity..."
            className="w-full bg-[#080C14] border border-white/10 rounded-xl py-4 pl-14 pr-6 text-[0.875rem] font-body font-[400] text-white placeholder:text-white/[0.22] placeholder:italic outline-none focus:border-[#FF6A00] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[32px] bg-[#0D1220] border border-white/[0.05] overflow-hidden animate-page-entrance" style={{ animationDelay: '0.2s' }}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/[0.05]">
                <th className="p-8 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em]">LOG ID</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em]">TIMESTAMP</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em]">CLIENT ENTITY</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-right">VALUE</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-center">PROTOCOL</th>
                <th className="p-8 font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredBills.map((bill, i) => (
                <tr 
                  key={bill.id} 
                  onClick={() => openViewModal(bill)}
                  className={`group hover:bg-white/[0.02] cursor-pointer transition-all animate-row-entrance ${bill.status === 'cancelled' ? 'opacity-30' : ''}`}
                  style={{ animationDelay: `${i * 0.025}s` }}
                >
                  <td className="p-8">
                    <span className="font-body font-[700] text-[0.875rem] text-white group-hover:text-[#FF6A00] transition-colors">#{bill.billNo}</span>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-col gap-1">
                      <span className="font-body font-[400] text-[0.78rem] text-white/[0.52] flex items-center gap-2"><Calendar size={14} className="text-[#FF6A00]" /> {safeFormatDate(bill.createdAt)}</span>
                      <span className="font-body font-[400] text-[0.72rem] text-white/[0.36] ml-[22px]">{safeFormatTime(bill.createdAt)}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="font-body font-[600] text-[0.875rem] text-white uppercase">{bill.customerName}</div>
                    <div className="font-body font-[400] text-[0.7rem] text-white/[0.38] mt-1 tracking-widest uppercase">{bill.customerPhone}</div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="font-heading font-[700] text-[0.95rem] text-[#FF6A00]">
                      <AnimatedNumber value={bill.grandTotal} prefix="₹" />
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className={`px-4 py-1.5 rounded-lg font-body font-[700] text-[0.62rem] uppercase tracking-[0.08em] border ${bill.paymentMode === 'Credit' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                      {bill.paymentMode}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="flex justify-end gap-3 no-print" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); openViewModal(bill); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-[#FF6A00] hover:border-[#FF6A00]/50 transition-all admin-btn-hover"><Eye size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handlePrint(bill); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-[#FF6A00] hover:border-[#FF6A00]/50 transition-all admin-btn-hover"><Printer size={18} /></button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(bill, shopSettings); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-[#FF6A00] hover:border-[#FF6A00]/50 transition-all admin-btn-hover"
                      ><Share2 size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setIsDeleting(bill); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#080C14] border border-white/5 text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all admin-btn-hover"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
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
            <button onClick={() => setIsViewModalOpen(false)} className="flex-1 py-4 rounded-xl bg-transparent border border-white/20 text-[0.75rem] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all">Close</button>
            <button onClick={() => handlePrint(selectedBill)} className="flex-1 py-4 rounded-xl bg-[#FF6A00] text-[0.75rem] font-black uppercase tracking-widest text-white shadow-lg shadow-[#FF6A0033] hover:bg-[#e65c00] transition-all flex items-center justify-center gap-2">
              <Printer size={18} /> Print
            </button>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-8 p-1">
            <div className="grid grid-cols-2 gap-8 animate-card-entrance" style={{ animationDelay: '0.06s' }}>
              <div className="p-6 rounded-2xl bg-[#080C14] border border-white/5">
                <p className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mb-2">Authorized Recipient</p>
                <p className="text-[1.1rem] font-black text-white uppercase leading-tight">{selectedBill.customerName}</p>
                <p className="text-[0.75rem] font-bold text-[#FF6A00] mt-2">{selectedBill.customerPhone}</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#080C14] border border-white/5 text-right">
                <p className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mb-2">Issue Timestamp</p>
                <p className="text-[1.1rem] font-black text-white">{safeFormatDate(selectedBill.createdAt)}</p>
                <p className="text-[0.65rem] font-black text-green-500 mt-2 uppercase tracking-widest">{selectedBill.paymentMode} PROTOCOL</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/[0.05] overflow-hidden animate-card-entrance" style={{ animationDelay: '0.12s' }}>
              <table className="w-full text-left">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="p-5 text-[0.6rem] font-black text-white/30 uppercase tracking-widest">Asset Details</th>
                    <th className="p-5 text-[0.6rem] font-black text-white/30 uppercase tracking-widest text-center">Qty</th>
                    <th className="p-5 text-[0.6rem] font-black text-white/30 uppercase tracking-widest text-right">Net Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <p className="text-[0.85rem] font-black text-white uppercase">{item.productName}</p>
                        <p className="text-[0.65rem] font-bold text-white/20 mt-1 uppercase tracking-widest">Rate: ₹{item.unitPrice}</p>
                      </td>
                      <td className="p-5 text-center font-black text-white/40 text-[0.9rem]">{item.quantity}</td>
                      <td className="p-5 text-right font-black text-[#FF6A00] text-[0.95rem]">₹{item.itemTotal?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#FF6A00]/5 p-8 rounded-[24px] border border-[#FF6A00]/10 animate-card-entrance" style={{ animationDelay: '0.18s' }}>
              <div className="flex justify-between mb-3">
                <span className="text-[0.7rem] font-black text-white/20 uppercase tracking-widest">Log Aggregate</span>
                <span className="text-[0.9rem] font-black text-white/60">₹{selectedBill.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between mb-5 pb-5 border-b border-[#FF6A00]/10">
                <span className="text-[0.7rem] font-black text-white/20 uppercase tracking-widest">System Tax (GST)</span>
                <span className="text-[0.9rem] font-black text-white/60">₹{selectedBill.gstAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[0.8rem] font-black text-white uppercase tracking-widest">Terminal Total</span>
                <span className="text-[2rem] font-heading font-black text-[#FF6A00] leading-none">₹{selectedBill.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <PrintInvoice bill={selectedBill} shopSettings={shopSettings} safeFormatDate={safeFormatDate} numberToWords={numberToWords} />

      <Modal isOpen={!!isDeleting} onClose={() => setIsDeleting(null)} title={`DELETE BILL #${isDeleting?.billNo}?`}>
        <div className="p-4 text-center space-y-6">
          <p className="text-white/60 text-[0.9rem] font-medium leading-relaxed">This cannot be undone. The items will be returned to inventory.</p>
          <div className="flex gap-4 pt-2">
            <button onClick={() => setIsDeleting(null)} className="flex-1 py-4 rounded-xl bg-transparent border border-[#FF6A00]/20 text-[0.75rem] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-[#FF6A00]/10 transition-all admin-btn-hover">Cancel</button>
            <button onClick={handleDeleteConfirm} className="flex-1 py-4 rounded-xl bg-red-500 text-[0.75rem] font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-1 transition-all admin-btn-hover">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bills;
