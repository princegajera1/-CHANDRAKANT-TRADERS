import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Trash2, RotateCcw, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';
import { PasswordModal } from '../components/ui/PasswordModal';
import gsap from 'gsap';

export const RecycleBin = () => {
  const { isReadOnly } = useAuthContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [restoringId, setRestoringId] = useState(null);

  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState(false);

  const pageRef = useRef(null);

  useEffect(() => {
    // 4 snapshots for the 4 collections
    const q1 = query(collection(db, 'bills'), where('isDeleted', '==', true));
    const q2 = query(collection(db, 'customers'), where('isDeleted', '==', true));
    const q3 = query(collection(db, 'suppliers'), where('isDeleted', '==', true));
    const q4 = query(collection(db, 'customBills'), where('isDeleted', '==', true));

    let billsList = [];
    let customersList = [];
    let suppliersList = [];
    let customBillsList = [];

    const mergeAndSort = () => {
      const combined = [
        ...billsList,
        ...customersList,
        ...suppliersList,
        ...customBillsList
      ];
      combined.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
      setItems(combined);
      setLoading(false);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      billsList = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Bills' }));
      mergeAndSort();
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      customersList = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Customers' }));
      mergeAndSort();
    });

    const unsub3 = onSnapshot(q3, (snap) => {
      suppliersList = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Suppliers' }));
      mergeAndSort();
    });

    const unsub4 = onSnapshot(q4, (snap) => {
      customBillsList = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Custom Bills' }));
      mergeAndSort();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.page-header', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 });
      tl.fromTo('.warning-block', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
      tl.fromTo('.search-block', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
      tl.fromTo('.table-block', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const handleRestore = async (item) => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    setRestoringId(item.id);
    try {
      const docRef = doc(db, item.originalCollection, item.id);
      await updateDoc(docRef, {
        isDeleted: false,
        deletedAt: null
      });
      toast.success(`${item.type.slice(0, -1)} restored to active protocols`);
    } catch (error) {
      console.error(error);
      toast.error('Restoration failed');
    } finally {
      setRestoringId(null);
    }
  };

  const handleConfirmDeletePermanently = async () => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    if (!itemToDelete) return;
    try {
      const docRef = doc(db, itemToDelete.originalCollection, itemToDelete.id);
      await deleteDoc(docRef);
      toast.success('Asset purged forever from database');
      setItemToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Purge operation failed');
    }
  };

  const handleConfirmEmptyRecycleBin = async () => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    try {
      const deletePromises = items.map(item => 
        deleteDoc(doc(db, item.originalCollection, item.id))
      );
      await Promise.all(deletePromises);
      toast.success('Recycle Bin emptied successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to empty Recycle Bin');
    }
  };

  const filteredItems = items.filter(item => {
    const searchString = (item.name || item.billNo || item.customerName || '').toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-text-muted font-mono uppercase tracking-[0.2em] text-[0.75rem]">Accessing Recycle Protocols...</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 page-header">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Recycle Bin</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Authorized asset recovery and permanent deletion</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => setIsEmptyModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-heading font-black text-[0.72rem] uppercase tracking-wider transition-all border border-red-500/20 active:scale-95 cursor-pointer"
          >
            Empty Recycle Bin
          </button>
        )}
      </div>

      {/* Warning Banner */}
      <div className="p-6 rounded-[24px] bg-red-500/5 border border-red-500/10 flex items-center gap-6 warning-block">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-[0.75rem] font-black text-red-500 uppercase tracking-widest">Protocol Warning</p>
          <p className="text-[0.85rem] font-bold text-white/50 mt-0.5">Assets in this terminal are scheduled for permanent purge. Restorations are logged for audit.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] search-block shadow-lg">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search recycle buffer for identity signatures..."
            className="w-full bg-[#080C14] border border-white/10 rounded-xl py-4.5 pl-14 pr-6 text-[0.875rem] font-body font-[400] text-white placeholder:text-white/20 placeholder:italic outline-none focus:border-[#FF6A00] transition-all admin-input-focus"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[32px] bg-[#0D1220] border border-white/[0.05] overflow-hidden table-block shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Asset Identity</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Original Source</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">Deleted On</th>
                <th className="p-8 font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em] text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredItems.map((item, i) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-all">
                  <td className="p-8">
                    <p className="font-heading font-[700] text-[1rem] text-white group-hover:text-[#FF6A00] transition-colors uppercase truncate">
                      {item.type === 'Bills' || item.type === 'Custom Bills' ? `#${item.billNo || '-'}` : (item.name || item.customerName || '-')}
                    </p>
                    <p className="font-body font-[400] text-[0.65rem] text-white/40 uppercase mt-1">
                      {item.type === 'Bills' || item.type === 'Custom Bills' ? `Client: ${item.customerName || '-'}` : `ID: ${item.id.slice(0, 8)}`}
                    </p>
                  </td>
                  <td className="p-8">
                    <span className="px-3 py-1 rounded-lg bg-white/5 font-body font-[600] text-[0.62rem] uppercase tracking-[0.1em] text-white/40 border border-white/10">
                      {item.type}
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
                        className="px-4 py-2 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981] hover:text-white transition-all font-black text-[0.6rem] uppercase tracking-widest flex items-center gap-2 admin-btn-hover cursor-pointer"
                      >
                        {restoringId === item.id ? (
                          <div className="w-3.5 h-3.5 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        ) : (
                          <RotateCcw size={14} />
                        )} 
                        Restore
                      </button>
                      <button 
                        onClick={() => setItemToDelete(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent hover:border-red-500/20 transition-all admin-btn-hover cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-32 text-center">
                    <div className="space-y-4 opacity-10">
                      <Trash2 size={64} className="mx-auto" />
                      <p className="text-[0.8rem] font-black uppercase tracking-[0.2em]">Recycle Bin is empty 🗑️</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Permanently Modal */}
      <PasswordModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDeletePermanently}
        title="Delete Permanently"
        subtitle="This will permanently delete this record. This cannot be undone."
        confirmLabel="Wipe"
      />

      {/* Empty Recycle Bin Modal */}
      <PasswordModal
        isOpen={isEmptyModalOpen}
        onClose={() => setIsEmptyModalOpen(false)}
        onConfirm={handleConfirmEmptyRecycleBin}
        title="Empty Recycle Bin"
        subtitle="This will permanently delete all items in the Recycle Bin. This cannot be undone."
        confirmLabel="Wipe All"
      />
    </div>
  );
};

export default RecycleBin;
