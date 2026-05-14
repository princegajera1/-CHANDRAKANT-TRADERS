import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Zap, CheckCircle2, ShieldCheck, Clock, Settings, Activity } from 'lucide-react';
import { Button } from '../components/ui/Button';

const TyreFitting = () => {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen">
      <div className="app-container section-padding space-y-24">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-12 h-1 bg-[#FF6A00] mx-auto"></div>
          <h1 className="text-[var(--text-primary)] uppercase">
            TYRE <span className="text-[#FF6A00]">FITTING</span>
          </h1>
          <p className="max-w-2xl mx-auto font-medium">
            Expert mounting and precision balancing using world-class computerized machinery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <h2 className="text-[var(--text-primary)] leading-tight uppercase italic">Superior <br/> Fitting Protocol</h2>
            <div className="space-y-10">
              {[
                { title: "Computerized Balancing", desc: "Eliminate vibration and ensure a smooth ride at all speeds." },
                { title: "Rim Protection", desc: "Specialized tools to ensure no damage to your expensive alloys." },
                { title: "Valve Replacement", desc: "Complimentary high-quality valve check with every fitting." },
                { title: "Fast Turnaround", desc: "Average fitting time under 20 minutes with our pro team." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="w-14 h-14 bg-[#FF6A001A] text-[#FF6A00] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-bold italic uppercase text-[var(--text-primary)] tracking-wide">{item.title}</h4>
                    <p className="font-medium mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square bg-slate-900 overflow-hidden border border-[var(--border-subtle)] pro-card p-0 shadow-2xl animate-in fade-in zoom-in duration-1000">
            <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200" alt="Tyre Fitting" className="w-full h-full object-cover opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TyreFitting;
