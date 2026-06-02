import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Terminal, ArrowRight, CornerDownLeft } from 'lucide-react';
import gsap from 'gsap';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const backdropRef = useRef(null);
  const inputRef = useRef(null);

  const navItems = [
    { label: 'DASHBOARD', desc: 'Overview of financials, stats, and activity logs', path: '/dashboard' },
    { label: 'INVENTORY / PRODUCTS', desc: 'Manage products, stock levels, and pricing', path: '/inventory' },
    { label: 'NEW BILL / INVOICE', desc: 'Create a new tax invoice with GST calculation', path: '/new-bill' },
    { label: 'TERMINAL ARCHIVES', desc: 'View and print past sales invoices', path: '/bills' },
    { label: 'CUSTOMER NETWORK', desc: 'Manage customer accounts and outstanding balances', path: '/customers' },
    { label: 'SUPPLY CHAIN', desc: 'Manage supplier inventory sources', path: '/suppliers' },
    { label: 'INTELLIGENCE REPORTS', desc: 'Deep dive sales charts and spreadsheets', path: '/reports' },
    { label: 'SYSTEM SETTINGS', desc: 'Configure shop preferences and clearances', path: '/settings' },
  ];

  const filteredItems = navItems.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.desc.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearch('');
      // GSAP Entrance
      gsap.to(backdropRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(containerRef.current, 
        { scale: 0.95, y: -20, opacity: 0, filter: 'blur(10px)' },
        { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power3.out' }
      );
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  const handleClose = () => {
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(containerRef.current, {
      scale: 0.95,
      y: -20,
      opacity: 0,
      filter: 'blur(10px)',
      duration: 0.2,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  const handleSelect = (path) => {
    handleClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        onClick={handleClose}
        className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur-md opacity-0"
      />

      {/* Main Panel */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[650px] bg-[#0D1B2A]/95 border border-[#1E2D3D] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl opacity-0"
      >
        {/* Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />

        {/* Input Bar */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[#1E2D3D]">
          <Search size={22} className="text-[#00D4FF] shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or page to navigate..."
            className="w-full bg-transparent text-[#F0F4F8] placeholder-[#8899A6] text-[0.95rem] outline-none font-sans"
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 shrink-0 select-none">
            <span className="text-[0.65rem] font-bold text-[#8899A6] tracking-widest font-mono">ESC</span>
          </div>
        </div>

        {/* Command List */}
        <div className="max-h-[350px] overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div 
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full px-4 py-3.5 rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer group
                    ${isSelected 
                      ? 'bg-[#00D4FF]/10 border border-[#00D4FF]/25 shadow-[0_0_15px_rgba(0,212,255,0.05)]' 
                      : 'border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Terminal size={18} className={`shrink-0 ${isSelected ? 'text-[#00D4FF]' : 'text-[#8899A6]'}`} />
                    <div className="min-w-0">
                      <p className={`text-[0.78rem] font-[700] uppercase tracking-wider font-heading ${isSelected ? 'text-[#00D4FF]' : 'text-[#F0F4F8]'}`}>
                        {item.label}
                      </p>
                      <p className="text-[0.68rem] text-[#8899A6] truncate mt-0.5 font-sans leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center gap-1.5 text-[#00D4FF]">
                      <span className="text-[0.55rem] font-bold tracking-widest uppercase">Go</span>
                      <CornerDownLeft size={12} />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <p className="text-[0.75rem] font-bold uppercase tracking-wider text-[#8899A6]">No commands or pages found</p>
              <p className="text-[0.65rem] text-[#8899A6]/60 mt-1 font-sans">Try searching for "Dashboard", "Inventory", or "Bill"</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#1E2D3D] bg-[#0A0F1E]/50 flex items-center justify-between">
          <div className="flex items-center gap-5 text-[0.65rem] text-[#8899A6] select-none">
            <span className="flex items-center gap-1"><span className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</span> Move</span>
            <span className="flex items-center gap-1"><span className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Enter</span> Select</span>
          </div>
          <p className="text-[0.58rem] font-bold uppercase tracking-widest text-[#8899A6]/40">System Core 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
