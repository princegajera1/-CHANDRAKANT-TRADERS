import React, { useState, useEffect } from 'react';
import { db, firebaseConfig } from '../firebase/config';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, orderBy, deleteDoc, where, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Key, UserCheck, UserX, Clock, Search, Filter, Copy, CheckCircle, XCircle, ShieldAlert, MoreHorizontal, UserPlus, Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthContext } from '../context/AuthContext';
import { Modal } from '../components/ui/Modal';

const GuestManagement = () => {
  const { user: currentUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [activeGuests, setActiveGuests] = useState([]);
  const [expiredGuests, setExpiredGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [duration, setDuration] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPass, setGeneratedPass] = useState('');

  // Fetch Requests
  useEffect(() => {
    const q = query(collection(db, 'guestRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch Active Guests
  useEffect(() => {
    const q = query(collection(db, 'guests'), where('isActive', '==', true), orderBy('approvedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setActiveGuests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Fetch Expired Guests
  useEffect(() => {
    const q = query(collection(db, 'guests'), where('isActive', '==', false), orderBy('approvedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setExpiredGuests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    const password = `Guest@${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      // 1. Create Auth Account using secondary instance
      const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, selectedRequest.email, password);
      await updateProfile(userCredential.user, { displayName: selectedRequest.name });
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(duration));

      const guestPayload = {
        uid: userCredential.user.uid,
        name: selectedRequest.name,
        email: selectedRequest.email,
        role: 'guest',
        isActive: true,
        approvedBy: currentUser.email,
        approvedAt: serverTimestamp(),
        expiresAt: expiryDate,
        purpose: selectedRequest.purpose || ''
      };

      // 2. Add to guests collection
      await setDoc(doc(db, 'guests', userCredential.user.uid), guestPayload);
      
      // 3. Add to users collection (for global auth check)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: selectedRequest.name,
        email: selectedRequest.email,
        role: 'guest',
        createdAt: serverTimestamp()
      });

      // 4. Update request status
      await updateDoc(doc(db, 'guestRequests', selectedRequest.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.email,
        expiresAt: expiryDate
      });

      setGeneratedPass(password);
      toast.success('Guest Authorization Synchronized');
      
      // Cleanup secondary app
      secondaryApp.delete();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Authorization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      await updateDoc(doc(db, 'guestRequests', requestId), {
        status: 'rejected'
      });
      toast.success('Request Revoked');
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleRevoke = async (guest) => {
    if (!window.confirm(`Revoke access for ${guest.name}?`)) return;
    try {
      await updateDoc(doc(db, 'guests', guest.id), {
        isActive: false
      });
      // Note: Disabling Auth account usually requires Admin SDK
      // We set isActive false to block app access via AuthContext
      toast.success('Guest access deactivated');
    } catch (err) {
      toast.error('Revocation failed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredItems = (items) => items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-page-entrance">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="admin-heading">Guest Management</h2>
          <p className="admin-subheading">Control temporary network access and authorizations</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#0D1220] p-1.5 rounded-2xl border border-white/[0.05]">
          {['pending', 'active', 'expired'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setGeneratedPass(''); }}
              className={`px-6 py-2.5 rounded-xl text-[0.7rem] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-[#FF6A00] text-white shadow-lg shadow-[#FF6A0022]' 
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {tab}
              {tab === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-white text-[#FF6A00] rounded-md text-[0.6rem]">{requests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#0D1220] rounded-[32px] border border-white/[0.05] overflow-hidden">
        <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              className="w-full h-[48px] pl-12 pr-4 bg-white/[0.03] border border-white/10 rounded-xl text-white text-[0.85rem] outline-none focus:border-[#FF6A00]/50 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="py-5 px-8 text-[0.65rem] font-black uppercase tracking-widest text-white/30">User Identity</th>
                <th className="py-5 px-8 text-[0.65rem] font-black uppercase tracking-widest text-white/30">Purpose / Details</th>
                <th className="py-5 px-8 text-[0.65rem] font-black uppercase tracking-widest text-white/30">
                  {activeTab === 'pending' ? 'Requested On' : activeTab === 'active' ? 'Expires On' : 'Expired On'}
                </th>
                <th className="py-5 px-8 text-[0.65rem] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center text-white/20 font-black uppercase tracking-widest text-[0.7rem]">Initializing Terminal Sync...</td></tr>
              ) : activeTab === 'pending' ? (
                filteredItems(requests.filter(r => r.status === 'pending')).map((req) => (
                  <tr key={req.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#FF6A00]/10 group-hover:text-[#FF6A00] transition-all">
                          <UserPlus size={18} />
                        </div>
                        <div>
                          <p className="text-[0.9rem] font-bold text-white uppercase tracking-tight">{req.name}</p>
                          <p className="text-[0.75rem] text-white/40">{req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <p className="text-[0.8rem] text-white/60 italic max-w-xs truncate" title={req.purpose}>{req.purpose || 'No reason provided'}</p>
                      <p className="text-[0.7rem] text-white/30 mt-1 font-mono">{req.phone || 'No phone'}</p>
                    </td>
                    <td className="py-6 px-8">
                      <p className="text-[0.8rem] text-white/50">{req.createdAt ? format(req.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}</p>
                      <p className="text-[0.65rem] text-white/20 uppercase tracking-widest mt-1">{req.createdAt ? format(req.createdAt.toDate(), 'hh:mm a') : ''}</p>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedRequest(req); setIsApproveModalOpen(true); }}
                          className="p-2.5 rounded-lg bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all shadow-lg shadow-[#10B9810A]"
                        >
                          <UserCheck size={18} />
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="p-2.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-all shadow-lg shadow-[#EF44440A]"
                        >
                          <UserX size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : activeTab === 'active' ? (
                filteredItems(activeGuests).map((guest) => (
                  <tr key={guest.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <p className="text-[0.9rem] font-bold text-white uppercase tracking-tight">{guest.name}</p>
                          <p className="text-[0.75rem] text-white/40">{guest.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className="px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] text-[0.6rem] font-black uppercase tracking-widest rounded-md">Authorized</span>
                      <p className="text-[0.65rem] text-white/30 mt-2 uppercase tracking-widest">By: {guest.approvedBy}</p>
                    </td>
                    <td className="py-6 px-8">
                      <p className="text-[0.8rem] text-white/50">{guest.expiresAt ? format(guest.expiresAt.toDate(), 'MMM dd, yyyy') : 'N/A'}</p>
                      <p className="text-[0.65rem] text-[#FF6A00] uppercase tracking-widest mt-1 font-bold">
                        {guest.expiresAt ? format(guest.expiresAt.toDate(), 'hh:mm a') : ''}
                      </p>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <button 
                        onClick={() => handleRevoke(guest)}
                        className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                      >
                        Revoke Access
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredItems(expiredGuests).map((guest) => (
                  <tr key={guest.id} className="group hover:bg-white/[0.02] transition-colors opacity-60">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-[0.9rem] font-bold text-white uppercase tracking-tight">{guest.name}</p>
                          <p className="text-[0.75rem] text-white/40">{guest.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className="px-2.5 py-1 bg-white/5 text-white/30 text-[0.6rem] font-black uppercase tracking-widest rounded-md">Expired</span>
                    </td>
                    <td className="py-6 px-8">
                      <p className="text-[0.8rem] text-white/40">{guest.expiresAt ? format(guest.expiresAt.toDate(), 'MMM dd, yyyy') : 'N/A'}</p>
                    </td>
                    <td className="py-6 px-8 text-right">
                       <button className="p-2 text-white/20 hover:text-white transition-colors">
                         <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && filteredItems(activeTab === 'pending' ? requests.filter(r => r.status === 'pending') : activeTab === 'active' ? activeGuests : expiredGuests).length === 0 && (
            <div className="py-32 text-center">
              <ShieldAlert size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-white/20 font-black uppercase tracking-widest text-[0.8rem]">No guest protocols found in this sector</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      <Modal isOpen={isApproveModalOpen} onClose={() => { setIsApproveModalOpen(false); setGeneratedPass(''); }} title="Finalize Guest Protocol">
        {!generatedPass ? (
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
                  <Mail size={14} />
                </div>
                <p className="text-[0.8rem] text-white/70 font-medium">{selectedRequest?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
                  <Calendar size={14} />
                </div>
                <p className="text-[0.8rem] text-white/70 font-medium">Request Date: {selectedRequest?.createdAt ? format(selectedRequest.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Access Duration Protocol</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '1 Day', val: '1' },
                  { label: '3 Days', val: '3' },
                  { label: '7 Days', val: '7' },
                  { label: '30 Days', val: '30' }
                ].map((opt) => (
                  <button 
                    key={opt.val}
                    onClick={() => setDuration(opt.val)}
                    className={`h-[52px] rounded-xl font-bold text-[0.75rem] uppercase tracking-widest transition-all border ${
                      duration === opt.val 
                        ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-lg shadow-[#FF6A0022]' 
                        : 'bg-white/[0.02] border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleApprove}
              disabled={isProcessing}
              className="w-full h-[60px] bg-[#FF6A00] text-white font-black uppercase tracking-[0.25em] rounded-xl hover:bg-[#ff7b1a] hover:scale-[1.02] transition-all shadow-xl shadow-[#FF6A0033] flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><CheckCircle size={20} /> Authorize Sync</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-3xl mx-auto flex items-center justify-center">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-[1.2rem] font-heading font-black text-white uppercase tracking-tight">Authorization Successful</h4>
              <p className="text-[0.8rem] text-white/40 font-body">Copy the security credentials below and share with the guest</p>
            </div>

            <div className="p-8 rounded-[28px] bg-[#080C14] border border-[#10B981]/20 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-[#10B981]/10 transition-all"></div>
              
              <div className="space-y-2">
                <label className="text-[0.6rem] font-black uppercase tracking-widest text-[#10B981]/60">Guest Identity (Email)</label>
                <div className="flex items-center justify-between">
                  <p className="text-[1.1rem] font-bold text-white tracking-tight">{selectedRequest?.email}</p>
                  <button onClick={() => copyToClipboard(selectedRequest?.email)} className="p-2 text-white/20 hover:text-[#10B981] transition-all"><Copy size={16} /></button>
                </div>
              </div>

              <div className="h-[1px] bg-white/5"></div>

              <div className="space-y-2">
                <label className="text-[0.6rem] font-black uppercase tracking-widest text-[#10B981]/60">Security Key (Password)</label>
                <div className="flex items-center justify-between">
                  <p className="text-[1.3rem] font-black text-[#10B981] tracking-widest">{generatedPass}</p>
                  <button onClick={() => copyToClipboard(generatedPass)} className="p-2 text-white/20 hover:text-[#10B981] transition-all"><Copy size={16} /></button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setIsApproveModalOpen(false); setGeneratedPass(''); }}
              className="w-full h-[56px] border border-white/10 text-white/50 font-black uppercase tracking-widest rounded-xl hover:bg-white/5 hover:text-white transition-all"
            >
              Close Terminal
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GuestManagement;
