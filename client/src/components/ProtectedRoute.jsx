import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const ProtectedRoute = () => {
  const { user, isLoading } = useContext(AuthContext);

  // Show loading while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If user exists, allow access
  if (user) {
    return <Outlet />;
  }

  // Redirect to login if no user
  return <Navigate to="/login" />;
};

export default ProtectedRoute;
