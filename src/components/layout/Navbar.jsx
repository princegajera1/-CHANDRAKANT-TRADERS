import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import gsap from 'gsap';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // GSAP navbar entrance
    gsap.fromTo(navRef.current, 
      { y: -72, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services/tyre-fitting' },
    { name: 'About', path: '/about' },
    { name: 'Tyre Care', path: '/tyre-care' },
    { name: 'Fleet Portal', path: '/fleet-solutions' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav 
      ref={navRef}
      className={`fixed top-0 w-full z-50 transition-all duration-300 h-[72px] flex items-center border-b ${
        mobileMenuOpen
          ? 'bg-[#080C14] border-transparent'
          : isScrolled 
            ? 'bg-[#080C14]/85 backdrop-blur-xl border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-transparent border-transparent'
      }`}
    >
      <div className="w-full max-w-[1280px] mx-auto px-[clamp(1.5rem,5vw,5rem)] flex items-center justify-between">
        
        <Link 
          to="/" 
          onClick={scrollToTop} 
          className="flex items-center gap-3 group cursor-pointer shrink-0"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)] to-[#00A3C4] text-[var(--primary)] flex items-center justify-center font-black text-lg rounded-full shadow-[0_0_15px_rgba(0,212,255,0.25)] group-hover:scale-105 transition-transform duration-300">CT</div>
          <div className="hidden sm:block">
            <span className="text-[1.1rem] font-heading font-extrabold italic block leading-none uppercase text-[var(--text-primary)]">CHANDRAKANT</span>
            <span className="text-[var(--accent)] text-[0.65rem] font-accent font-semibold tracking-[0.3em] uppercase mt-1 block">Traders</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              className={`nav-link text-[0.8rem] font-bold tracking-[0.1em] uppercase transition-colors hover:text-[var(--accent)] ${isActive(link.path) ? 'text-[var(--accent)] glow-text-cyan' : 'text-white/60'}`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="flex items-center gap-5 ml-4">
            <Link to="/login">
              <Button className="h-11 px-8 font-heading font-bold italic text-[0.8rem] tracking-[0.1em] uppercase rounded-none bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--primary)] shadow-[0_4px_14px_rgba(0,212,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,212,255,0.35)] transition-all duration-300">
                Portal Access
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[72px] bg-[#080C14]/95 backdrop-blur-2xl z-[999] p-8 flex flex-col gap-8 duration-300 border-t border-white/5">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-heading font-extrabold italic uppercase text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
             <Button className="w-full h-16 text-lg font-heading font-extrabold italic uppercase rounded-none bg-[var(--accent)] text-[var(--primary)]">Portal Access</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
