import { useTheme } from '../../context/ThemeContext';
import { twMerge } from 'tailwind-merge';

export const Input = ({ label, error, className, ...props }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="w-full">
      {label && (
        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {label}
        </label>
      )}
      <input
        className={twMerge(
          `w-full border-2 rounded-2xl px-5 py-4 outline-none transition-all font-bold placeholder:text-slate-400 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10' 
              : 'bg-white border-slate-100 text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
          }`,
          error && (isDark ? 'border-red-500/50 focus:ring-red-500/10' : 'border-red-500 focus:ring-red-500/10'),
          className
        )}
        {...props}
      />
      {error && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{error}</p>}
    </div>
  );
};
