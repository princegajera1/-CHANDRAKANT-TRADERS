import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, where, addDoc, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as signOutSecondary } from 'firebase/auth';
import { firebaseConfig } from '../firebase/config';
import { Users as UsersIcon, UserPlus, ShieldCheck, History, Search, Download, Trash2, Filter, Clock, Activity, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Modal } from '../components/ui/Modal';

const Users = () => {
  const { isSuperAdmin, isReadOnly } = useAuthContext();
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let unsubAdmins = () => {};
    let unsubLogs = () => {};

    if (isSuperAdmin) {
      const qAdmins = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubAdmins = onSnapshot(qAdmins, (snapshot) => {
        setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      const qLogs = query(collection(db, 'activityLogs'), where('role', '==', 'demo'), orderBy('timestamp', 'desc'));
      unsubLogs = onSnapshot(qLogs, (snapshot) => {
        setVisitorLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubAdmins();
      unsubLogs();
    };
  }, [isSuperAdmin]);

  const handleDeleteAdmin = async (id) => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    if (!window.confirm('Terminate this admin session permanently?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('Admin access terminated');
    } catch (err) {
      toast.error('Failed to terminate access');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    setSaving(true);
    try {
      // Create a secondary Firebase instance to register the new user without logging out the current owner
      const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newAdmin.email, newAdmin.password);
      
      // Save their profile to the users collection with their true UID
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password, // Kept for the owner to view if necessary
        role: newAdmin.role || 'admin',
        createdAt: serverTimestamp(),
        status: 'active'
      });

      // Sign out and clean up the secondary instance
      await signOutSecondary(secondaryAuth);
      
      toast.success('Admin credential provisioned successfully in Main Auth');
      setIsAddAdminModalOpen(false);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = visitorLogs.filter(l => 
    l.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-8 animate-page-entrance">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-heading font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <UsersIcon className="text-[#FF6A00]" size={32} />
            Admin Network
          </h2>
          <p className="text-white/40 mt-1 font-body uppercase text-[0.65rem] font-bold tracking-widest">Manage your internal team access and review guest activity logs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search directory..." 
              className="bg-[#080C14] border border-white/10 rounded-xl py-3 pl-12 pr-6 text-sm text-white outline-none focus:border-[#FF6A00]/50 focus:bg-white/[0.08] transition-all w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-white/5 gap-8">
        <button 
          onClick={() => setActiveTab('admins')}
          className={`pb-4 text-[0.7rem] font-black uppercase tracking-[0.25em] transition-all relative ${activeTab === 'admins' ? 'text-[#FF6A00]' : 'text-white/30 hover:text-white/60'}`}
        >
          Active Team Members
          {activeTab === 'admins' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6A00] shadow-[0_0_15px_#FF6A00]"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('visitors')}
          className={`pb-4 text-[0.7rem] font-black uppercase tracking-[0.25em] transition-all relative ${activeTab === 'visitors' ? 'text-[#FF6A00]' : 'text-white/30 hover:text-white/60'}`}
        >
          Guest Traffic Monitor
          {activeTab === 'visitors' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6A00] shadow-[0_0_15px_#FF6A00]"></div>}
        </button>
      </div>

      {activeTab === 'admins' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 bg-[#FF6A00]/10 rounded-xl flex items-center justify-center text-[#FF6A00]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-white/40 text-[0.65rem] font-black uppercase tracking-widest">Team Size</p>
                <p className="text-2xl font-heading font-black text-white">{admins.length}</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <UsersIcon size={24} />
              </div>
              <div>
                <p className="text-white/40 text-[0.65rem] font-black uppercase tracking-widest">System Status</p>
                <p className="text-2xl font-heading font-black text-white">SECURE</p>
              </div>
            </div>
            {isSuperAdmin && (
              <button 
                onClick={() => setIsAddAdminModalOpen(true)}
                className="bg-[#FF6A00] rounded-2xl p-6 flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-[#FF6A0033] cursor-pointer"
              >
                <UserPlus size={24} /> New Admin Enlistment
              </button>
            )}
          </div>

          <div className="bg-[#0D121F] border border-white/10 rounded-[24px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Admin Identity</th>
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Clearance Level</th>
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Status</th>
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Joined Date</th>
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] font-black">
                          {admin.name?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="text-[0.9rem] font-bold text-white">{admin.name}</p>
                          <p className="text-[0.7rem] text-white/30">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {isSuperAdmin && admin.role !== 'owner' ? (
                        <select
                          value={admin.role || 'staff'}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                          className="bg-[#080C14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF6A00] transition-all cursor-pointer font-bold uppercase tracking-wider"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-tighter ${
                          admin.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                          admin.role === 'admin' ? 'bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20' : 
                          admin.role === 'manager' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                          admin.role === 'staff' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}>
                          {admin.role || 'Staff'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {isSuperAdmin && admin.role !== 'owner' ? (
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.status)}
                          className={`px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            admin.status === 'disabled' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                              : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          }`}
                        >
                          {admin.status === 'disabled' ? 'Disabled' : 'Active'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${admin.status === 'disabled' ? 'bg-red-500' : 'bg-[#10B981]'} animate-pulse`}></div>
                          <span className={`text-[0.75rem] font-bold ${admin.status === 'disabled' ? 'text-red-500' : 'text-[#10B981]'}`}>
                            {admin.status === 'disabled' ? 'Disabled' : 'Active'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-[0.8rem] text-white/40">
                      {admin.createdAt ? (admin.createdAt.toDate ? format(admin.createdAt.toDate(), 'MMM dd, yyyy') : format(new Date(admin.createdAt), 'MMM dd, yyyy')) : 'Pre-Launch'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {isSuperAdmin && admin.role !== 'owner' && (
                        <button 
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 text-white/20 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <p className="text-white/40 text-[0.65rem] font-black uppercase tracking-widest mb-1">Total Demo Visitors</p>
              <div className="flex items-center gap-3">
                <History className="text-[#FF6A00]" size={20} />
                <p className="text-2xl font-heading font-black text-white">{visitorLogs.length}</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <p className="text-white/40 text-[0.65rem] font-black uppercase tracking-widest mb-1">Active Now</p>
              <div className="flex items-center gap-3">
                <Activity className="text-[#10B981]" size={20} />
                <p className="text-2xl font-heading font-black text-white">
                  {visitorLogs.filter(l => l.action === 'LOGIN').length}
                </p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <p className="text-white/40 text-[0.65rem] font-black uppercase tracking-widest mb-1">Avg. Session</p>
              <div className="flex items-center gap-3">
                <Clock className="text-blue-400" size={20} />
                <p className="text-2xl font-heading font-black text-white">08m</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <p className="text-white/40 text-[0.65rem] font-black uppercase tracking-widest mb-1">Terminal Status</p>
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-purple-400" size={20} />
                <p className="text-2xl font-heading font-black text-white italic">SECURE</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0D121F] border border-white/10 rounded-[24px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Visitor Identity</th>
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Entry Timestamp</th>
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Terminal Environment</th>
                  <th className="px-6 py-4 text-[0.7rem] font-black uppercase tracking-widest text-white/30">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-[0.9rem] font-bold text-white uppercase tracking-tight">{log.userName || 'Unknown Visitor'}</p>
                      <p className="text-[0.7rem] text-white/30 uppercase tracking-widest">Demo Channel Access</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[0.8rem] text-white/80">{log.timestamp ? format(log.timestamp.toDate(), 'MMM dd, yyyy') : 'Recent'}</p>
                      <p className="text-[0.7rem] text-white/30 uppercase tracking-widest font-bold">{log.timestamp ? format(log.timestamp.toDate(), 'hh:mm:ss a') : 'Now'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-widest text-white/40">
                        <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/5">{log.os || 'WINDOWS'}</span>
                        <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/5">{log.browser || 'CHROME'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-widest ${
                        log.action === 'LOGIN' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {log.action === 'LOGIN' ? 'Terminal Active' : 'Session Terminated'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD ADMIN MODAL */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#080C14]/95 backdrop-blur-md" onClick={() => setIsAddAdminModalOpen(false)}></div>
          <div className="relative w-full max-w-[500px] bg-[#0D121F] border border-white/10 rounded-[32px] p-10 shadow-2xl animate-page-entrance">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[1.8rem] font-heading font-black text-white uppercase tracking-tighter">Enlist New Admin</h3>
              <button onClick={() => setIsAddAdminModalOpen(false)} className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors">
                <Trash2 className="rotate-45" size={24} />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/30 ml-1">Full Identity Name</label>
                <input 
                  required
                  className="w-full h-[60px] px-6 rounded-2xl bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all font-bold placeholder:text-white/10"
                  placeholder="Enter administrator's name"
                  value={newAdmin.name}
                  onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/30 ml-1">Access Email</label>
                <input 
                  required
                  type="email"
                  className="w-full h-[60px] px-6 rounded-2xl bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all font-bold placeholder:text-white/10"
                  placeholder="admin@traders.com"
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({...newAdmin, email: e.target.value.trim()})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/30 ml-1">Terminal Security Key</label>
                <input 
                  required
                  type="password"
                  className="w-full h-[60px] px-6 rounded-2xl bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all font-bold"
                  placeholder="Set secret password"
                  value={newAdmin.password}
                  onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/30 ml-1">Clearance Role</label>
                <select 
                  className="w-full h-[60px] px-6 rounded-2xl bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all font-bold"
                  value={newAdmin.role}
                  onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full h-[64px] bg-[#FF6A00] text-white font-black text-[0.9rem] uppercase tracking-[0.25em] rounded-[24px] hover:brightness-110 transition-all shadow-[0_20px_50px_rgba(255,106,0,0.3)] flex items-center justify-center mt-6 cursor-pointer"
              >
                {saving ? "Granting Access..." : "Finalize Authorization"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
