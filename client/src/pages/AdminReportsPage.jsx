import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';
import './AdminReportsPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly'); // Default to monthly view
  const { user: adminUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!adminUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const config = { 
          headers: { Authorization: `Bearer ${adminUser.token}` },
          params: { period } // Pass the selected period to the backend
        };
        
        const { data } = await axios.get('/api/dashboard/admin-report', config);
        setReportData(data);
      } catch (error) {
        console.error("Failed to fetch admin report data for period:", period, error);
        setError(error.response?.data?.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [adminUser, period]); // Re-fetch data whenever the 'period' state changes

  // Prepare chart data from the API response
  const chartData = {
    labels: reportData?.branchSalesForChart?.map(branch => branch.branchName) || [],
    datasets: [
      {
        label: 'Sales (GHS)',
        data: reportData?.branchSalesForChart?.map(branch => branch.totalSales) || [],
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
        text: `Sales Performance by Branch - ${period === 'monthly' ? 'Current Month' : 'Year-to-Date'}`
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
          <p>Generating {period === 'monthly' ? 'Monthly' : 'Year-to-Date'} Report...</p>
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
        <h3>Reports & Analytics</h3>
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
          <div className="label">TOTAL SALES ({period.toUpperCase()})</div>
          <div className="value">GHS {reportData?.totalSales?.toLocaleString() || 0}</div>
          <div className="subtext">{period === 'monthly' ? 'Current month performance' : 'Year to date performance'}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">AVERAGE MONTHLY SALES</div>
          <div className="value">GHS {reportData?.avgMonthlySales?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}</div>
          <div className="subtext">{period === 'monthly' ? 'Current month average' : 'Year to date monthly average'}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">TOP PERFORMING BRANCH</div>
          <div className="value">{reportData?.topPerformingBranch?.branchName || 'N/A'}</div>
          <div className="subtext">GHS {reportData?.topPerformingBranch?.totalSales?.toLocaleString() || 0}</div>
        </div>
        
        <div className="stat-card-light">
          <div className="label">NEW REGISTRATIONS ({period.toUpperCase()})</div>
          <div className="value">{reportData?.newRegistrations || 0}</div>
          <div className="subtext">{period === 'monthly' ? 'New policies this month' : 'New policies this year'}</div>
        </div>
      </div>

      {/* Chart */}
      <Card title={`Sales Performance by Branch - ${period === 'monthly' ? 'Current Month' : 'Year-to-Date'}`}>
        <div className="chart-container">
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>
      </Card>

      {/* Detailed Table */}
      <Card title={`Detailed Branch Breakdown - ${period === 'monthly' ? 'Current Month' : 'Year-to-Date'}`}>
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Total Sales ({period === 'monthly' ? 'Current Month' : 'Year-to-Date'})</th>
                <th>Performance Rank</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.branchSalesForChart?.map((branch, index) => (
                <tr key={branch._id}>
                  <td>{branch.branchName}</td>
                  <td>GHS {branch.totalSales.toLocaleString()}</td>
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

export default AdminReportsPage;
