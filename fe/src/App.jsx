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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public login route */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Protected routes with AppLayout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="booking" element={<BookingPage />} />
            
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