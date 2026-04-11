// frontend/src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Usage:
 * <ProtectedRoute> → requires any logged-in user
 * <ProtectedRoute role='admin'> → requires specific role (e.g., admin)
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  // 1. Handle the "Initial Load" state
  // This prevents the app from redirecting while it checks localStorage for a token.
  if (loading) {
    return <div className="loading-screen">Verifying authentication...</div>;
  }

  // 2. If no user is found after loading, redirect to login
  if (!user) {
    // FIX: Added space between Navigate and to
    return <Navigate to='/login' replace />;
  }

  // 3. If a specific role is required but not met, redirect to home
  if (role && user.role !== role) {
    return <Navigate to='/home' replace />;
  }

  // 4. Everything is fine, render the protected component
  return children;
};

export default ProtectedRoute;