import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, CheckCircle2, AlertTriangle, Gauge, Sun, Droplets, Wind, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

const TyreCare = () => {
  const { isDark } = useTheme();

  const tips = [
    { title: "Pressure Check", desc: "Maintain optimal PSI for better fuel efficiency and safety. Check weekly.", icon: Gauge },
    { title: "Alignment", desc: "Incorrect alignment causes rapid wear and compromises handling.", icon: ShieldCheck },
    { title: "Rotation", desc: "Rotate every 5,000km to ensure even tread wear across all tyres.", icon: Wind },
    { title: "Tread Depth", desc: "Monitor tread depth for wet weather grip. Minimum 1.6mm is critical.", icon: Droplets }
  ];

  return (
    <div className="min-h-screen">
      <div className="app-container section-padding space-y-24">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-12 h-1 bg-[#FF6A00] mx-auto"></div>
          <h1 className="text-[var(--text-primary)] uppercase">
            TYRE <span className="text-[#FF6A00]">INTELLIGENCE</span>
          </h1>
          <p className="max-w-2xl mx-auto font-medium">
            Expert maintenance protocols to maximize your tyre lifespan and road safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tips.map((tip, i) => (
            <div key={i} className="pro-card group">
              <div className="w-16 h-16 bg-[#FF6A001A] text-[#FF6A00] flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <tip.icon size={32} />
              </div>
              <h3 className="mb-4">{tip.title}</h3>
              <p className="font-medium leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-12 md:p-24 relative overflow-hidden pro-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6A0005] rounded-full blur-[100px]"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div className="space-y-10">
              <h2 className="text-[var(--text-primary)] leading-tight">The Safety <br/> Audit Protocol</h2>
              <ul className="space-y-6">
                {[
                  "Visual inspection for cracks or bulges",
                  "Digital tread depth measurement",
                  "Computerized balancing certification",
                  "Nitrogen purity verification"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-5">
                    <CheckCircle2 size={24} className="text-[#FF6A00]" />
                    <span className="text-lg font-heading font-bold italic uppercase text-[var(--text-primary)] tracking-wide">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="aspect-video rounded-none shadow-2xl overflow-hidden border border-[var(--border-subtle)] bg-black">
              <img src="https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Tyre Check" className="w-full h-full object-cover opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TyreCare;
