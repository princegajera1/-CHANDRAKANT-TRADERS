import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, CheckCircle2, Activity, Target, Zap, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';

const LaserAlignment = () => {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen">
      <div className="app-container section-padding space-y-24">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-12 h-1 bg-[#FF6A00] mx-auto"></div>
          <h1 className="text-[var(--text-primary)] uppercase">
            LASER <span className="text-[#FF6A00]">ALIGNMENT</span>
          </h1>
          <p className="max-w-2xl mx-auto font-medium">
            Advanced 3D laser alignment technology to ensure your vehicle drives straight and safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="aspect-[4/5] bg-slate-900 overflow-hidden border border-[var(--border-subtle)] pro-card p-0 shadow-2xl order-2 md:order-1 animate-in fade-in zoom-in duration-1000">
            <img src="https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Laser Alignment" className="w-full h-full object-cover opacity-60" />
          </div>
          <div className="space-y-12 order-1 md:order-2">
            <h2 className="text-[var(--text-primary)] leading-tight uppercase italic">Precision <br/> Engineering</h2>
            <div className="space-y-10">
              {[
                { title: "3D Digital Scanning", desc: "Our sensors detect even the slightest deviation in your vehicle's suspension geometry." },
                { title: "Fuel Efficiency", desc: "Properly aligned wheels reduce rolling resistance, saving you money at the pump." },
                { title: "Tyre Longevity", desc: "Prevent uneven tread wear and extend the life of your tyres by up to 30%." },
                { title: "Highway Stability", desc: "Ensure your car stays perfectly centered, reducing driver fatigue on long trips." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-bold italic uppercase text-[var(--text-primary)] tracking-wide">{item.title}</h4>
                    <p className="font-medium mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="h-20 px-16 rounded-none font-heading font-bold italic text-[0.9rem] tracking-[0.2em] uppercase bg-[#FF6A00] hover:bg-[#FF8C38] text-white shadow-2xl">
              Book Alignment Service
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaserAlignment;
