import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Shield, Calendar, MapPin, Phone, Edit3, Camera } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Profile = () => {
  const { profile } = useAuthContext();
  const { isDark } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Card */}
      <div className={`relative overflow-hidden rounded-[3rem] p-12 border transition-all ${
        isDark ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
      }`}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/10 to-transparent -z-10" />
        
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[2.5rem] bg-orange-500 flex items-center justify-center text-white text-6xl font-black shadow-2xl shadow-orange-500/40 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              {profile?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl text-orange-500 border border-slate-100 dark:border-white/5 hover:scale-110 active:scale-95 transition-all">
              <Camera size={20} />
            </button>
          </div>
          
          <div className="text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">
              <Shield size={12} fill="currentColor" /> System Administrator
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">{profile?.name || 'PRINCE'}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} className="text-orange-500" /> {profile?.email || 'admin@chandrakant.com'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <Button className="h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-500/20">
                <Edit3 size={16} /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'} space-y-8`}>
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-6">
            <User size={20} className="text-orange-500" /> Identity Credentials
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Role</span>
              <span className="text-xs font-black uppercase tracking-tighter text-orange-500">{profile?.role || 'OWNER'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</span>
              <span className="text-xs font-black uppercase tracking-tighter">{profile?.phone || '+91 99999 88888'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Join Date</span>
              <span className="text-xs font-black uppercase tracking-tighter">May 2024</span>
            </div>
          </div>
        </div>

        <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'} space-y-8`}>
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-6">
            <MapPin size={20} className="text-orange-500" /> Operational Base
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Main Hub</span>
              <span className="text-xs font-black uppercase tracking-tighter">Ahmedabad, Gujarat</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workstation</span>
              <span className="text-xs font-black uppercase tracking-tighter">Admin Terminal 01</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Key</span>
              <span className="text-xs font-black uppercase tracking-tighter">SHIELD-992-ALPHA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
