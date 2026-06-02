import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const CountUp = ({ end, prefix = '' }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      setValue(end);
      return;
    }

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: end,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => {
        setValue(Math.floor(obj.val));
      }
    });

    return () => {
      tween.kill();
    };
  }, [end]);

  return <>{prefix}{prefix === '₹' ? value.toLocaleString('en-IN') : value}</>;
};

export const StatCard = ({ title, value, icon: Icon, color = 'cyan', subValue, onClick, isCurrency = false }) => {
  const cardRef = useRef(null);
  
  const colors = {
    cyan: 'bg-[#00D4FF]/10 text-[#00D4FF]',
    gold: 'bg-[#FFB800]/10 text-[#FFB800]',
    green: 'bg-[#00E676]/10 text-[#00E676]',
    red: 'bg-[#FF3D57]/10 text-[#FF3D57]',
  };

  const borders = {
    cyan: 'hover:border-[#00D4FF]/40',
    gold: 'hover:border-[#FFB800]/40',
    green: 'hover:border-[#00E676]/40',
    red: 'hover:border-[#FF3D57]/40',
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      const dx = x - xc;
      const dy = y - yc;
      
      const tiltX = (dy / yc) * -6;
      const tiltY = (dx / xc) * 6;

      gsap.to(card, {
        rotateX: tiltX,
        rotateY: tiltY,
        transformPerspective: 800,
        ease: 'power2.out',
        duration: 0.25
      });
    };

    const onMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        ease: 'power3.out',
        duration: 0.5
      });
    };

    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);

    return () => {
      card.removeEventListener('mousemove', onMouseMove);
      card.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      className={`
        p-[1.6rem] rounded-[16px] bg-[#0D1B2A] border border-[#1E2D3D]
        flex items-start justify-between relative overflow-hidden group h-full
        transition-all duration-300 hover:bg-[#111827] shadow-[0_10px_30px_rgba(0,0,0,0.2)]
        ${borders[color] || borders.cyan}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
      `}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Gloss reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-white/[0.04] pointer-events-none" />

      <div className="relative z-10 space-y-3" style={{ transform: 'translateZ(20px)' }}>
        <p className="font-body font-[600] text-[0.62rem] text-[#8899A6] tracking-[0.16em] uppercase">{title}</p>
        <h3 className="font-heading font-[800] text-[1.8rem] text-white leading-none font-mono tracking-tight">
          <CountUp end={value} prefix={isCurrency ? '₹' : ''} />
        </h3>
        {subValue && (
          <p className="font-body font-[500] italic text-[0.68rem] text-[#8899A6]/80 first-letter:uppercase pt-1 tracking-wide">{subValue}</p>
        )}
      </div>
      <div 
        className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(0,0,0,0.2)] ${colors[color] || colors.cyan}`}
        style={{ transform: 'translateZ(30px)' }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
    </div>
  );
};

export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-white/[0.04] text-[#8899A6] border-white/5',
    green: 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20 shadow-[0_0_10px_rgba(0,230,118,0.05)]',
    blue: 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20 shadow-[0_0_10px_rgba(0,212,255,0.05)]',
    gold: 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20 shadow-[0_0_10px_rgba(255,184,0,0.05)]',
    red: 'bg-[#FF3D57]/10 text-[#FF3D57] border-[#FF3D57]/20 shadow-[0_0_10px_rgba(255,61,87,0.05)]',
    solidCyan: 'bg-[#00D4FF] text-[#0A0F1E] border-[#00D4FF] font-black',
  };

  return (
    <span className={`px-2.5 py-1 rounded-[6px] font-body font-[700] text-[0.6rem] tracking-[0.14em] uppercase border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
