import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';
import '../components/ReportPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ManagerReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('monthly');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { period }
        };
        
        console.log('🔍 Fetching report data for period:', period);
        console.log('👤 User branch:', user.branch);
        
        // --- CALL THE NEW, DEDICATED ENDPOINT ---
        const { data } = await axios.get('/api/dashboard/manager-report', config);
        
        console.log('📊 Received report data:', data);
        setReportData(data);
      } catch (err) {
        console.error("--- MANAGER REPORT FRONTEND ERROR ---", err.response || err);
        console.error("Error details:", {
          status: err.response?.status,
          message: err.response?.data?.message,
          userBranch: user.branch,
          period: period
        });
        setError('Failed to load report data. Please ensure sales have been recorded for your branch.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [user, period]);

  const chartData = {
    labels: reportData?.agentPerformanceChart?.map(a => a.agentName) || [],
    datasets: [{
      label: `Sales (${period === 'monthly' ? 'Month' : 'YTD'})`,
      data: reportData?.agentPerformanceChart?.map(a => a.totalSales) || [],
      backgroundColor: 'rgba(0, 104, 55, 0.8)'
    }]
  };
  
  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { legend: { display: false } } 
  };

  if (loading) return (
    <div className="report-page-grid">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Generating Branch Report...</p>
      </div>
    </div>
  );
  
  if (error) return (
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

  return (
    <div className="report-page-grid">
      <div className="reports-header">
        <h3>Branch Reports & Analytics</h3>
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

      <div className="report-stats-grid">
        <div className="stat-card-light">
          <div className="label">BRANCH SALES ({period.toUpperCase()})</div>
          <div className="value">GHS {reportData?.branchSales?.toLocaleString() || 0}</div>
          <div className="subtext">Target: GHS {reportData?.branchTarget?.toLocaleString() || 0}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">TOP AGENT</div>
          <div className="value">{reportData?.topAgent?.name || 'N/A'}</div>
          <div className="subtext">GHS {reportData?.topAgent?.sales?.toLocaleString() || 0}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">TARGET ACHIEVEMENT</div>
          <div className="value">{reportData?.targetAchievement?.toFixed(1) || 0}%</div>
          <div className="subtext">On track</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">NEW REGISTRATIONS ({period.toUpperCase()})</div>
          <div className="value">{reportData?.newRegistrations || 0}</div>
          <div className="subtext">New policies this period</div>
        </div>
      </div>

      <Card title={`Agent Performance Chart - ${period === 'monthly' ? 'Current Month' : 'Year-to-Date'}`}>
        <div className="chart-container">
          {reportData?.agentPerformanceChart?.length > 0 ? (
            <Bar options={chartOptions} data={chartData} />
          ) : (
            <p>No agent sales data recorded for this period to display chart.</p>
          )}
        </div>
      </Card>

      <Card title="Detailed Agent Breakdown">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>AGENT</th>
                <th>TOTAL SALES ({period.toUpperCase()})</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.agentPerformanceChart
                ?.sort((a, b) => b.totalSales - a.totalSales)
                .map((agent, index) => (
                  <tr key={agent._id}>
                    <td>{agent.agentName}</td>
                    <td>GHS {agent.totalSales.toLocaleString()}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ManagerReportsPage;
