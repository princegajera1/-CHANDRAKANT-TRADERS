import React, { useEffect, useState } from 'react';

export const CountUp = ({ end, prefix = '' }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      setValue(end);
      return;
    }

    let startTime;
    const duration = 1300; // 1.3 seconds
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end]);

  return <>{prefix}{prefix === '₹' ? value.toLocaleString('en-IN') : value}</>;
};

export const StatCard = ({ title, value, icon: Icon, color = 'orange', subValue, onClick, isCurrency = false }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-[#10B981]/10 text-[#10B981]',
    red: 'bg-red-500/10 text-red-500',
    orange: 'bg-[#FF6A00]/10 text-[#FF6A00]',
  };

  return (
    <div 
      onClick={onClick}
      className={`
        p-[1.6rem] rounded-[16px] bg-[#0D1220] border border-white/[0.07] admin-card-hover
        flex items-start justify-between relative overflow-hidden group
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="relative z-10 space-y-2">
        <p className="font-body font-[600] text-[0.62rem] text-white/[0.42] tracking-[0.16em] uppercase">{title}</p>
        <h3 className="font-heading font-[700] text-[1.65rem] text-white leading-none">
          <CountUp end={value} prefix={isCurrency ? '₹' : ''} />
        </h3>
        {subValue && (
          <p className="font-body font-[400] italic text-[0.75rem] text-white/[0.42] lowercase first-letter:uppercase pt-1">{subValue}</p>
        )}
      </div>
      <div className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${colors[color] || colors.orange}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
};

export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-white/[0.06] text-white/60 border-white/10',
    green: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    orange: 'bg-[#FF6A00]/10 text-[#FF6A00] border-[#FF6A00]/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    solidOrange: 'bg-[#FF6A00] text-white border-[#FF6A00]',
  };

  return (
    <span className={`px-3 py-1 rounded-[6px] font-body font-[700] text-[0.65rem] tracking-[0.14em] uppercase border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
