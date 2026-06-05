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
    const products = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.isDeleted !== true);
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

export const auditProductDeletion = async (product, reason, user, profile) => {
  let ipAddress = 'Unknown';
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    ipAddress = data.ip;
  } catch (e) {
    console.warn("Failed to fetch IP:", e);
  }

  const getBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone')) return 'iOS';
    return 'Unknown';
  };

  const auditCol = collection(db, 'deletedProductsAudit');
  const now = new Date();
  
  const userName = profile?.name || user?.displayName || user?.name || user?.email?.split('@')[0] || 'Unknown';
  const userEmail = user?.email || 'unknown@chandrakanttraders.com';

  await addDoc(auditCol, {
    productId: product.id,
    productName: product.name,
    productBrand: product.brand || '',
    productCategory: product.category || '',
    productSize: product.size || '',
    deletedBy: `${userName} (${userEmail})`,
    deletedByUid: user?.uid || 'unknown',
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    reason: reason,
    timestamp: serverTimestamp(),
    ip: ipAddress,
    device: navigator.userAgent,
    browser: getBrowser(),
    os: getOS()
  });
};
