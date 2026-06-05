import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ShieldAlert } from 'lucide-react';

export const PasswordModal = ({ isOpen, onClose, onConfirm, title = "Confirm Reset" }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Clear inputs on open/close
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (password === '123') {
      onConfirm();
      onClose();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="420px"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="text-[0.68rem] text-text-muted uppercase tracking-[0.14em] font-black block">
            Authorization Required
          </label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className={`w-full h-[52px] px-5 rounded-xl text-[0.875rem] font-body bg-[#080C14] border ${
              error ? 'border-accent-red' : 'border-white/10'
            } text-white outline-none focus:border-accent transition-all placeholder:text-white/20`}
            autoFocus
          />
          {error && (
            <p className="text-accent-red text-[0.7rem] font-mono mt-1 flex items-center gap-1.5 animate-pulse">
              <ShieldAlert size={14} /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[50px] rounded-xl bg-transparent border border-white/20 text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-[50px] rounded-xl bg-accent text-[0.72rem] font-body font-[700] uppercase tracking-[0.12em] text-primary shadow-glow hover:bg-accent/85 hover:translate-y-[-1px] transition-all"
          >
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordModal;
