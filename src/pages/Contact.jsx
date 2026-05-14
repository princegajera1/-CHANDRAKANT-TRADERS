import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, User, PhoneCall } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp()
      });
      toast.success('Message sent successfully! We will contact you soon.');
      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    } catch (error) {
      console.error('Error saving inquiry:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14]">
      <div className="app-container section-padding space-y-24">
        
        {/* Header */}
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-12 h-1 bg-[#FF6A00] mx-auto"></div>
          <h1 className="text-white uppercase">
            GET IN <span className="text-[#FF6A00]">TOUCH</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/70 font-medium">
            Have questions about our services or need a quote for your fleet? Our engineering hub is ready to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Contact Info */}
          <div className="space-y-12">
            <div className="pro-card space-y-10">
              <h3 className="text-[#FF6A00] italic tracking-tighter">Contact Coordinates</h3>
              
              <div className="space-y-8">
                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-[#FF6A001A] text-[#FF6A00] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <h4 className="text-white font-heading font-bold italic uppercase tracking-wider mb-1">Our Location</h4>
                    <p className="text-white/60">MG Road, Savarkundla, Gujarat 364515</p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-[#FF6A001A] text-[#FF6A00] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <PhoneCall size={28} />
                  </div>
                  <div>
                    <h4 className="text-white font-heading font-bold italic uppercase tracking-wider mb-1">Direct Line</h4>
                    <p className="text-white/60">+91 99240 58659</p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-[#FF6A001A] text-[#FF6A00] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail size={28} />
                  </div>
                  <div>
                    <h4 className="text-white font-heading font-bold italic uppercase tracking-wider mb-1">Email Protocol</h4>
                    <p className="text-white/60">info@chandrakanttraders.com</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="aspect-video bg-slate-900 border border-white/5 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200" 
                  alt="Location Map" 
                  className="w-full h-full object-cover opacity-30 grayscale"
                />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="pro-card">
            <h3 className="text-[#FF6A00] italic tracking-tighter mb-10">Transmission Protocol</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-tag text-[0.65rem] opacity-60">Full Identity</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6A00]" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Your Name"
                      className="w-full bg-[#080C14] border border-white/10 p-4 pl-12 text-white focus:border-[#FF6A00] outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-tag text-[0.65rem] opacity-60">Communication Link</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6A00]" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="Email Address"
                      className="w-full bg-[#080C14] border border-white/10 p-4 pl-12 text-white focus:border-[#FF6A00] outline-none transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-tag text-[0.65rem] opacity-60">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6A00]" size={18} />
                    <input 
                      type="tel" 
                      required
                      placeholder="Phone Number"
                      className="w-full bg-[#080C14] border border-white/10 p-4 pl-12 text-white focus:border-[#FF6A00] outline-none transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-tag text-[0.65rem] opacity-60">Subject Matter</label>
                  <select 
                    className="w-full bg-[#080C14] border border-white/10 p-4 text-white focus:border-[#FF6A00] outline-none transition-all"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  >
                    <option>General Inquiry</option>
                    <option>Service Booking</option>
                    <option>Fleet Partnership</option>
                    <option>Complaint/Feedback</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-tag text-[0.65rem] opacity-60">Detailed Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 text-[#FF6A00]" size={18} />
                  <textarea 
                    rows="5"
                    required
                    placeholder="Describe your requirement..."
                    className="w-full bg-[#080C14] border border-white/10 p-4 pl-12 text-white focus:border-[#FF6A00] outline-none transition-all resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-[#FF6A00] hover:bg-[#FF8C38] text-white font-heading font-bold italic text-[0.9rem] tracking-[0.2em] uppercase rounded-none shadow-2xl"
              >
                {loading ? 'Transmitting...' : 'Initiate Transmission'} <Send className="ml-3" size={18} />
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
