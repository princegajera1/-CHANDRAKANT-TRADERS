import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  signInAnonymously 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    return { user: userCredential.user, profile: userDoc.data() };
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      uid: userCredential.user.uid,
      name,
      email,
      role: 'staff', // Default role
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), profile);
    return { user: userCredential.user, profile };
  } catch (error) {
    throw error;
  }
};

export const logoutUser = () => signOut(auth);

export const anonymousLogin = () => signInAnonymously(auth);

export const getCurrentUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? userDoc.data() : null;
};
