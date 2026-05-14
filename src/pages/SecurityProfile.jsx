import React from 'react';
import { Shield, Lock, Eye, Server } from 'lucide-react';

const SecurityProfile = () => {
  const securitySections = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      desc: "All data transmitted between your device and our administrative portal is encrypted using industry-standard AES-256 protocols. Your passwords and secure tokens are hashed and salted prior to database storage, ensuring absolute confidentiality even in the event of a breach."
    },
    {
      icon: Server,
      title: "Infrastructure Resilience",
      desc: "Our databases are hosted on enterprise-grade cloud infrastructure with 99.99% guaranteed uptime. We employ automated daily backups, geo-redundant storage, and strict firewall configurations to prevent unauthorized access and DDoS attacks."
    },
    {
      icon: Eye,
      title: "Access Monitoring",
      desc: "All administrative access is strictly monitored. The Precision Core system logs every login attempt, IP address, and operational action. We enforce stringent role-based access control (RBAC) meaning staff only have access to the data required for their specific duties."
    }
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-white pt-32 pb-24 font-body">
      <div className="max-w-[800px] mx-auto px-6 sm:px-12 animate-page-entrance">
        <div className="space-y-6 mb-20 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#FF6A000D] border border-[#FF6A0033] rounded-full">
            <Shield size={14} className="text-[#FF6A00]" />
            <span className="text-[0.65rem] font-black tracking-[0.18em] uppercase text-[#FF6A00]">Data Protection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tighter uppercase leading-none">
            Security <span className="text-[#FF6A00]">Profile</span>
          </h1>
          <p className="text-white/50 text-[0.95rem] leading-relaxed max-w-2xl mx-auto uppercase tracking-widest font-bold">
            Authorized Protocol Overview & Cryptographic Standards
          </p>
        </div>

        <div className="space-y-8">
          {securitySections.map((section, index) => (
            <section 
              key={index}
              className="bg-white/[0.02] border border-white/10 p-8 rounded-[24px] hover:border-[#FF6A00]/30 transition-all duration-500 group animate-card-entrance"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-[#FF6A0014] text-[#FF6A00] flex items-center justify-center rounded-2xl group-hover:bg-[#FF6A0022] transition-colors">
                  <section.icon size={28} />
                </div>
                <h2 className="text-[1.25rem] font-heading font-black uppercase tracking-wider">{section.title}</h2>
              </div>
              <p className="text-white/60 leading-relaxed text-[0.95rem] font-medium">
                {section.desc}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityProfile;
