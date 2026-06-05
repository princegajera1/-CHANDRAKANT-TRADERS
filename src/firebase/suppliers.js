import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  runTransaction,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './config';

const suppliersCol = collection(db, 'suppliers');
const purchasesCol = collection(db, 'purchases');

export const getSuppliers = (callback) => {
  return onSnapshot(suppliersCol, (snapshot) => {
    const suppliers = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(sup => sup.isDeleted !== true);
    callback(suppliers);
  });
};

export const addSupplier = async (data) => {
  return await addDoc(suppliersCol, {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const updateSupplier = async (id, data) => {
  const supplierRef = doc(db, 'suppliers', id);
  return await updateDoc(supplierRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const addPurchase = async (purchaseData) => {
  const { items } = purchaseData;

  return await runTransaction(db, async (transaction) => {
    // 1. Update stock and purchase price for each item
    for (const item of items) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await transaction.get(productRef);
      
      if (productSnap.exists()) {
        const currentQty = productSnap.data().currentQty;
        transaction.update(productRef, {
          currentQty: currentQty + item.quantity,
          purchasePrice: item.purchasePrice
        });
      }
    }

    // 2. Save purchase record
    const newPurchaseRef = doc(purchasesCol);
    transaction.set(newPurchaseRef, {
      ...purchaseData,
      createdAt: serverTimestamp()
    });
  });
};

export const getPurchases = (callback) => {
  const q = query(purchasesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(purchases);
  });
};
