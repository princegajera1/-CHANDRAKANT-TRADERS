import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

const productsCol = collection(db, 'products');

export const getProducts = (callback) => {
  return onSnapshot(productsCol, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(products);
  });
};

export const addProduct = async (data) => {
  return await addDoc(productsCol, {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const updateProduct = async (id, data) => {
  const productRef = doc(db, 'products', id);
  return await updateDoc(productRef, data);
};

export const deleteProduct = async (id) => {
  const productRef = doc(db, 'products', id);
  return await deleteDoc(productRef);
};

export const getLowStockProducts = async () => {
  const q = query(productsCol, where('currentQty', '<=', 'minQty'));
  // Note: Firestore doesn't support field-to-field comparison directly in query easily without separate field
  // So we'll fetch and filter if necessary or use a 'isLowStock' flag
  const snapshot = await getDocs(productsCol);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => p.currentQty <= p.minQty);
};

export const updateStock = async (productId, quantityChange) => {
  const productRef = doc(db, 'products', productId);
  await runTransaction(db, async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists()) throw new Error("Product does not exist!");
    
    const newQty = productDoc.data().currentQty + quantityChange;
    transaction.update(productRef, { currentQty: newQty });
  });
};
