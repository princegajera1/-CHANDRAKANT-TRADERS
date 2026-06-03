import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, onSnapshot, collection, query, where, setDoc } from 'firebase/firestore';
import { logActivity } from '../utils/activity';

const AuthContext = createContext();

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const isDemoSession = localStorage.getItem('is_demo_session') === 'true';

      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (currentUser) {
        if (currentUser.email === 'demo@chandrakanttraders.com') {
          setUser(currentUser);
          setProfile({
            name: localStorage.getItem('demo_visitor_name') || 'Demo Visitor',
            role: 'demo'
          });
          setLoading(false);
        } else {
          // Real-time security listener: Instantly kicks user out if SuperAdmin deletes or disables them
          profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
            if (!docSnap.exists() || docSnap.data().status === 'disabled' || docSnap.data().disabled === true) {
              // Profile has been purged or disabled! Terminate session and kick to home page instantly.
              await signOut(auth);
              setUser(null);
              setProfile(null);
              setLoading(false);
              window.location.href = '/'; 
            } else {
              setUser(currentUser);
              setProfile(docSnap.data());
              setLoading(false);
            }
          });
        }
      } else if (isDemoSession) {
        // Local Demo Bypass
        setUser({ email: 'demo@chandrakanttraders.com', uid: 'demo-local-id' });
        setProfile({
          name: localStorage.getItem('demo_visitor_name') || 'Demo Visitor',
          role: 'demo'
        });
        setLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (profileUnsubscribe) profileUnsubscribe();
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (user) {
      const displayName = profile?.name || user.displayName || user.email.split('@')[0];
      await logActivity({ ...user, displayName, role: profile?.role }, 'LOGOUT');
    }
    localStorage.removeItem('demo_visitor_name');
    localStorage.removeItem('is_demo_session');
    localStorage.removeItem('db_admin_session');
    return signOut(auth);
  };
  
  const isSuperAdmin = user?.email === 'princegajera944@gmail.com' || profile?.role === 'owner' || profile?.role === 'superadmin';
  const isDemo = user?.email === 'demo@chandrakanttraders.com';
  const isGuest = profile?.role === 'guest';

  // Guest Expiry Check
  useEffect(() => {
    if (isGuest && profile?.expiresAt) {
      const checkExpiry = () => {
        const now = new Date();
        const expiry = profile.expiresAt.toDate ? profile.expiresAt.toDate() : new Date(profile.expiresAt);
        if (now > expiry) {
          logout();
          toast.error("Your guest access has expired");
        }
      };
      checkExpiry();
      const interval = setInterval(checkExpiry, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isGuest, profile]);

  // Live WhatsApp Queue Background Processor (Mock Engine)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'whatsappQueue'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const docId = docSnap.id;
        const data = docSnap.data();

        if (window[`processing_wa_${docId}`]) return;
        window[`processing_wa_${docId}`] = true;

        setTimeout(async () => {
          try {
            // 90% chance of success, 10% chance of failure to demonstrate retry queues
            const isSuccess = Math.random() > 0.1;
            const newStatus = isSuccess ? 'success' : 'failed';

            await setDoc(doc(db, 'whatsappQueue', docId), {
              status: newStatus,
              processedAt: new Date(),
              attempts: (data.attempts || 0) + 1
            }, { merge: true });

            console.log(`WhatsApp message for Bill #${data.billNo} processed: ${newStatus}`);
          } catch (err) {
            console.error("Failed to process WhatsApp queue document:", err);
          } finally {
            delete window[`processing_wa_${docId}`];
          }
        }, 3000);
      });
    });

    return () => unsubscribe();
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    role: profile?.role || (isDemo ? 'demo' : ''),
    isOwner: profile?.role === 'owner',
    isSuperAdmin,
    isAdmin: profile?.role === 'admin' || isSuperAdmin,
    isManager: profile?.role === 'manager' || profile?.role === 'admin' || isSuperAdmin,
    isStaff: profile?.role === 'staff' || profile?.role === 'manager' || profile?.role === 'admin' || isSuperAdmin,
    isViewer: profile?.role === 'viewer' || isDemo || isGuest,
    isReadOnly: isDemo || isGuest || profile?.role === 'viewer',
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
