import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const BranchManagerRoute = () => {
  const { user, isLoading } = useContext(AuthContext);

  // Show loading while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Check if user exists and is branch manager
  if (user && user.role === 'branch_manager') {
    return <Outlet />;
  }

  // Redirect to login if not branch manager
  return <Navigate to="/login" />;
};

export default BranchManagerRoute;
