import { doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

const settingsRef = doc(db, 'settings', 'shop');

export const getSettings = (callback) => {
  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  });
};

export const updateSettings = async (data) => {
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    return await updateDoc(settingsRef, data);
  } else {
    return await setDoc(settingsRef, data);
  }
};
