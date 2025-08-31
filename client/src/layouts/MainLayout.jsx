import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import PageHeader from '../components/PageHeader.jsx'; // This will be our one and only header
import './MainLayout.css';

// A definitive mapping of URL paths to their desired, professional titles
const pathTitles = {
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/branches': 'Branch Management',
  '/admin/set-target': 'Set Branch Target',
  '/admin/reports': 'Reports & Analytics',
  '/admin/ai-insights': 'AI Performance Insights',
  '/manager-dashboard': 'Branch Manager Dashboard',
  '/manager-dashboard/targets': 'Target Management',
  '/manager-dashboard/reports': 'Branch Reports',
  '/manager-dashboard/ai-insights': 'AI Insights',
  '/dashboard': 'Data Entry',
  '/dashboard/reports': 'My Team Reports',
  '/dashboard/ai-insights': 'AI Insights',
  '/leaderboard': 'Performance Leaderboard',
};

const MainLayout = () => {
    const location = useLocation();
    // Look up the title in our map; provide a default if not found
    const title = pathTitles[location.pathname] || 'Dashboard';

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content-area">
        {/* The PageHeader is now part of the main layout, ensuring 100% consistency */}
        <PageHeader title={title} /> 
        <main className="page-content">
          <Outlet /> {/* Pages render here, WITHOUT their own headers */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
