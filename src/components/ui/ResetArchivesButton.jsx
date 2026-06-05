import React, { useState } from 'react';
import { PasswordModal } from './PasswordModal';

export const ResetArchivesButton = ({ onConfirm, subtitle = "This will move all records to Recycle Bin" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative px-6 py-3.5 rounded-xl bg-red-500/[0.08] hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 text-red-500 font-heading font-black text-[0.72rem] uppercase tracking-wider transition-all border border-red-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
      >
        Reset Archives
        
        {/* Glowing Orange Dot Indicator */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6B00]"></span>
        </span>
      </button>

      <PasswordModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onConfirm}
        title="Reset Archives"
        subtitle={subtitle}
        confirmLabel="Reset"
      />
    </>
  );
};

export default ResetArchivesButton;
