import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiMapPin, FiUsers, FiUserCheck } from 'react-icons/fi';
import './AdminBranchManagement.css';

const AdminBranchManagement = () => {
  const { user } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });

  // Quick stats state
  const [stats, setStats] = useState({
    totalBranches: 0,
    branchManagers: 0,
    totalAgents: 0
  });

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
      
      const [branchesResponse, statsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/branches', config),
        axios.get('http://localhost:5000/api/branches/stats', config)
      ]);

      setBranches(branchesResponse.data);
      setStats(statsResponse.data);
      setError('');
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError(error.response?.data?.message || 'Failed to fetch branches');
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

      if (editingBranch) {
        // Update existing branch
        await axios.put(`http://localhost:5000/api/branches/${editingBranch._id}`, formData, config);
      } else {
        // Create new branch
        await axios.post('http://localhost:5000/api/branches', formData, config);
      }

      setShowModal(false);
      setEditingBranch(null);
      setFormData({ name: '', location: '' });
      fetchBranches(); // Refresh the list
    } catch (error) {
      console.error('Error saving branch:', error);
      setError(error.response?.data?.message || 'Failed to save branch');
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location
    });
    setShowModal(true);
  };

  const handleDelete = async (branchId) => {
    if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        await axios.delete(`http://localhost:5000/api/branches/${branchId}`, config);
        fetchBranches(); // Refresh the list
      } catch (error) {
        console.error('Error deleting branch:', error);
        setError(error.response?.data?.message || 'Failed to delete branch');
      }
    }
  };

  // --- UPDATED FUNCTION TO FETCH LIVE BRANCH DETAILS ---
  const handleViewDetails = async (branch) => {
    setSelectedBranch(null); // Clear previous data
    setModalLoading(true);
    setShowDetailsModal(true);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Fetch detailed branch information with live performance data
      const response = await axios.get(`http://localhost:5000/api/branches/${branch._id}`, config);
      setSelectedBranch(response.data);
    } catch (error) {
      console.error('Error fetching branch details:', error);
      setError(error.response?.data?.message || 'Failed to fetch branch details');
    } finally {
      setModalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', location: '' });
    setEditingBranch(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading branches...</p>
      </div>
    );
  }

  return (
    <div className="branch-management-page">
      {/* Add New Branch Button - Top Right */}
      <div className="action-header">
        <button 
          className="btn btn-primary add-branch-btn"
          onClick={() => setShowModal(true)}
        >
          <FiPlus /> Add New Branch
        </button>
      </div>

      {/* Quick Stats Overview */}
      <div className="stats-overview">
        <Card className="stat-card">
          <div className="stat-icon">
            <FiMapPin />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBranches}</div>
            <div className="stat-label">Total Branches</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <FiUserCheck />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.branchManagers}</div>
            <div className="stat-label">Branch Managers</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAgents}</div>
            <div className="stat-label">Total Agents</div>
          </div>
        </Card>
      </div>

      {/* Branch List Table */}
      <Card title="Branch List">
        {error && <div className="error-message">{error}</div>}
        
        <div className="table-container">
          <table className="branch-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Branch Manager</th>
                <th>Branch Coordinator</th>
                <th>Location</th>
                <th>Total Agents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch._id}>
                  <td className="branch-name">{branch.name}</td>
                  <td>{branch.branchManager?.name || 'Not Assigned'}</td>
                  <td>{branch.branchCoordinator?.name || 'Not Assigned'}</td>
                  <td>{branch.location}</td>
                  <td>{branch.totalAgents || 0}</td>
                  <td className="actions">
                    <div className="action-buttons">
                      <button
                        className="btn btn-icon btn-view"
                        onClick={() => handleViewDetails(branch)}
                        title="View Branch Details"
                      >
                        <FiEye />
                        <span className="action-label">View</span>
                      </button>
                      <button
                        className="btn btn-icon btn-edit"
                        onClick={() => handleEdit(branch)}
                        title="Edit Branch Information"
                      >
                        <FiEdit />
                        <span className="action-label">Edit</span>
                      </button>
                      <button
                        className="btn btn-icon btn-delete"
                        onClick={() => handleDelete(branch._id)}
                        title="Delete Branch (Warning: This action cannot be undone)"
                      >
                        <FiTrash2 />
                        <span className="action-label">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Branch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="branchName">Branch Name *</label>
                <input
                  type="text"
                  id="branchName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter branch name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="Enter branch location"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPDATED BRANCH DETAILS MODAL WITH LIVE DATA --- */}
      {showDetailsModal && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Branch Details - {selectedBranch?.branchInfo?.name || 'Loading...'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            {modalLoading ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Loading branch details...</p>
              </div>
            ) : selectedBranch ? (
              <div className="branch-details">
                <div className="details-section">
                  <h3>Branch Information</h3>
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">{selectedBranch.branchInfo.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Location:</span>
                    <span className="value">{selectedBranch.branchInfo.location}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Created:</span>
                    <span className="value">{new Date(selectedBranch.branchInfo.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Branch Manager</h3>
                  {selectedBranch.manager ? (
                    <div className="manager-info">
                      <div className="detail-row">
                        <span className="label">Name:</span>
                        <span className="value">{selectedBranch.manager.name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Email:</span>
                        <span className="value">{selectedBranch.manager.email}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="no-data">No branch manager assigned</p>
                  )}
                </div>

                {/* --- NEW LIVE PERFORMANCE DATA SECTION --- */}
                <div className="details-section">
                  <h3>Branch Performance - {selectedBranch.monthYear}</h3>
                  <div className="performance-stats">
                    <div className="stat-item">
                      <span className="stat-label">Current Target</span>
                      <span className="stat-value">GHS {selectedBranch.currentTarget.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Achieved</span>
                      <span className="stat-value">GHS {selectedBranch.achieved.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Achievement %</span>
                      <span className="stat-value">{selectedBranch.achievementPercentage}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Ranking</span>
                      <span className="stat-value">#{selectedBranch.ranking}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">New Registrations</span>
                      <span className="stat-value">{selectedBranch.totalRegistrations}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Agents in Branch ({selectedBranch.agents?.length || 0})</h3>
                  {selectedBranch.agents && selectedBranch.agents.length > 0 ? (
                    <div className="agents-list">
                      {selectedBranch.agents.map((agent) => (
                        <div key={agent._id} className="agent-item">
                          <span className="agent-name">{agent.name}</span>
                          <span className="agent-role">{agent.role}</span>
                          <span className="agent-email">{agent.email}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No agents assigned to this branch</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="modal-error">
                <h3>Could not load branch details</h3>
                <p>Please try again later.</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBranchManagement;
