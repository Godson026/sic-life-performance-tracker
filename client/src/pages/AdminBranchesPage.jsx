import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';

const AdminBranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBranch, setNewBranch] = useState({ name: '', location: '' });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      const response = await axios.get('http://localhost:5000/api/branches', config);
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      const response = await axios.post('http://localhost:5000/api/branches', newBranch, config);
      setBranches([response.data, ...branches]);
      setNewBranch({ name: '', location: '' });
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Failed to create branch');
    }
  };

  if (loading) {
    return <div>Loading branches...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchBranches} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <Card title="Create New Branch">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="branchName">Branch Name:</label>
            <input
              type="text"
              id="branchName"
              value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="branchLocation">Location:</label>
            <input
              type="text"
              id="branchLocation"
              value={newBranch.location}
              onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Branch</button>
        </form>
      </Card>

      <Card title="Existing Branches">
        {branches.length === 0 ? (
          <p>No branches created yet.</p>
        ) : (
          <div className="branches-list">
            {branches.map((branch) => (
              <div key={branch._id} className="branch-item">
                <h4>{branch.name}</h4>
                <p>Location: {branch.location}</p>
                <p>Created: {new Date(branch.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminBranchesPage;
