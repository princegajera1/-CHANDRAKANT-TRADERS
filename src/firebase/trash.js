import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export const moveToTrash = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      originalCollection: collectionName
    });
  } catch (error) {
    console.error('Error moving to trash:', error);
    throw error;
  }
};
