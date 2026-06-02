import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Clock, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import gsap from 'gsap';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    
    // GSAP navbar entrance
    gsap.fromTo(navContainerRef.current, 
      { y: -110, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/#services' },
    { name: 'Brands', path: '/#brands' },
    { name: 'About', path: '/#about' },
    { name: 'Tyre Finder', path: '/#tyre-finder' },
    { name: 'Contact', path: '/#contact' }
  ];

  const handleLinkClick = (path) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const id = path.substring(2);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' && !window.location.hash;
    return window.location.hash === path.substring(1);
  };

  return (
    <div 
      ref={navContainerRef}
      className="fixed top-0 w-full z-50 flex flex-col"
    >
      {/* 1. TOP INFORMATION BAR */}
      <div className="w-full bg-[#0B0F1A] border-b border-white/5 py-2 text-white/50 text-[0.65rem] tracking-[0.08em] font-body font-bold no-print">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-5">
            <a href="tel:+919924058659" className="hover:text-[#FF6B00] transition-colors flex items-center gap-1.5">
              <Phone size={11} className="text-[#FF6B00]" /> +91 99240 58659
            </a>
            <span className="flex items-center gap-1.5">
              <Clock size={11} className="text-[#FF6B00]" /> Mon–Sat 9AM–7PM
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-center sm:text-right">
            <MapPin size={11} className="text-[#FF6B00]" /> Savarkundla, Amreli
          </span>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION MENUBAR */}
      <nav 
        className={`w-full transition-all duration-300 h-[72px] flex items-center border-b ${
          mobileMenuOpen
            ? 'bg-[#0B0F1A] border-transparent'
            : isScrolled 
              ? 'bg-[#0B0F1A]/85 backdrop-blur-xl border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
              : 'bg-transparent border-transparent'
        }`}
      >
        <div className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 flex items-center justify-between">
          
          {/* Logo Left Side */}
          <Link 
            to="/" 
            onClick={() => handleLinkClick('/')} 
            className="flex items-center gap-3 group cursor-pointer shrink-0"
          >
            {/* CT circle logo with cyan/blue (#0EA5E9) for logo only */}
            <div className="w-[42px] h-[42px] bg-gradient-to-tr from-[#0EA5E9] to-[#0284c7] text-[#0B0F1A] flex items-center justify-center font-heading font-black text-[1.1rem] rounded-full shadow-[0_0_15px_rgba(14,165,233,0.3)] group-hover:scale-105 transition-transform duration-300">
              CT
            </div>
            <div>
              <span className="text-[1rem] font-heading font-extrabold italic block leading-none uppercase text-white tracking-[0.05em]">CHANDRAKANT</span>
              <span className="text-white/40 text-[0.62rem] font-heading font-bold tracking-[0.25em] uppercase mt-0.5 block">Traders</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => handleLinkClick(link.path)}
                className={`nav-link text-[0.75rem] font-black tracking-[0.14em] uppercase transition-all duration-200 hover:text-[#FF6B00] ${
                  isActive(link.path) 
                    ? 'text-[#FF6B00] drop-shadow-[0_0_8px_rgba(255,107,0,0.3)]' 
                    : 'text-white/60'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="flex items-center gap-5 ml-4">
              <Link to="/login">
                {/* Portal Access Button in Orange Accent style */}
                <Button className="h-11 px-8 font-heading font-black italic text-[0.72rem] tracking-[0.15em] uppercase rounded-none bg-[#FF6B00] hover:bg-[#FF8533] text-white shadow-[0_4px_14px_rgba(255,107,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.35)] transition-all duration-300">
                  Portal Access
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden p-2 text-white hover:text-[#FF6B00] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-[110px] bottom-0 bg-[#0B0F1A]/98 backdrop-blur-2xl z-[999] p-8 flex flex-col gap-8 duration-300 border-t border-white/5 overflow-y-auto">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => handleLinkClick(link.path)}
                className="text-2xl font-heading font-extrabold italic uppercase text-white hover:text-[#FF6B00] transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
               <Button className="w-full h-16 text-lg font-heading font-extrabold italic uppercase rounded-none bg-[#FF6B00] text-white shadow-lg">
                 Portal Access
               </Button>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
