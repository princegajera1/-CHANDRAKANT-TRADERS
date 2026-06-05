import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, orderBy, limit, where, addDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Store, Globe, Bell, Shield, Database, Save, Trash2, Link as LinkIcon, Eye, EyeOff, Users, History, UserPlus, Lock, Download, Search, CheckCircle, XCircle, UserCheck, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthContext } from '../context/AuthContext';
import { logActivity } from '../utils/activity';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useBills } from '../hooks/useBills';
import { useSuppliers } from '../hooks/useSuppliers';
import { Modal } from '../components/ui/Modal';
import { PasswordModal } from '../components/ui/PasswordModal';
import { validateGSTIN, validatePAN, extractPANFromGSTIN } from '../utils/gstValidation';

const Settings = () => {
  const { isSuperAdmin, isDemo, isReadOnly, user: currentUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [logFilter, setLogFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [settings, setSettings] = useState({
    name: 'CHANDRAKANT TRADERS', 
    phone: '+91 99240 58859', 
    email: '',
    addressLine1: 'Shop No. 27/28/29, Taluka Panchayat Shopping Center', 
    addressLine2: 'Mahuva Road',
    city: 'Savarkundla',
    district: 'Amreli',
    pin: '364515',
    gstNo: '24ABTPM0428L1ZY', 
    panNo: '',
    state: 'Gujarat',
    stateCode: '24',
    upiId: 'traders@upi', 
    lowStockThreshold: 5,
    websiteUrl: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    alertLowStock: true,
    alertNewInquiry: true,
    alertDailyRevenue: true,
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    bankBranch: '',
    invoicePrefix: '#',
    startingInvoiceNo: 1,
    defaultGst: 5,
    defaultPaymentMode: 'Cash',
    termsConditions: '1. Goods once sold will not be taken back.\n2. Our risk and responsibility ceases as soon as the goods leave our premises.\n3. Subject to Savarkundla Jurisdiction only. E.&O.E.'
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [confirmClear, setConfirmClear] = useState('');
  const [manualBillNum, setManualBillNum] = useState('');
  const [showCounterResetModal, setShowCounterResetModal] = useState(false);
  const [showWipeProductsModal, setShowWipeProductsModal] = useState(false);
  const [showSystemWipeModal, setShowSystemWipeModal] = useState(false);
  
  // WhatsApp Automation states
  const [waQueue, setWaQueue] = useState([]);
  const [loadingWa, setLoadingWa] = useState(false);

  const handleRetryWhatsApp = async (docId) => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    try {
      await updateDoc(doc(db, 'whatsappQueue', docId), {
        status: 'pending',
        attempts: 0
      });
      toast.success('Message queued for retry');
    } catch (err) {
      toast.error('Failed to retry message');
    }
  };

  const handleToggleAutoSend = async () => {
    if (isReadOnly) return toast.error('Access Denied: Read-Only Mode');
    const newVal = settings.whatsappAutoSend === false ? true : false;
    try {
      const settingsRef = doc(db, 'settings', 'shop');
      await updateDoc(settingsRef, { whatsappAutoSend: newVal });
      setSettings(prev => ({ ...prev, whatsappAutoSend: newVal }));
      const newSettingsLocal = { ...settings, whatsappAutoSend: newVal };
      localStorage.setItem('shopSettings', JSON.stringify(newSettingsLocal));
      toast.success(`Auto WhatsApp invoicing turned ${newVal ? 'ON' : 'OFF'}`);
    } catch (err) {
      toast.error('Failed to update toggle setting');
    }
  };

  const { products } = useProducts();
  const { customers } = useCustomers();
  const { bills } = useBills();
  const { suppliers } = useSuppliers();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'shop'));
        if (snap.exists()) {
          const data = snap.data();
          setSettings({ ...settings, ...data });
          localStorage.setItem('shopSettings', JSON.stringify(data));
        }
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'admins'), orderBy('addedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab !== 'whatsapp') return;
    setLoadingWa(true);
    const q = query(collection(db, 'whatsappQueue'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWaQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingWa(false);
    });
    return unsubscribe;
  }, [activeTab]);

  const handleStateChange = (e) => {
    const stateName = e.target.value;
    const codeMap = { 'Gujarat': '24', 'Maharashtra': '27', 'Rajasthan': '08', 'Delhi': '07' }; // simplified map
    setSettings({...settings, state: stateName, stateCode: codeMap[stateName] || ''});
  };

  const handleGSTINChange = (e) => {
    const val = e.target.value.toUpperCase();
    const newSettings = { ...settings, gstNo: val };
    if (val.length >= 15) {
      newSettings.panNo = extractPANFromGSTIN(val);
    }
    setSettings(newSettings);
    setFormErrors({...formErrors, gstNo: null});
  };

  const handleSave = async () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    if (activeTab === 'security') {
      if (!passwords.current || !passwords.new || !passwords.confirm) return toast.error('Fill all security fields');
      if (passwords.new !== passwords.confirm) return toast.error('New protocols do not match');
      setSaving(true);
      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, passwords.current);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, passwords.new);
        toast.success("Security credentials updated successfully");
        setPasswords({ current: '', new: '', confirm: '' });
      } catch (err) {
        if (err.code === 'auth/wrong-password') {
          toast.error("Invalid Current Protocol Key");
        } else if (err.code === 'auth/requires-recent-login') {
          toast.error("Session expired. Please re-login.");
        } else {
          toast.error(err.message || "Update failed");
        }
      }
      setSaving(false);
      return;
    }

    if (activeTab === 'shop') {
      const errors = {};
      if (settings.gstNo && !validateGSTIN(settings.gstNo)) errors.gstNo = 'Invalid GSTIN format';
      if (settings.panNo && !validatePAN(settings.panNo)) errors.panNo = 'Invalid PAN format';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error('Please fix validation errors');
        return;
      }
    }

    if (activeTab === 'data') return; // Handled separately

    setSaving(true);
    try {
      // Re-construct full address for backward compatibility
      const fullAddress = `${settings.addressLine1}, ${settings.addressLine2 ? settings.addressLine2 + ', ' : ''}${settings.city}, Dist. ${settings.district} - ${settings.pin}`;
      
      const dataToSave = {
        ...settings,
        address: fullAddress
      };
      await updateDoc(doc(db, 'settings', 'shop'), dataToSave);
      localStorage.setItem('shopSettings', JSON.stringify(dataToSave));
      toast.success("Infrastructure parameters updated");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (isReadOnly) return toast.error('Read-only access — authorization required');
    if (!isSuperAdmin) return toast.error('Super Admin authority required');
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'admins'), {
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        isActive: true,
        addedBy: currentUser.uid,
        addedAt: serverTimestamp()
      });
      
      toast.success(`${newAdmin.name} enlisted in Admin Network`);
      setIsAdminModalOpen(false);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
    } catch (err) {
      toast.error("Failed to add admin");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAdmin = async (adminId, adminName, adminEmail) => {
    if (isReadOnly) return toast.error('Read-only access — authorization required');
    if (!isSuperAdmin) return toast.error('Super Admin authority required');
    if (adminEmail === 'princegajera944@gmail.com') return toast.error('Super Admin cannot be removed');
    
    if (!window.confirm(`Are you sure you want to revoke access for ${adminName}?`)) return;

    try {
      await deleteDoc(doc(db, 'admins', adminId));
      toast.success(`${adminName} removed from network`);
    } catch (err) {
      toast.error("Removal failed");
    }
  };

  const handleExportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,User,Role,Action,IP,Device\n"
      + logs.map(l => {
          const date = l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString() : 'N/A';
          return `"${date}","${l.userName}","${l.role}","${l.action}","${l.ipAddress}","${l.device}"`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeResetBillCounter = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'shop');
      await updateDoc(settingsRef, { billCounter: 0 });
      setSettings(prev => ({ ...prev, billCounter: 0 }));
      const newSettingsLocal = { ...settings, billCounter: 0 };
      localStorage.setItem('shopSettings', JSON.stringify(newSettingsLocal));
      toast.success('Invoice sequence counter reset to 0000 (Next bill will start from 0001)');
    } catch (err) {
      toast.error('Failed to reset counter');
    }
  };

  const handleResetBillCounter = () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    setShowCounterResetModal(true);
  };

  const handleSaveManualBillNum = async () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    const numVal = parseInt(manualBillNum);
    if (isNaN(numVal) || numVal < 1) {
      toast.error('Specify a valid positive starting sequence number');
      return;
    }
    try {
      const settingsRef = doc(db, 'settings', 'shop');
      await updateDoc(settingsRef, { billCounter: numVal - 1 });
      setSettings(prev => ({ ...prev, billCounter: numVal - 1 }));
      const newSettingsLocal = { ...settings, billCounter: numVal - 1 };
      localStorage.setItem('shopSettings', JSON.stringify(newSettingsLocal));
      toast.success(`Invoice counter set to ${numVal - 1} (Next bill will be ${String(numVal).padStart(4, '0')})`);
      setManualBillNum('');
    } catch (err) {
      toast.error('Failed to set manual counter');
    }
  };

  const handleValidateManualBillNum = async () => {
    const numVal = parseInt(manualBillNum);
    if (isNaN(numVal) || numVal < 1) {
      toast.error('Specify a valid positive sequence number to validate');
      return;
    }
    const formattedBillNo = String(numVal).padStart(4, '0');
    try {
      const q = query(collection(db, 'bills'), where('billNo', '==', formattedBillNo));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast.error(`Invalid: Invoice Number ${formattedBillNo} is already in use!`);
      } else {
        toast.success(`Valid: Invoice Number ${formattedBillNo} is available for use.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Verification failed during database check');
    }
  };

  const executeWipeProducts = async () => {
    setSaving(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const batchPromises = snap.docs.map(d => deleteDoc(doc(db, 'products', d.id)));
      await Promise.all(batchPromises);
      toast.success('All products successfully purged from inventory');
      setConfirmClear('');
    } catch (err) {
      toast.error('Failed to wipe products');
    } finally {
      setSaving(false);
    }
  };

  const handleWipeProducts = () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    if (confirmClear !== 'DELETE PRODUCTS') {
      toast.error('Type "DELETE PRODUCTS" in the authorization field to proceed');
      return;
    }
    setShowWipeProductsModal(true);
  };

  const executeSystemWipe = async () => {
    setSaving(true);
    try {
      // 1. Delete bills
      const billsSnap = await getDocs(collection(db, 'bills'));
      await Promise.all(billsSnap.docs.map(d => deleteDoc(doc(db, 'bills', d.id))));

      // 2. Delete customers
      const customersSnap = await getDocs(collection(db, 'customers'));
      await Promise.all(customersSnap.docs.map(d => deleteDoc(doc(db, 'customers', d.id))));

      // 3. Delete products
      const productsSnap = await getDocs(collection(db, 'products'));
      await Promise.all(productsSnap.docs.map(d => deleteDoc(doc(db, 'products', d.id))));

      // 4. Delete payments
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      await Promise.all(paymentsSnap.docs.map(d => deleteDoc(doc(db, 'payments', d.id))));

      // 5. Reset bill counter
      const settingsRef = doc(db, 'settings', 'shop');
      await updateDoc(settingsRef, { billCounter: 0 });
      setSettings(prev => ({ ...prev, billCounter: 0 }));
      const newSettingsLocal = { ...settings, billCounter: 0 };
      localStorage.setItem('shopSettings', JSON.stringify(newSettingsLocal));

      toast.success('Complete system wipe and database reset successful');
      setConfirmClear('');
    } catch (err) {
      toast.error('Wipe failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSystemWipe = () => {
    if (isReadOnly) {
      toast.error('Read-only access — authorization required');
      return;
    }
    if (confirmClear !== 'WIPE SYSTEM') {
      toast.error('Type "WIPE SYSTEM" in the authorization field to proceed');
      return;
    }
    setShowSystemWipeModal(true);
  };

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Syncing System Parameters...</div>;

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-page-entrance">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Infrastructure Settings</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Authorized terminal parameters</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="h-[46px] px-8 rounded-xl bg-[#FF6A00] text-white font-body font-[700] text-[0.75rem] uppercase tracking-[0.14em] shadow-lg shadow-[#FF6A0033] hover:translate-y-[-2px] transition-all flex items-center gap-3 admin-btn-hover disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <><Save size={18} /> Deploy Changes</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2 animate-dropdown-entrance">
          {[
            { id: 'shop', icon: Store, label: 'Shop Configuration' },
            { id: 'digital', icon: Globe, label: 'Digital Matrix' },
            { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp Automation' },
            { id: 'alerts', icon: Bell, label: 'Alert Protocols' },
            { id: 'security', icon: Shield, label: 'Security Grid' },
            { id: 'admins', icon: Users, label: 'Admin Network' },
            isSuperAdmin && { id: 'logs', icon: History, label: 'Activity Logs' },
            { id: 'data', icon: Database, label: 'Data Registry' }
          ].filter(Boolean).map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all border duration-300 ${
                activeTab === item.id 
                  ? 'bg-[#FF6A00] text-white border-[#FF6A00]/50 shadow-lg shadow-[#FF6A0022]' 
                  : 'bg-[#0D1220] border-white/[0.05] text-white/30 hover:text-white/60 hover:border-white/10'
              }`}
            >
              <item.icon size={18} />
              <span className="font-body font-[600] text-[0.78rem] uppercase tracking-[0.12em]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8 animate-page-entrance" style={{ animationDelay: '0.2s' }}>
          {activeTab === 'shop' && (
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10">
              
              {/* SECTION 1 — Shop Identity */}
              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <Store size={20} className="text-[#FF6A00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">SECTION 1 — Shop Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Shop Name</label>
                    <input value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Address Line 1</label>
                    <input value={settings.addressLine1} onChange={e => setSettings({...settings, addressLine1: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Address Line 2</label>
                    <input value={settings.addressLine2} onChange={e => setSettings({...settings, addressLine2: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">City</label>
                    <input value={settings.city} onChange={e => setSettings({...settings, city: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">District</label>
                    <input value={settings.district} onChange={e => setSettings({...settings, district: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">PIN</label>
                    <input value={settings.pin} onChange={e => setSettings({...settings, pin: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Mobile Number 1</label>
                    <input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Mobile Number 2</label>
                    <input value={settings.phone2 || ''} onChange={e => setSettings({...settings, phone2: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Email (Optional)</label>
                    <input value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                </div>
              </div>

              {/* SECTION 2 — Tax & Legal */}
              <div className="space-y-8 pt-10 border-t border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <Shield size={20} className="text-[#FF6A00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">SECTION 2 — Tax & Legal</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">GSTIN (15-char)</label>
                    <input 
                      value={settings.gstNo} 
                      onChange={handleGSTINChange} 
                      className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.gstNo ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all`}
                    />
                    {formErrors.gstNo && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.gstNo}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">PAN Number (10-char)</label>
                    <input 
                      value={settings.panNo} 
                      onChange={e => { setSettings({...settings, panNo: e.target.value.toUpperCase()}); setFormErrors({...formErrors, panNo: null}); }} 
                      className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border ${formErrors.panNo ? 'border-red-500' : 'border-white/10'} text-white outline-none focus:border-[#FF6A00] transition-all`}
                    />
                    {formErrors.panNo && <p className="text-red-500 text-[0.65rem] ml-1">{formErrors.panNo}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">State</label>
                    <select 
                      value={settings.state} 
                      onChange={handleStateChange} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
                    >
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Delhi">Delhi</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">State Code</label>
                    <input 
                      value={settings.stateCode} 
                      readOnly
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14]/50 border border-white/5 text-white/50 outline-none transition-all cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3 — Bank Details */}
              <div className="space-y-8 pt-10 border-t border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <Database size={20} className="text-[#FF6A00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">SECTION 3 — Bank Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Bank Name</label>
                    <input value={settings.bankName || ''} onChange={e => setSettings({...settings, bankName: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Account Number</label>
                    <input value={settings.bankAccount || ''} onChange={e => setSettings({...settings, bankAccount: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">IFSC Code</label>
                    <input value={settings.bankIfsc || ''} onChange={e => setSettings({...settings, bankIfsc: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Branch Name</label>
                    <input value={settings.bankBranch || ''} onChange={e => setSettings({...settings, bankBranch: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                </div>
              </div>

              {/* SECTION 4 — Invoice Preferences */}
              <div className="space-y-8 pt-10 border-t border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <CheckCircle size={20} className="text-[#FF6A00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">SECTION 4 — Invoice Preferences</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Invoice Prefix</label>
                    <input value={settings.invoicePrefix || ''} onChange={e => setSettings({...settings, invoicePrefix: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Starting Invoice Number</label>
                    <input type="number" value={settings.startingInvoiceNo || 1} onChange={e => setSettings({...settings, startingInvoiceNo: Number(e.target.value)})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Default GST Rate</label>
                    <select value={settings.defaultGst || 5} onChange={e => setSettings({...settings, defaultGst: Number(e.target.value)})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all">
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Default Payment Mode</label>
                    <select value={settings.defaultPaymentMode || 'Cash'} onChange={e => setSettings({...settings, defaultPaymentMode: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all">
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="Credit">Credit</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Terms & Conditions</label>
                    <textarea value={settings.termsConditions} onChange={e => setSettings({...settings, termsConditions: e.target.value})} className="w-full h-[120px] p-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all resize-none" />
                  </div>
                </div>
              </div>

              {/* SECTION 5 — Bill Settings (Invoice Counter Control) */}
              <div className="space-y-8 pt-10 border-t border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <Database size={20} className="text-[#FF6A00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">SECTION 5 — Bill Settings (Invoice Counter Control)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <h4 className="font-body font-[700] text-[0.9rem] text-white uppercase">Reset Invoice Sequence</h4>
                    <p className="font-body font-[400] text-[0.7rem] text-white/40 leading-relaxed">
                      Reset the sequential invoice number counter back to 0001. All subsequent invoices will follow from 0001.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetBillCounter}
                      className="h-[42px] px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-body font-[700] text-[0.7rem] uppercase tracking-[0.1em] shadow-lg transition-all admin-btn-hover"
                    >
                      Reset to 0001
                    </button>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <h4 className="font-body font-[700] text-[0.9rem] text-white uppercase">Manually Override Invoice Number</h4>
                    <p className="font-body font-[400] text-[0.7rem] text-white/40 leading-relaxed">
                      Set the next invoice sequence number manually. Submitting a new invoice will start from this number.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['0001', '0010', '0050', '0100', '1000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setManualBillNum(parseInt(val).toString())}
                          className="px-3 py-1.5 text-[0.65rem] font-bold bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] hover:border-[#FF6B00]/25 transition-all cursor-pointer uppercase tracking-wider"
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-2">
                      <input
                        type="number"
                        placeholder="Next sequence (e.g. 42)"
                        className="flex-1 h-[42px] px-4 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
                        value={manualBillNum}
                        onChange={e => setManualBillNum(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleValidateManualBillNum}
                          className="h-[42px] px-5 rounded-xl border border-white/10 text-white font-body font-[700] text-[0.7rem] uppercase tracking-[0.1em] transition-all hover:bg-white/5 hover:border-white/20 active:scale-95 cursor-pointer"
                        >
                          Validate
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveManualBillNum}
                          className="h-[42px] px-5 rounded-xl bg-[#FF6A00] text-white font-body font-[700] text-[0.7rem] uppercase tracking-[0.1em] shadow-lg transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                        >
                          Save Sequence
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10 animate-page-entrance">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <MessageSquare size={20} className="text-[#FF6B00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">WhatsApp Invoicing Automation</h3>
                </div>
                {/* Auto Send Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-white/40">Auto-Queue Invoices:</span>
                  <button 
                    onClick={handleToggleAutoSend}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                      settings.whatsappAutoSend !== false ? 'bg-[#FF6B00]' : 'bg-white/10'
                    }`}
                  >
                    <span 
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.whatsappAutoSend !== false ? 'translate-x-6' : 'translate-x-1'
                      }`} 
                    />
                  </button>
                </div>
              </div>

              {/* Live Status and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                  <p className="text-[0.6rem] font-bold text-white/30 uppercase tracking-widest">Pending in Queue</p>
                  <p className="text-2xl font-heading font-black text-white mt-2">
                    {waQueue.filter(m => m.status === 'pending').length}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                  <p className="text-[0.6rem] font-bold text-white/30 uppercase tracking-widest">Delivered Logs</p>
                  <p className="text-2xl font-heading font-black text-emerald-400 mt-2">
                    {waQueue.filter(m => m.status === 'success').length}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                  <p className="text-[0.6rem] font-bold text-white/30 uppercase tracking-widest">Failed Attempts</p>
                  <p className="text-2xl font-heading font-black text-rose-500 mt-2">
                    {waQueue.filter(m => m.status === 'failed').length}
                  </p>
                </div>
              </div>

              {/* Queue Table */}
              <div className="space-y-4 pt-4">
                <h4 className="text-[0.7rem] font-heading font-black text-white/40 uppercase tracking-widest">Real-time Automation Queue</h4>
                
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-primary/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-6 py-4 text-[0.65rem] font-black uppercase text-white/30 tracking-widest">Bill #</th>
                        <th className="px-6 py-4 text-[0.65rem] font-black uppercase text-white/30 tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-[0.65rem] font-black uppercase text-white/30 tracking-widest">Queue Status</th>
                        <th className="px-6 py-4 text-[0.65rem] font-black uppercase text-white/30 tracking-widest">Attempts</th>
                        <th className="px-6 py-4 text-[0.65rem] font-black uppercase text-white/30 tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loadingWa ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-white/30 font-bold uppercase tracking-wider">Syncing queue...</td>
                        </tr>
                      ) : waQueue.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-white/20 font-bold uppercase tracking-wider">No queued automation logs available</td>
                        </tr>
                      ) : (
                        waQueue.map(item => (
                          <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-accent text-[0.8rem]">#{item.billNo}</td>
                            <td className="px-6 py-4">
                              <p className="text-[0.8rem] font-bold text-white uppercase">{item.customerName}</p>
                              <p className="text-[0.65rem] text-white/30">{item.customerPhone}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-wider border ${
                                item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                item.status === 'failed' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-[0.8rem] text-white/40">{item.attempts || 1}</td>
                            <td className="px-6 py-4 text-right">
                              {item.status === 'failed' && (
                                <button 
                                  onClick={() => handleRetryWhatsApp(item.id)}
                                  className="px-3 py-1.5 bg-[#FF6B00] hover:brightness-110 text-white text-[0.62rem] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                  Retry
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'digital' && (
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10 animate-page-entrance">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Globe size={20} className="text-[#FF6A00]" />
                <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Digital Matrix</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Website URL</label>
                  <input value={settings.websiteUrl} onChange={e => setSettings({...settings, websiteUrl: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" />
                </div>
                <div className="space-y-2">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">WhatsApp Number</label>
                  <input value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" />
                </div>
                <div className="space-y-2">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Instagram Handle</label>
                  <input value={settings.instagram} onChange={e => setSettings({...settings, instagram: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" />
                </div>
                <div className="space-y-2">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Facebook Page</label>
                  <input value={settings.facebook} onChange={e => setSettings({...settings, facebook: e.target.value})} className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10 animate-page-entrance">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Bell size={20} className="text-[#FF6A00]" />
                <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Alert Protocols</h3>
              </div>
              <div className="space-y-6">
                {[
                  { id: 'alertLowStock', title: 'Low Stock Alerts', desc: 'Receive notifications when asset inventory drops below threshold.' },
                  { id: 'alertNewInquiry', title: 'New Inquiry Alerts', desc: 'Receive notifications for new customer communications.' },
                  { id: 'alertDailyRevenue', title: 'Daily Revenue Summary', desc: 'Receive automated daily intelligence briefs.' },
                ].map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-6 rounded-2xl bg-[#080C14] border border-white/5">
                    <div>
                      <h4 className="font-body font-[700] text-[0.9rem] text-white">{alert.title}</h4>
                      <p className="font-body font-[400] text-[0.7rem] text-white/40 mt-1">{alert.desc}</p>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, [alert.id]: !settings[alert.id]})}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${settings[alert.id] ? 'bg-[#FF6A00]' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${settings[alert.id] ? 'translate-x-[26px]' : 'translate-x-[4px]'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10 animate-page-entrance">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Shield size={20} className="text-[#FF6A00]" />
                <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Security Grid</h3>
              </div>
              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Current Protocol Key</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.current ? "text" : "password"} 
                      value={passwords.current} 
                      onChange={e => setPasswords({...passwords, current: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" 
                      placeholder="Enter current password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FF6A00] transition-colors"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">New Protocol Key</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.new ? "text" : "password"} 
                      value={passwords.new} 
                      onChange={e => setPasswords({...passwords, new: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" 
                      placeholder="Enter new password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FF6A00] transition-colors"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Confirm Protocol Key</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.confirm ? "text" : "password"} 
                      value={passwords.confirm} 
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" 
                      placeholder="Confirm new password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FF6A00] transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-8 animate-page-entrance">
              <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-[#FF6A00]" />
                    <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Admin Network</h3>
                  </div>
                  {isSuperAdmin && (
                    <button 
                      onClick={() => setIsAdminModalOpen(true)}
                      className="px-4 py-2 bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-lg text-[#FF6A00] text-[0.65rem] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#FF6A00] hover:text-white transition-all"
                    >
                      <UserPlus size={14} /> Add New Admin
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="p-6 rounded-2xl bg-[#080C14] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-[#FF6A00]/20 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#FF6A00]/10 group-hover:text-[#FF6A00] transition-all font-black text-lg uppercase">
                          {admin.name?.[0] || 'A'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-body font-[700] text-[0.95rem] text-white uppercase">{admin.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[0.55rem] font-black uppercase tracking-[0.15em] ${admin.role === 'superadmin' ? 'bg-[#FF6A00] text-white' : 'bg-white/10 text-white/50'}`}>
                              {admin.role}
                            </span>
                          </div>
                          <p className="text-[0.75rem] text-white/30 font-body font-[400] mt-1">{admin.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                          <p className="text-[0.65rem] text-white/20 uppercase tracking-widest font-black">Added At</p>
                          <p className="text-[0.75rem] text-white/50 mt-1">
                            {admin.addedAt?.toDate ? admin.addedAt.toDate().toLocaleDateString() : 'Initial'}
                          </p>
                        </div>
                        {isSuperAdmin && admin.email !== 'princegajera944@gmail.com' && admin.email !== currentUser.email && (
                          <button 
                            onClick={() => handleRemoveAdmin(admin.id, admin.name, admin.email)}
                            className="p-3 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && isSuperAdmin && (
            <div className="space-y-8 animate-page-entrance">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Logins Today', val: logs.filter(l => l.action === 'LOGIN' && l.timestamp?.toDate().toDateString() === new Date().toDateString()).length, icon: History, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: 'Active Now', val: logs.filter(l => l.action === 'LOGIN' && (new Date() - l.timestamp?.toDate()) < 3600000).length, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { label: 'Guest Logins', val: logs.filter(l => l.role === 'guest').length, icon: Eye, color: 'text-[#FF6A00]', bg: 'bg-[#FF6A00]/10' },
                  { label: 'Admin Logins', val: logs.filter(l => l.role === 'admin' || l.role === 'superadmin').length, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-[28px] bg-[#0D1220] border border-white/[0.05] flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-[1.5rem] font-heading font-black text-white leading-none">{stat.val}</h4>
                      <p className="text-[0.65rem] font-bold text-white/30 uppercase tracking-widest mt-1.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
                  <div className="flex items-center gap-3">
                    <History size={20} className="text-[#FF6A00]" />
                    <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Activity Audit Trail</h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                      <input 
                        placeholder="Search email/name..."
                        className="h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-[0.75rem] text-white outline-none focus:border-[#FF6A00]/50"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select 
                      className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-[0.7rem] font-bold text-white/60 outline-none"
                      value={logFilter}
                      onChange={e => setLogFilter(e.target.value)}
                    >
                      <option value="All">All Actions</option>
                      <option value="LOGIN">Logins</option>
                      <option value="LOGOUT">Logouts</option>
                      <option value="admin">Admins</option>
                      <option value="guest">Guests</option>
                    </select>
                    <button 
                      onClick={handleExportLogs}
                      className="h-10 px-4 bg-[#FF6A00] text-white rounded-lg text-[0.65rem] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#ff7b1a] transition-all"
                    >
                      <Download size={14} /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr>
                        <th className="py-4 px-6 text-[0.65rem] font-black uppercase tracking-widest text-white/20">Authorized Identity</th>
                        <th className="py-4 px-6 text-[0.65rem] font-black uppercase tracking-widest text-white/20 text-center">Action Protocol</th>
                        <th className="py-4 px-6 text-[0.65rem] font-black uppercase tracking-widest text-white/20">Operational Timestamp</th>
                        <th className="py-4 px-6 text-[0.65rem] font-black uppercase tracking-widest text-white/20">Network Address</th>
                        <th className="py-4 px-6 text-[0.65rem] font-black uppercase tracking-widest text-white/20 text-right">Device Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs
                        .filter(l => {
                          if (logFilter === 'All') return true;
                          if (logFilter === 'LOGIN' || logFilter === 'LOGOUT') return l.action === logFilter;
                          return l.role === logFilter;
                        })
                        .filter(l => l.userName.toLowerCase().includes(searchTerm.toLowerCase()) || l.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((log) => {
                          const isLogin = log.action === 'LOGIN';
                          const isAdmin = log.role === 'admin' || log.role === 'superadmin';
                          const isGuestRole = log.role === 'guest';
                          
                          let borderClass = 'border-l-4 border-transparent';
                          if (isLogin && isAdmin) borderClass = 'border-l-4 border-green-500';
                          if (isLogin && isGuestRole) borderClass = 'border-l-4 border-[#FF6A00]';
                          if (log.action === 'LOGOUT') borderClass = 'border-l-4 border-red-500';

                          return (
                            <tr key={log.id} className={`bg-[#080C14] hover:bg-white/[0.03] transition-colors ${borderClass}`}>
                              <td className="py-5 px-6 rounded-r-none rounded-l-none">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[0.7rem] font-black ${isAdmin ? 'bg-purple-500/10 text-purple-500' : 'bg-[#FF6A00]/10 text-[#FF6A00]'}`}>
                                    {log.userName?.[0] || 'U'}
                                  </div>
                                  <div>
                                    <p className="text-[0.8rem] font-bold text-white uppercase leading-none mb-1">{log.userName}</p>
                                    <p className="text-[0.65rem] text-white/20 font-mono">{log.userEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-6 text-center">
                                <span className={`px-2.5 py-1 rounded text-[0.6rem] font-black uppercase tracking-widest ${isLogin ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-5 px-6">
                                <p className="text-[0.8rem] text-white/50">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM dd, yyyy') : 'N/A'}</p>
                                <p className="text-[0.65rem] text-white/20 font-bold uppercase tracking-tighter mt-1">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'hh:mm:ss a') : ''}</p>
                              </td>
                              <td className="py-5 px-6 font-mono text-[0.75rem] text-white/30">{log.ipAddress}</td>
                              <td className="py-5 px-6 text-right rounded-l-none rounded-r-xl">
                                <div className="group/dev relative inline-block">
                                  <span className="text-[0.7rem] text-white/30 hover:text-white/60 cursor-help border-b border-dashed border-white/10">{log.browser} / {log.os}</span>
                                  <div className="absolute right-0 bottom-full mb-3 w-72 p-4 bg-black border border-white/10 rounded-2xl text-[0.65rem] text-white/50 invisible group-hover/dev:visible z-[100] shadow-2xl leading-relaxed">
                                    {log.device}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] space-y-10 animate-page-entrance">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Database size={20} className="text-[#FF6A00]" />
                <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Data Registry Statistics</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Products', val: products.length },
                  { label: 'Customers', val: customers.length },
                  { label: 'Bills', val: bills.length },
                  { label: 'Suppliers', val: suppliers.length },
                ].map(stat => (
                  <div key={stat.label} className="p-6 rounded-2xl bg-[#080C14] border border-white/5 text-center">
                    <h4 className="font-heading font-[800] text-[2rem] text-white leading-none">{stat.val}</h4>
                    <p className="font-body font-[600] text-[0.65rem] text-white/40 uppercase tracking-[0.16em] mt-2">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-8 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-8">
                <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
                  <Trash2 size={24} className="text-red-500" />
                  <div>
                    <h4 className="font-body font-[700] text-red-500 text-[1rem]">Danger Zone</h4>
                    <p className="text-white/40 text-[0.75rem] font-body font-[400] italic mt-1">Permanently erase data or reset the database. These actions are irreversible.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Authorization Code Input */}
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em]">Authorization Input Field</label>
                    <input 
                      type="text" 
                      placeholder="Type 'DELETE PRODUCTS' or 'WIPE SYSTEM' to authorize" 
                      value={confirmClear}
                      onChange={e => setConfirmClear(e.target.value)}
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-red-500 transition-all placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-white/[0.01] border border-white/5 space-y-4">
                      <h5 className="font-body font-[700] text-white text-[0.85rem] uppercase">Purge All Inventory</h5>
                      <p className="font-body font-[400] text-[0.7rem] text-white/40 leading-relaxed">
                        Delete all products currently listed in the inventory registry.
                      </p>
                      <button 
                        type="button"
                        onClick={handleWipeProducts} 
                        className="w-full h-[46px] rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-500 font-body font-[700] text-[0.7rem] uppercase tracking-[0.1em] transition-all"
                      >
                        Wipe Products
                      </button>
                    </div>

                    <div className="p-6 rounded-xl bg-white/[0.01] border border-white/5 space-y-4">
                      <h5 className="font-body font-[700] text-white text-[0.85rem] uppercase">Full System Reset</h5>
                      <p className="font-body font-[400] text-[0.7rem] text-white/40 leading-relaxed">
                        Wipe all invoices, customer files, product logs, and reset the bill counter sequence back to 0.
                      </p>
                      <button 
                        type="button"
                        onClick={handleSystemWipe} 
                        className="w-full h-[46px] rounded-xl bg-red-500 text-white font-body font-[700] text-[0.7rem] uppercase tracking-[0.1em] shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                      >
                        Reset Admin Panel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title="Enlist New Admin">
        <form onSubmit={handleAddAdmin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/30">Name</label>
            <input 
              required
              value={newAdmin.name}
              onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
              className="w-full h-[52px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
              placeholder="Full Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/30">Email Address</label>
            <input 
              required
              type="email"
              value={newAdmin.email}
              onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
              className="w-full h-[52px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
              placeholder="admin@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/30">Assign Role</label>
            <select 
              value={newAdmin.role}
              onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}
              className="w-full h-[52px] px-5 rounded-xl bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
            >
              <option value="admin">Standard Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          
          <div className="pt-4">
            <button 
              type="submit"
              disabled={saving}
              className="w-full h-[52px] bg-[#FF6A00] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#FF8C38] transition-all shadow-lg shadow-[#FF6A0022] flex items-center justify-center"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm Authorization'}
            </button>
          </div>
        </form>
      </Modal>

      <PasswordModal 
        isOpen={showCounterResetModal}
        onClose={() => setShowCounterResetModal(false)}
        onConfirm={executeResetBillCounter}
        title="Confirm Reset"
      />

      <PasswordModal 
        isOpen={showWipeProductsModal}
        onClose={() => setShowWipeProductsModal(false)}
        onConfirm={executeWipeProducts}
        title="Confirm Reset"
      />

      <PasswordModal 
        isOpen={showSystemWipeModal}
        onClose={() => setShowSystemWipeModal(false)}
        onConfirm={executeSystemWipe}
        title="Confirm Reset"
      />
    </div>
  );
};

export default Settings;
