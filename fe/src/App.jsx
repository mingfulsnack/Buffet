import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuPage from './pages/MenuPage';
import BookingPage from './pages/BookingPage';
import TablesPage from './pages/TablesPage';
import './styles/globals.scss';

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  console.log('ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated(), 'adminOnly:', adminOnly);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    console.log('User not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('PublicRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated());

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated()) {
    console.log('User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Public routes with AppLayout (menu, booking accessible to all) */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<MenuPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="booking" element={<BookingPage />} />
            
            {/* Admin protected routes */}
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin only routes */}
            <Route 
              path="tables" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <TablesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="customers" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <div>Customers Page</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="employees" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <div>Employees Page</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="orders" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <div>Orders Page</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="reports" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <div>Reports Page</div>
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;