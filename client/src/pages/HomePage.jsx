import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';

const HomePage = () => {
  const { user, dispatch } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const getWelcomeMessage = () => {
    switch (user.role) {
      case 'admin':
        return 'Welcome to the Admin Dashboard';
      case 'branch_manager':
        return 'Welcome to the Branch Manager Dashboard';
      case 'coordinator':
        return 'Welcome to the Coordinator Dashboard';
      case 'agent':
        return 'Welcome to the Agent Dashboard';
      default:
        return 'Welcome to SIC Life Performance Tracker';
    }
  };

  const getRoleSpecificLinks = () => {
    switch (user.role) {
      case 'admin':
        return (
          <>
            <Link to="/admin" className="dashboard-link">Go to Admin Dashboard</Link>
            <Link to="/admin/users" className="dashboard-link">Manage Users</Link>
            <Link to="/admin/branches" className="dashboard-link">Manage Branches</Link>
            <Link to="/admin/set-target" className="dashboard-link">Set Branch Targets</Link>
          </>
        );
      case 'branch_manager':
        return (
          <>
            <Link to="/manager-dashboard" className="dashboard-link">Go to Branch Manager Dashboard</Link>
            <Link to="/manager-dashboard/targets" className="dashboard-link">Manage Targets</Link>
          </>
        );
      case 'coordinator':
        return (
          <>
            <Link to="/dashboard" className="dashboard-link">Go to Coordinator Dashboard</Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Card>
        <h2>{getWelcomeMessage()}</h2>
        <p>Hello, <strong>{user.name}</strong>!</p>
        <p>You are logged in as a <strong>{user.role.replace('_', ' ')}</strong>.</p>
        {user.branch && (
          <p>Branch: <strong>{user.branch.name}</strong> - {user.branch.location}</p>
        )}
      </Card>

      <div className="dashboard-links">
        {getRoleSpecificLinks()}
        
        {/* Common links for all users */}
        <Link to="/leaderboard" className="dashboard-link">View Leaderboards</Link>
      </div>

      <Card>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </Card>
    </div>
  );
};

export default HomePage;
