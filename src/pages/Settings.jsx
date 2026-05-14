import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Store, Globe, Bell, Shield, Database, Save, Trash2, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useBills } from '../hooks/useBills';
import { useSuppliers } from '../hooks/useSuppliers';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [settings, setSettings] = useState({
    name: 'CHANDRAKANT TRADERS', 
    phone: '+91 99240 58859', 
    address: 'Savarkundla, Gujarat', 
    gstNo: '24ABTPM0428L1ZY', 
    upiId: 'traders@upi', 
    lowStockThreshold: 5,
    websiteUrl: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    alertLowStock: true,
    alertNewInquiry: true,
    alertDailyRevenue: true
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [confirmClear, setConfirmClear] = useState('');

  const { products } = useProducts();
  const { customers } = useCustomers();
  const { bills } = useBills();
  const { suppliers } = useSuppliers();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'shop'));
        if (snap.exists()) setSettings(snap.data());
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
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

    if (activeTab === 'data') return; // Handled separately

    setSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'shop'), settings);
      toast.success("Infrastructure parameters updated");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = () => {
    if (confirmClear === 'CONFIRM') {
      toast.success('System wipe initiated (Disabled for safety)');
      setConfirmClear('');
    } else {
      toast.error('Type CONFIRM to proceed');
    }
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
            { id: 'shop', icon: Store, label: 'Shop Profile' },
            { id: 'digital', icon: Globe, label: 'Digital Matrix' },
            { id: 'alerts', icon: Bell, label: 'Alert Protocols' },
            { id: 'security', icon: Shield, label: 'Security Grid' },
            { id: 'data', icon: Database, label: 'Data Registry' }
          ].map((item) => (
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
              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <Store size={20} className="text-[#FF6A00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Professional Identity</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Trade Designation</label>
                    <input 
                      value={settings.name} 
                      onChange={e => setSettings({...settings, name: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Terminal Hotline</label>
                    <input 
                      value={settings.phone} 
                      onChange={e => setSettings({...settings, phone: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Operational Coordinates</label>
                    <input 
                      value={settings.address} 
                      onChange={e => setSettings({...settings, address: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Tax Identity (GSTIN)</label>
                    <input 
                      value={settings.gstNo} 
                      onChange={e => setSettings({...settings, gstNo: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] uppercase bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Digital Settlement (UPI)</label>
                    <input 
                      value={settings.upiId} 
                      onChange={e => setSettings({...settings, upiId: e.target.value})} 
                      className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-8 pt-10 border-t border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <Bell size={20} className="text-[#FF6A00]" />
                  <h3 className="font-body font-[700] text-[0.72rem] text-white/[0.50] uppercase tracking-[0.18em]">Threshold Protocols</h3>
                </div>
                <div className="max-w-xs space-y-2">
                  <label className="font-body font-[600] text-[0.65rem] text-white/[0.46] uppercase tracking-[0.12em] ml-1">Critical Stock Alarm (Units)</label>
                  <input 
                    type="number"
                    value={settings.lowStockThreshold} 
                    onChange={e => setSettings({...settings, lowStockThreshold: Number(e.target.value)})} 
                    className="w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20"
                  />
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

              <div className="mt-12 p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <Trash2 size={24} className="text-red-500" />
                  <div>
                    <h4 className="font-body font-[700] text-red-500 text-[1rem]">Danger Zone</h4>
                    <p className="text-white/40 text-[0.75rem] font-body font-[400] italic mt-1">Permanently erase all system data. This action is irreversible.</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Type CONFIRM to authorize" 
                    value={confirmClear}
                    onChange={e => setConfirmClear(e.target.value)}
                    className="flex-1 h-[52px] px-5 rounded-xl text-[0.875rem] font-body font-[400] bg-[#080C14] border border-white/10 text-white outline-none focus:border-red-500 transition-all admin-input-focus placeholder:font-body placeholder:italic placeholder:text-[0.875rem] placeholder:text-white/20" 
                  />
                  <button onClick={handleClearData} className="h-[52px] px-8 rounded-xl bg-red-500 text-white font-body font-[700] text-[0.75rem] uppercase tracking-[0.12em] hover:bg-red-600 transition-colors">Clear All Data</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
