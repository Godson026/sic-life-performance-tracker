import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const AdminRoute = () => {
  const { user, isLoading } = useContext(AuthContext);

  // Show loading while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Check if user exists and is admin
  if (user && user.role === 'admin') {
    return <Outlet />;
  }

  // Redirect to login if not admin
  return <Navigate to="/login" />;
};

export default AdminRoute;
