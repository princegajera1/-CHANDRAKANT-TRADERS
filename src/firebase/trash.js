import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

export const moveToTrash = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const trashData = {
        ...data,
        id,
        originalCollection: collectionName,
        deletedAt: new Date().toISOString(),
      };
      
      const existingTrash = JSON.parse(localStorage.getItem('ct_trash') || '[]');
      existingTrash.push(trashData);
      localStorage.setItem('ct_trash', JSON.stringify(existingTrash));
      
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.error('Error moving to trash:', error);
    throw error;
  }
};
