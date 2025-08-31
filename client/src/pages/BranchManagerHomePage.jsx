import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import './BranchManagerHomePage.css';

const BranchManagerHomePage = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchSummary = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const config = { 
                    headers: { 
                        Authorization: `Bearer ${user.token}` 
                    } 
                };
                const { data } = await axios.get('http://localhost:5000/api/dashboard/manager-summary', config);
                console.log('Branch Manager Dashboard Data:', data); // Debug log
                setSummaryData(data);
                setError('');
            } catch (error) {
                console.error("Failed to fetch branch manager summary", error);
                setError(error.response?.data?.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [user]);

    if (loading) {
        return (
            <div className="loading-row">
                <p>Loading dashboard...</p>
            </div>
        );
    }
    
    if (error || !summaryData) {
        return (
            <div className="error-message">
                <p>{error || 'Could not load dashboard data.'}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                    Try Again
                </button>
            </div>
        );
    }
    
    // Helper function to calculate progress percentage
    const calculateProgress = (achieved, target) => {
        if (!target || target === 0) return 0;
        return ((achieved / target) * 100).toFixed(0);
    };
    
    // Extracting data for clarity
    const salesTarget = summaryData.branchTargets.find(t => t.target_type === 'sales');
    const regTarget = summaryData.branchTargets.find(t => t.target_type === 'registration');
    
    // Get top 3 coordinators for leaderboard
    const top3Coordinators = summaryData.coordinatorPerformance.slice(0, 3);

    return (
        <div>
            {/* Data Status Indicator */}
            <div style={{ 
                background: '#f8f9fa', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                fontSize: '0.9rem',
                color: '#666'
            }}>
                <strong>Data Status:</strong> 
                {summaryData ? ` Last updated: ${new Date().toLocaleTimeString()}` : ' No data available'}
                {summaryData && (
                    <span style={{ marginLeft: '1rem' }}>
                        Sales: {summaryData.salesThisMonth > 0 ? '✓' : '✗'} | 
                        Registrations: {summaryData.registrationsThisMonth > 0 ? '✓' : '✗'} | 
                        Targets: {salesTarget || regTarget ? '✓' : '✗'}
                    </span>
                )}
            </div>

            {/* --- LIVE Top Row Stat Cards --- */}
            <div className="overview-cards">
                <Card className="stat-card">
                    <div className="stat-card-label">Branch Sales Target Progress</div>
                    <div className="stat-card-value">{summaryData.salesProgressPercentage}%</div>
                    <div className="stat-card-subtitle">
                        GHS {summaryData.salesThisMonth.toLocaleString()} / {salesTarget?.amount.toLocaleString() || 'N/A'}
                    </div>
                </Card>
                
                <Card className="stat-card">
                    <div className="stat-card-label">Branch New Reg. Progress</div>
                    <div className="stat-card-value">{summaryData.registrationProgressPercentage}%</div>
                    <div className="stat-card-subtitle">
                        {summaryData.registrationsThisMonth.toLocaleString()} / {regTarget?.amount.toLocaleString() || 'N/A'} registrations
                    </div>
                </Card>
                
                <Card className="stat-card">
                    <div className="stat-card-label">Top Coordinator</div>
                    <div className="stat-card-value">
                        {summaryData.topCoordinator ? summaryData.topCoordinator.name : 'N/A'}
                    </div>
                    <div className="stat-card-subtitle">
                        {summaryData.topCoordinator ? `${summaryData.topCoordinator.salesAchievementPercentage.toFixed(1)}% target achievement` : 'No data'}
                    </div>
                </Card>
                
                <Card className="stat-card">
                    <div className="stat-card-label">Branch Rank Nationwide</div>
                    <div className="stat-card-value">#{summaryData.branchRank}</div>
                    <div className="stat-card-subtitle">
                        Out of {summaryData.totalBranches} branches
                    </div>
                </Card>
            </div>

            {/* --- LIVE Main Content Grid --- */}
            <div className="main-grid">
                <div className="left-column">
                    <Card title="Admin-Assigned Monthly Targets">
                        <div className="target-info">
                            <div className="target-item">
                                <strong>Sales Target:</strong> GHS {salesTarget?.amount.toLocaleString() || 'Not Set'}
                            </div>
                            <div className="target-item">
                                <strong>Sales Achieved:</strong> GHS {summaryData.salesThisMonth.toLocaleString()}
                            </div>
                            <div className="target-item">
                                <strong>Registrations Target:</strong> {regTarget?.amount.toLocaleString() || 'Not Set'}
                            </div>
                            <div className="target-item">
                                <strong>Registrations Achieved:</strong> {summaryData.registrationsThisMonth.toLocaleString()}
                            </div>
                        </div>
                        <p className="target-note">
                            {salesTarget ? `Monthly sales target: GHS ${(salesTarget.amount / 12).toLocaleString()}` : 'No sales target set for this month'}
                        </p>
                    </Card>
                    
                    <Card title="Your Assigned Coordinators & Targets">
                        <div className="coordinators-table">
                            {summaryData.coordinatorPerformance.length > 0 ? (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Coordinator</th>
                                            <th>Sales Target</th>
                                            <th>Sales Achieved</th>
                                            <th>Registrations</th>
                                            <th>Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summaryData.coordinatorPerformance.map((coordinator) => (
                                            <tr key={coordinator._id}>
                                                <td>{coordinator.name}</td>
                                                <td>GHS {coordinator.monthlySalesTarget.toLocaleString()}</td>
                                                <td>GHS {coordinator.monthlySales.toLocaleString()}</td>
                                                <td>{coordinator.monthlyRegistrations.toLocaleString()}</td>
                                                <td>
                                                    <span className={`progress-badge ${
                                                        coordinator.salesAchievementPercentage >= 100 ? 'high' :
                                                        coordinator.salesAchievementPercentage >= 70 ? 'medium' : 'low'
                                                    }`}>
                                                        {coordinator.salesAchievementPercentage.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="empty-state">No coordinators assigned to your branch yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
                
                <div className="right-column">
                    <Card title="Leaderboard Snapshot">
                        {top3Coordinators.length > 0 ? (
                            <div className="leaderboard-preview">
                                {top3Coordinators.map((coordinator, index) => (
                                    <div key={coordinator._id} className="leaderboard-item">
                                        <span className="rank">{index + 1}</span>
                                        <span className="name">{coordinator.name}</span>
                                        <span className="score">{coordinator.salesAchievementPercentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">No coordinator data available</p>
                        )}
                        <p className="view-more">View full leaderboard →</p>
                    </Card>
                    
                    <Card title="AI Performance Insights">
                        <div className="ai-insights">
                            <div className="insight-item">
                                <strong>🎯 Key Insight:</strong> 
                                {summaryData.salesProgressPercentage >= 100 
                                    ? 'Excellent! Your branch has exceeded the sales target.' 
                                    : `Your branch is at ${summaryData.salesProgressPercentage}% of the sales target.`}
                            </div>
                            <div className="insight-item">
                                <strong>💡 Recommendation:</strong> 
                                {summaryData.topCoordinator 
                                    ? `Learn from ${summaryData.topCoordinator.name}'s success (${summaryData.topCoordinator.salesAchievementPercentage.toFixed(1)}% achievement).`
                                    : 'Focus on training coordinators in customer acquisition strategies.'}
                            </div>
                            <div className="insight-item">
                                <strong>📊 Branch Performance:</strong> 
                                Rank #{summaryData.branchRank} out of {summaryData.totalBranches} branches nationwide.
                            </div>
                        </div>
                        <p className="ai-note">AI Coach content will be here...</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BranchManagerHomePage;
