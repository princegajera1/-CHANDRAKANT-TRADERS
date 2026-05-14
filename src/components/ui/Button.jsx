import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Button = ({ children, variant = 'primary', className, ...props }) => {
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500/20',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/20',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
  };

  return (
    <button
      className={twMerge(
        'px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
