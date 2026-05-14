import React from 'react';
import { ArrowRight, Star, ShieldCheck, Zap, Award, Cpu, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Website = () => {
  const brands = ['MRF', 'APOLLO', 'JK TYRE', 'CEAT', 'BRIDGESTONE', 'GOODYEAR', 'MICHELIN', 'DUNLOP'];
  
  const services = [
    { title: 'Tyre Fitting', path: '/services/tyre-fitting', desc: 'Expert mounting and balancing for all vehicle types with computerized precision.', icon: Zap },
    { title: 'Laser Alignment', path: '/services/laser-alignment', desc: 'Precision laser alignment to increase tyre life and ensure highway safety.', icon: ShieldCheck },
    { title: 'Nitrogen Filling', path: '/services/nitrogen-filling', desc: 'Cooler running tyres for better fuel efficiency and highway performance.', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-white selection:bg-[#FF6A00] selection:text-white overflow-x-hidden">
      
      {/* Hero Section */}
      <section id="home" className="hero-padding app-container flex items-center relative min-h-[100vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-[#FF6A0005] rounded-full blur-[150px] -z-10"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center py-20 w-full">
          <div className="space-y-10 text-center lg:text-left">
            <div className="label-tag inline-flex items-center gap-3">
              <Star size={14} fill="currentColor" /> SAVARKUNDLA'S ABSOLUTE HUB
            </div>
            {/* RULE B: Title Case for headlines */}
            <h1 className="italic">
              Engineering <br />
              <span className="text-[#FF6A00]">Dominance.</span>
            </h1>
            {/* RULE C: Sentence case for tagline */}
            <p className="max-w-xl mx-auto lg:mx-0">
              The absolute authority in multi-brand tyres and world-class computerized diagnostics. Redefining performance for every mile since 1998.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-6 pt-4">
              <Button 
                onClick={() => document.getElementById('services')?.scrollIntoView({behavior: 'smooth'})} 
                className="h-16 px-12 font-heading font-bold italic text-[0.85rem] tracking-[0.15em] uppercase rounded-none bg-[#FF6A00] hover:bg-[#FF8C38] text-white shadow-xl hover:shadow-orange-500/20 group"
              >
                EXPLORE SOLUTIONS <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Link to="/fleet-solutions">
                <Button variant="outline" className="h-16 px-12 font-heading font-bold italic text-[0.85rem] tracking-[0.15em] uppercase rounded-none border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]">
                  FLEET LOGISTICS
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="aspect-[4/5] bg-[#0D1220] rounded-none overflow-hidden border border-[var(--border-subtle)] relative z-10 pro-card p-0">
               <img 
                 src="https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                 alt="Performance Hub" 
                 className="w-full h-full object-cover opacity-60"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>
            
            <div className="absolute -right-10 top-1/3 z-20 bg-[#FF6A00] p-8 shadow-2xl text-white">
               <Truck size={32} className="mb-3" />
               <p className="text-3xl font-heading font-extrabold italic leading-none">500+</p>
               <p className="text-[0.72rem] font-heading font-bold tracking-[0.18em] uppercase opacity-80 mt-1">FLEETS MANAGED</p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Ticker */}
      <section className="py-12 border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee hover:pause-animation cursor-pointer">
          {[...brands, ...brands].map((brand, i) => (
            <div key={i} className="flex items-center gap-8 mx-10 ticker-brand cursor-pointer hover:text-[#FF6A00] transition-colors duration-300 group">
              <span className="text-2xl font-heading font-extrabold italic uppercase group-hover:text-[#FF6A00]">{brand}</span>
              <div className="w-1.5 h-1.5 bg-[#FF6A00] rounded-full group-hover:scale-150 transition-transform"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section-padding app-container">
        <div className="space-y-24">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-12 h-1 bg-[#FF6A00]"></div>
            <h2 className="label-tag">CORE COMPETENCIES</h2>
            <h2 className="italic">The Precision Suite</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((s, i) => (
              <Link to={s.path} key={i} className="pro-card group flex flex-col justify-between min-h-[480px] p-10 rounded-2xl bg-[#0b0f19] border border-white/[0.05] hover:bg-[#111724] hover:border-[#FF6A00]/30 hover:-translate-y-3 shadow-xl hover:shadow-[#FF6A00]/10 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6A00] opacity-0 group-hover:opacity-[0.03] rounded-full blur-3xl transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 flex items-center justify-center mb-12 bg-[#1a1f2e] text-[#FF6A00] rounded-xl group-hover:scale-110 group-hover:bg-[#FF6A00]/10 transition-all duration-300 shadow-md">
                    <s.icon size={28} strokeWidth={2} />
                  </div>
                  {/* RULE B: Title Case for card titles */}
                  <h3 className="mb-6 italic text-[1.4rem] font-heading font-extrabold tracking-tight group-hover:text-[#FF6A00] transition-colors">0{i+1}. {s.title}</h3>
                  {/* RULE C: Sentence case for card descriptions */}
                  <p className="card-description mb-8 text-white/60 font-medium text-[0.95rem] leading-relaxed group-hover:text-white/80 transition-colors">{s.desc}</p>
                </div>
                <div className="label-tag flex items-center gap-3 transition-all group-hover:gap-6 text-[#FF6A00] relative z-10">
                  VIEW PROTOCOL <ArrowRight size={18} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-padding app-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative">
            <div className="aspect-square bg-[#0D1220] overflow-hidden border border-[var(--border-subtle)] pro-card p-0">
              <img src="https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Workshop" className="w-full h-full object-cover opacity-50" />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-[#FF6A00] p-12 shadow-2xl text-white">
               <p className="text-5xl font-heading font-extrabold italic leading-none">25+</p>
               <p className="text-[0.72rem] font-heading font-bold tracking-[0.18em] uppercase opacity-80 mt-2">YEARS OF LEGACY</p>
            </div>
          </div>
          <div className="space-y-10">
            <div className="w-12 h-1 bg-[#FF6A00]"></div>
            <h2 className="leading-tight italic">Reliability <br/> <span className="text-[#FF6A00]">Redefined.</span></h2>
            {/* RULE C: Sentence case for about text */}
            <p className="font-medium">
              Chandrakant Traders has been at the forefront of automotive excellence in Savarkundla for over two decades. Our commitment to precision engineering and customer safety has made us the undisputed leader in tyre technology.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-6">
               <div className="space-y-2">
                 <p className="text-3xl font-heading font-extrabold text-[#FF6A00] italic uppercase">10K+</p>
                 <p className="label-tag opacity-60">CUSTOMERS SERVED</p>
               </div>
               <div className="space-y-2">
                 <p className="text-3xl font-heading font-extrabold text-[#FF6A00] italic uppercase">100%</p>
                 <p className="label-tag opacity-60">QUALITY ASSURED</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Section */}
      <section className="section-padding app-container">
        <div className="bg-[var(--bg-card)] p-12 md:p-24 relative overflow-hidden border border-[var(--border-subtle)] shadow-xl">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FF6A0005] rounded-full blur-[200px] -z-10"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <h2 className="leading-tight italic">The 4-Step <br/> <span className="text-[#FF6A00]">Precision</span> <br/> Protocol.</h2>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Digital Diagnostics', desc: 'Computerized tread and wear analysis.' },
                  { step: '02', title: 'Laser Alignment', desc: 'Micron-perfect geometric calibration.' },
                  { step: '03', title: 'Nitrogen Infusion', desc: 'Aero-grade cooling for extreme endurance.' },
                  { step: '04', title: 'Quality Cert', desc: 'Final performance verification seal.' }
                ].map((p, i) => (
                  <div key={i} className="flex gap-6 group cursor-pointer hover:bg-white/[0.02] p-4 -ml-4 rounded-lg transition-all duration-300 border border-transparent hover:border-[#FF6A00]/20">
                    <span className="text-3xl font-heading font-extrabold text-[#FF6A0033] group-hover:text-[#FF6A00] transition-colors shrink-0">{p.step}</span>
                    <div>
                      <h3 className="mb-1 italic group-hover:text-[#FF6A00] transition-colors duration-300">{p.title}</h3>
                      {/* RULE C: Sentence case for step description */}
                      <p className="text-[0.85rem] font-normal leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity duration-300">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
               <div className="aspect-square bg-[var(--bg-secondary)] rounded-full border border-[var(--border-subtle)] flex items-center justify-center relative animate-spin-slow">
                 <Cpu size={140} className="text-[#FF6A001A]" strokeWidth={1} />
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-6xl font-heading font-extrabold italic tracking-tighter">99.9%</p>
                  <p className="label-tag text-[#FF6A00]">ACCURACY</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding app-container">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="italic">Ready to <span className="text-[#FF6A00]">Remaster</span> Your Drive?</h2>
          <div className="flex justify-center">
            <Link to="/login">
              <Button className="h-20 px-16 font-heading font-bold italic text-[0.9rem] tracking-[0.2em] uppercase rounded-none bg-[#FF6A00] hover:bg-[#FF8C38] text-white shadow-2xl">
                LAUNCH PORTAL
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .pause-animation {
          animation-play-state: paused;
        }
        .animate-spin-slow {
          animation: spin 30s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Website;
