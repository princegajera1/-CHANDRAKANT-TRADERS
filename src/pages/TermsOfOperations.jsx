import React from 'react';
import { FileText, AlertTriangle, Scale } from 'lucide-react';

const TermsOfOperations = () => {
  const termsSections = [
    {
      icon: FileText,
      title: "1. Portal Usage & Authorization",
      desc: "Access to the Precision Core administrative suite is restricted to authorized personnel only. Users must not share their cryptographic tokens or login credentials. Unauthorized access or attempts to reverse engineer the portal's infrastructure will result in immediate termination and potential legal action."
    },
    {
      icon: AlertTriangle,
      title: "2. Inventory & Billing Liability",
      desc: "While our system guarantees 99.9% computational accuracy, human input errors during billing or inventory management are the responsibility of the operator. Chandrakant Traders is not liable for financial discrepancies resulting from incorrect data entry. Always verify fleet logistics and pricing matrices prior to final execution."
    },
    {
      icon: Scale,
      title: "3. Service Modifications",
      desc: "We reserve the right to update, modify, or suspend any component of the portal for maintenance or security upgrades without prior notice. Operational terms may be revised periodically to align with updated security standards. Continued use of the portal implies acceptance of any modifications."
    }
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-white pt-32 pb-24 font-body">
      <div className="max-w-[800px] mx-auto px-6 sm:px-12 animate-page-entrance">
        <div className="space-y-6 mb-20 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#FF6A000D] border border-[#FF6A0033] rounded-full">
            <Scale size={14} className="text-[#FF6A00]" />
            <span className="text-[0.65rem] font-black tracking-[0.18em] uppercase text-[#FF6A00]">Legal Framework</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tighter uppercase leading-none">
            Terms of <span className="text-[#FF6A00]">Operations</span>
          </h1>
          <p className="text-white/50 text-[0.95rem] leading-relaxed max-w-2xl mx-auto uppercase tracking-widest font-bold">
            Authorized Directives & Operational Compliance
          </p>
        </div>

        <div className="space-y-8">
          {termsSections.map((section, index) => (
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

export default TermsOfOperations;
