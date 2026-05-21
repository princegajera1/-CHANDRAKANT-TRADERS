import React from 'react';
import { formatIndianNumber } from '../../utils/amountToWords';

export const PrintInvoice = ({ bill, shopSettings, safeFormatDate, amountToWords }) => {
  if (!bill) return null;

  // Minimum 8 rows logic
  const minRows = 8;
  const items = bill.items || [];
  const emptyRowsCount = Math.max(0, minRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  // Handle Terms and Conditions array or string
  let tnc = [];
  if (Array.isArray(shopSettings?.termsAndConditions)) {
    tnc = shopSettings.termsAndConditions;
  } else if (shopSettings?.termsAndConditions) {
    tnc = shopSettings.termsAndConditions.split('\n').filter(Boolean);
  } else if (shopSettings?.termsConditions) {
    tnc = shopSettings.termsConditions.split('\n').filter(Boolean);
  } else {
    tnc = [
      "Goods once sold will not be taken back.",
      "Our risk and responsibility ceases as soon as the goods leave our premises.",
      "Subject to Savarkundla Jurisdiction only. E.&O.E."
    ];
  }

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 8mm; 
          }
          body {
            font-family: 'Times New Roman', Times, serif !important;
          }
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important;
            width: 100% !important;
            max-width: 194mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            color: black !important;
            box-sizing: border-box !important;
          }
          /* Ensure zero top margin */
          #invoice-print-area > div {
            margin-top: 0 !important;
          }
        }
      `}</style>

      <div className="hidden print:block w-full" style={{ fontFamily: "'Times New Roman', Times, serif", color: '#000' }}>
        <div id="invoice-print-area">
          
          {/* Main Wrapper with 1px solid black border */}
          <div className="border border-black relative flex flex-col" style={{ marginTop: '14px' }}>
            
            {/* TAX INVOICE Badge */}
            <div className="absolute w-full flex justify-center left-0" style={{ top: '-14px' }}>
              <div 
                style={{
                  background: 'white',
                  border: '1px solid black',
                  padding: '2px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                TAX INVOICE
              </div>
            </div>

            {/* Original Badge */}
            <div className="absolute top-1 right-2 text-[10px]">
              Original
            </div>

            {/* SECTION A — HEADER */}
            <div className="w-full flex flex-col items-center justify-center pt-3 pb-2 border-b border-black text-center">
              <h1 className="text-[24px] font-bold uppercase m-0 leading-none text-center">
                {shopSettings?.shopName || shopSettings?.name || 'CHANDRAKANT TRADERS'}
              </h1>
              <div className="w-full flex flex-col items-center justify-center text-[12px] mt-1 leading-tight text-center">
                <span className="m-0 text-center">{shopSettings?.addressLine1 || 'Shop No. 27/28/29, Taluka Panchayat Shopping Center'}</span>
                <span className="m-0 text-center">
                  {shopSettings?.addressLine2 ? `${shopSettings.addressLine2}, ` : ''}
                  {shopSettings?.city || 'Savarkundla'}, Dist. {shopSettings?.district || 'Amreli'} - {shopSettings?.pin || '364515'}
                </span>
                <span className="m-0 mt-0.5 text-center">Mobile: {shopSettings?.mobile || shopSettings?.phone || '9727031027'}</span>
              </div>
            </div>

            {/* SECTION B — CUSTOMER + INVOICE INFO */}
            <div className="flex border-b border-black">
              {/* LEFT COLUMN: Debit Memo */}
              <div className="flex-[1.2] p-2 border-r border-black">
                <p className="text-[10px] italic mb-1">Debit Memo</p>
                <h3 className="text-[13px] font-bold uppercase m-0 leading-tight">M/s. {bill.customerName}</h3>
                <p className="text-[11px] uppercase m-0 mt-0.5 leading-tight">{bill.customerAddress || '-'}</p>
                
                {/* Try to extract city/pin from address if needed, or assume it's in address. */}
                <p className="text-[11px] uppercase m-0 mt-1">
                  GSTIN: <span className="font-bold">{bill.customerGstin || '-'}</span>
                </p>
                <p className="text-[11px] uppercase m-0">
                  Place of Supply: {shopSettings?.state || 'Gujarat'} - {shopSettings?.stateCode || '24'}
                </p>
              </div>
              
              {/* RIGHT COLUMN: Original Details */}
              <div className="flex-1 p-2">
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="w-24">Invoice No.</td>
                      <td className="font-bold">: {shopSettings?.invoicePrefix || ''}{bill.billNo}</td>
                    </tr>
                    <tr>
                      <td>Date</td>
                      <td className="font-bold">: {safeFormatDate(bill.createdAt)}</td>
                    </tr>
                    <tr>
                      <td>Vehicle No.</td>
                      <td className="font-bold">: {bill.vehicleNo || '-'}</td>
                    </tr>
                    <tr>
                      <td>Transporter</td>
                      <td className="font-bold">: {bill.transporter || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION C — PRODUCT TABLE */}
            <div className="w-full border-b border-black min-h-[250px]">
              <table className="w-full border-collapse h-full">
                <thead>
                  <tr className="bg-black text-white text-[11px] font-bold border-b border-black">
                    <th className="p-1 border-r border-black font-bold" style={{ width: '6%' }}>Sr.No</th>
                    <th className="p-1 border-r border-black font-bold text-left" style={{ width: '40%' }}>Product Name</th>
                    <th className="p-1 border-r border-black font-bold" style={{ width: '10%' }}>HSN</th>
                    <th className="p-1 border-r border-black font-bold text-right" style={{ width: '8%' }}>Qty</th>
                    <th className="p-1 border-r border-black font-bold text-right" style={{ width: '12%' }}>Rate</th>
                    <th className="p-1 border-r border-black font-bold text-right" style={{ width: '8%' }}>GST%</th>
                    <th className="p-1 font-bold text-right" style={{ width: '16%' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const isZeroGST = item.gstPercent === 0;
                    const showReverseCharge = isZeroGST && !!bill.customerGstin;
                    
                    return (
                      <tr key={index} className="align-top border-b border-black last:border-b-0 text-[11px]">
                        <td className="p-1 text-center border-r border-black">{item.serialNo || (index + 1)}</td>
                        <td className="p-1 text-left border-r border-black uppercase">
                          {item.productName}
                          {showReverseCharge && (
                            <div className="italic text-[9px] mt-0.5 lowercase first-letter:uppercase">
                              Reverse Charge Applicable
                            </div>
                          )}
                        </td>
                        <td className="p-1 text-center border-r border-black">{item.hsnCode || '4011'}</td>
                        <td className="p-1 text-right border-r border-black">{item.quantity}</td>
                        <td className="p-1 text-right border-r border-black">{formatIndianNumber(item.unitPrice)}</td>
                        <td className="p-1 text-right border-r border-black">{item.gstPercent || 0}%</td>
                        <td className="p-1 text-right font-bold">{formatIndianNumber(item.itemTotal)}</td>
                      </tr>
                    );
                  })}
                  {/* Empty rows filling */}
                  {emptyRows.map((_, i) => (
                    <tr key={`empty-${i}`} className="align-top border-b border-black last:border-b-0 text-[11px] h-6">
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1"></td>
                    </tr>
                  ))}
                  <tr className="flex-1">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION D — INFO BAR (Serial, IRN, ACK) */}
            <div className="border-b border-black bg-gray-50/50 p-2 text-[10px]">
              <div className="flex">
                <div className="flex-1">
                  <span className="font-bold">SERIAL NUMBER:</span> <span className="font-normal">{bill.items && bill.items.length > 0 ? bill.items.map(i => i.serialNo).join(', ') : '-'}</span>
                </div>
                <div className="flex-1 pl-4">
                  <span className="font-bold">ACK NO:</span> <span className="font-normal">{bill.ackNo || `202601${String(bill.billNo || '').padStart(4, '0')}`}</span>
                </div>
              </div>
              <div className="flex mt-0.5">
                <div className="flex-1">
                  <span className="font-bold">IRN:</span> <span className="font-normal">{bill.items && bill.items.length > 0 ? bill.items[0].serialNo : '-'}</span>
                </div>
                <div className="flex-1 pl-4">
                  <span className="font-bold">ACK DATE:</span> <span className="font-normal">{bill.ackDate ? safeFormatDate(bill.ackDate) : safeFormatDate(bill.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* SECTION E — FOOTER TWO COLUMNS */}
            <div className="flex border-b border-black min-h-[140px]">
              {/* LEFT COLUMN: Bank Details & Amount Words */}
              <div className="flex-[1.2] p-2 border-r border-black flex flex-col justify-between">
                <div className="text-[11px] leading-tight">
                  <p className="m-0 font-bold">GSTIN NO.: {bill.customerGstin || shopSettings?.gstin || shopSettings?.gstNo || '-'}</p>
                  <p className="m-0 mt-1">Bank: {bill.customerBankName || shopSettings?.bankName || '-'}</p>
                  <p className="m-0">Bank A/c No.: {bill.customerBankAccount || shopSettings?.bankAccount || shopSettings?.accountNumber || '-'}</p>
                  <p className="m-0">RTGS/IFSC Code: {bill.customerIfsc || shopSettings?.bankIfsc || shopSettings?.ifscCode || '-'}</p>
                </div>
                
                <div className="mt-4 text-[11px]">
                  <p className="m-0 font-bold mb-0.5">Note:</p>
                  <p className="m-0 uppercase italic">{amountToWords(bill.gstAmount)}</p>
                  
                  <p className="m-0 font-bold mt-2 mb-0.5">Bill Amount:</p>
                  <p className="m-0 uppercase font-bold">{amountToWords(bill.grandTotal)}</p>
                </div>
              </div>

              {/* RIGHT COLUMN: Payment Summary */}
              <div className="flex-[0.8] flex flex-col text-[11px]">
                <div className="flex justify-between px-2 py-1 border-b border-black">
                  <span>Sub Total:</span>
                  <span>₹{formatIndianNumber(bill.subtotal)}</span>
                </div>
                
                <div className="flex-1 p-2 border-b border-black">
                  <p className="font-bold underline mb-1">Payment Details:</p>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td>Taxable Amount:</td>
                        <td className="text-right">₹{formatIndianNumber(bill.subtotal - (bill.discountAmount || 0))}</td>
                      </tr>
                      <tr>
                        <td>Central Tax:</td>
                        <td className="text-right">₹{formatIndianNumber(bill.gstAmount / 2)}</td>
                      </tr>
                      <tr>
                        <td>State/UT Tax:</td>
                        <td className="text-right">₹{formatIndianNumber(bill.gstAmount / 2)}</td>
                      </tr>
                      <tr>
                        <td>Round Off:</td>
                        <td className="text-right">₹{formatIndianNumber(bill.grandTotal - (bill.subtotal - (bill.discountAmount || 0) + bill.gstAmount))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Grand Total Box */}
                <div className="p-2 border-[2px] border-black m-1">
                  <div className="flex justify-between font-bold text-[14px]">
                    <span>Grand Total</span>
                    <span>₹{formatIndianNumber(bill.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION F — TERMS & CONDITIONS + SIGNATURE */}
            <div className="flex min-h-[80px]">
              <div className="flex-[1.2] p-2">
                <p className="text-[10px] font-bold mb-1 underline">Terms & Conditions:</p>
                <div className="text-[9px]">
                  {tnc.map((term, i) => {
                    const isNumbered = /^\d+\./.test(term);
                    return (
                      <p key={i} className="m-0 leading-tight">
                        {isNumbered ? term : `${i + 1}. ${term}`}
                      </p>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex-[0.8] p-2 flex flex-col justify-between items-end text-right">
                <p className="text-[11px] font-bold m-0 uppercase">For {shopSettings?.shopName || shopSettings?.name || 'CHANDRAKANT TRADERS'}</p>
                
                <div className="mt-8">
                  <div className="w-32 border-b border-black mb-1"></div>
                  <p className="text-[10px] m-0">(Authorized Signatory)</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
