import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logActivity = async (user, action) => {
  if (!user) return;
  
  try {
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

    let role = 'admin';
    let userName = user.displayName || user.email.split('@')[0];

    if (user.email === 'princegajera944@gmail.com') role = 'superadmin';
    else if (user.email === 'demo@chandrakanttraders.com') {
      role = 'demo';
      userName = `DEMO: ${localStorage.getItem('demo_visitor_name') || 'Visitor'}`;
    }
    else if (user.email.includes('guest')) role = 'guest';

    await addDoc(collection(db, 'activityLogs'), {
      userId: user.uid,
      userEmail: user.email,
      userName,
      role,
      action,
      timestamp: serverTimestamp(),
      device: navigator.userAgent,
      browser: getBrowser(),
      os: getOS(),
      ipAddress
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
