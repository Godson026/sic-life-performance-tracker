import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import Header from '../components/Header.jsx';

const BranchManagerDashboard = () => {
  const [myTargets, setMyTargets] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [branchUsers, setBranchUsers] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState('');
  const [targetType, setTargetType] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      
      // Fetch targets, coordinators, and branch users in parallel
      const [targetsResponse, coordinatorsResponse, branchUsersResponse] = await Promise.all([
        API.get('/api/targets/mytargets'),
        API.get('/api/users/branch-coordinators'),
        API.get('/api/users/branch-users')
      ]);

      setMyTargets(targetsResponse.data);
      setCoordinators(coordinatorsResponse.data);
      setBranchUsers(branchUsersResponse.data);
      setError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCoordinator || !targetType || !amount || !startDate || !endDate) {
      setError('Please fill in all fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await API.post('/api/targets/coordinator', {
        coordinatorId: selectedCoordinator,
        target_type: targetType,
        amount: parseFloat(amount),
        start_date: startDate,
        end_date: endDate
      });

      alert('Target set successfully!');
      
      // Reset form fields
      setSelectedCoordinator('');
      setTargetType('');
      setAmount('');
      setStartDate('');
      setEndDate('');
      
      // Refresh targets to show the new one
      fetchData();
    } catch (error) {
      console.error('Error setting coordinator target:', error);
      setError(error.response?.data?.message || 'Failed to set target');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="branch-manager-dashboard">
        <h1>Branch Manager Dashboard</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error && !myTargets.length && !coordinators.length) {
    return (
      <div className="branch-manager-dashboard">
        <h1>Branch Manager Dashboard</h1>
        <div className="error-message">{error}</div>
        <p>Please contact an administrator to assign you to a branch.</p>
      </div>
    );
  }

  return (
    <div>
      <Header title="Branch Manager Dashboard" />
      
      {/* Stats Cards */}
      <div className="card-grid-3">
        <Card className="stat-card">
          <div className="stat-card-label">Branch Targets</div>
          <div className="stat-card-value">{myTargets.length}</div>
          <div className="stat-card-subtitle">Active targets set</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label">Coordinators</div>
          <div className="stat-card-value">{coordinators.length}</div>
          <div className="stat-card-subtitle">In your branch</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label">Team Members</div>
          <div className="stat-card-value">{branchUsers.length}</div>
          <div className="stat-card-subtitle">Total team size</div>
        </Card>
      </div>

      {/* My Branch Targets Section */}
      <Card title="My Branch Targets">
        {myTargets.length === 0 ? (
          <p className="no-targets">No targets set for your branch yet.</p>
        ) : (
          <div className="card-grid">
            {myTargets.map((target) => (
              <Card key={target._id} title={target.target_type === 'sales' ? 'Sales Target' : 'Registration Target'}>
                <p><strong>Amount:</strong> GHS {target.amount}</p>
                <p><strong>Start Date:</strong> {new Date(target.start_date).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(target.end_date).toLocaleDateString()}</p>
                <p><strong>Set On:</strong> {new Date(target.createdAt).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Set Coordinator Target Section */}
      {coordinators.length > 0 ? (
        <Card title="Set Coordinator Target">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="target-form">
            <div className="form-group">
              <label htmlFor="coordinator">Select Coordinator:</label>
              <select
                id="coordinator"
                value={selectedCoordinator}
                onChange={(e) => setSelectedCoordinator(e.target.value)}
                required
                disabled={loading}
                className="coordinator-select"
              >
                <option value="">Choose a coordinator</option>
                {coordinators.map((coordinator) => (
                  <option key={coordinator._id} value={coordinator._id}>
                    {coordinator.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="targetType">Target Type:</label>
              <select
                id="targetType"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select target type</option>
                <option value="sales">Sales</option>
                <option value="registration">Registration</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">Target Amount (GHS):</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0.01"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Setting Target...' : 'Set Target'}
            </button>
          </form>
        </Card>
      ) : (
        <Card title="No Coordinators Found">
          <p>There are no coordinators currently assigned to your branch.</p>
        </Card>
      )}

      {/* Coordinators Summary */}
      <div className="coordinators-summary">
        <h2>Branch Coordinators ({coordinators.length})</h2>
        {coordinators.length === 0 ? (
          <p className="no-coordinators">No coordinators found in your branch.</p>
        ) : (
          <div className="coordinators-grid">
            {coordinators.map((coordinator) => (
              <div key={coordinator._id} className="coordinator-card">
                <h3>{coordinator.name}</h3>
                <p><strong>Email:</strong> {coordinator.email}</p>
                <p><strong>Role:</strong> {coordinator.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Team Members Section */}
      <Card title={`My Team Members (${branchUsers.length})`}>
        {branchUsers.length === 0 ? (
          <p className="no-team-members">No team members found in your branch.</p>
        ) : (
          <div className="card-grid">
            {branchUsers.map((member) => (
              <Card key={member._id} title={member.name}>
                <p><strong>Email:</strong> {member.email}</p>
                <p><strong>Role:</strong> <span className={`role-badge role-${member.role}`}>{member.role}</span></p>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BranchManagerDashboard;
