import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Droplets, CheckCircle2, Wind, Gauge, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

const NitrogenFilling = () => {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen">
      <div className="app-container section-padding space-y-24">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-12 h-1 bg-[#FF6A00] mx-auto"></div>
          <h1 className="text-[var(--text-primary)] uppercase">
            NITROGEN <span className="text-[#FF6A00]">FILLING</span>
          </h1>
          <p className="max-w-2xl mx-auto font-medium">
            Superior inflation technology for cooler running tyres and sustained pressure levels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <h2 className="text-[var(--text-primary)] leading-tight uppercase italic">The Nitrogen <br/> Advantage</h2>
            <div className="space-y-10">
              {[
                { title: "Cooler Operation", desc: "Nitrogen keeps your tyres at lower temperatures during high-speed highway driving." },
                { title: "Stable Pressure", desc: "Nitrogen molecules are larger, meaning they leak 3x slower than compressed air." },
                { title: "Rim Protection", desc: "Unlike regular air, nitrogen is dry and prevents internal rim corrosion." },
                { title: "Enhanced Grip", desc: "Consistent pressure leads to a better contact patch and superior road handling." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
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
          <div className="aspect-square bg-slate-900 rounded-full overflow-hidden border border-[var(--border-subtle)] pro-card p-0 shadow-2xl relative animate-in fade-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
            <img src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1200" alt="Nitrogen Filling" className="w-full h-full object-cover opacity-40 grayscale" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Wind size={120} className="text-emerald-500/50 animate-bounce-slow" strokeWidth={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NitrogenFilling;
