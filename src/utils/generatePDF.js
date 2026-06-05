import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateBillPDFBlob = async (bill, settings) => {
  let billDiv = document.getElementById('bill-print-area');
  if (!billDiv) {
    // Retry once after a short delay in case of DOM rendering transitions
    await new Promise(resolve => setTimeout(resolve, 500));
    billDiv = document.getElementById('bill-print-area');
  }
  if (!billDiv) return null;

  // Provide isolated rendering state
  const parentContainer = billDiv.parentElement;
  const originalDisplay = parentContainer.style.display;
  parentContainer.style.display = 'block';

  billDiv.style.width = '794px';
  billDiv.style.position = 'absolute';
  billDiv.style.left = '-9999px';
  document.body.appendChild(billDiv);

  try {
    const canvas = await html2canvas(billDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      windowWidth: 794
    });

    document.body.removeChild(billDiv);
    parentContainer.appendChild(billDiv); // Put it back

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4' 
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
    return pdf.output('blob');
  } finally {
    parentContainer.style.display = originalDisplay;
    billDiv.style.position = '';
    billDiv.style.left = '';
  }
};

export const generateBillPDF = async (bill, settings) => {
  const blob = await generateBillPDFBlob(bill, settings);
  if (!blob) return;

  const pdfUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `CT_Bill_${bill.billNo}.pdf`;
  link.click();
  URL.revokeObjectURL(pdfUrl);
};
