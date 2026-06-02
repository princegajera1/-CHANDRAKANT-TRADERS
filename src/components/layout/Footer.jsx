import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--accent)]/10 pt-20 pb-0 font-body relative overflow-hidden transition-colors duration-500">
      
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_1fr_1.2fr] gap-16 pb-20">
          
          {/* COLUMN 1 — BRAND BLOCK */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-[14px] group cursor-pointer w-fit">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent)] to-[#00A3C4] text-[var(--primary)] rounded-[14px] flex items-center justify-center font-black text-xl italic shadow-xl shadow-[rgba(0,212,255,0.15)] group-hover:scale-105 transition-transform duration-300">CT</div>
              <div>
                <h4 className="text-[1.5rem] font-heading font-extrabold italic leading-none text-white tracking-[0.05em] uppercase group-hover:text-[var(--accent)] transition-colors duration-300">CHANDRAKANT</h4>
                <p className="text-[var(--accent)] text-[0.65rem] font-heading font-bold tracking-[0.28em] uppercase mt-1">TRADERS</p>
              </div>
            </Link>
            
            <p className="max-w-[300px] text-[0.9rem] font-normal leading-[1.75] text-white/50">
              Savarkundla's absolute authority in multi-brand tyres and computerized diagnostics since 1998.
            </p>
            
            <div className="flex items-center gap-4">
              {[
                { 
                  id: 'instagram',
                  Icon: Instagram, 
                  link: 'https://instagram.com/',
                  hoverBg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                  hoverGlow: 'rgba(220,39,67,0.4)'
                },
                { 
                  id: 'facebook',
                  Icon: Facebook, 
                  link: 'https://facebook.com/',
                  hoverBg: '#1877F2',
                  hoverGlow: 'rgba(24,119,242,0.4)'
                },
                { 
                  id: 'whatsapp',
                  Icon: () => (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  ), 
                  link: 'https://wa.me/919727031027',
                  hoverBg: '#25D366',
                  hoverGlow: 'rgba(37,211,102,0.4)'
                }
              ].map((social, i) => (
                <a 
                  key={social.id} 
                  href={social.link}
                  target="_blank"
                  rel="noreferrer" 
                  className="social-icon-box w-10 h-10 flex items-center justify-center bg-white/[0.05] border border-white/10 rounded-[10px] text-[#6A7080] transition-all duration-[0.3s] cubic-bezier hover:scale-110 hover:text-white"
                  style={{ 
                    '--hover-bg': social.hoverBg,
                    '--hover-glow': social.hoverGlow
                  }}
                >
                  <social.Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* COLUMN 2 — NAVIGATION */}
          <div className="flex flex-col">
            <div className="mb-[1.8rem]">
              <h4 className="text-[var(--accent)] text-[0.68rem] font-heading font-bold tracking-[0.22em] uppercase italic">NAVIGATION</h4>
              <div className="h-[2px] w-6 bg-[var(--accent)] mt-2"></div>
            </div>
            
            <ul className="flex flex-col gap-[1.05rem]">
              {[
                { name: 'Home', path: '/' },
                { name: 'Services', path: '/services/tyre-fitting' },
                { name: 'About', path: '/about' },
                { name: 'Tyre Care', path: '/tyre-care' },
                { name: 'Fleet Portal', path: '/fleet-solutions' },
                { name: 'Contact', path: '/contact' }
              ].map((link, i) => (
                <li key={i}>
                  <Link 
                    to={link.path}
                    className="group flex items-center gap-0 hover:gap-2 text-white/55 text-[0.92rem] font-medium hover:text-white transition-all duration-[0.22s] ease-in-out animate-none"
                  >
                    <span className="w-0 h-1 bg-[var(--accent)] rounded-full group-hover:w-1 transition-all duration-[0.22s]"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3 — COORDINATES */}
          <div className="space-y-10">
            <div>
              <div className="mb-[1.8rem]">
                <h4 className="text-[var(--accent)] text-[0.68rem] font-heading font-bold tracking-[0.22em] uppercase italic">COORDINATES</h4>
                <div className="h-[2px] w-6 bg-[var(--accent)] mt-2"></div>
              </div>
              
              <a href="https://maps.google.com/?q=MG+Road,+Savarkundla,+Gujarat+364515" target="_blank" rel="noreferrer" className="flex items-start gap-3 group cursor-pointer hover:text-[var(--accent)] transition-colors duration-[0.22s]">
                <MapPin size={20} className="text-[var(--accent)] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-[0.92rem] font-semibold text-white group-hover:text-[var(--accent)] transition-colors duration-[0.22s]">MG Road, Savarkundla</p>
                  <p className="text-white/50 text-[0.82rem] font-normal group-hover:text-[var(--accent)]/70 transition-colors duration-[0.22s]">Gujarat 364515</p>
                </div>
              </a>
            </div>

            <a href="tel:+919924058659" className="group cursor-pointer flex items-center gap-3 hover:text-[var(--accent)] transition-colors duration-[0.22s]">
              <Phone size={20} className="text-[var(--accent)] shrink-0 group-hover:scale-110 transition-transform" />
              <p className="text-[0.95rem] font-bold text-white group-hover:text-[var(--accent)] tracking-[0.03em] transition-all duration-200">
                +91 99240 58659
              </p>
            </a>

            <div className="flex items-center gap-3 group cursor-pointer hover:text-[var(--accent)] transition-colors duration-[0.22s]">
              <Clock size={18} className="text-[var(--accent)] shrink-0 group-hover:scale-110 transition-transform" />
              <p className="text-[0.8rem] font-normal text-white/35 group-hover:text-[var(--accent)]/70 transition-colors duration-[0.22s]">
                Mon – Sat, 9:00 AM to 8:00 PM
              </p>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/[0.07] mt-10">
          <div className="w-full py-2">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-[1.4rem]">
              <p className="text-[0.72rem] font-heading font-bold tracking-[0.1em] uppercase text-white/28 italic text-center md:text-left whitespace-nowrap">
                © 2026 CHANDRAKANT TRADERS · INDUSTRIAL GRADE PERFORMANCE
              </p>
              
              <div className="flex items-center gap-8 text-[0.72rem] font-heading font-bold tracking-[0.1em] uppercase text-white/28 italic">
                <Link to="/security-profile" className="hover:text-white/70 transition-all duration-[0.2s]">SECURITY PROFILE</Link>
                <Link to="/terms-of-operations" className="hover:text-white/70 transition-all duration-[0.2s]">TERMS OF OPERATIONS</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Hover Dot Effect Style */}
      <style>{`
        .footer-link-dot {
          display: inline-block;
          width: 0;
          height: 4px;
          background-color: var(--accent);
          border-radius: 50%;
          margin-right: 0;
          transition: all 0.22s ease;
        }
        .footer-link:hover .footer-link-dot {
          width: 4px;
          margin-right: 8px;
        }
        .social-icon-box:hover {
          background: var(--hover-bg) !important;
          border-color: transparent !important;
          box-shadow: 0 4px 15px var(--hover-glow);
        }
      `}</style>

    </footer>
  );
};

export default Footer;
