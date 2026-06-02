import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, MapPin, Phone, Clock, MessageSquare } from 'lucide-react';

const Footer = () => {
  const handleLinkClick = (hashId) => {
    if (hashId.startsWith('#')) {
      const el = document.getElementById(hashId.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Home', hash: '#' },
    { name: 'Services', hash: '#services' },
    { name: 'Brands', hash: '#brands' },
    { name: 'About', hash: '#about' },
    { name: 'Tyre Finder', hash: '#tyre-finder' },
    { name: 'Contact', hash: '#contact' }
  ];

  const services = [
    'Tyre Sales',
    'Tyre Fitting',
    'Wheel Alignment',
    'Wheel Balancing',
    'Nitrogen Filling',
    'Puncture Repair'
  ];

  return (
    <footer className="bg-[#111827] border-t border-white/5 pt-20 pb-0 font-body relative overflow-hidden select-none no-print">
      
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-20">
          
          {/* COLUMN 1 — BRAND BLOCK (Lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" onClick={() => handleLinkClick('#')} className="flex items-center gap-3 group cursor-pointer w-fit">
              {/* CT circle logo with cyan/blue (#0EA5E9) for logo only */}
              <div className="w-12 h-12 bg-gradient-to-tr from-[#0EA5E9] to-[#0284c7] text-[#0B0F1A] flex items-center justify-center font-heading font-black text-lg rounded-full shadow-[0_0_15px_rgba(14,165,233,0.25)] group-hover:scale-105 transition-transform duration-300">
                CT
              </div>
              <div>
                <h4 className="text-[1.1rem] font-heading font-black italic leading-none text-white tracking-[0.05em] uppercase group-hover:text-[#FF6B00] transition-colors">CHANDRAKANT</h4>
                <p className="text-white/40 text-[0.62rem] font-heading font-bold tracking-[0.25em] uppercase mt-0.5">Traders</p>
              </div>
            </Link>
            
            <p className="max-w-[320px] text-[0.82rem] leading-relaxed text-white/50 font-body">
              Savarkundla's absolute authority in multi-brand tyres since 1998.
            </p>
            
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a 
                href="https://instagram.com/" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-[#FF6B00] hover:border-transparent transition-all duration-300"
              >
                <Instagram size={18} />
              </a>
              {/* Facebook */}
              <a 
                href="https://facebook.com/" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-[#1877F2] hover:border-transparent transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
              {/* WhatsApp */}
              <a 
                href="https://wa.me/919924058659" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-[#25D366] hover:border-transparent transition-all duration-300"
              >
                <MessageSquare size={18} fill="currentColor" />
              </a>
            </div>
          </div>

          {/* COLUMN 2 — NAVIGATION (Lg: 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="text-white text-[0.72rem] font-heading font-black tracking-[0.2em] uppercase italic">NAVIGATION</h4>
              <div className="h-[2px] w-6 bg-[#FF6B00] mt-2"></div>
            </div>
            
            <ul className="flex flex-col gap-3 font-body text-[0.82rem]">
              {navLinks.map((link, i) => (
                <li key={i}>
                  <Link 
                    to={link.hash === '#' ? '/' : `/${link.hash}`}
                    onClick={() => handleLinkClick(link.hash)}
                    className="group flex items-center gap-0 hover:gap-1.5 text-white/50 hover:text-white transition-all duration-200"
                  >
                    <span className="w-0 h-[2px] bg-[#FF6B00] rounded-full group-hover:w-2 transition-all duration-200"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3 — SERVICES (Lg: 3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h4 className="text-white text-[0.72rem] font-heading font-black tracking-[0.2em] uppercase italic">SERVICES</h4>
              <div className="h-[2px] w-6 bg-[#FF6B00] mt-2"></div>
            </div>
            
            <ul className="flex flex-col gap-3 font-body text-[0.82rem]">
              {services.map((svc, i) => (
                <li key={i}>
                  <a 
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick('#services');
                    }}
                    className="group flex items-center gap-0 hover:gap-1.5 text-white/50 hover:text-white transition-all duration-200"
                  >
                    <span className="w-0 h-[2px] bg-[#FF6B00] rounded-full group-hover:w-2 transition-all duration-200"></span>
                    {svc}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4 — COORDINATES (Lg: 3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h4 className="text-white text-[0.72rem] font-heading font-black tracking-[0.2em] uppercase italic">COORDINATES</h4>
              <div className="h-[2px] w-6 bg-[#FF6B00] mt-2"></div>
            </div>
            
            <div className="space-y-4 text-[0.82rem] font-body text-white/60">
              <a 
                href="https://maps.google.com/?q=Savarkundla,+Amreli,+Gujarat" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-start gap-2.5 hover:text-white transition-colors"
              >
                <MapPin size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <span>Shop 27/28/29, Taluka Panchayat SC, Savarkundla, Amreli 364515</span>
              </a>

              <a 
                href="tel:+919924058659" 
                className="flex items-center gap-2.5 hover:text-white transition-colors font-bold text-white"
              >
                <Phone size={16} className="text-[#FF6B00] shrink-0" />
                <span>+91 99240 58659</span>
              </a>

              <div className="flex items-start gap-2.5">
                <Clock size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <span>Mon–Sat 9AM–7PM</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/5 mt-10">
          <div className="w-full py-6 flex justify-center items-center text-center">
            <p className="text-[0.68rem] font-heading font-black tracking-[0.1em] uppercase text-white/20 italic">
              © 2026 CHANDRAKANT TRADERS · GSTIN: 24AAAGM0289C1ZP · All Rights Reserved
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
