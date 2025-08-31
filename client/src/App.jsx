import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';

// Import ALL your page components
import LoginPage from './pages/LoginPage.jsx';
import AdminHomePage from './pages/AdminHomePage.jsx';
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';
import AdminBranchManagementPage from './pages/AdminBranchManagement.jsx';
import AdminSetBranchTargetPage from './pages/AdminSetBranchTargetPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import AIInsightsPage from './pages/AIInsightsPage.jsx';
import BranchManagerHomePage from './pages/BranchManagerHomePage.jsx';
import ManagerTargetsPage from './pages/ManagerTargetManagementPage.jsx';
import ManagerReportsPage from './pages/ManagerReportsPage.jsx';
import CoordinatorDashboard from './pages/CoordinatorDashboard.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import CoordinatorReportsPage from './pages/CoordinatorReportsPage.jsx';

// Simple placeholder for pages we haven't built data for yet
const PlaceholderPage = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>This page is under development.</p>
  </div>
);

function App() {
  const { user, isLoading } = useContext(AuthContext);

  const getHomeRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'branch_manager': return '/manager-dashboard';
      case 'coordinator': return '/dashboard';
      default: return '/'; // Fallback
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading SIC Life Performance Tracker...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* If NOT logged in, ONLY the login route is available. All else redirects to login. */}
        {!user && (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* If logged in, the entire app is rendered inside the main layout. */}
        {user && (
          <Route element={<MainLayout />}>
            {/* Redirect root path to the user's specific dashboard */}
            <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
            
            {/* Common Routes */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/branches" element={<AdminBranchManagementPage />} />
            <Route path="/admin/set-target" element={<AdminSetBranchTargetPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/ai-insights" element={<AIInsightsPage />} />

            {/* Branch Manager Routes */}
            <Route path="/manager-dashboard" element={<BranchManagerHomePage />} />
            <Route path="/manager-dashboard/targets" element={<ManagerTargetsPage />} />
            <Route path="/manager-dashboard/reports" element={<ManagerReportsPage />} />
            <Route path="/manager-dashboard/ai-insights" element={<AIInsightsPage />} />
            
            {/* Coordinator Routes */}
            <Route path="/dashboard" element={<CoordinatorDashboard />} />
            <Route path="/dashboard/reports" element={<CoordinatorReportsPage />} />
            <Route path="/dashboard/ai-insights" element={<AIInsightsPage />} />
            
            {/* A catch-all for any invalid URL for a logged-in user redirects them home */}
            <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
