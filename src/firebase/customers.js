import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

const customersCol = collection(db, 'customers');
const paymentsCol = collection(db, 'payments');

export const getCustomers = (callback) => {
  const q = query(customersCol, orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(customers);
  });
};

export const addCustomer = async (data) => {
  return await addDoc(customersCol, {
    ...data,
    balance: data.balance || 0,
    totalPurchased: 0,
    createdAt: serverTimestamp()
  });
};

export const updateCustomer = async (id, data) => {
  const customerRef = doc(db, 'customers', id);
  return await updateDoc(customerRef, data);
};

export const recordPayment = async (paymentData) => {
  const { customerId, amount, note, createdBy } = paymentData;
  
  return await runTransaction(db, async (transaction) => {
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await transaction.get(customerRef);
    
    if (!customerSnap.exists()) throw new Error("Customer not found");
    
    const newBalance = customerSnap.data().balance - amount;
    
    // Save payment doc
    const newPaymentRef = doc(paymentsCol);
    transaction.set(newPaymentRef, {
      ...paymentData,
      createdAt: serverTimestamp()
    });
    
    // Update customer balance
    transaction.update(customerRef, { balance: newBalance });
  });
};
