import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../api/axios';
import Card from '../components/Card.jsx';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../pages/BranchManagerHomePage.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminHomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  
  // --- NEW AI STATE ---
  const [aiInsight, setAiInsight] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching admin dashboard data...');
        const response = await API.get('/api/dashboard/admin-summary');
        console.log('Admin dashboard response:', response.data);
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // --- NEW FUNCTION TO GET AI INSIGHT ---
  const handleGenerateInsight = async () => {
    setIsGenerating(true);
    setAiInsight(''); // Clear previous insight
    try {
      const { data } = await API.get('/api/ai/summary');
      setAiInsight(data.insight);
    } catch (error) {
      console.error("Failed to fetch AI Insight", error);
      setAiInsight("Sorry, I was unable to generate an insight at this time. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div>Failed to load dashboard data</div>;
  }

  const chartData = {
    labels: dashboardData.branchSalesPerformance.map(branch => branch.branchName),
    datasets: [
      {
        label: 'Sales Performance (GHS)',
        data: dashboardData.branchSalesPerformance.map(branch => branch.totalSales),
        backgroundColor: 'rgba(0, 123, 255, 0.8)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Branch Sales Performance',
      },
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

  return (
    <div>
      {/* Stats Cards */}
      <div className="overview-cards">
        <Card className="stat-card">
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value">{dashboardData.userCount}</div>
          <div className="stat-card-subtitle">Active users</div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-card-label">Total Branches</div>
          <div className="stat-card-value">{dashboardData.branchCount}</div>
          <div className="stat-card-subtitle">Company branches</div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-card-label">Sales This Month</div>
          <div className="stat-card-value">GHS {dashboardData.salesThisMonth.toLocaleString()}</div>
          <div className="stat-card-subtitle">Total revenue</div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-card-label">Average Achievement</div>
          <div className="stat-card-value">{dashboardData.averageAchievement}%</div>
          <div className="stat-card-subtitle">Team performance</div>
        </Card>
      </div>

      {/* Charts and Data */}
      <div className="main-grid">
        <div className="left-column">
          <Card title="Branch Sales Performance">
            <Bar data={chartData} options={chartOptions} />
          </Card>
        </div>
        
        <div className="right-column">
          <Card title="Top Agents">
            <div className="top-agents-list">
              {dashboardData.topAgents.map((agent, index) => (
                <div key={agent._id} className="agent-item">
                  <span className="agent-rank">#{index + 1}</span>
                  <span className="agent-name">{agent.agentName}</span>
                  <span className="agent-achievement">{agent.achievementPercentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* --- THIS IS THE UPDATED AI CARD --- */}
      <Card title="AI Performance Insights" className="ai-insights-card">
        {isGenerating ? (
          <p className="generating-text">AI Coach is analyzing the latest data...</p>
        ) : aiInsight ? (
          <div className="ai-insight-content">{aiInsight}</div>
        ) : (
          <div className="ai-insights-placeholder">
            <p>AI-powered performance analysis and recommendations will appear here.</p>
            <p>This will include:</p>
            <ul>
              <li>Performance trend predictions</li>
              <li>Optimization recommendations</li>
              <li>Anomaly detection</li>
              <li>Strategic insights</li>
            </ul>
          </div>
        )}

        <button 
          onClick={handleGenerateInsight} 
          className="btn-view-insights" 
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Get New Insight'}
        </button>
      </Card>
    </div>
  );
};

export default AdminHomePage;
