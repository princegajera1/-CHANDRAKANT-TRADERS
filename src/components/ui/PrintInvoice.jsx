import React from 'react';

export const PrintInvoice = ({ bill, shopSettings, safeFormatDate, numberToWords }) => {
  if (!bill) return null;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 15mm; }
          html, body, #root { 
            height: 100vh !important;
            overflow: hidden !important;
            margin: 0 !important; 
            padding: 0 !important; 
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden; }
          #bill-print-area, #bill-print-area * { visibility: visible; }
          #bill-print-area { 
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 100% !important; 
            max-width: 100% !important;
            margin: 0 !important; 
            padding: 0 !important;
            background-color: white !important;
          }
        }
      `}</style>

      <div className="hidden print:flex print:absolute print:inset-0 print:bg-white print:text-black print:z-[99999] print:m-0 w-full font-sans justify-center">
        {/* Container has no fixed height, allows it to size to content for html2canvas */}
        <div id="bill-print-area" className="w-full max-w-[794px] mx-auto bg-white text-black print:p-0 p-[20px]" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* OUTER BORDER with 16px inner padding */}
          <div className="border-[2px] border-black p-[16px] flex flex-col gap-[8px]" style={{ pageBreakInside: 'avoid' }}>
            
            {/* HEADER SECTION */}
            <div className="flex justify-between items-start pb-[8px] border-b-[1px] border-black">
              <div className="flex items-start gap-3">
                <div className="w-[40px] h-[40px] bg-[#FF6A00] flex items-center justify-center text-white font-black text-[18px] leading-none">CT</div>
                <div>
                  <h1 className="font-bold text-[16px] text-black uppercase leading-none mb-1">{shopSettings?.name || 'CHANDRAKANT TRADERS'}</h1>
                  <p className="text-[11px] text-black">Shop No. 27/28/29, Taluka Panchayat Shopping Center,</p>
                  <p className="text-[11px] text-black">Mahuva Road, Savarkundla, Dist. Amreli - 364515</p>
                  <p className="text-[11px] text-black font-bold mt-1">Mobile: {shopSettings?.phone || '9727031027'}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="border-[1.5px] border-black px-3 py-1 font-bold text-[13px] uppercase mb-1">TAX INVOICE</div>
                <p className="text-[10px] text-black uppercase">Original For Recipient</p>
                {shopSettings?.gstin && <p className="text-[10px] text-black uppercase font-bold mt-1">GSTIN: {shopSettings.gstin}</p>}
              </div>
            </div>

            {/* BILL INFO SECTION */}
            <div className="flex border-[1px] border-gray-400 mt-[2px]">
              <div className="flex-1 p-[8px] border-r-[1px] border-gray-400">
                <p className="text-[11px] text-gray-500 uppercase mb-1">Billed To:</p>
                <h3 className="text-[11px] font-bold uppercase text-black">{bill.customerName}</h3>
                <p className="text-[11px] text-black uppercase mt-1">Phone: <span className="font-bold">{bill.customerPhone}</span></p>
              </div>
              <div className="flex-1 p-[8px] flex flex-col justify-center space-y-1">
                <div className="flex justify-between"><span className="text-[11px] text-gray-500 uppercase">Invoice No:</span> <span className="text-[11px] font-bold text-black">#{bill.billNo}</span></div>
                <div className="flex justify-between"><span className="text-[11px] text-gray-500 uppercase">Date:</span> <span className="text-[11px] font-bold text-black">{safeFormatDate(bill.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-[11px] text-gray-500 uppercase">Payment:</span> <span className="text-[11px] font-bold text-black">{bill.paymentMode}</span></div>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="w-full mt-[2px]">
              <table className="w-full border-collapse" style={{ border: '0.5px solid #ddd' }}>
                <thead>
                  <tr className="bg-[#1a1a1a] text-white">
                    <th className="p-[6px] text-[10px] font-bold uppercase text-center border-[0.5px] border-[#ddd]" style={{ width: '4%' }}>#</th>
                    <th className="p-[6px] text-[10px] font-bold uppercase text-left border-[0.5px] border-[#ddd]" style={{ width: '35%' }}>Product</th>
                    <th className="p-[6px] text-[10px] font-bold uppercase text-center border-[0.5px] border-[#ddd]" style={{ width: '12%' }}>HSN</th>
                    <th className="p-[6px] text-[10px] font-bold uppercase text-center border-[0.5px] border-[#ddd]" style={{ width: '8%' }}>Qty</th>
                    <th className="p-[6px] text-[10px] font-bold uppercase text-right border-[0.5px] border-[#ddd]" style={{ width: '14%' }}>Rate</th>
                    <th className="p-[6px] text-[10px] font-bold uppercase text-center border-[0.5px] border-[#ddd]" style={{ width: '10%' }}>GST%</th>
                    <th className="p-[6px] text-[10px] font-bold uppercase text-right border-[0.5px] border-[#ddd]" style={{ width: '17%' }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                      <td className="p-[6px] text-[10px] text-center border-[0.5px] border-[#ddd]">{idx + 1}</td>
                      <td className="p-[6px] text-[10px] text-left border-[0.5px] border-[#ddd] uppercase font-bold">{item.productName}</td>
                      <td className="p-[6px] text-[10px] text-center border-[0.5px] border-[#ddd]">{item.hsnCode || '4011'}</td>
                      <td className="p-[6px] text-[10px] text-center border-[0.5px] border-[#ddd]">{item.quantity}</td>
                      <td className="p-[6px] text-[10px] text-right border-[0.5px] border-[#ddd]">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="p-[6px] text-[10px] text-center border-[0.5px] border-[#ddd]">{item.gstPercent || 5}%</td>
                      <td className="p-[6px] text-[10px] text-right border-[0.5px] border-[#ddd] font-bold">₹{item.itemTotal?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS SECTION */}
            <div className="flex border-[1px] border-gray-400 mt-[2px]">
              <div className="flex-1 p-[8px] flex items-center border-r-[1px] border-gray-400">
                <div>
                  <p className="text-[10px] italic text-gray-600 uppercase mb-1">Amount In Words:</p>
                  <p className="text-[10px] font-bold uppercase text-black" style={{ maxWidth: '80%' }}>{numberToWords(bill.grandTotal)}</p>
                </div>
              </div>
              <div className="w-[280px] p-[8px] flex flex-col justify-center space-y-1 bg-[#fafafa]">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-black">Subtotal:</span>
                  <span className="text-[11px] font-bold text-black">₹{bill.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-black">CGST ({(bill.items[0]?.gstPercent || 5) / 2}%):</span>
                  <span className="text-[11px] font-bold text-black">₹{(bill.gstAmount / 2)?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-black">SGST ({(bill.items[0]?.gstPercent || 5) / 2}%):</span>
                  <span className="text-[11px] font-bold text-black">₹{(bill.gstAmount / 2)?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-1 border-t-[1px] border-black">
                  <span className="text-[13px] font-bold text-black uppercase">Grand Total:</span>
                  <span className="text-[13px] font-bold text-black">₹{bill.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* TERMS & CONDITIONS */}
            <div className="mt-[2px] p-[4px]">
              <p className="text-[9px] font-bold text-black mb-1 uppercase underline">Terms & Conditions</p>
              <ol className="list-decimal list-inside text-[9px] text-black space-y-[2px]">
                <li>Goods once sold will not be taken back.</li>
                <li>Our risk and responsibility ceases as soon as goods leave our premises.</li>
                <li>Subject to Savarkundla Jurisdiction only. E.&.O.E</li>
              </ol>
            </div>

            {/* FOOTER SIGNATURE */}
            <div className="mt-[20px] pt-[8px] border-t-[1px] border-dashed border-gray-400 flex justify-end">
              <div className="w-[200px] text-center pt-[40px]">
                <p className="text-[9px] text-black uppercase font-bold mb-8">For {shopSettings?.name || 'CHANDRAKANT TRADERS'}</p>
                <div className="border-t-[1px] border-black w-full mb-1"></div>
                <p className="text-[9px] text-black font-bold uppercase tracking-widest">Authorized Signatory</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
