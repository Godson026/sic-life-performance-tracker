import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';
import '../components/ReportPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CoordinatorReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly'); // Default to monthly view
  const { user: coordinatorUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!coordinatorUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const config = { 
          headers: { Authorization: `Bearer ${coordinatorUser.token}` },
          params: { period } // Pass the selected period to the backend
        };
        
        const { data } = await axios.get('/api/dashboard/coordinator-report', config);
        setReportData(data);
      } catch (error) {
        console.error("Failed to fetch coordinator report data for period:", period, error);
        setError(error.response?.data?.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [coordinatorUser, period]); // Re-fetch data whenever the 'period' state changes

  // Prepare chart data from the API response
  const chartData = {
    labels: reportData?.agentPerformanceData?.map(agent => agent.agentName) || [],
    datasets: [
      {
        label: 'Sales (GHS)',
        data: reportData?.agentPerformanceData?.map(agent => agent.totalSales) || [],
        backgroundColor: 'rgba(0, 104, 55, 0.8)',
        borderColor: 'rgba(0, 104, 55, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Team Performance Chart - ${period === 'monthly' ? 'Current Month' : 'Year-to-Date'}`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'GHS ' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="report-page-grid">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Generating {period === 'monthly' ? 'Monthly' : 'Year-to-Date'} Team Report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-page-grid">
        <div className="error-container">
          <h3>Error Loading Report</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page-grid">
      {/* Period Filter Controls */}
      <div className="reports-header">
        <h3>Team Reports & Analytics</h3>
        <div className="period-filters">
          <button 
            onClick={() => setPeriod('monthly')} 
            className={`filter-btn ${period === 'monthly' ? 'active' : ''}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setPeriod('ytd')} 
            className={`filter-btn ${period === 'ytd' ? 'active' : ''}`}
          >
            Year-to-Date
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="report-stats-grid">
        <div className="stat-card-light">
          <div className="label">TEAM SALES ({period.toUpperCase()})</div>
          <div className="value">GHS {reportData?.teamSales?.toLocaleString() || 0}</div>
          <div className="subtext">{period === 'monthly' ? 'Current month performance' : 'Year to date performance'}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">TOP AGENT</div>
          <div className="value">{reportData?.topAgentInTeam?.agentName || 'N/A'}</div>
          <div className="subtext">GHS {reportData?.topAgentInTeam?.totalSales?.toLocaleString() || 0}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">TARGET ACHIEVEMENT</div>
          <div className="value">{reportData?.teamAchievementPercentage || 0}%</div>
          <div className="subtext">Target: GHS {reportData?.currentTarget?.toLocaleString() || 0}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">NEW REGISTRATIONS ({period.toUpperCase()})</div>
          <div className="value">{reportData?.newRegistrations || 0}</div>
          <div className="subtext">{period === 'monthly' ? 'New policies this month' : 'New policies this year'}</div>
        </div>
      </div>

      {/* Chart */}
      <Card title={`Team Performance Chart - ${period === 'monthly' ? 'Current Month' : 'Year-to-Date'}`}>
        <div className="chart-container">
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>
      </Card>

      {/* Detailed Table */}
      <Card title={`Agent Performance Breakdown - ${period === 'monthly' ? 'Current Month' : 'Year-to-Date'}`}>
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Total Sales ({period === 'monthly' ? 'Current Month' : 'Year-to-Date'})</th>
                <th>New Registrations</th>
                <th>Performance Rank</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.agentPerformanceData?.map((agent, index) => (
                <tr key={agent._id}>
                  <td>{agent.agentName}</td>
                  <td>GHS {agent.totalSales.toLocaleString()}</td>
                  <td>{agent.totalRegistrations}</td>
                  <td>#{index + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Last Updated Footer */}
      {reportData?.lastUpdated && (
        <div className="report-footer">
          <p>Last updated: {new Date(reportData.lastUpdated).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default CoordinatorReportsPage;
