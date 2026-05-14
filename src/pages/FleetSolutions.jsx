import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Truck, BarChart3, Clock, ShieldCheck, ArrowRight, Settings, Users, Activity } from 'lucide-react';
import { Button } from '../components/ui/Button';

const FleetSolutions = () => {
  const { isDark } = useTheme();

  const benefits = [
    { title: "Fleet Tracking", desc: "Digital registry of every tyre across your entire transport fleet.", icon: Truck },
    { title: "Cost Optimization", desc: "Data-driven insights to lower your CPK (Cost Per Kilometer).", icon: BarChart3 },
    { title: "Priority Service", desc: "Dedicated service lanes for commercial fleet turnarounds.", icon: Clock },
    { title: "Safety Audits", icon: ShieldCheck, desc: "Periodic computerized safety certifications for regulatory compliance." }
  ];

  return (
    <div className="min-h-screen">
      <div className="app-container section-padding space-y-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="label-tag inline-flex items-center gap-3">
              <Settings size={14} /> Enterprise Logistics
            </div>
            <h1 className="text-[var(--text-primary)]">
              FLEET <br/>
              <span className="text-[#FF6A00]">OPERATIONS.</span>
            </h1>
            <p className="font-medium max-w-xl">
              Powering Savarkundla's logistics industry with specialized commercial tyre management and performance diagnostics.
            </p>
            <div className="flex gap-6">
              <Button className="h-20 px-16 font-heading font-bold italic text-[0.9rem] tracking-[0.2em] uppercase rounded-none bg-[#FF6A00] hover:bg-[#FF8C38] text-white shadow-2xl">
                Connect with Expert
              </Button>
            </div>
          </div>
          <div className="relative animate-in fade-in zoom-in duration-1000">
            <div className="aspect-square bg-slate-900 overflow-hidden border border-[var(--border-subtle)] pro-card p-0 shadow-2xl">
              <img src="https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Fleet" className="w-full h-full object-cover opacity-60" />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-[#FF6A00] p-10 shadow-2xl animate-float text-white">
              <p className="text-4xl font-heading font-extrabold italic tracking-tighter">500+</p>
              <p className="text-[0.72rem] font-heading font-bold tracking-[0.18em] uppercase opacity-80 mt-1">Commercial Units Managed</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="pro-card group">
              <div className="flex items-start justify-between mb-12">
                <div className="w-20 h-20 bg-[#FF6A001A] text-[#FF6A00] flex items-center justify-center transition-transform group-hover:scale-110">
                  <b.icon size={40} />
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-full"><Activity size={20} /></div>
              </div>
              <h3 className="text-3xl mb-6 italic tracking-tighter">{b.title}</h3>
              <p className="font-medium leading-relaxed mb-10">{b.desc}</p>
              <Button variant="ghost" className="p-0 text-[#FF6A00] font-heading font-bold italic text-[0.85rem] tracking-[0.15em] uppercase hover:bg-transparent hover:translate-x-4 transition-all">
                Learn Protocol <ArrowRight size={20} className="ml-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FleetSolutions;
