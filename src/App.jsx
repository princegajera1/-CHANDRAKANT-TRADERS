import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';

// Pages
import Website from './pages/Website';
import TyreCare from './pages/TyreCare';
import FleetSolutions from './pages/FleetSolutions';
import TyreFitting from './pages/TyreFitting';
import LaserAlignment from './pages/LaserAlignment';
import NitrogenFilling from './pages/NitrogenFilling';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import NewBill from './pages/NewBill';
import Bills from './pages/Bills';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Trash from './pages/Trash';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Inquiries from './pages/Inquiries';
import SecurityProfile from './pages/SecurityProfile';
import TermsOfOperations from './pages/TermsOfOperations';

const ProtectedRoute = ({ children, requireOwner = false }) => {
  const { user, loading, isOwner } = useAuthContext();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireOwner && !isOwner) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

import ScrollToTop from './components/utils/ScrollToTop';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public Website */}
            <Route path="/" element={<PublicLayout><Website /></PublicLayout>} />
            <Route path="/tyre-care" element={<PublicLayout><TyreCare /></PublicLayout>} />
            <Route path="/fleet-solutions" element={<PublicLayout><FleetSolutions /></PublicLayout>} />
            <Route path="/services/tyre-fitting" element={<PublicLayout><TyreFitting /></PublicLayout>} />
            <Route path="/services/laser-alignment" element={<PublicLayout><LaserAlignment /></PublicLayout>} />
            <Route path="/services/nitrogen-filling" element={<PublicLayout><NitrogenFilling /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            <Route path="/security-profile" element={<PublicLayout><SecurityProfile /></PublicLayout>} />
            <Route path="/terms-of-operations" element={<PublicLayout><TermsOfOperations /></PublicLayout>} />
            
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/new-bill" element={<ProtectedRoute><NewBill /></ProtectedRoute>} />
            <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/inquiries" element={<ProtectedRoute><Inquiries /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3000,
            className: 'animate-toast-in',
            style: {
              background: '#0D1220',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#0D1220' },
              style: { borderLeft: '4px solid #10B981' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#0D1220' },
              style: { borderLeft: '4px solid #EF4444' },
            },
            blank: {
              iconTheme: { primary: '#FF6A00', secondary: '#0D1220' },
              style: { borderLeft: '4px solid #FF6A00' },
            }
          }} 
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
