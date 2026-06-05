import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { recordPayment } from '../firebase/customers';
import { sendUdhaarReminder } from '../utils/whatsapp';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Phone, Plus, MapPin, Calendar, CreditCard, Wallet, FileText, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [customer, setCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', note: '' });
  const [shopSettings, setShopSettings] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      const docRef = doc(db, 'customers', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) setCustomer({ id: snap.id, ...snap.data() });
      setLoading(false);
    };

    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'shop'));
      if (snap.exists()) setShopSettings(snap.data());
    };

    const qBills = query(collection(db, 'bills'), where('customerId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribeBills = onSnapshot(qBills, (snap) => {
      setBills(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(bill => bill.isDeleted !== true));
    });

    const qPayments = query(collection(db, 'payments'), where('customerId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribePayments = onSnapshot(qPayments, (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchCustomer();
    fetchSettings();
    return () => { unsubscribeBills(); unsubscribePayments(); };
  }, [id]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount) return toast.error('Specify liquidity transfer amount');
    try {
      await recordPayment({
        customerId: id,
        customerName: customer.name,
        amount: Number(paymentData.amount),
        note: paymentData.note,
        createdBy: user.uid
      });
      toast.success('Financial ledger synchronized');
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: '', note: '' });
      setCustomer(prev => ({ ...prev, balance: prev.balance - Number(paymentData.amount) }));
    } catch (error) {
      toast.error('Ledger synchronization fault');
    }
  };

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Fetching Profile Identity...</div>;

  if (!customer) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
      <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Identity Profile Lost</h2>
      <button onClick={() => navigate('/customers')} className="px-8 py-3 rounded-xl bg-[#FF6A00] text-white font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] shadow-lg">Return to Network</button>
    </div>
  );

  return (
    <div className="space-y-10 pb-16 animate-page-entrance">
      <button 
        onClick={() => navigate('/customers')} 
        className="flex items-center gap-3 font-body font-[600] text-[0.65rem] uppercase tracking-[0.16em] text-white/30 hover:text-[#FF6A00] transition-all group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Back to Network Registry
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Profile Identity Card */}
        <div className="xl:col-span-1 space-y-8">
          <div className="rounded-[40px] p-10 bg-[#0D1220] border border-white/[0.05] relative overflow-hidden group">
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 bg-[#FF6A00] text-white rounded-[40px] mx-auto flex items-center justify-center font-black text-5xl mb-8 shadow-2xl shadow-[#FF6A0033] transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                {customer.name[0]?.toUpperCase()}
              </div>
              <h2 className="text-[2.2rem] font-heading font-[800] text-white uppercase tracking-tighter leading-none">{customer.name}</h2>
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 font-body font-[400] text-[0.78rem] text-white/60">
                <Phone size={14} className="text-[#FF6A00]" /> {customer.phone}
              </div>

              <div className="mt-10 p-8 rounded-3xl bg-[#080C14] border border-white/5 text-center">
                <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em] mb-2">Exposure Liability</p>
                <p className={`text-[2rem] font-heading font-[800] tracking-tighter ${customer.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(customer.balance)}</p>
              </div>

              <div className="mt-4 p-8 rounded-3xl bg-[#080C14] border border-white/5 text-center">
                <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em] mb-2">Lifetime Total Purchase</p>
                <p className="text-[2rem] font-heading font-[800] tracking-tighter text-[#00D4FF]">{formatCurrency(customer.totalPurchased || 0)}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-8">
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="h-[52px] rounded-2xl bg-[#FF6A00] text-white font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] flex items-center justify-center gap-3 shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all admin-btn-hover"
                >
                  <Plus size={18} /> Record Ledger Entry
                </button>
                <button 
                  onClick={() => sendUdhaarReminder(customer, shopSettings)}
                  className="h-[52px] rounded-2xl bg-white/5 border border-white/10 text-white font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all admin-btn-hover"
                >
                  <Send size={16} className="text-[#10B981]" /> Send Reminder
                </button>
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 text-left space-y-6">
                <div className="flex gap-4">
                  <MapPin className="text-[#FF6A00] shrink-0" size={20} />
                  <div>
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Physical Coordinates</p>
                    <p className="font-body font-[400] text-[0.78rem] text-white/60 leading-relaxed uppercase">{customer.address || 'Address Not Registered'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Calendar className="text-[#FF6A00] shrink-0" size={20} />
                  <div>
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Network Onboarding</p>
                    <p className="font-body font-[400] text-[0.78rem] text-white/60 uppercase">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="mt-8 pt-8 border-t border-white/5 text-left">
                  <p className="font-body font-[600] text-[0.62rem] text-[#FF6A00] uppercase tracking-[0.16em] mb-2">Special Notes / Remarks</p>
                  <p className="font-body font-[400] text-[0.78rem] text-white/60 leading-relaxed italic">"{customer.notes}"</p>
                </div>
              )}
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <FileText size={200} />
            </div>
          </div>
        </div>

        {/* Transaction History Stream */}
        <div className="xl:col-span-2 space-y-8">
          <div className="rounded-[40px] p-10 bg-[#0D1220] border border-white/[0.05] min-h-[700px]">
            <h3 className="text-[1.2rem] font-heading font-[800] text-white mb-10 uppercase tracking-widest border-b border-white/5 pb-6">Protocol Transaction Matrix</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Invoices */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]"><CreditCard size={18} /></div>
                  <h4 className="font-body font-[600] text-[0.65rem] text-white/40 uppercase tracking-[0.16em]">Authorized Invoices</h4>
                </div>
                <div className="space-y-4">
                  {bills.map((bill, i) => (
                    <div 
                      key={bill.id} 
                      className="p-6 rounded-3xl bg-[#080C14] border border-white/5 hover:border-[#FF6A00]/30 transition-all cursor-pointer group animate-row-entrance" 
                      onClick={() => navigate('/bills')}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-heading font-[700] text-white text-[1rem] uppercase group-hover:text-[#FF6A00] transition-colors">#{bill.billNo}</p>
                        <span className={`px-3 py-1 rounded-lg font-body font-[600] text-[0.55rem] uppercase tracking-[0.16em] ${bill.paymentMode === 'Credit' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
                          {bill.paymentMode}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="font-body font-[400] text-[0.65rem] text-white/40 uppercase tracking-[0.12em]">{formatDate(bill.createdAt)}</p>
                        <p className="text-[1.2rem] font-heading font-[800] text-white tracking-tight">{formatCurrency(bill.grandTotal)}</p>
                      </div>
                    </div>
                  ))}
                  {bills.length === 0 && <div className="py-20 text-center opacity-10 uppercase tracking-[0.16em] text-[0.7rem] font-body font-[600]">No Invoice Logs</div>}
                </div>
              </section>

              {/* Payments */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]"><Wallet size={18} /></div>
                  <h4 className="font-body font-[600] text-[0.65rem] text-white/40 uppercase tracking-[0.16em]">Ledger Receipts</h4>
                </div>
                <div className="space-y-4">
                  {payments.map((payment, i) => (
                    <div 
                      key={payment.id} 
                      className="p-6 rounded-3xl bg-[#10B981]/5 border border-[#10B981]/10 animate-row-entrance"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-body font-[600] text-[#10B981] uppercase tracking-[0.16em] text-[0.62rem]">Liquidity Capture</p>
                        <p className="text-[1.2rem] font-heading font-[800] text-[#10B981] tracking-tight">+{formatCurrency(payment.amount)}</p>
                      </div>
                      <p className="font-body font-[400] text-[0.65rem] text-white/40 uppercase tracking-[0.12em] mb-3">{formatDate(payment.createdAt)}</p>
                      {payment.note && <div className="p-3 rounded-xl bg-white/5 font-body font-[400] text-[0.7rem] text-white/60 italic uppercase">{payment.note}</div>}
                    </div>
                  ))}
                  {payments.length === 0 && <div className="py-20 text-center opacity-10 uppercase tracking-[0.16em] text-[0.7rem] font-body font-[600]">No Ledger Receipts</div>}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Ledger Balance Entry"
      >
        <form className="space-y-8 p-2" onSubmit={handleRecordPayment}>
          <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 text-center">
            <p className="font-body font-[600] text-[0.62rem] text-red-500/40 uppercase tracking-[0.16em] mb-2">Total Liability Signal</p>
            <p className="text-4xl font-heading font-[800] text-red-500 tracking-tighter">{formatCurrency(customer.balance)}</p>
          </div>
          
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Liquidity Transfer (₹)</label>
            <input 
              type="number" 
              className="w-full h-[56px] px-5 rounded-xl text-[1.1rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
              value={paymentData.amount} 
              onChange={e => setPaymentData({...paymentData, amount: e.target.value})} 
              placeholder="0.00"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Protocol Memo / Ledger Note</label>
            <input 
              className="w-full h-[56px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
              value={paymentData.note} 
              onChange={e => setPaymentData({...paymentData, note: e.target.value})} 
              placeholder="e.g. Settlement via Digital Transfer / Cash Vault" 
            />
          </div>
          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 h-[52px] rounded-xl bg-transparent border border-white/20 font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" className="flex-1 h-[52px] rounded-xl bg-[#FF6A00] font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] text-white shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all">Commit Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerDetail;
