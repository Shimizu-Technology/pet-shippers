import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/Login';
import { InboxPage } from './pages/Inbox';
import { ConversationPage } from './pages/Conversation';
import { ShipmentsPage } from './pages/Shipments';
import { AdminPage } from './pages/Admin';
import { CustomerDashboardPage } from './pages/CustomerDashboard';


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E2A47]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin/Staff Routes */}
          <Route
            path="/app/inbox"
            element={
              <ProtectedRoute>
                <InboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/inbox/:conversationId"
            element={
              <ProtectedRoute>
                <ConversationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/shipments"
            element={
              <ProtectedRoute>
                <ShipmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          
          {/* Customer Portal Routes */}
          <Route
            path="/portal/dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/inbox"
            element={
              <ProtectedRoute>
                <InboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/inbox/:conversationId"
            element={
              <ProtectedRoute>
                <ConversationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/shipments"
            element={
              <ProtectedRoute>
                <ShipmentsPage />
              </ProtectedRoute>
            }
          />

          
          {/* Legacy routes for backward compatibility */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <InboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox/:conversationId"
            element={
              <ProtectedRoute>
                <ConversationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipments"
            element={
              <ProtectedRoute>
                <ShipmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } 
          />
        </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
};

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'client') {
    return <Navigate to="/portal/dashboard" replace />;
  }
  
  return <Navigate to="/app/inbox" replace />;
};

export default App;