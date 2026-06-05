import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateBillPDFBlob } from './generatePDF';

export async function queueWhatsAppBill(bill, settings) {
  try {
    const message = `Thank you for visiting Chandrakant Traders`;

    await addDoc(collection(db, 'whatsappQueue'), {
      billNo: bill.billNo,
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      message,
      status: 'pending',
      attempts: 1,
      createdAt: serverTimestamp(),
      processedAt: null
    });
  } catch (error) {
    console.error("Failed to queue WhatsApp message:", error);
  }
}

export async function shareOnWhatsApp(bill, settings) {
  const message = `Thank you for visiting Chandrakant Traders`;
  
  try {
    const pdfBlob = await generateBillPDFBlob(bill, settings);
    if (!pdfBlob) {
      // Fallback if PDF generation fails
      const encodedMessage = encodeURIComponent(message);
      const url = `https://wa.me/91${bill.customerPhone}?text=${encodedMessage}`;
      window.open(url, '_blank');
      return;
    }

    const pdfFile = new File([pdfBlob], `CT_Bill_${bill.billNo}.pdf`, { 
      type: 'application/pdf' 
    });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        text: message
      });
    } else {
      // Option B — Fallback: Download PDF first, then open WhatsApp
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `CT_Bill_${bill.billNo}.pdf`;
      link.click();
      URL.revokeObjectURL(pdfUrl);

      setTimeout(() => {
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/91${bill.customerPhone}?text=${encodedMessage}`;
        window.open(url, '_blank');
      }, 1500);
    }
  } catch (error) {
    console.error("Failed to share on WhatsApp:", error);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/91${bill.customerPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  }
}

export function sendUdhaarReminder(customer, settings) {
  const message = `
🔧 *${settings?.shopName || 'CHANDRAKANT TRADERS'}*
Savarkundla | Ph: ${settings?.phone || '99240 58659'}

Respected *${customer.name}*,

Your pending balance is *₹${customer.balance}*.

Please visit our shop or call us to clear the balance.

આભાર 🙏
  `.trim();

  const url = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
