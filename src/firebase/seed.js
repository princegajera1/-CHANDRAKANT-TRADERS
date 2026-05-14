import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './config';

export const seedDatabase = async () => {
  const batch = writeBatch(db);

  // 1. Initial Products
  const products = [
    { name: 'MRF Zapper FG', brand: 'MRF', size: '2.75-18', category: 'Tyre', currentQty: 50, minQty: 10, purchasePrice: 1800, sellingPrice: 2200, hsnCode: '4011', gstPercent: 5 },
    { name: 'MRF Nylogrip', brand: 'MRF', size: '90/90-10', category: 'Tyre', currentQty: 30, minQty: 8, purchasePrice: 2400, sellingPrice: 2900, hsnCode: '4011', gstPercent: 5 },
    { name: 'Apollo Actizip', brand: 'Apollo', size: '2.75-18', category: 'Tyre', currentQty: 40, minQty: 10, purchasePrice: 1750, sellingPrice: 2150, hsnCode: '4011', gstPercent: 5 },
    { name: 'Apollo Rib', brand: 'Apollo', size: '90/90-10', category: 'Tyre', currentQty: 25, minQty: 8, purchasePrice: 2200, sellingPrice: 2700, hsnCode: '4011', gstPercent: 5 },
    { name: 'CEAT Gripp', brand: 'CEAT', size: '185/65 R15', category: 'Tyre', currentQty: 20, minQty: 5, purchasePrice: 5500, sellingPrice: 6800, hsnCode: '4011', gstPercent: 5 },
    { name: 'Goodyear Assurance', brand: 'Goodyear', size: '195/65 R15', category: 'Tyre', currentQty: 15, minQty: 5, purchasePrice: 6000, sellingPrice: 7500, hsnCode: '4011', gstPercent: 5 },
    { name: 'JK Tyre Vectra', brand: 'JK Tyre', size: '165/80 R14', category: 'Tyre', currentQty: 25, minQty: 6, purchasePrice: 4200, sellingPrice: 5200, hsnCode: '4011', gstPercent: 5 },
    { name: 'MRF Tube 2.75', brand: 'MRF', size: '2.75-18', category: 'Tube', currentQty: 100, minQty: 20, purchasePrice: 280, sellingPrice: 380, hsnCode: '4013', gstPercent: 5 },
    { name: 'Apollo Tube 90/90', brand: 'Apollo', size: '90/90-10', category: 'Tube', currentQty: 80, minQty: 20, purchasePrice: 220, sellingPrice: 320, hsnCode: '4013', gstPercent: 5 },
    { name: 'Valve TR4', brand: 'Other', size: 'TR4', category: 'Accessory', currentQty: 200, minQty: 50, purchasePrice: 8, sellingPrice: 20, hsnCode: '4013', gstPercent: 5 },
  ];

  products.forEach(p => {
    const ref = doc(collection(db, 'products'));
    batch.set(ref, { ...p, createdAt: new Date() });
  });

  // 2. Initial Suppliers
  const suppliers = [
    { name: 'Apollo Tyres Ltd', contactPerson: 'Manager', phone: '1800-209-0144', brand: 'Apollo', address: 'Gurgaon, India' },
    { name: 'MRF Limited', contactPerson: 'Sales Head', phone: '044-28171000', brand: 'MRF', address: 'Chennai, India' },
    { name: 'CEAT Limited', contactPerson: 'Distributor', phone: '1800-209-2328', brand: 'CEAT', address: 'Mumbai, India' },
    { name: 'Goodyear India', contactPerson: 'Regional Manager', phone: '1800-103-3141', brand: 'Goodyear', address: 'New Delhi, India' },
    { name: 'JK Tyre Industries', contactPerson: 'Area Manager', phone: '1800-102-1001', brand: 'JK Tyre', address: 'New Delhi, India' },
  ];

  suppliers.forEach(s => {
    const ref = doc(collection(db, 'suppliers'));
    batch.set(ref, { ...s, createdAt: new Date() });
  });

  // 3. Initial Settings
  const settingsRef = doc(db, 'settings', 'shop');
  batch.set(settingsRef, {
    shopName: 'Chandrakant Traders',
    tagline: 'Dealer: Tyre & Tube',
    address: 'Shop No. 27/28/29, Taluka Panchayat Shopping Center, Mahuva Road, Savarkundla, Dist. Amreli',
    phone: '99240 58659',
    email: 'chandrakanttraders75@gmail.com',
    gstin: '',
    billPrefix: 'CT',
    billCounter: 0,
    thankYouMessage: 'આભાર! ફરી પધારો! | Thank you! Visit again!'
  });

  await batch.commit();
};
