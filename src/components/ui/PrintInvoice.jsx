import React from 'react';
import { formatIndianNumber } from '../../utils/amountToWords';

export const PrintInvoice = ({ bill, shopSettings, safeFormatDate, amountToWords, numberToWords }) => {
  if (!bill) return null;

  // Minimum 12 rows logic to fit on a single A4 page and fill the layout
  const minRows = 12;
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

  // Check if bank details are actually configured (not empty or hyphen)
  const hasBankDetails = (shopSettings?.panNo && shopSettings.panNo !== '-') ||
                         (shopSettings?.bankName && shopSettings.bankName !== '-') ||
                         (shopSettings?.bankAccount && shopSettings.bankAccount !== '-') ||
                         (shopSettings?.bankIfsc && shopSettings.bankIfsc !== '-');

  // Support amount to words fallback if passed as numberToWords
  const convertAmountToWords = amountToWords || numberToWords || ((val) => {
    if (!val) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((val = val.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + val).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
    return str;
  });

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 6mm; 
          }
          body {
            visibility: hidden !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
          #bill-print-area, #bill-print-area * { visibility: visible !important; }
          #bill-print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important;
            width: 100% !important;
            max-width: 198mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            color: black !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div className="print-only-container w-full" style={{ fontFamily: "'Times New Roman', Times, serif", color: '#000' }}>
        <div id="bill-print-area">
          
          {/* Main Wrapper with 1px solid black border */}
          <div className="border border-black relative flex flex-col min-h-[250mm]" style={{ marginTop: '14px' }}>
            
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
                <span className="m-0 mt-0.5 text-center font-bold">Mobile: {shopSettings?.mobile || '9924058659'}</span>
              </div>
            </div>

            {/* SECTION B — CUSTOMER + INVOICE INFO */}
            <div className="flex border-b border-black">
              {/* LEFT COLUMN: Customer info */}
              <div className="flex-[1.2] p-2 border-r border-black">
                <h3 className="text-[13px] font-bold uppercase m-0 leading-tight">M/s. {bill.customerName}</h3>
                <p className="text-[11px] uppercase m-0 mt-0.5 leading-tight">{bill.customerAddress || '-'}</p>
                
                <p className="text-[11px] uppercase m-0 mt-1">
                  GSTIN: <span className="font-bold">{bill.customerGstin || '-'}</span>
                </p>
                <p className="text-[11px] uppercase m-0">
                  Place of Supply: {shopSettings?.state || 'Gujarat'} - {shopSettings?.stateCode || '24'}
                </p>
              </div>
              
              {/* RIGHT COLUMN: Invoice Details */}
              <div className="flex-1 p-2">
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="w-24">Invoice No.</td>
                      <td className="font-bold">: #{bill.billNo}</td>
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
                    <tr>
                      <td>Serial No.</td>
                      <td className="font-bold" style={{ wordBreak: 'break-all' }}>
                        : {bill.serialNo || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION C — PRODUCT TABLE */}
            <div className="w-full border-b border-black flex-1">
              <table className="w-full border-collapse h-full">
                <thead>
                  <tr className="bg-black text-white text-[11px] font-bold border-b border-black">
                    <th className="p-1 border-r border-black font-bold" style={{ width: '6%' }}>Sr.No</th>
                    <th className="p-1 border-r border-black font-bold text-left" style={{ width: '48%' }}>Product Description</th>
                    <th className="p-1 border-r border-black font-bold" style={{ width: '10%' }}>HSN</th>
                    <th className="p-1 border-r border-black font-bold text-right" style={{ width: '8%' }}>Qty</th>
                    <th className="p-1 border-r border-black font-bold text-right" style={{ width: '12%' }}>Rate</th>
                    <th className="p-1 font-bold text-right" style={{ width: '16%' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    return (
                      <tr key={index} className="align-top border-b border-black last:border-b-0 text-[11px] h-7">
                        <td className="p-1 text-center border-r border-black">{index + 1}</td>
                        <td className="p-1 text-left border-r border-black uppercase font-bold">
                          <div>{item.productName}</div>
                          {(item.size || item.tyreSize) && !item.productName.toUpperCase().includes((item.size || item.tyreSize).toUpperCase()) && (
                            <div className="text-[9px] text-gray-500 font-normal normal-case mt-0.5 leading-none">
                              Tyre Size: {item.size || item.tyreSize}
                            </div>
                          )}
                        </td>
                        <td className="p-1 text-center border-r border-black">{item.hsnCode || '4011'}</td>
                        <td className="p-1 text-right border-r border-black">{item.quantity}</td>
                        <td className="p-1 text-right border-r border-black">{formatIndianNumber(item.unitPrice)}</td>
                        <td className="p-1 text-right font-bold">{formatIndianNumber(item.itemTotal)}</td>
                      </tr>
                    );
                  })}
                  {/* Empty rows filling */}
                  {emptyRows.map((_, i) => (
                    <tr key={`empty-${i}`} className="align-top border-b border-black last:border-b-0 text-[11px] h-7">
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1 border-r border-black"></td>
                      <td className="p-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION E — FOOTER TWO COLUMNS */}
            <div className="flex border-b border-black min-h-[120px]">
              {/* LEFT COLUMN: Bank Details & Amount Words */}
              <div className="flex-[1.2] p-2 border-r border-black flex flex-col justify-between">
                {hasBankDetails && (
                  <div className="text-[10px] leading-tight">
                    {shopSettings?.panNo && shopSettings.panNo !== '-' && <p className="m-0 font-bold">PAN NO.: {shopSettings.panNo}</p>}
                    {shopSettings?.bankName && shopSettings.bankName !== '-' && <p className="m-0 mt-0.5">Bank Name: <span className="font-semibold">{shopSettings.bankName}</span></p>}
                    {shopSettings?.bankAccount && shopSettings.bankAccount !== '-' && <p className="m-0">A/c No.: <span className="font-semibold">{shopSettings.bankAccount}</span></p>}
                    {shopSettings?.bankIfsc && shopSettings.bankIfsc !== '-' && <p className="m-0">IFSC Code: <span className="font-semibold">{shopSettings.bankIfsc}</span></p>}
                    {shopSettings?.bankBranch && <p className="m-0">Branch: {shopSettings?.bankBranch}</p>}
                  </div>
                )}
                
                <div className="mt-2 text-[10px]">
                  <p className="m-0 font-bold mb-0.5">Tax Amount (in words):</p>
                  <p className="m-0 uppercase italic text-gray-700">{convertAmountToWords(bill.gstAmount)}</p>
                  
                  <p className="m-0 font-bold mt-2 mb-0.5">Total Amount (in words):</p>
                  <p className="m-0 uppercase font-bold text-gray-900">{convertAmountToWords(bill.grandTotal)}</p>
                </div>
              </div>

              {/* RIGHT COLUMN: Payment Summary */}
              <div className="flex-[0.8] flex flex-col text-[11px]">
                <div className="flex justify-between px-2 py-1 border-b border-black">
                  <span>Sub Total:</span>
                  <span>₹{formatIndianNumber(bill.subtotal)}</span>
                </div>
                
                <div className="flex-1 p-2 border-b border-black text-[10.5px]">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td>Taxable Amount:</td>
                        <td className="text-right">₹{formatIndianNumber(bill.subtotal - (bill.discountAmount || 0))}</td>
                      </tr>
                      <tr>
                        <td>CGST (9%):</td>
                        <td className="text-right">₹{formatIndianNumber(bill.gstAmount / 2)}</td>
                      </tr>
                      <tr>
                        <td>SGST (9%):</td>
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
                <div className="p-2 border-[2px] border-black m-1 bg-gray-50">
                  <div className="flex justify-between font-bold text-[14px]">
                    <span>Grand Total</span>
                    <span>₹{formatIndianNumber(bill.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION F — TERMS & CONDITIONS + SIGNATURE */}
            <div className="flex min-h-[70px] mt-auto">
              <div className="flex-[1.2] p-2">
                <p className="text-[9px] font-bold mb-0.5 underline">Terms & Conditions:</p>
                <div className="text-[8px] leading-normal text-gray-700">
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
                <p className="text-[10px] font-bold m-0 uppercase">For {shopSettings?.shopName || shopSettings?.name || 'CHANDRAKANT TRADERS'}</p>
                
                <div className="mt-6">
                  <div className="w-28 border-b border-black mb-0.5"></div>
                  <p className="text-[9px] m-0 text-gray-500">(Authorized Signatory)</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
