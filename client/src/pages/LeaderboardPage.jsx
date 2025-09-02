import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import { FaTrophy } from 'react-icons/fa';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [type, setType] = useState('agents');
    const [metric, setMetric] = useState('sales');
    const [period, setPeriod] = useState('monthly');
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!user) return;
            setLoading(true);
            setError('');
            try {
                const response = await API.get('/api/leaderboard', {
                    params: { type, metric, period }
                });
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
                setError(error.response?.data?.message || 'Failed to load leaderboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [user, type, metric, period]);

    const podium = data.slice(0, 3);
    const tableData = data.slice(3);

    const formatPerformance = (value) => {
        if (metric === 'sales') {
            return `GHS ${value.toLocaleString()}`;
        }
        return value.toLocaleString();
    };

    const getMetricLabel = () => {
        return metric === 'sales' ? 'Sales Amount' : 'Registrations';
    };

    const getPeriodLabel = () => {
        switch (period) {
            case 'weekly': return 'This Week';
            case 'monthly': return 'This Month';
            case 'yearly': return 'This Year';
            default: return 'This Month';
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'agents': return 'Agents';
            case 'coordinators': return 'Coordinators';
            case 'branches': return 'Branches';
            default: return 'Agents';
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <p>Loading leaderboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="leaderboard-page">
            {/* Filters Section */}
            <Card>
                <div className="leaderboard-filters">
                    <div className="filter-group">
                        <label htmlFor="type-filter">Leaderboard Type</label>
                        <select 
                            id="type-filter"
                            value={type} 
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="agents">Agents</option>
                            <option value="coordinators">Coordinators</option>
                            <option value="branches">Branches</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="metric-filter">Performance Metric</label>
                        <select 
                            id="metric-filter"
                            value={metric} 
                            onChange={(e) => setMetric(e.target.value)}
                        >
                            <option value="sales">Sales Amount</option>
                            <option value="registrations">Registrations</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="period-filter">Time Period</label>
                        <select 
                            id="period-filter"
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Podium for Top 3 */}
            {podium.length > 0 ? (
                <div className="podium">
                    {/* 2nd Place */}
                    <div className="podium-card rank-2">
                        {podium[1] ? (
                            <>
                                <div className="podium-rank">2nd Place</div>
                                <FaTrophy className="podium-trophy" />
                                <div className="podium-ranker-name">{podium[1].name}</div>
                                <div className="podium-performance">{formatPerformance(podium[1].totalPerformance)}</div>
                                <div className="podium-metric">{getMetricLabel()}</div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>No 2nd Place</p>
                            </div>
                        )}
                    </div>

                    {/* 1st Place */}
                    <div className="podium-card rank-1">
                        {podium[0] ? (
                            <>
                                <div className="podium-rank">1st Place</div>
                                <FaTrophy className="podium-trophy" />
                                <div className="podium-ranker-name">{podium[0].name}</div>
                                <div className="podium-performance">{formatPerformance(podium[0].totalPerformance)}</div>
                                <div className="podium-metric">{getMetricLabel()}</div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>No 1st Place</p>
                            </div>
                        )}
                    </div>

                    {/* 3rd Place */}
                    <div className="podium-card rank-3">
                        {podium[2] ? (
                            <>
                                <div className="podium-rank">3rd Place</div>
                                <FaTrophy className="podium-trophy" />
                                <div className="podium-ranker-name">{podium[2].name}</div>
                                <div className="podium-performance">{formatPerformance(podium[2].totalPerformance)}</div>
                                <div className="podium-metric">{getMetricLabel()}</div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>No 3rd Place</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <p>No leaderboard data available for the selected criteria.</p>
                </div>
            )}

            {/* Table for Ranks 4+ */}
            {tableData.length > 0 && (
                <Card title={`${getTypeLabel()} Rankings (4th Place and Beyond)`}>
                    <div className="table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Name</th>
                                    <th>{getMetricLabel()}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((item, index) => (
                                    <tr key={item._id}>
                                        <td>{item.rank}</td>
                                        <td>{item.name}</td>
                                        <td>{formatPerformance(item.totalPerformance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Empty state for no additional rankings */}
            {podium.length > 0 && tableData.length === 0 && (
                <Card title="Additional Rankings">
                    <div className="empty-state">
                        <p>Only top 3 performers available for the selected criteria.</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default LeaderboardPage;
