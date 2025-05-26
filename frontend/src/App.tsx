import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Advertise from './pages/Advertise';
import Blogs from './pages/Blogs';
import BlogPost from './pages/BlogPost';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { useEffect } from 'react';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useStore();
  
  useEffect(() => {
    // If no user is logged in, redirect to main site
    if (!currentUser) {
      window.location.href = 'https://chatsafari.com';
    }
  }, [currentUser]);

  if (!currentUser) {
    return null; // Return null while redirecting
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const isProduction = window.location.hostname === 'chatsafari.com';

  return (
    <HelmetProvider>
      <Router>
        <Toaster position="top-center" />
        <Routes>
          {/* Main route - show Login for both development and production */}
          <Route path="/" element={<Login />} />
          
          {/* Login route - redirects to main route in production */}
          <Route 
            path="/login" 
            element={
              isProduction ? 
                <Navigate to="/" replace /> : 
                <Login />
            } 
          />

          {/* Protected dashboard route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Public routes */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Catch all - redirect to main route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
};

export default App;
