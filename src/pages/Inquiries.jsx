import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Mail, Phone, Calendar, Trash2, CheckCircle, Clock, Search, MessageSquare, User, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [isChanging, setIsChanging] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        status: doc.data().status || 'new',
        ...doc.data()
      }));
      setInquiries(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab) => {
    setIsChanging(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsChanging(false);
    }, 150);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status: newStatus });
      toast.success(`Inquiry moved to ${newStatus}`);
    } catch (error) {
      toast.error('Protocol update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this inquiry?')) return;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      toast.success('Inquiry permanently deleted');
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  const filteredInquiries = inquiries.filter(item => {
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.message || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'ACTIVE') return item.status === 'new' || item.status === 'active' || item.status === 'processed';
    if (activeTab === 'ARCHIVED') return item.status === 'archived';
    
    return true; // 'ALL' tab
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'processed':
        return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-[0.65rem] font-black uppercase tracking-widest"><CheckCircle size={12} /> Processed</div>;
      case 'archived':
        return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 text-[0.65rem] font-black uppercase tracking-widest"><Archive size={12} /> Archived</div>;
      default:
        return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20 text-[0.65rem] font-black uppercase tracking-widest"><Clock size={12} /> Active</div>;
    }
  };

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Syncing transmissions...</div>;

  return (
    <div className="space-y-10 animate-page-entrance pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Customer Inquiries</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Authorized client requests and fleet leads</p>
        </div>
      </div>

      <div className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] space-y-8 animate-card-entrance" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#080C14] rounded-2xl w-fit">
          {['ACTIVE', 'ARCHIVED', 'ALL'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`h-[42px] px-8 rounded-xl font-body font-[700] text-[0.75rem] uppercase tracking-[0.12em] transition-all duration-300 ${
                activeTab === tab ? 'bg-[#FF6A00] text-white shadow-lg shadow-[#FF6A0033]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search network for identity or transmission contents..."
            className="w-full pl-14 pr-6 h-[56px] rounded-xl outline-none text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20 focus:border-[#FF6A00] transition-all admin-input-focus"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 transition-all duration-300 ${isChanging ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {filteredInquiries.length > 0 ? filteredInquiries.map((inquiry, i) => (
          <div 
            key={inquiry.id} 
            className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] flex flex-col xl:flex-row gap-10 hover:border-[#FF6A00]/20 transition-all group animate-card-entrance"
            style={{ animationDelay: `${(i + 2) * 0.05}s` }}
          >
            {/* Left: Info */}
            <div className="xl:w-[240px] shrink-0 space-y-6">
              {getStatusBadge(inquiry.status)}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 font-body font-[600] text-white/40 text-[0.62rem] uppercase tracking-[0.16em]">
                  <Calendar size={14} className="text-[#FF6A00]" />
                  {inquiry.createdAt ? format(inquiry.createdAt.toDate(), 'dd MMM yyyy') : 'Recently'}
                </div>
                <div className="flex items-center gap-3 font-body font-[600] text-white/40 text-[0.62rem] uppercase tracking-[0.16em]">
                  <Clock size={14} className="text-[#FF6A00]" />
                  {inquiry.createdAt ? format(inquiry.createdAt.toDate(), 'HH:mm') : 'Syncing'}
                </div>
              </div>
            </div>

            {/* Middle: Data */}
            <div className="flex-1 space-y-8">
              <div className="flex flex-wrap gap-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF6A00] group-hover:bg-[#FF6A00]/10 transition-all"><User size={24} /></div>
                  <div>
                    <p className="font-heading font-[700] text-white text-[1rem] leading-none mb-1 uppercase group-hover:text-[#FF6A00] transition-colors">{inquiry.name}</p>
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">{inquiry.subject || 'Standard Request'}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-body font-[600] text-[0.62rem] text-white/[0.42] uppercase tracking-[0.16em] mb-1">Secure Email</p>
                  <p className="font-body font-[400] text-white/60 text-[0.78rem]">{inquiry.email}</p>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-body font-[600] text-[0.62rem] text-white/[0.42] uppercase tracking-[0.16em] mb-1">Direct Contact</p>
                  <p className="font-body font-[400] text-white/60 text-[0.78rem] tracking-wider">{inquiry.phone}</p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="xl:w-[180px] flex xl:flex-col gap-3 justify-end xl:justify-center">
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedInquiry(inquiry); }}
                className="w-full py-3 rounded-xl bg-white/5 text-white/60 border border-white/10 font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 admin-btn-hover"
              >
                <MessageSquare size={16} /> View Log
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-[#0D1220] border border-white/[0.05] rounded-[32px] p-32 text-center space-y-6 animate-page-entrance">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-white/10">
               <MessageSquare size={40} />
             </div>
             <p className="text-white/20 font-black uppercase tracking-[0.2em] text-[0.8rem]">No active transmissions in {activeTab} buffer</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedInquiry} onClose={() => setSelectedInquiry(null)} title="Communication Log">
        {selectedInquiry && (
          <div className="space-y-8 p-4">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF6A00]"><User size={24} /></div>
              <div>
                <p className="font-black text-white text-[1.2rem] leading-none mb-1 uppercase">{selectedInquiry.name}</p>
                <div className="flex items-center gap-4 text-[0.7rem] font-bold text-white/40">
                  <span className="flex items-center gap-1"><Mail size={12} className="text-[#FF6A00]" /> {selectedInquiry.email}</span>
                  <span className="flex items-center gap-1"><Phone size={12} className="text-[#FF6A00]" /> {selectedInquiry.phone}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#080C14] p-8 rounded-2xl border border-white/5 border-l-4 border-l-[#FF6A00] relative overflow-hidden">
              <p className="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Transmission Payload</p>
              <p className="font-body font-[400] text-[0.85rem] text-white/[0.80] leading-relaxed relative z-10">"{selectedInquiry.message}"</p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/5">
              {selectedInquiry.status !== 'processed' && selectedInquiry.status !== 'archived' && (
                <button 
                  onClick={() => { handleStatusChange(selectedInquiry.id, 'processed'); setSelectedInquiry(null); }}
                  className="flex-1 py-4 rounded-xl bg-[#10B981] text-[0.75rem] font-black uppercase tracking-widest text-white shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Process
                </button>
              )}
              {selectedInquiry.status !== 'archived' && (
                <button 
                  onClick={() => { handleStatusChange(selectedInquiry.id, 'archived'); setSelectedInquiry(null); }}
                  className="flex-1 py-4 rounded-xl bg-[#3b82f6] text-[0.75rem] font-black uppercase tracking-widest text-white shadow-lg shadow-[#3b82f6]/20 hover:bg-[#2563eb] transition-all flex items-center justify-center gap-2"
                >
                  <Archive size={18} /> Archive
                </button>
              )}
              {selectedInquiry.status === 'archived' && (
                <button 
                  onClick={() => { handleStatusChange(selectedInquiry.id, 'active'); setSelectedInquiry(null); }}
                  className="flex-1 py-4 rounded-xl bg-[#FF6A00] text-[0.75rem] font-black uppercase tracking-widest text-white shadow-lg shadow-[#FF6A00]/20 hover:bg-[#e65c00] transition-all flex items-center justify-center gap-2"
                >
                  <Clock size={18} /> Restore
                </button>
              )}
              <button 
                onClick={() => { handleDelete(selectedInquiry.id); setSelectedInquiry(null); }}
                className="w-14 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inquiries;
