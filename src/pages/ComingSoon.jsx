import React from 'react';
import { ShieldAlert, Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-page-entrance">
      <div className="max-w-xl w-full bg-[#0D121F] border border-white/10 rounded-[40px] p-12 text-center shadow-2xl relative overflow-hidden group">
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#FF6A00]/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-[#FF6A00]/10 rounded-3xl flex items-center justify-center text-[#FF6A00] mx-auto mb-10 border border-[#FF6A00]/20 group-hover:scale-110 transition-transform duration-500">
            <Construction size={48} />
          </div>
          
          <h1 className="text-[2.5rem] font-heading font-black text-white uppercase tracking-tighter leading-none mb-6">
            {title || "System Core Module"}
          </h1>
          
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse"></div>
            <span className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/40">Status: In Development</span>
          </div>

          <p className="text-[#A0A0B0] text-[1.1rem] leading-relaxed mb-12 max-w-md mx-auto">
            {description || "The high-security infrastructure for this module is currently being provisioned. Access will be granted in the next deployment cycle."}
          </p>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full h-[64px] bg-[#FF6A00] text-white font-black text-[0.9rem] uppercase tracking-[0.2em] rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-[#FF6A0022]"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Command Center
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
