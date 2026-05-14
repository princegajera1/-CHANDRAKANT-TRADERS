import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CustomCursor from '../ui/CustomCursor';

const PublicLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
