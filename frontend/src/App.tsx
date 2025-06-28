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
import ConsentBanner from './components/ConsentBanner';
import GlobalCallNotification from './components/GlobalCallNotification';

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
  const { socket, incomingCall, showCallNotification, setIncomingCall, clearIncomingCall, currentUser, activeUsers, selectedUser, setIsCallOpen, setIsIncoming, setCallFrom, setCallTo, setCallType, setLastOffer, setSelectedUser, setAutoAcceptCall } = useStore();

  useEffect(() => {
    if (!socket || !currentUser) return;
    // Listen for incoming call offers
    const handleOffer = ({ from, offer, callType }: { from: string; offer: any; callType: 'audio' | 'video' }) => {
      // Find user info for avatar/username
      const caller = activeUsers.find(u => u.id === from);
      setIncomingCall({
        from,
        username: caller?.username || 'Unknown',
        avatar: caller?.avatar || '/favicon.png',
        type: callType || 'video',
        offer,
      });
    };
    socket.on('webrtc:offer', handleOffer);

    // Listen for hangup to clear notification and modal
    const handleHangup = () => {
      clearIncomingCall();
      setIsCallOpen(false);
      setIsIncoming(false);
      setCallFrom(null);
      setCallTo(null);
      setCallType('video');
      setLastOffer(null);
    };
    socket.on('webrtc:hangup', handleHangup);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:hangup', handleHangup);
    };
  }, [socket, currentUser, activeUsers, setIncomingCall, clearIncomingCall, setIsCallOpen, setIsIncoming, setCallFrom, setCallTo, setCallType, setLastOffer]);

  // Accept/Reject handlers
  const handleAccept = () => {
    if (!incomingCall || !currentUser) return;
    // Find the caller user object
    const callerUser = activeUsers.find(u => u.id === incomingCall.from);
    if (callerUser) setSelectedUser(callerUser);
    setAutoAcceptCall(true);
    // Set call modal state as in ChatWindow's handleOffer
    setCallType(incomingCall.type);
    setIsIncoming(true);
    setIsCallOpen(true);
    setCallFrom(incomingCall.from);
    setCallTo(currentUser.id);
    setLastOffer(incomingCall.offer);
    clearIncomingCall();
  };
  const handleReject = () => {
    if (!socket || !incomingCall || !currentUser) return;
    // Notify caller of rejection
    socket.emit('webrtc:hangup', {
      to: incomingCall.from,
      from: currentUser.id,
    });
    clearIncomingCall();
    setIsCallOpen(false);
    setIsIncoming(false);
    setCallFrom(null);
    setCallTo(null);
    setCallType('video');
    setLastOffer(null);
  };

  const shouldShowGlobalCallNotification = showCallNotification && incomingCall && selectedUser?.id !== incomingCall.from;

  return (
    <HelmetProvider>
      <Router>
        <Toaster position="top-center" />
        <ConsentBanner />
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
        <GlobalCallNotification
          open={shouldShowGlobalCallNotification}
          callInfo={incomingCall}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </Router>
    </HelmetProvider>
  );
};

export default App;
