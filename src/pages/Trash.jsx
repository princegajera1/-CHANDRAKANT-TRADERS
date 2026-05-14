import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Trash2, RotateCcw, Package, FileText, User, Clock, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { subDays } from 'date-fns';
import { toast } from 'react-hot-toast';

const Trash = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    const loadTrash = () => {
      const existingTrash = JSON.parse(localStorage.getItem('ct_trash') || '[]');
      const thirtyDaysAgo = subDays(new Date(), 30).getTime();
      
      const filteredTrash = existingTrash.filter(item => {
        return new Date(item.deletedAt).getTime() > thirtyDaysAgo;
      });
      
      if (filteredTrash.length !== existingTrash.length) {
        localStorage.setItem('ct_trash', JSON.stringify(filteredTrash));
      }
      
      setItems(filteredTrash.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)));
      setLoading(false);
    };
    
    loadTrash();
    const interval = setInterval(loadTrash, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRestore = async (item) => {
    setRestoringId(item.id);
    try {
      const { deletedAt, originalCollection, id, ...originalData } = item;
      await setDoc(doc(db, originalCollection, id), originalData);
      
      const newTrash = items.filter(t => t.id !== id);
      localStorage.setItem('ct_trash', JSON.stringify(newTrash));
      setItems(newTrash);
      
      toast.success('Asset restored to active protocols');
    } catch (error) {
      toast.error('Restoration failed');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = (id) => {
    if (window.confirm('Irreversible Action: Permanently purge this asset?')) {
      const newTrash = items.filter(t => t.id !== id);
      localStorage.setItem('ct_trash', JSON.stringify(newTrash));
      setItems(newTrash);
      toast.success('Asset purged from terminal');
    }
  };

  const filteredItems = items.filter(item => 
    (item.name || item.billNo || item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Syncing Recycle Protocols...</div>;

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-page-entrance">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Recycle Bin</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Authorized asset recovery and permanent deletion</p>
        </div>
        <div className="h-[36px] px-[1.2rem] rounded-[8px] bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center font-black text-[0.65rem] uppercase tracking-widest">
          {items.length} Pending Purge
        </div>
      </div>

      {/* Warning Banner */}
      <div className="p-6 rounded-[24px] bg-red-500/5 border border-red-500/10 flex items-center gap-6 animate-page-entrance" style={{ animationDelay: '0.1s' }}>
        <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-[0.75rem] font-black text-red-500 uppercase tracking-widest">Protocol Warning</p>
          <p className="text-[0.85rem] font-bold text-white/50 mt-0.5">Assets in this terminal are scheduled for periodic purge (30-day window). Restorations are logged for audit.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] animate-page-entrance" style={{ animationDelay: '0.2s' }}>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search recycle buffer for identity signatures..."
              className="w-full bg-[#080C14] border border-white/10 rounded-xl py-4 pl-14 pr-6 text-[0.875rem] font-body font-[400] text-white placeholder:text-white/20 placeholder:italic outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[32px] bg-[#0D1220] border border-white/[0.05] overflow-hidden animate-page-entrance" style={{ animationDelay: '0.3s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Asset Identity</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Type</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Deleted On</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em] text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredItems.map((item, i) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-all animate-row-entrance" style={{ animationDelay: `${i * 0.025}s` }}>
                  <td className="p-8">
                    <p className="font-heading font-[700] text-[1rem] text-white group-hover:text-[#FF6A00] transition-colors uppercase truncate">{item.name || item.billNo || item.customerName}</p>
                    <p className="font-body font-[400] text-[0.65rem] text-white/40 uppercase mt-1">Trace ID: {item.id.slice(0, 8)}</p>
                  </td>
                  <td className="p-8">
                    <span className="px-3 py-1 rounded-lg bg-white/5 font-body font-[600] text-[0.62rem] uppercase tracking-[0.1em] text-white/40 border border-white/10">
                      {item.originalCollection}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 font-body font-[400] text-[0.78rem] text-white/60">
                      <Calendar size={14} className="text-[#FF6A00]" />
                      {formatDate(item.deletedAt)}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id}
                        className="px-4 py-2 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981] hover:text-white transition-all font-black text-[0.6rem] uppercase tracking-widest flex items-center gap-2 admin-btn-hover"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(item.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all admin-btn-hover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="py-32 text-center">
                    <div className="space-y-4 opacity-10">
                      <Trash2 size={64} className="mx-auto" />
                      <p className="text-[0.8rem] font-black uppercase tracking-[0.2em]">Buffer Empty</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trash;
