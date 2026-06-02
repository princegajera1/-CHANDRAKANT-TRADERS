import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, anonymousLogin } from '../firebase/auth';
import { toast } from 'react-hot-toast';
import { User, Lock, Check, Eye, EyeOff, ShieldCheck, PlayCircle } from 'lucide-react';
import { logActivity } from '../utils/activity';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAuthContext } from '../context/AuthContext';

const Login = () => {
  const { user, profile, loading: authLoading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestData, setGuestData] = useState({ name: '', email: '', phone: '', purpose: '' });
  
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoVisitorName, setDemoVisitorName] = useState('');
  
  const navigate = useNavigate();
  
  // Handle "Remember Me" and Entrance Animation on Mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('remembered_admin');
    if (saved) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      } catch (e) {
        console.error("Error loading remembered credentials", e);
      }
    }
  }, []);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!demoVisitorName.trim()) {
      toast.error("Identification required to proceed");
      return;
    }
    setLoading(true);
    try {
      const demoEmail = 'demo@chandrakanttraders.com';
      const demoPass = 'Demo@123'; 
      
      // Store name for AuthContext
      localStorage.setItem('demo_visitor_name', demoVisitorName);
      
      try {
        await loginUser(demoEmail, demoPass);
      } catch (authError) {
        console.warn("Auth failed, using local demo bypass:", authError);
        localStorage.setItem('is_demo_session', 'true');
      }
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        userId: 'demo-user',
        userEmail: demoEmail,
        userName: `DEMO: ${demoVisitorName}`,
        role: 'demo',
        action: 'LOGIN',
        timestamp: serverTimestamp(),
        device: navigator.userAgent,
        browser: 'Chrome',
        os: 'Windows',
        ipAddress: 'Captured'
      });

      toast.success(`Welcome, ${demoVisitorName}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error("Critical System Error. Please try again.");
    } finally {
      setLoading(false);
      setIsDemoModalOpen(false);
    }
  };
  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'guestRequests'), {
        ...guestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        approvedAt: null,
        approvedBy: null,
        expiresAt: null
      });
      toast.success('Request submitted! Admin will review.');
      setIsGuestModalOpen(false);
      setGuestData({ name: '', email: '', phone: '', purpose: '' });
    } catch (err) {
      toast.error('Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasError(false);
    try {
      // 1. Try Firebase Auth
      // Normal Firebase Auth for everyone (Owners, Admins, etc.)
      const { user, profile } = await loginUser(email, password);
      
      if (!user) {
        throw new Error('Invalid credentials. Identity not verified.');
      }
      
      if (!profile && email !== 'demo@chandrakanttraders.com') {
        toast.error("ACCESS DENIED: Your admin profile has been revoked or does not exist.");
        setHasError(true);
        setTimeout(() => setHasError(false), 500);
        setLoading(false);
        return;
      }
      
      // Save or Clear Remembered Credentials
      if (rememberMe) {
        localStorage.setItem('remembered_admin', JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem('remembered_admin');
      }

      const displayName = profile?.name || user.displayName || user.email.split('@')[0];
      await logActivity({ ...user, displayName }, 'LOGIN');
      toast.success('Access Granted');
      navigate('/dashboard');
    } catch (error) {
      setHasError(true);
      if (error.code === 'auth/too-many-requests') {
        toast.error("Too many login attempts. Please wait a minute and try again.");
      } else if (error.code === 'auth/invalid-credential') {
        toast.error("Invalid email or password. Please check your credentials.");
      } else {
        toast.error(error.message || "Invalid credentials.");
      }
      // Remove error state after animation
      setTimeout(() => setHasError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsDemoModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#080C14] font-body text-white selection:bg-[#FF6A00] selection:text-white overflow-hidden">
      
      {/* Left Side - Luxury Automotive Background */}
      <div className="w-full md:w-1/2 h-[30vh] md:h-screen relative overflow-hidden flex items-center justify-center p-8">
        <img 
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000" 
          alt="Luxury car" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent via-[#080C14]/60 to-[#080C14]"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 h-[70vh] md:h-screen relative flex items-start justify-center p-6 md:p-12 pt-[12vh] md:pt-[15vh]">
        {/* Subtle Animated Background Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
          <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.08)_0%,rgba(10,10,15,0)_60%)] animate-[spin_60s_linear_infinite]"></div>
        </div>

        {/* Freely Floating Form Container */}
        <div 
          className={`relative z-10 w-full max-w-[400px] p-8 md:p-10 transition-all duration-700 ease-out ${hasError ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
          style={{
            opacity: isMounted ? 1 : 0,
            transform: isMounted ? 'translateY(0)' : 'translateY(40px)'
          }}
        >
          {/* Header Branding */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-[52px] h-[52px] bg-[#FF6A00] rounded-[14px] flex items-center justify-center text-white font-heading font-[800] text-[1.2rem] shadow-[0_0_30px_rgba(255,106,0,0.4)]">
              CT
            </div>
            <div>
              <h1 className="font-heading font-[800] text-[1.5rem] text-white uppercase tracking-[0.15em] leading-tight">
                Authorization
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck size={12} className="text-[#FF6A00]" />
                <span className="font-body font-[700] text-[#FF6A00] text-[0.65rem] uppercase tracking-[0.2em]">
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
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] group-focus-within:text-[#FF6A00] transition-colors duration-300" />
                <input 
                  type="email" 
                  required
                  placeholder="Enter authorized email"
                  className="w-full h-[54px] bg-white/[0.05] border border-transparent rounded-[12px] pl-12 pr-4 text-white text-[0.9rem] font-body outline-none placeholder:text-[#A0A0B0]/50 transition-all duration-300 focus:border-[#FF6A00]/50 focus:bg-[#FF6A00]/5 focus:shadow-[0_0_20px_rgba(255,106,0,0.1)]"
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
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] group-focus-within:text-[#FF6A00] transition-colors duration-300" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="Enter security password"
                  className="w-full h-[54px] bg-white/[0.05] border border-transparent rounded-[12px] pl-12 pr-12 text-white text-[0.9rem] font-body outline-none placeholder:text-[#A0A0B0]/50 transition-all duration-300 focus:border-[#FF6A00]/50 focus:bg-[#FF6A00]/5 focus:shadow-[0_0_20px_rgba(255,106,0,0.1)]"
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
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-[#FF6A00] border-[#FF6A00]' : 'border-white/10 group-hover:border-[#FF6A00]/50 bg-transparent'}`}>
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
              className="relative w-full h-[56px] bg-[#FF6A00] text-white font-body font-black text-[0.8rem] uppercase tracking-[0.2em] rounded-[14px] transition-all duration-300 flex items-center justify-center hover:bg-[#ff7b1a] hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(255,106,0,0.4)] active:scale-[0.97] overflow-hidden group"
            >
              {loading ? (
                <div className="w-5 h-5 border-[2px] border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Initialize Login'
              )}
            </button>

            <div className="mt-6 text-center">
              <button type="button" className="text-[0.75rem] font-body text-[#A0A0B0] hover:text-[#FF6A00] transition-all">
                Forgot credentials?
              </button>
            </div>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[0.6rem] uppercase tracking-[0.2em] font-black text-white/10"><span className="bg-[#080C14] px-4">OR</span></div>
            </div>

            <button 
              type="button" 
              onClick={handleDemoLogin}
              className="w-full h-[56px] bg-white/[0.03] border border-white/10 text-white/40 font-body font-black text-[0.75rem] uppercase tracking-[0.2em] rounded-[14px] transition-all duration-300 flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white"
            >
              Try Demo Mode
            </button>

            <button 
              type="button" 
              onClick={() => setIsGuestModalOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 text-[0.65rem] font-body font-black text-[#A0A0B0]/20 hover:text-[#FF6A00] transition-colors uppercase tracking-[0.2em]"
            >
              <Eye size={12} /> Request Guest Access
            </button>
          </form>

          {/* Guest Request Modal (Preserved but styled) */}
          {isGuestModalOpen && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-[#080C14]/95 backdrop-blur-md" onClick={() => setIsGuestModalOpen(false)}></div>
              <div className="relative w-full max-w-[480px] bg-[#0D121F] border border-white/10 rounded-[32px] p-10 shadow-2xl animate-page-entrance">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-[#FF6A00]/10 rounded-2xl flex items-center justify-center text-[#FF6A00]">
                    <Eye size={28} />
                  </div>
                  <div>
                    <h3 className="text-[1.3rem] font-heading font-black text-white uppercase tracking-tight">Access Request</h3>
                    <p className="text-[0.8rem] text-white/40 font-body mt-1">Submit your profile for temporary clearance</p>
                  </div>
                </div>

                <form onSubmit={handleGuestSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#A0A0B0]/50 ml-1">Full Name *</label>
                    <input 
                      required
                      className="w-full h-[52px] px-5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
                      value={guestData.name}
                      onChange={e => setGuestData({...guestData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#A0A0B0]/50 ml-1">Email Address *</label>
                    <input 
                      required
                      type="email"
                      className="w-full h-[52px] px-5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
                      value={guestData.email}
                      onChange={e => setGuestData({...guestData, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#A0A0B0]/50 ml-1">Phone</label>
                      <input 
                        className="w-full h-[52px] px-5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
                        value={guestData.phone}
                        onChange={e => setGuestData({...guestData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#A0A0B0]/50 ml-1">Purpose</label>
                      <input 
                        className="w-full h-[52px] px-5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all"
                        value={guestData.purpose}
                        onChange={e => setGuestData({...guestData, purpose: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-[60px] bg-[#FF6A00] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#ff7b1a] transition-all shadow-xl shadow-[#FF6A0022] mt-4"
                  >
                    {loading ? "Processing..." : "Submit Request"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {isDemoModalOpen && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-[#080C14]/95 backdrop-blur-md" onClick={() => setIsDemoModalOpen(false)}></div>
              <div className="relative w-full max-w-[440px] bg-[#0D121F] border border-white/10 rounded-[32px] p-10 shadow-2xl animate-page-entrance">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 bg-[#FF6A00]/10 rounded-2xl flex items-center justify-center text-[#FF6A00]">
                    <PlayCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-[1.3rem] font-heading font-black text-white uppercase tracking-tight">Visitor Identity</h3>
                    <p className="text-[0.8rem] text-white/40 font-body mt-1">Please identify yourself to enter Demo Mode</p>
                  </div>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#A0A0B0]/50 ml-1">Enter Your Name *</label>
                    <input 
                      required
                      autoFocus
                      className="w-full h-[56px] px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-[#FF6A00] transition-all font-bold"
                      placeholder="e.g. John Doe"
                      value={demoVisitorName}
                      onChange={e => setDemoVisitorName(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsDemoModalOpen(false)}
                      className="flex-1 h-[60px] rounded-2xl bg-white/5 border border-white/10 text-white text-[0.8rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-[2] h-[60px] bg-[#FF6A00] text-white font-black text-[0.8rem] uppercase tracking-[0.2em] rounded-2xl hover:bg-[#ff7b1a] transition-all shadow-xl shadow-[#FF6A0022] flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Enter Terminal"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 border-t border-white/[0.05] pt-6 text-center">
            <p className="text-[0.65rem] font-body text-white/10 uppercase tracking-[0.2em]">
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
