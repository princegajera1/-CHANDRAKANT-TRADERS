import { formatDate } from './formatters';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function queueWhatsAppBill(bill, settings) {
  try {
    const itemsList = bill.items
      .map(item => `• ${item.productName} x${item.quantity} = ₹${item.itemTotal}`)
      .join('\n');

    const upiLink = settings?.upiId 
      ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.shopName || 'Chandrakant Traders')}&am=${bill.balanceDue || bill.grandTotal}&cu=INR&tn=Bill%20%23${bill.billNo}`
      : '';

    const message = `
🔧 *${settings?.shopName || 'CHANDRAKANT TRADERS'}*
${settings?.tagline || 'Dealer: Tyre & Tube'} | Savarkundla

📄 *Bill No:* ${bill.billNo}
📅 *Date:* ${new Date(bill.createdAt?.toDate ? bill.createdAt.toDate() : new Date()).toLocaleDateString('en-IN')}

${itemsList}

💰 *Grand Total: ₹${bill.grandTotal}*
✅ *Paid: ₹${bill.amountPaid}*
${bill.balanceDue > 0 ? `⚠️ *Balance Due: ₹${bill.balanceDue}*` : '🤝 *Payment Complete*'}

${upiLink ? `💳 *Pay via UPI:* ${upiLink}` : ''}

📞 ${settings?.phone || '99240 58659'}
Thank you! આભાર! 🙏
    `.trim();

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

export function shareOnWhatsApp(bill, settings) {
  const itemsList = bill.items
    .map(item => `• ${item.productName} x${item.quantity} = ₹${item.itemTotal}`)
    .join('%0A');

  const upiLink = settings?.upiId 
    ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.shopName || 'Chandrakant Traders')}&am=${bill.balanceDue}&cu=INR&tn=Bill%20%23${bill.billNo}`
    : '';

  const message = `
🔧 *${settings?.shopName || 'CHANDRAKANT TRADERS'}*
${settings?.tagline || 'Dealer: Tyre & Tube'} | Savarkundla

📄 *Bill No:* ${bill.billNo}
📅 *Date:* ${formatDate(bill.createdAt)}

${itemsList}

💰 *Grand Total: ₹${bill.grandTotal}*
✅ *Paid: ₹${bill.amountPaid}*
${bill.balanceDue > 0 ? `⚠️ *Balance Due: ₹${bill.balanceDue}*` : '🤝 *Payment Complete*'}

${upiLink ? `💳 *Pay via UPI:* ${upiLink}` : ''}

📞 ${settings?.phone || '99240 58659'}
Thank you! આભાર! 🙏
  `.trim();

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/91${bill.customerPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
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
