import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = '560px', preventClose = false, className = '' }) => {
  const [renderState, setRenderState] = useState('unmounted');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen && renderState === 'unmounted') {
      setRenderState('entering');
      document.body.style.overflow = 'hidden';
    } else if (!isOpen && (renderState === 'entering' || renderState === 'entered')) {
      setRenderState('exiting');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      if (!isOpen) document.body.style.overflow = 'unset';
    };
  }, [isOpen, renderState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && renderState === 'entered') {
        if (preventClose) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 400);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [renderState, onClose, preventClose]);

  const handleAnimationEnd = (e) => {
    if (e.animationName === 'modalEntrance') {
      setRenderState('entered');
    } else if (e.animationName === 'modalExit') {
      setRenderState('unmounted');
    }
  };

  if (renderState === 'unmounted') return null;

  const isExiting = renderState === 'exiting';

  return createPortal(
    <div 
      className="fixed top-0 left-0 w-[100vw] h-[100vh] z-[99999] flex items-center justify-center"
    >
      <div 
        className={`absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px] ${isExiting ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade'}`} 
        onClick={() => {
          if (preventClose) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 400);
          } else {
            onClose();
          }
        }} 
      />
      <div 
        onAnimationEnd={handleAnimationEnd}
        className={`relative bg-[#0D1220] border border-[#FF6B00]/20 rounded-[20px] p-[2rem] flex flex-col w-full max-h-[85vh] ${isExiting ? 'animate-modal-exit' : 'animate-[modalEntrance_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]'} ${isShaking ? 'animate-[errorShake_0.4s_ease-in-out]' : ''} ${className}`}
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-heading font-[800] text-[1.3rem] uppercase text-white leading-none tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-white/[0.50] hover:text-[#FF6A00] transition-all p-2 bg-white/5 hover:bg-white/10 rounded-lg admin-btn-hover flex items-center justify-center"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 pl-2 pr-6 scroll-smooth">
          {children}
        </div>
        {footer && (
          <div className="mt-8 pt-8 border-t border-white/5 w-full">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
