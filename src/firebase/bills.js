import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction, 
  serverTimestamp,
  where,
  limit
} from 'firebase/firestore';
import { db } from './config';

const billsCol = collection(db, 'bills');

export const getNextBillNumber = async () => {
  const counterRef = doc(db, 'settings', 'invoiceCounter');
  const counterSnap = await getDoc(counterRef);
  if (!counterSnap.exists()) {
    return "0001";
  }
  const { lastInvoiceNumber } = counterSnap.data();
  return String((lastInvoiceNumber || 0) + 1).padStart(4, '0');
};

export const getNextInvoiceNumber = getNextBillNumber;

export const incrementInvoiceNumber = async () => {
  const counterRef = doc(db, 'settings', 'invoiceCounter');
  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let lastInvoiceNumber = 0;
    if (counterSnap.exists()) {
      lastInvoiceNumber = counterSnap.data().lastInvoiceNumber || 0;
    }
    const nextNumber = lastInvoiceNumber + 1;
    transaction.set(counterRef, { lastInvoiceNumber: nextNumber }, { merge: true });
    return String(nextNumber).padStart(4, '0');
  });
};

export const resetInvoiceCounter = async () => {
  const counterRef = doc(db, 'settings', 'invoiceCounter');
  const { setDoc } = await import('firebase/firestore');
  await setDoc(counterRef, { lastInvoiceNumber: 0 }, { merge: true });
};

export const createBill = async (billData) => {
  const { items, customerId, paymentMode, grandTotal, amountPaid, balanceDue } = billData;

  return await runTransaction(db, async (transaction) => {
    // --- 1. ALL READS FIRST ---
    
    // Get invoice counter document (Atomic Lock)
    const counterRef = doc(db, 'settings', 'invoiceCounter');
    const counterSnap = await transaction.get(counterRef);
    let lastInvoiceNumber = 0;
    if (counterSnap.exists()) {
      lastInvoiceNumber = counterSnap.data().lastInvoiceNumber || 0;
    }

    // Get all products
    const productSnaps = [];
    for (const item of items) {
      const productRef = doc(db, 'products', item.productId);
      const snap = await transaction.get(productRef);
      if (!snap.exists()) throw new Error(`Product ${item.productName} not found`);
      productSnaps.push({ ref: productRef, snap });
    }

    // Get customer
    let customerSnap = null;
    let customerRef = null;
    if (customerId) {
      customerRef = doc(db, 'customers', customerId);
      customerSnap = await transaction.get(customerRef);
    }

    // --- 2. LOGIC & WRITES ---

    // The billNo is determined by the next increment
    const nextNumber = lastInvoiceNumber + 1;
    const billNo = String(nextNumber).padStart(4, '0');

    // Update stocks (with strict validation)
    productSnaps.forEach(({ ref, snap }, index) => {
      const currentQty = snap.data().currentQty || 0;
      const requestedQty = items[index].quantity;
      if (currentQty < requestedQty) {
        throw new Error(`Insufficient stock for ${items[index].productName}. Available: ${currentQty}`);
      }
      transaction.update(ref, { currentQty: currentQty - requestedQty });
    });

    // Update customer
    if (customerSnap && customerSnap.exists()) {
      transaction.update(customerRef, {
        balance: (customerSnap.data().balance || 0) + balanceDue,
        totalPurchased: (customerSnap.data().totalPurchased || 0) + grandTotal
      });
    }

    // Save the bill
    const newBillRef = doc(billsCol);
    
    const cleanedBillData = { ...billData };
    delete cleanedBillData.billNo;

    transaction.set(newBillRef, {
      ...cleanedBillData,
      billNo, // This is now guaranteed unique
      status: 'active',
      createdAt: serverTimestamp()
    });

    // Update settings counter document
    transaction.set(counterRef, { lastInvoiceNumber: nextNumber }, { merge: true });

    return { id: newBillRef.id, billNo };
  });
};

export const getBills = (callback, filters = {}) => {
  let q = query(billsCol, orderBy('createdAt', 'desc'));
  
  if (filters.customerId) {
    q = query(q, where('customerId', '==', filters.customerId));
  }
  
  return onSnapshot(q, (snapshot) => {
    const bills = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(bill => bill.isDeleted !== true);
    callback(bills);
  });
};

export const cancelBill = async (billId) => {
  const billRef = doc(db, 'bills', billId);
  
  return await runTransaction(db, async (transaction) => {
    // --- 1. ALL READS FIRST ---
    const billSnap = await transaction.get(billRef);
    if (!billSnap.exists()) throw new Error("Bill not found");
    
    const billData = billSnap.data();
    if (billData.status === 'cancelled') throw new Error("Bill is already cancelled");

    // Get all product snaps first
    const productSnaps = [];
    for (const item of billData.items) {
      const productRef = doc(db, 'products', item.productId);
      const snap = await transaction.get(productRef);
      productSnaps.push({ ref: productRef, snap });
    }

    // Get customer snap if applicable
    let customerSnap = null;
    let customerRef = null;
    if (billData.customerId) {
      customerRef = doc(db, 'customers', billData.customerId);
      customerSnap = await transaction.get(customerRef);
    }

    // --- 2. ALL WRITES AFTER ---

    // Reverse stock
    productSnaps.forEach(({ ref, snap }, index) => {
      if (snap.exists()) {
        transaction.update(ref, {
          currentQty: snap.data().currentQty + billData.items[index].quantity
        });
      }
    });

    // Reverse customer balance
    if (customerSnap && customerSnap.exists()) {
      transaction.update(customerRef, {
        balance: customerSnap.data().balance - billData.balanceDue,
        totalPurchased: customerSnap.data().totalPurchased - billData.grandTotal
      });
    }

    // Mark as cancelled
    transaction.update(billRef, { status: 'cancelled' });
  });
};
