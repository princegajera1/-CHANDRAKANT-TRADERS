import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../firebase/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password should be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password, name);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-brand-100 overflow-hidden">
          <div className="bg-brand-500 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center font-bold text-3xl text-brand-500 shadow-lg mb-4">
              CT
            </div>
            <h1 className="text-xl font-bold">Create Account</h1>
            <p className="text-brand-100 text-xs">Join Chandrakant Traders</p>
          </div>
          
          <form onSubmit={handleRegister} className="p-8 space-y-4">
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="owner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full py-3 mt-4" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            
            <div className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
