import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';

const CoordinatorDashboard = () => {
  const [agents, setAgents] = useState([]);
  const [myTargets, setMyTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    selectedAgent: '',
    date: '',
    salesAmount: '',
    newRegistrations: ''
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agentsResponse, targetsResponse] = await Promise.all([
        API.get('/api/users/branch-agents'),
        API.get('/api/targets/mytargets')
      ]);

      setAgents(agentsResponse.data);
      setMyTargets(targetsResponse.data);
      setError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/sales', {
        agentId: formData.selectedAgent,
        date: formData.date,
        sales_amount: parseFloat(formData.salesAmount),
        new_registrations: parseInt(formData.newRegistrations)
      });

      alert('Record saved successfully!');
      setFormData({
        selectedAgent: '',
        date: '',
        salesAmount: '',
        newRegistrations: ''
      });
    } catch (error) {
      console.error('Error saving record:', error);
      alert(error.response?.data?.message || 'Failed to save record');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchData} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div>
      {/* My Current Targets Section */}
      <Card title="My Current Targets">
        {myTargets.length > 0 ? (
          <div className="targets-list">
            {myTargets.map((target) => (
              <div key={target._id} className="target-item">
                <div className="target-header">
                  <h4>{target.target_type === 'sales' ? 'Sales Target' : 'Registration Target'}</h4>
                  <span className="target-amount">
                    {target.target_type === 'sales' ? `GHS ${target.amount.toLocaleString()}` : target.amount.toLocaleString()}
                  </span>
                </div>
                <div className="target-dates">
                  <span>From: {new Date(target.start_date).toLocaleDateString()}</span>
                  <span>To: {new Date(target.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No targets assigned yet.</p>
        )}
      </Card>

      {/* Log Daily Performance Form */}
      <Card title="Log Daily Performance">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="selectedAgent">Select Agent:</label>
            <select
              id="selectedAgent"
              name="selectedAgent"
              value={formData.selectedAgent}
              onChange={handleInputChange}
              required
            >
              <option value="">Choose an agent</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="salesAmount">Sales Amount (GHS):</label>
            <input
              type="number"
              id="salesAmount"
              name="salesAmount"
              value={formData.salesAmount}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newRegistrations">New Registrations:</label>
            <input
              type="number"
              id="newRegistrations"
              name="newRegistrations"
              value={formData.newRegistrations}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      </Card>

      {/* Branch Information */}
      <Card title="Branch Information">
        <p><strong>Branch:</strong> {user.branch ? user.branch.name : 'Not assigned to a branch'}</p>
        <p><strong>Location:</strong> {user.branch ? user.branch.location : 'N/A'}</p>
        <p><strong>Role:</strong> {user.role.replace('_', ' ')}</p>
      </Card>
    </div>
  );
};

export default CoordinatorDashboard;
