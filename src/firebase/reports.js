import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

const billsCol = collection(db, 'bills');
const productsCol = collection(db, 'products');

export const getDailySales = async (date) => {
  const start = Timestamp.fromDate(startOfDay(date));
  const end = Timestamp.fromDate(endOfDay(date));
  
  const q = query(
    billsCol, 
    where('createdAt', '>=', start), 
    where('createdAt', '<=', end),
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getMonthlySales = async (year, month) => {
  const date = new Date(year, month);
  const start = Timestamp.fromDate(startOfMonth(date));
  const end = Timestamp.fromDate(endOfMonth(date));
  
  const q = query(
    billsCol, 
    where('createdAt', '>=', start), 
    where('createdAt', '<=', end),
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTopProducts = async (startDate, endDate) => {
  const start = Timestamp.fromDate(startOfDay(startDate));
  const end = Timestamp.fromDate(endOfDay(endDate));
  
  const q = query(
    billsCol, 
    where('createdAt', '>=', start), 
    where('createdAt', '<=', end),
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(q);
  const sales = {};
  
  snapshot.docs.forEach(doc => {
    const bill = doc.data();
    bill.items.forEach(item => {
      if (!sales[item.productId]) {
        sales[item.productId] = { 
          name: item.productName, 
          qty: 0, 
          revenue: 0 
        };
      }
      sales[item.productId].qty += item.quantity;
      sales[item.productId].revenue += item.itemTotal;
    });
  });
  
  return Object.values(sales).sort((a, b) => b.qty - a.qty);
};

export const getLowStockReport = async () => {
  const snapshot = await getDocs(productsCol);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => p.currentQty <= p.minQty);
};
