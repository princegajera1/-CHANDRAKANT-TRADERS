# Chandrakant Traders — Shop Management System
### Tyre & Tube Inventory & Billing Solution (React + Firebase)

---

## Setup Instructions

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

1. **Auth**: Create your first user in Firebase Console → Authentication.
2. **Firestore**: Create a document in the `users` collection with the UID as the document ID, and set the following fields:
   - `name`: "Admin Name"
   - `email`: "admin@example.com"
   - `role`: "owner"
3. **Data**: Go to **Settings** in the app and click **"Initialize Sample Data"** to automatically load products and suppliers.

---

## Features

- ✅ **Real-time Inventory**: Auto-deduct stock on sales.
- ✅ **GST Billing**: Automatic GST (5%) calculation.
- ✅ **PDF Bills**: Professional invoices generated using jsPDF.
- ✅ **WhatsApp Integration**: Share bills and payment reminders directly via WhatsApp.
- ✅ **Udhaar Management**: Track customer balances and record payments.
- ✅ **Reports**: Daily and monthly sales analytics with charts.
- ✅ **Cloud Storage**: Secure data storage on Firebase.

---

*Developed for: Chandrakant Traders, Savarkundla*