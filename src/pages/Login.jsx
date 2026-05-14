import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../firebase/auth';
import { toast } from 'react-hot-toast';
import { User, Lock, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasError(false);
    try {
      await loginUser(email, password);
      toast.success('Access Granted');
      navigate('/dashboard');
    } catch (error) {
      setHasError(true);
      toast.error(error.message);
      // Remove error state after animation
      setTimeout(() => setHasError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0A0A0F] font-body text-white selection:bg-[#FF6B00] selection:text-white overflow-hidden">
      
      {/* Left Side - Automotive Background */}
      <div className="w-full md:w-1/2 h-[30vh] md:h-screen relative overflow-hidden flex items-center justify-center p-8">
        <img 
          src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=2000" 
          alt="Dark automotive" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent via-[#0A0A0F]/50 to-[#0A0A0F]"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 h-[70vh] md:h-screen relative flex items-center justify-center p-6 md:p-12">
        {/* Subtle Animated Background Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
          <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.08)_0%,rgba(10,10,15,0)_60%)] animate-[spin_60s_linear_infinite]"></div>
        </div>

        {/* Freely Floating Form Container */}
        <div 
          className={`relative z-10 w-full max-w-[440px] p-8 md:p-12 transition-all duration-700 ease-out ${hasError ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
          style={{
            opacity: isMounted ? 1 : 0,
            transform: isMounted ? 'translateY(0)' : 'translateY(40px)'
          }}
        >
          {/* Header Branding */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-[52px] h-[52px] bg-[#FF6B00] rounded-[14px] flex items-center justify-center text-white font-heading font-[800] text-[1.2rem] shadow-[0_0_20px_rgba(255,107,0,0.4)]">
              CT
            </div>
            <div>
              <h1 className="font-heading font-[800] text-[1.3rem] text-white uppercase tracking-[0.15em] leading-tight">
                Authorization
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck size={12} className="text-[#FF6B00]" />
                <span className="font-body font-[700] text-[#FF6B00] text-[0.65rem] uppercase tracking-[0.2em]">
                  Secure Portal
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username */}
            <div className="space-y-2">
              <label className="font-body font-[600] text-[#A0A0B0] text-[0.65rem] uppercase tracking-[0.15em] ml-1">
                Admin Identity
              </label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] group-focus-within:text-[#FF6B00] transition-colors duration-300" />
                <input 
                  type="email" 
                  required
                  placeholder="Enter authorized email"
                  className="w-full h-[52px] bg-[rgba(255,255,255,0.05)] border border-transparent rounded-[12px] pl-12 pr-4 text-white text-[0.9rem] font-body outline-none placeholder:text-[#A0A0B0]/50 placeholder:italic transition-all duration-300 focus:border-[#FF6B00]/50 focus:bg-[rgba(255,107,0,0.05)] focus:shadow-[0_0_15px_rgba(255,107,0,0.15)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="font-body font-[600] text-[#A0A0B0] text-[0.65rem] uppercase tracking-[0.15em] ml-1">
                Security Key
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] group-focus-within:text-[#FF6B00] transition-colors duration-300" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="Enter security password"
                  className="w-full h-[52px] bg-[rgba(255,255,255,0.05)] border border-transparent rounded-[12px] pl-12 pr-12 text-white text-[0.9rem] font-body outline-none placeholder:text-[#A0A0B0]/50 placeholder:italic transition-all duration-300 focus:border-[#FF6B00]/50 focus:bg-[rgba(255,107,0,0.05)] focus:shadow-[0_0_15px_rgba(255,107,0,0.15)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-white transition-colors duration-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="pt-1 pb-4">
              <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-white/20 group-hover:border-[#FF6B00]/50 bg-transparent'}`}>
                  {rememberMe && <Check size={12} className="text-white" strokeWidth={4} />}
                </div>
                <span className="text-[0.8rem] font-body text-[#A0A0B0] group-hover:text-white transition-colors">
                  Keep me signed in
                </span>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="relative w-full h-[54px] bg-[#FF6B00] text-white font-body font-[700] text-[0.85rem] uppercase tracking-[0.15em] rounded-[12px] transition-all duration-300 flex items-center justify-center hover:bg-[#ff7b1a] hover:scale-[1.02] hover:shadow-[0_10px_25px_rgba(255,107,0,0.4)] hover:brightness-110 active:scale-[0.97] overflow-hidden group"
            >
              {loading ? (
                <div className="w-5 h-5 border-[2px] border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Initialize Login'
              )}
            </button>
          </form>

          {/* Forgot Credentials */}
          <div className="mt-6 text-center">
            <button className="text-[0.75rem] font-body text-[#A0A0B0] hover:text-[#FF6B00] hover:underline underline-offset-4 transition-all">
              Forgot credentials?
            </button>
          </div>

          {/* Footer */}
          <div className="mt-10 border-t border-white/[0.05] pt-6 text-center">
            <p className="text-[0.65rem] font-body text-[#A0A0B0]/50 uppercase tracking-[0.15em]">
              Chandrakant Traders &copy; 2026
            </p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default Login;
