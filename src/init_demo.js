import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';

async function initDemo() {
  try {
    // Add Super Admin to admins collection
    await setDoc(doc(db, 'admins', 'prince_superadmin'), {
      email: 'princegajera944@gmail.com',
      name: 'Prince Gajera',
      role: 'superadmin',
      isActive: true,
      addedAt: serverTimestamp()
    });

    // Add Demo User to admins collection
    await setDoc(doc(db, 'admins', 'demo_user'), {
      email: 'demo@chandrakanttraders.com',
      name: 'Demo User',
      role: 'demo',
      isActive: true,
      addedAt: serverTimestamp()
    });

    console.log("Demo and SuperAdmin initialized in Firestore");
  } catch (e) {
    console.error("Initialization failed", e);
  }
}

// Note: This script needs to be run in a context where firebase is initialized.
// I'll leave it as a reference for the user or they can run it in console.
