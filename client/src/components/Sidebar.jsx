import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { FiLogOut, FiHome, FiUsers, FiTarget, FiGrid, FiBarChart2, FiCpu } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext.jsx';
import './Sidebar.css';

// --- Role-Specific Link Components ---
const AdminLinks = () => (
  <>
    <NavLink to="/admin" end><FiHome /> Dashboard</NavLink>
    <NavLink to="/admin/users"><FiUsers /> User Management</NavLink>
    <NavLink to="/admin/branches"><FiGrid /> Branch Management</NavLink>
    <NavLink to="/admin/set-target"><FiTarget /> Target Setting</NavLink>
    <NavLink to="/leaderboard"><FiBarChart2 /> Leaderboards</NavLink>
    <NavLink to="/admin/reports"><FiBarChart2 /> Reports & Analytics</NavLink>
    <NavLink to="/admin/ai-insights"><FiCpu /> AI Insights</NavLink>
  </>
);

const BranchManagerLinks = () => (
  <>
    <NavLink to="/manager-dashboard" end><FiHome /> Dashboard</NavLink>
    <NavLink to="/manager-dashboard/targets"><FiTarget /> Targets</NavLink>
    <NavLink to="/leaderboard"><FiBarChart2 /> Leaderboards</NavLink>
    <NavLink to="/manager-dashboard/reports"><FiBarChart2 /> Reports</NavLink>
    <NavLink to="/manager-dashboard/ai-insights"><FiCpu /> AI Insights</NavLink>
  </>
);

const CoordinatorLinks = () => (
  <>
    <NavLink to="/dashboard"><FiHome /> Data Entry</NavLink>
    <NavLink to="/dashboard/reports"><FiBarChart2 /> My Reports</NavLink>
    <NavLink to="/leaderboard"><FiBarChart2 /> Leaderboards</NavLink>
    <NavLink to="/dashboard/ai-insights"><FiCpu /> AI Insights</NavLink>
  </>
);

const Sidebar = () => {
  const { user, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  // The complete and correct logout function
  const handleLogout = () => {
    // Clear all storage
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // Update context state
    dispatch({ type: 'LOGOUT' });
    
    // Navigate to login page
    navigate('/login');
  };

  // Safely renders links based on user role
  const renderLinks = () => {
    // Optional chaining `?.` prevents crash if user object is temporarily malformed
    switch (user?.role) {
      case 'admin':
        return <AdminLinks />;
      case 'branch_manager':
        return <BranchManagerLinks />;
      case 'coordinator':
        return <CoordinatorLinks />;
      default:
        // Render nothing if role is not recognized
        return null;
    }
  };

  // Defensive check - don't render if no user
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>SIC Life LTD</h3>
        <p>Performance Tracker</p>
      </div>
      <nav className="sidebar-nav">
        {renderLinks()}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
