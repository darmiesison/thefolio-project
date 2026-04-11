// frontend/src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Usage:
 * <ProtectedRoute> → requires any logged-in user
 * <ProtectedRoute role='admin'> → requires specific role
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  // 1. Handle the Loading State
  // If we don't wait, the app will redirect to /login before 
  // the AuthContext finishes checking the token in localStorage.
  if (loading) {
    return <div className="loading-spinner">Verifying session...</div>;
  }

  // 2. Check if user is logged in
  if (!user) {
    return <Navigate to='/login' replace />;
  }

  // 3. Check for specific role requirements
  if (role && user.role !== role) {
    return <Navigate to='/' replace />;
  }

  return children;
};

export default ProtectedRoute;