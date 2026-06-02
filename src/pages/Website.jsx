import React, { useState } from 'react';
import { 
  Star, ArrowRight, Phone, ShieldCheck, Award, Zap, Check, 
  MapPin, Wrench, Package, Cpu, Clock, Landmark, MessageSquare 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Website = () => {
  // Brand list for scrolling ticker
  const brands = [
    'MRF', 'APOLLO', 'JK TYRE', 'CEAT', 'BRIDGESTONE', 
    'GOODYEAR', 'MICHELIN', 'TVS', 'FALKEN', 'YOKOHAMA', 
    'PIRELLI', 'CONTINENTAL'
  ];

  // Core 6 Services
  const services = [
    { 
      num: '01', 
      title: 'Tyre Sales', 
      desc: 'Largest stock of car, bike and commercial tyres in Amreli district. Genuine brands guaranteed.', 
      icon: Package, 
      featured: false 
    },
    { 
      num: '02', 
      title: 'Tyre Fitting', 
      desc: 'Expert mounting and balancing with computerized precision for all vehicle types.', 
      icon: Zap, 
      featured: false 
    },
    { 
      num: '03', 
      title: 'Laser Wheel Alignment', 
      desc: 'Micron-perfect geometric calibration to extend tyre life and improve handling.', 
      icon: ShieldCheck, 
      featured: true 
    },
    { 
      num: '04', 
      title: 'Wheel Balancing', 
      desc: 'Dynamic balancing to eliminate vibration and ensure smooth highway performance.', 
      icon: Award, 
      featured: false 
    },
    { 
      num: '05', 
      title: 'Nitrogen Filling', 
      desc: 'Aero-grade nitrogen for cooler running, better fuel efficiency and longer tyre life.', 
      icon: Cpu, 
      featured: false 
    },
    { 
      num: '06', 
      title: 'Puncture Repair', 
      desc: 'Fast tubeless and tube-type puncture repair while you wait in our workshop.', 
      icon: Wrench, 
      featured: false 
    }
  ];

  // 4 Pillars of Trust
  const pillars = [
    { num: '01', title: 'GENUINE STOCK', desc: 'Only 100% authentic tyres directly from manufacturers. Zero counterfeit. Ever.' },
    { num: '02', title: 'EXPERT TEAM', desc: 'Our technicians have 15+ years of hands-on experience with all vehicle types and tyre brands.' },
    { num: '03', title: 'FAIR PRICING', desc: 'Transparent pricing with no hidden charges. You pay exactly what you\'re quoted.' },
    { num: '04', title: 'AFTER-SALE SUPPORT', desc: 'We stand behind every tyre we sell. Free pressure checks and advice, always.' }
  ];

  // 4-Step Protocol
  const protocol = [
    { num: '01', title: 'Inspection', desc: 'We check your current tyres for wear, damage and fit.' },
    { num: '02', title: 'Selection', desc: 'We recommend the best tyre for your vehicle, usage and budget.' },
    { num: '03', title: 'Fitting', desc: 'Professional mounting and balancing with computerized equipment.' },
    { num: '04', title: 'Final Check', desc: 'Pressure, alignment check and road-readiness verification.' }
  ];

  // Testimonials
  const testimonials = [
    {
      text: "Chandrakant Traders has been my go-to for tyres for over 10 years. Best prices in the district and the fitting is always perfect.",
      author: "Ramesh B.",
      location: "Savarkundla"
    },
    {
      text: "Got my truck tyres replaced here. They had the exact size I needed in stock and the price was better than Rajkot. Highly recommend.",
      author: "Haresh P.",
      location: "Amreli"
    },
    {
      text: "The wheel alignment service is excellent. My car drives so much better now. The team is knowledgeable and honest.",
      author: "Priya M.",
      location: "Botad"
    }
  ];

  // Tyre Finder State Configuration
  const [vehicleType, setVehicleType] = useState('Car');
  const [width, setWidth] = useState('195');
  const [aspect, setAspect] = useState('65');
  const [rim, setRim] = useState('15');
  const [finderResult, setFinderResult] = useState('');

  const handleTyreFinderSubmit = (e) => {
    e.preventDefault();
    const sizeStr = `${width}/${aspect} R${rim}`;
    setFinderResult(`Call us at 99240 58659 for availability and best price on ${sizeStr}!`);
  };

  const getWhatsAppMessage = () => {
    const sizeStr = `${width}/${aspect} R${rim}`;
    const text = `Hi, I need a tyre in size ${sizeStr} for my ${vehicleType}. Please share availability and price.`;
    return `https://wa.me/919924058659?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white selection:bg-[#FF6B00] selection:text-white overflow-x-hidden font-body">
      
      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-[999] no-print">
        {/* Call Float Button */}
        <a 
          href="tel:+919924058659" 
          className="w-14 h-14 bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,107,0,0.4)] transition-all active:scale-95 pulse-orange-glow"
          title="Call Shop Now"
        >
          <Phone size={24} />
        </a>
        {/* WhatsApp Float Button */}
        <a 
          href="https://wa.me/919924058659?text=Hi%2C%20I%20need%20help%20with%20tyres" 
          target="_blank" 
          rel="noreferrer"
          className="w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-all active:scale-95 pulse-green-glow"
          title="WhatsApp Support"
        >
          <MessageSquare size={24} fill="currentColor" />
        </a>
      </div>

      {/* SECTION 2 — HERO SECTION */}
      <section id="home" className="pt-32 pb-20 px-6 sm:px-12 max-w-[1280px] mx-auto flex items-center relative min-h-[90vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-[#FF6B00]/[0.015] rounded-full blur-[150px] -z-10"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-10 w-full">
          {/* Left Text */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/5 text-[#FF6B00] text-[0.68rem] font-bold uppercase tracking-[0.15em] mx-auto lg:mx-0">
              <Star size={11} fill="currentColor" className="animate-spin-slow" /> SAVARKUNDLA'S #1 TYRE DESTINATION
            </div>
            <h1 className="text-[3.2rem] sm:text-[4.5rem] font-heading font-black italic leading-[0.95] text-white uppercase tracking-tight">
              Your Road. <br />
              <span className="text-[#FF6B00] drop-shadow-[0_0_12px_rgba(255,107,0,0.2)]">Our Obsession.</span>
            </h1>
            <p className="max-w-xl mx-auto lg:mx-0 text-white/70 text-[0.95rem] leading-[1.65]">
              Gujarat's most trusted multi-brand tyre dealer. From cars to commercial vehicles — we stock, fit, balance and align with precision. Serving Savarkundla since 1998.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => document.getElementById('tyre-finder')?.scrollIntoView({behavior: 'smooth'})} 
                className="h-16 px-10 font-heading font-black italic text-[0.8rem] tracking-[0.15em] uppercase bg-[#FF6B00] hover:bg-[#FF8533] text-white shadow-xl hover:shadow-[#FF6B00]/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                EXPLORE TYRES <ArrowRight size={16} />
              </button>
              <a href="tel:+919924058659" className="h-16 px-10 font-heading font-black italic text-[0.8rem] tracking-[0.15em] uppercase border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-[#FF6B00]/40 text-white transition-all duration-300 flex items-center justify-center gap-2">
                CALL NOW: 99240 58659
              </a>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-white/5 text-left">
              {[
                { val: '25+', label: 'Years in Business' },
                { val: '10K+', label: 'Customers Served' },
                { val: '500+', label: 'Tyre Sizes in Stock' },
                { val: '100%', label: 'Genuine Products' }
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-2xl font-heading font-black italic text-[#FF6B00]">{stat.val}</p>
                  <p className="text-[0.62rem] font-bold text-white/40 uppercase tracking-widest leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image Graphic */}
          <div className="relative hidden lg:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-[#FF6B00] blur-[120px] opacity-[0.08] z-0"></div>
            
            <div className="aspect-[4/5] bg-secondary rounded-[32px] overflow-hidden border border-white/5 relative z-10 shadow-2xl group">
               <img 
                 src="https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                 alt="Garage Diagnostic Hub" 
                 className="w-full h-full object-cover opacity-80 group-hover:scale-102 transition-transform duration-700"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent opacity-80"></div>
            </div>
            
            {/* CEAT AUTHORISED DEALER Card */}
            <div className="absolute -right-8 bottom-12 z-20 bg-gradient-to-br from-[#FF6B00] to-[#E65C00] px-8 py-6 rounded-2xl shadow-[0_20px_50px_rgba(255,107,0,0.35)] border border-white/20 text-white flex items-center gap-4 transform hover:-translate-y-1 transition-all duration-300 w-72">
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner border border-white/20">
                  <Check size={24} className="text-white" strokeWidth={3} />
               </div>
               <div>
                 <p className="text-[0.62rem] font-black tracking-[0.2em] text-white/80 uppercase">CEAT PARTNER</p>
                 <p className="text-[1.1rem] font-heading font-black italic uppercase leading-none mt-1">AUTHORISED DEALER</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — BRAND MARQUEE */}
      <section id="brands" className="py-8 border-y border-white/5 bg-[#111827] overflow-hidden whitespace-nowrap relative z-10 select-none no-print">
        {/* Forward scrolling marquee */}
        <div className="flex animate-marquee-left hover:pause-animation cursor-pointer mb-5">
          {[...brands, ...brands].map((brand, i) => (
            <div key={i} className="flex items-center gap-6 mx-12 ticker-brand cursor-pointer hover:text-[#FF6B00] transition-colors duration-300 group">
              <span className="text-xl font-heading font-black italic uppercase text-white/50 group-hover:text-[#FF6B00] transition-colors">{brand}</span>
              <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full"></div>
            </div>
          ))}
        </div>
        {/* Reverse scrolling marquee */}
        <div className="flex animate-marquee-right hover:pause-animation cursor-pointer border-t border-white/[0.02] pt-5">
          {[...brands, ...brands].map((brand, i) => (
            <div key={i} className="flex items-center gap-6 mx-12 ticker-brand cursor-pointer hover:text-[#FF6B00] transition-colors duration-300 group">
              <span className="text-xl font-heading font-black italic uppercase text-white/30 group-hover:text-[#FF6B00] transition-colors">{brand}</span>
              <div className="w-1.5 h-1.5 bg-[#FF6B00]/40 rounded-full"></div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — CORE SERVICES */}
      <section id="services" className="py-24 px-6 sm:px-12 max-w-[1280px] mx-auto relative z-10">
        <div className="space-y-20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-1 bg-[#FF6B00]"></div>
            <span className="text-[#FF6B00] text-[0.7rem] font-bold uppercase tracking-[0.2em]">CORE SERVICES</span>
            <h2 className="text-[2.2rem] sm:text-[3rem] font-heading font-black italic uppercase leading-none">Everything Your Vehicle Needs</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s, i) => (
              <div 
                key={i} 
                className={`flex flex-col justify-between min-h-[420px] p-8 rounded-2xl bg-[#141B2D] border ${
                  s.featured ? 'border-[#FF6B00] shadow-[0_0_25px_rgba(255,107,0,0.15)]' : 'border-white/5'
                } hover:border-[#FF6B00]/30 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6B00] opacity-0 group-hover:opacity-[0.02] rounded-full blur-2xl transition-opacity duration-300"></div>
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div className={`w-14 h-14 flex items-center justify-center bg-[#0B0F1A] text-[#FF6B00] border border-white/5 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300 ${s.featured ? 'border-[#FF6B00]/30 bg-[#FF6B00]/10' : ''}`}>
                      <s.icon size={26} strokeWidth={2} />
                    </div>
                    <span className="font-heading font-black text-xl text-white/10 group-hover:text-[#FF6B00]/25 transition-colors">{s.num}</span>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-heading font-black italic uppercase leading-tight group-hover:text-[#FF6B00] transition-colors">{s.title}</h3>
                    <p className="text-white/60 text-[0.875rem] leading-relaxed font-body">{s.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})}
                  className="inline-flex items-center gap-2 text-[#FF6B00] text-[0.68rem] font-bold uppercase tracking-[0.2em] pt-8 hover:gap-4 transition-all"
                >
                  VIEW SERVICE <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — TYRE FINDER TOOL */}
      <section id="tyre-finder" className="py-24 px-6 sm:px-12 max-w-[1000px] mx-auto relative z-10">
        {/* Blueprint Grid Texture Background */}
        <div className="bg-[#111827] rounded-[32px] border border-white/5 p-8 sm:p-12 relative overflow-hidden shadow-2xl bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6B00]/[0.01] rounded-full blur-[120px] -z-10"></div>
          
          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-3">
              <span className="text-[#FF6B00] text-[0.7rem] font-bold uppercase tracking-[0.2em]">FIND YOUR TYRE</span>
              <h2 className="text-[2.2rem] font-heading font-black italic uppercase leading-none">The Right Tyre in 10 Seconds</h2>
              <p className="text-white/50 text-[0.85rem] leading-relaxed max-w-xl">
                Select your vehicle type and tyre size — we'll show you what's available
              </p>
            </div>

            <form onSubmit={handleTyreFinderSubmit} className="space-y-8">
              {/* Step 1: Vehicle Type Buttons */}
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 block">Step 1: Select Vehicle Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {['Car', 'Bike', 'SUV', 'Truck', 'Tractor'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setVehicleType(type);
                        setFinderResult('');
                      }}
                      className={`h-16 rounded-xl border font-heading font-black italic text-[0.8rem] uppercase tracking-widest transition-all ${
                        vehicleType === type 
                          ? 'bg-[#FF6B00] text-white border-transparent shadow-lg shadow-[#FF6B00]/20 scale-102'
                          : 'bg-[#0B0F1A] border-white/5 hover:border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steps 2-4: Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Width */}
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 block">Step 2: Section Width (mm)</label>
                  <select 
                    value={width}
                    onChange={(e) => {
                      setWidth(e.target.value);
                      setFinderResult('');
                    }}
                    className="w-full h-14 px-5 rounded-xl border border-white/5 bg-[#0B0F1A] text-white font-mono font-bold text-[0.85rem] outline-none focus:border-[#FF6B00] transition-colors cursor-pointer"
                  >
                    {['155', '165', '175', '185', '195', '205', '215', '225', '235', '245'].map(opt => (
                      <option key={opt} value={opt} className="bg-[#111827] text-white">{opt} mm</option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 block">Step 3: Aspect Ratio (%)</label>
                  <select 
                    value={aspect}
                    onChange={(e) => {
                      setAspect(e.target.value);
                      setFinderResult('');
                    }}
                    className="w-full h-14 px-5 rounded-xl border border-white/5 bg-[#0B0F1A] text-white font-mono font-bold text-[0.85rem] outline-none focus:border-[#FF6B00] transition-colors cursor-pointer"
                  >
                    {['55', '60', '65', '70', '75', '80'].map(opt => (
                      <option key={opt} value={opt} className="bg-[#111827] text-white">{opt} %</option>
                    ))}
                  </select>
                </div>

                {/* Rim Size */}
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 block">Step 4: Rim Diameter (Inches)</label>
                  <select 
                    value={rim}
                    onChange={(e) => {
                      setRim(e.target.value);
                      setFinderResult('');
                    }}
                    className="w-full h-14 px-5 rounded-xl border border-white/5 bg-[#0B0F1A] text-white font-mono font-bold text-[0.85rem] outline-none focus:border-[#FF6B00] transition-colors cursor-pointer"
                  >
                    {['13', '14', '15', '16', '17', '18'].map(opt => (
                      <option key={opt} value={opt} className="bg-[#111827] text-white">R {opt} Inches</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit button */}
              <button 
                type="submit"
                className="w-full h-16 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-heading font-black italic text-[0.85rem] tracking-[0.2em] uppercase rounded-xl shadow-lg transition-all shadow-[#FF6B00]/10 flex items-center justify-center gap-2"
              >
                FIND TYRES <ArrowRight size={18} />
              </button>
            </form>

            {/* Dynamic Stateful Finder Result Display */}
            {finderResult && (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-[#FF6B00]/20 animate-modal-entrance space-y-5 text-center">
                <p className="font-heading font-black italic text-lg text-white uppercase leading-snug">
                  {finderResult}
                </p>
                <div className="flex justify-center">
                  <a 
                    href={getWhatsAppMessage()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="h-14 px-8 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-heading font-black italic text-[0.72rem] tracking-[0.16em] uppercase flex items-center gap-2.5 transition-all duration-300 shadow-md shadow-[#25D366]/20"
                  >
                    <MessageSquare size={16} fill="currentColor" /> Inquiry on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6 — ABOUT REDESIGNED */}
      <section id="about" className="py-24 px-6 sm:px-12 max-w-[1280px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* About Images */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#FF6B00] blur-[120px] opacity-[0.06] z-0"></div>
            
            <div className="aspect-square bg-secondary rounded-[32px] overflow-hidden border border-white/5 relative z-10 shadow-2xl group">
              <img 
                src="https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                alt="Professional Tyre Workshop" 
                className="w-full h-full object-cover opacity-75 group-hover:scale-102 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent opacity-80"></div>
            </div>
            
            {/* Legacy Stats Floating Card */}
            <div className="absolute -bottom-6 right-0 sm:-right-8 z-20 bg-gradient-to-br from-[#FF6B00] to-[#E65C00] px-8 py-8 rounded-2xl shadow-[0_20px_50px_rgba(255,107,0,0.35)] border border-white/20 text-white flex flex-col items-center text-center w-56">
               <p className="text-4xl font-heading font-black italic leading-none mb-1">25+</p>
               <p className="text-[0.62rem] font-bold tracking-[0.2em] uppercase leading-none opacity-80">Years of Legacy</p>
               <div className="w-10 h-[1px] bg-white/30 my-3"></div>
               <p className="text-[0.65rem] font-bold text-white/95 uppercase tracking-wider leading-snug">Savarkundla's Authority</p>
            </div>
          </div>

          {/* About Text Content */}
          <div className="space-y-8">
            <div className="w-12 h-1 bg-[#FF6B00]"></div>
            <h2 className="text-[2.2rem] sm:text-[3rem] font-heading font-black italic uppercase leading-[1.05]">
              Reliability <br />
              <span className="text-[#FF6B00] drop-shadow-[0_0_8px_rgba(255,107,0,0.2)]">Redefined.</span>
            </h2>
            <p className="text-white/70 text-[0.95rem] leading-[1.65] font-body">
              Chandrakant Traders has been Savarkundla's most trusted name in tyres since 1998. What began as a small tyre shop has grown into the district's largest multi-brand tyre dealer, serving thousands of happy customers across Amreli, Botad, and surrounding regions. We are an authorised dealer for CEAT and carry genuine stock from all major brands including MRF, Apollo, Bridgestone, Michelin and more.
            </p>
            
            {/* Legacy stats horizontal row */}
            <div className="grid grid-cols-3 gap-6 py-4 border-y border-white/5">
               <div className="space-y-1">
                 <p className="text-2xl font-heading font-black text-[#FF6B00] italic">25+ Yrs</p>
                 <p className="text-[0.58rem] font-bold text-white/40 uppercase tracking-widest">Legacy</p>
               </div>
               <div className="space-y-1">
                 <p className="text-2xl font-heading font-black text-[#FF6B00] italic">10K+</p>
                 <p className="text-[0.58rem] font-bold text-white/40 uppercase tracking-widest">Clients</p>
               </div>
               <div className="space-y-1">
                 <p className="text-2xl font-heading font-black text-[#FF6B00] italic">100%</p>
                 <p className="text-[0.58rem] font-bold text-white/40 uppercase tracking-widest">Quality</p>
               </div>
            </div>

            {/* 3 Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              <span className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[0.68rem] font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                ✓ Authorised CEAT Dealer
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[0.68rem] font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                ✓ GST Registered Business
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[0.68rem] font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                ✓ Bank of Baroda Partner
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY CHOOSE US (4 Pillars of Trust) */}
      <section className="py-24 px-6 sm:px-12 bg-[#111827]/70 border-y border-white/5 relative z-10">
        <div className="max-w-[1280px] mx-auto space-y-20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-1 bg-[#FF6B00]"></div>
            <span className="text-[#FF6B00] text-[0.7rem] font-bold uppercase tracking-[0.2em]">OUR PROMISE</span>
            <h2 className="text-[2.2rem] sm:text-[3rem] font-heading font-black italic uppercase leading-none">The 4 Pillars of Trust</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map((pillar, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#0B0F1A] border border-white/5 hover:border-[#FF6B00]/25 transition-colors group">
                <span className="font-heading font-black text-2xl text-white/10 group-hover:text-[#FF6B00]/30 transition-colors block mb-4">{pillar.num}</span>
                <h4 className="font-heading font-black text-[0.88rem] uppercase tracking-wider mb-3 text-white leading-tight">{pillar.title}</h4>
                <p className="text-white/50 text-[0.75rem] leading-relaxed font-body">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — 4-STEP PRECISION PROTOCOL */}
      <section className="py-24 px-6 sm:px-12 max-w-[1280px] mx-auto relative z-10">
        <div className="bg-[#111827] p-8 sm:p-12 lg:p-20 rounded-[32px] border border-white/5 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Left Steps */}
            <div className="space-y-12">
              <h2 className="text-[2.2rem] sm:text-[3rem] font-heading font-black italic uppercase leading-[1.05]">
                The 4-Step <br />
                <span className="text-[#FF6B00] drop-shadow-[0_0_8px_rgba(255,107,0,0.2)]">Precision</span> <br />
                Protocol.
              </h2>
              <div className="space-y-6">
                {protocol.map((p, i) => (
                  <div key={i} className="flex gap-5 p-4 -ml-4 rounded-xl hover:bg-white/[0.01] border border-transparent hover:border-white/5 transition-all group">
                    <span className="text-2xl font-heading font-black text-white/10 group-hover:text-[#FF6B00] transition-colors shrink-0">{p.num}</span>
                    <div className="space-y-1">
                      <h3 className="font-heading font-black text-[0.95rem] uppercase tracking-wider group-hover:text-[#FF6B00] transition-colors">{p.title}</h3>
                      <p className="text-white/50 text-[0.78rem] leading-relaxed font-body">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Branded Circle */}
            <div className="relative flex justify-center">
               <div className="aspect-square w-72 sm:w-[380px] rounded-full border border-white/5 bg-[#0B0F1A] flex items-center justify-center relative animate-spin-slow">
                 <div className="w-[85%] h-[85%] rounded-full border border-dashed border-[#FF6B00]/15"></div>
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-64 bg-[#0B0F1A] p-6 rounded-full border border-white/5 shadow-inner">
                  <p className="text-[0.62rem] font-black tracking-[0.25em] text-[#FF6B00] uppercase">AUTHORIZED DEALER</p>
                  <p className="text-[1.8rem] font-heading font-black italic uppercase text-white leading-none mt-2 tracking-tight">CEAT TYRES</p>
                  <div className="w-8 h-1 bg-[#FF6B00] mx-auto mt-4 rounded-full"></div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 9 — TESTIMONIALS */}
      <section className="py-24 px-6 sm:px-12 bg-[#111827]/30 border-t border-white/5 relative z-10">
        <div className="max-w-[1280px] mx-auto space-y-20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-1 bg-[#FF6B00]"></div>
            <span className="text-[#FF6B00] text-[0.7rem] font-bold uppercase tracking-[0.2em]">CUSTOMER VOICES</span>
            <h2 className="text-[2.2rem] sm:text-[3rem] font-heading font-black italic uppercase leading-none">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 rounded-2xl bg-[#141B2D] border border-white/5 flex flex-col justify-between min-h-[300px] relative group hover:border-[#FF6B00]/25 transition-all">
                {/* Large Orange Quote Mark */}
                <span className="text-7xl font-serif text-[#FF6B00]/10 absolute top-4 left-6 pointer-events-none font-extrabold group-hover:text-[#FF6B00]/15 transition-colors">“</span>
                
                <div className="space-y-6 relative z-10 pt-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={13} className="text-[#FF6B00] fill-[#FF6B00]" />
                    ))}
                  </div>
                  <p className="text-white/80 text-[0.875rem] leading-relaxed italic font-body">{t.text}</p>
                </div>
                
                <div className="pt-6 border-t border-white/5 relative z-10">
                  <p className="font-heading font-black uppercase text-[0.8rem] tracking-wider text-white">{t.author}</p>
                  <p className="text-[#FF6B00] text-[0.62rem] font-bold uppercase tracking-widest mt-0.5">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10 — CONTACT SECTION REDESIGNED */}
      <section id="contact" className="py-24 px-6 sm:px-12 max-w-[1280px] mx-auto relative z-10">
        <div className="space-y-20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-1 bg-[#FF6B00]"></div>
            <span className="text-[#FF6B00] text-[0.7rem] font-bold uppercase tracking-[0.2em]">GET IN TOUCH</span>
            <h2 className="text-[2.2rem] sm:text-[3rem] font-heading font-black italic uppercase leading-none">Visit Us or Call Now</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column — Contact Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Address card */}
              <div className="p-6 rounded-2xl bg-[#141B2D] border border-white/5 flex gap-4">
                <MapPin size={22} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-[0.7rem] uppercase tracking-wider text-white/50 leading-none">Our Shop Address</h4>
                  <p className="text-white text-[0.82rem] font-bold leading-relaxed mt-1">
                    Shop No. 27/28/29, Taluka Panchayat Shopping Center, Savarkundla, Dist. Amreli - 364515
                  </p>
                </div>
              </div>

              {/* Phone card */}
              <a href="tel:+919924058659" className="p-6 rounded-2xl bg-[#141B2D] border border-white/5 flex gap-4 hover:border-[#FF6B00]/30 transition-colors block">
                <Phone size={22} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-[0.7rem] uppercase tracking-wider text-white/50 leading-none">Call Support Line</h4>
                  <p className="text-white text-[1.1rem] font-heading font-black italic tracking-wider mt-1 hover:text-[#FF6B00] transition-colors">
                    99240 58659
                  </p>
                </div>
              </a>

              {/* Hours card */}
              <div className="p-6 rounded-2xl bg-[#141B2D] border border-white/5 flex gap-4">
                <Clock size={22} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-[0.7rem] uppercase tracking-wider text-white/50 leading-none">Operational Timings</h4>
                  <p className="text-white text-[0.8rem] font-mono leading-relaxed mt-1">
                    Mon–Sat: 9:00 AM – 7:00 PM <br />
                    Sun: 10:00 AM – 2:00 PM
                  </p>
                </div>
              </div>

              {/* Bank card */}
              <div className="p-6 rounded-2xl bg-[#141B2D] border border-white/5 flex gap-4">
                <Landmark size={22} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-[0.7rem] uppercase tracking-wider text-white/50 leading-none">Bank Settlement Registry</h4>
                  <p className="text-white text-[0.8rem] font-mono leading-relaxed mt-1">
                    Bank of Baroda <br />
                    A/c: 1111111111 | IFSC: BARB0SAVARK
                  </p>
                </div>
              </div>

              {/* Chat on WhatsApp Button */}
              <a 
                href="https://wa.me/919924058659?text=Hi%2C%20I%20need%20help%20with%20tyres" 
                target="_blank" 
                rel="noreferrer"
                className="h-16 rounded-2xl bg-[#FF6B00] hover:bg-[#FF8533] text-white font-heading font-black italic text-[0.75rem] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-[#FF6B00]/10 w-full"
              >
                <MessageSquare size={18} fill="currentColor" /> CHAT ON WHATSAPP
              </a>
            </div>

            {/* Right Column — Google Maps embed with dark overlay styling */}
            <div className="lg:col-span-7 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl min-h-[400px] relative z-10 bg-secondary">
              <iframe
                title="Chandrakant Traders Google Maps Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14849.529729864227!2d71.30062402485542!3d21.345638127393433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39589d97f55f9eeb%3A0xc3f8e5fbb4e3e3b7!2sSavarkundla%2C%20Gujarat%20364515!5e0!3m2!1sen!2sin!4v1717329580432!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px', filter: 'grayscale(1) invert(0.9) contrast(1.1) brightness(0.9)' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 11 — CTA BANNER (Perfect Tyre) */}
      <section className="py-24 px-6 sm:px-12 bg-gradient-to-br from-[#111827] to-[#0B0F1A] border-t border-white/5 relative z-10 no-print">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-[2.2rem] sm:text-[3rem] font-heading font-black italic uppercase leading-none">
            Ready to Get the <span className="text-[#FF6B00] drop-shadow-[0_0_8px_rgba(255,107,0,0.25)]">Perfect</span> Tyre?
          </h2>
          <p className="text-white/60 text-[0.88rem] leading-relaxed max-w-xl mx-auto font-body">
            Visit us in Savarkundla or call now — we'll help you find the right tyre at the best price.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 pt-4">
            <Link to="/login">
              <Button className="h-16 px-12 font-heading font-black italic text-[0.82rem] tracking-[0.2em] uppercase bg-[#FF6B00] hover:bg-[#FF8533] text-white shadow-xl transition-all shadow-[#FF6B00]/10 rounded-none w-56 sm:w-auto">
                LAUNCH PORTAL
              </Button>
            </Link>
            <a 
              href="tel:+919924058659"
              className="h-16 px-12 font-heading font-black italic text-[0.82rem] tracking-[0.2em] uppercase border border-white/10 hover:border-[#FF6B00]/40 text-white bg-white/[0.02] hover:bg-white/5 flex items-center justify-center gap-2 transition-all w-56 sm:w-auto"
            >
              CALL US NOW
            </a>
          </div>
        </div>
      </section>

      {/* STYLING WRAPPER FOR MARQUEES AND PULSES */}
      <style>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marqueeLeft 30s linear infinite;
        }
        .animate-marquee-right {
          animation: marqueeRight 30s linear infinite;
        }
        .pause-animation:hover {
          animation-play-state: paused;
        }
        .animate-spin-slow {
          animation: spin 35s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-orange {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.45); }
          50% { box-shadow: 0 0 0 12px rgba(255, 107, 0, 0); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.45); }
          50% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); }
        }
        .pulse-orange-glow {
          animation: pulse-orange 2s infinite;
        }
        .pulse-green-glow {
          animation: pulse-green 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 0, 0.4);
          border-radius: 4px;
        }
      `}</style>

    </div>
  );
};

export default Website;
