import React, { useState, useEffect, useContext } from 'react';
import Modal from 'react-modal';
import API from '../api/axios';
import { FiTrash2, FiUsers, FiUserCheck, FiUser, FiUserPlus, FiShield } from 'react-icons/fi'; // Import icons
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx'; // Import Card component
import './AdminUserManagementPage.css';

Modal.setAppElement('#root'); // for accessibility

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [selectedBranches, setSelectedBranches] = useState({});
  const [selectedRoles, setSelectedRoles] = useState({});
  const [roleFilter, setRoleFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [modalError, setModalError] = useState(''); // For modal-specific errors
  const { user: adminUser } = useContext(AuthContext);

  // Calculate user statistics
  const userStats = {
    totalUsers: users.length,
    admins: users.filter(user => user.role === 'admin').length,
    branchManagers: users.filter(user => user.role === 'branch_manager').length,
    coordinators: users.filter(user => user.role === 'coordinator').length,
    agents: users.filter(user => user.role === 'agent').length
  };

  useEffect(() => {
    fetchData();
  }, [adminUser]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [usersResponse, branchesResponse] = await Promise.all([
        API.get('/api/users'),
        API.get('/api/branches')
      ]);

      setUsers(usersResponse.data);
      setBranches(branchesResponse.data);
      setError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Handlers for creating a user in the modal
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError(''); // Reset previous errors

    try {
      // Create the user
      const { data } = await API.post('/api/users/admin/create', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: 'agent' // Default role
      });

      // Add new user to the top of the list for instant UI update
      setUsers(prevUsers => [data, ...prevUsers]);

      // Reset form and close modal
      setNewUser({ name: '', email: '', password: '' });
      setModalIsOpen(false);

      // Show success message
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      setModalError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prevState => ({ ...prevState, [name]: value }));
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await API.delete(`/api/users/${userId}`);
        setUsers(users.filter((u) => u._id !== userId));
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleAssignBranch = async (userId) => {
    const branchId = selectedBranches[userId];
    if (!branchId) {
      alert('Please select a branch first');
      return;
    }

    try {
      const response = await API.put(`/api/users/${userId}`, 
        { branchId });
      
      setUsers(prevUsers => prevUsers.map(u => u._id === userId ? response.data : u));
      alert('Branch assigned successfully!');
    } catch (error) {
      console.error('Error assigning branch:', error);
      alert('Failed to assign branch');
    }
  };

  const handleUpdateRole = async (userId) => {
    const newRole = selectedRoles[userId];
    if (!newRole) {
      alert('Please select a role first');
      return;
    }

    try {
      const response = await API.put(`/api/users/${userId}/role`, 
        { role: newRole });
      
      setUsers(prevUsers => prevUsers.map(u => u._id === userId ? response.data : u));
      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const filteredUsers = users.filter(user => {
    const roleMatch = roleFilter === 'All' || user.role === roleFilter;
    const branchMatch = branchFilter === 'All' || user.branch?._id === branchFilter;
    const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return roleMatch && branchMatch && searchMatch;
  });

  const getRolePillClass = (role) => {
    return `role-pill role-${role.replace('_', '-')}`;
  };

  const formatRole = (role) => {
    return role.replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="loading-row">
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="user-management-header">
        <input
          type="text"
          placeholder="Search users by name or email..."
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={() => setModalIsOpen(true)} className="create-user-btn">
          Create User
        </button>
      </div>

      {/* Quick Stats Overview */}
      <div className="stats-overview">
        <Card className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userStats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <FiShield />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userStats.admins}</div>
            <div className="stat-label">Admins</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <FiUserCheck />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userStats.branchManagers}</div>
            <div className="stat-label">Branch Managers</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <FiUser />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userStats.coordinators}</div>
            <div className="stat-label">Coordinators</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <FiUserPlus />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userStats.agents}</div>
            <div className="stat-label">Agents</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label htmlFor="roleFilter">Filter by Role:</label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="branch_manager">Branch Manager</option>
            <option value="coordinator">Coordinator</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <div>
          <label htmlFor="branchFilter">Filter by Branch:</label>
          <select
            id="branchFilter"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="All">All Branches</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Assign Branch</th>
              <th>Update Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <p>No users found matching your criteria.</p>
                  <p>Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRolePillClass(user.role)}>
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td>{user.branch ? user.branch.name : 'Unassigned'}</td>
                  <td>
                    <div className="branch-assignment">
                      <select
                        value={selectedBranches[user._id] || ''}
                        onChange={(e) => setSelectedBranches(prev => ({
                          ...prev,
                          [user._id]: e.target.value
                        }))}
                        className="branch-select"
                      >
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignBranch(user._id)}
                        className="action-btn btn-assign"
                      >
                        Assign
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="branch-assignment">
                      <select
                        value={selectedRoles[user._id] || ''}
                        onChange={(e) => setSelectedRoles(prev => ({
                          ...prev,
                          [user._id]: e.target.value
                        }))}
                        className="branch-select"
                      >
                        <option value="">Select Role</option>
                        <option value="agent">Agent</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="branch_manager">Branch Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleUpdateRole(user._id)}
                        className="action-btn btn-update"
                      >
                        Update
                      </button>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <FiTrash2 onClick={() => handleDeleteUser(user._id)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h2>Create New User</h2>
          <button 
            className="close-btn"
            onClick={() => setModalIsOpen(false)}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleCreateUser}>
          <div className="modal-form-group">
            <label htmlFor="name">Name</label>
            <input 
              type="text" 
              id="name"
              name="name" 
              value={newUser.name}
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              value={newUser.email}
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              name="password" 
              value={newUser.password}
              onChange={handleInputChange} 
              required 
            />
          </div>

          {modalError && <p className="error-message">{modalError}</p>}
          
          <div className="modal-form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setModalIsOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUserManagementPage;
