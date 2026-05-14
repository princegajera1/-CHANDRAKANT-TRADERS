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
import Users from './pages/Users';
import Logs from './pages/Logs';
import ComingSoon from './pages/ComingSoon';

const ProtectedRoute = ({ children, requireOwner = false, requireSuperAdmin = false }) => {
  const { user, loading, isOwner, isSuperAdmin } = useAuthContext();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireOwner && !isOwner) return <Navigate to="/" />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/dashboard" />;
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
            <Route path="/users" element={<ProtectedRoute requireSuperAdmin><Users /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            <Route path="/matrix" element={<ProtectedRoute><ComingSoon title="Digital Matrix" /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><ComingSoon title="Alert Protocols" /></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute><ComingSoon title="Security Grid" /></ProtectedRoute>} />
            <Route path="/registry" element={<ProtectedRoute><ComingSoon title="Data Registry" /></ProtectedRoute>} />

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
              background: '#0A0F1A',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 20px 50px -12px rgba(0,0,0,0.8)',
              padding: '16px 20px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            },
            success: {
              iconTheme: { primary: '#FFB800', secondary: '#0A0F1A' },
              style: { borderLeft: '4px solid #FFB800' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#0A0F1A' },
              style: { borderLeft: '4px solid #EF4444' },
            },
            blank: {
              iconTheme: { primary: '#FFB800', secondary: '#0A0F1A' },
              style: { borderLeft: '4px solid #FFB800' },
            }
          }} 
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
