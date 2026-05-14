# Chandrakant Traders — Shop Management System
### Tyre & Tube Inventory & Billing Solution (React + Firebase)

---

## 🇮🇳 English - Setup Instructions

### 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `Chandrakant Traders`.
3. Add a **Web App** to the project.
4. Copy the `firebaseConfig` object.

### 2. Configuration
1. Create a `.env` file in the root directory.
2. Add your Firebase keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 3. Installation
```bash
npm install
npm run dev
```

### 4. First Time Setup (CRITICAL)
1. **Auth**: Create your first user in Firebase Console -> Authentication.
2. **Firestore**: Create a document in `users` collection with the UID as the ID:
   - `name`: "Admin Name"
   - `email`: "admin@example.com"
   - `role`: "owner"
3. **Data**: Go to **Settings** in the app and click **"Initialize Sample Data"** to load products and suppliers.

---

## 🇮🇳 ગુજરાતી - સેટઅપ સૂચનાઓ

### ૧. ફાયરબેઝ પ્રોજેક્ટ સેટઅપ
૧. [Firebase Console](https://console.firebase.google.com/) પર જાઓ.
૨. `Chandrakant Traders` નામનો નવો પ્રોજેક્ટ બનાવો.
૩. પ્રોજેક્ટમાં **Web App** ઉમેરો.
૪. `firebaseConfig` કોપી કરો.

### ૨. કોન્ફિગરેશન
૧. રૂટ ડિરેક્ટરીમાં `.env` ફાઇલ બનાવો.
૨. તમારી ફાયરબેઝ કી ઉમેરો (ઉપરના અંગ્રેજી વિભાગ મુજબ).

### ૩. ઇન્સ્ટોલેશન
```bash
npm install
npm run dev
```

### ૪. પ્રથમ વખત સેટઅપ (ખાસ વાંચો)
૧. **Auth**: ફાયરબેઝ કન્સોલમાં પહેલો યુઝર બનાવો.
૨. **Firestore**: `users` કલેક્શનમાં એક ડોક્યુમેન્ટ બનાવો જેમાં `role`: "owner" હોય.
૩. **Data**: એપમાં **Settings** માં જાઓ અને **"Initialize Sample Data"** પર ક્લિક કરો. આનાથી પ્રોડક્ટ્સ અને સપ્લાયર્સ આપોઆપ લોડ થઈ જશે.

---

## Features
- ✅ **Real-time Inventory**: Auto-deduct stock on sales.
- ✅ **GST Billing**: Automatic GST (5%) calculation.
- ✅ **PDF Bills**: Professional jsPDF generated invoices.
- ✅ **WhatsApp Integration**: Share bills and reminders directly.
- ✅ **Udhaar Management**: Track customer balances and record payments.
- ✅ **Reports**: Daily and monthly sales analytics with charts.
- ✅ **Cloud Storage**: Secure data storage on Firebase.

---

*Developed for: Chandrakant Traders, Savarkundla*
