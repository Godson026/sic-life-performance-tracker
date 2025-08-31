import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const CoordinatorRoute = () => {
  const { user, isLoading } = useContext(AuthContext);

  // Show loading while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Check if user exists and is coordinator
  if (user && user.role === 'coordinator') {
    return <Outlet />;
  }

  // Redirect to login if not coordinator
  return <Navigate to="/login" />;
};

export default CoordinatorRoute;
