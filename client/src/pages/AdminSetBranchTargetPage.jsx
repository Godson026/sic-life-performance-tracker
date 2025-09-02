import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import './AdminSetBranchTargetPage.css';

const AdminSetBranchTargetPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    branchId: '',
    target_type: 'sales',
    amount: '',
    start_date: '',
    end_date: ''
  });
  
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await API.get('/api/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to fetch branches. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.branchId) {
      setMessage({ type: 'error', text: 'Please select a branch.' });
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }
    
    if (!formData.start_date) {
      setMessage({ type: 'error', text: 'Please select a start date.' });
      return;
    }
    
    if (!formData.end_date) {
      setMessage({ type: 'error', text: 'Please select an end date.' });
      return;
    }
    
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate >= endDate) {
      setMessage({ type: 'error', text: 'End date must be after start date.' });
      return;
    }
    
    // Check if start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      setMessage({ type: 'error', text: 'Start date cannot be in the past.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });
      
      // THE KEY FIX: Ensure payload keys match backend expectations
      const payload = {
        branchId: formData.branchId,
        target_type: formData.target_type,
        amount: Number(formData.amount),
        start_date: formData.start_date,
        end_date: formData.end_date
      };
      
      const response = await API.post('/api/targets/branch', payload);
      
      setMessage({ 
        type: 'success', 
        text: response.data.message || 'Branch target set successfully!' 
      });
      
      // Reset form
      setFormData({
        branchId: '',
        target_type: 'sales',
        amount: '',
        start_date: '',
        end_date: ''
      });
      
    } catch (error) {
      console.error('Error setting branch target:', error);
      
      // Display specific error message from backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') || 
                          'Failed to set branch target. Please try again.';
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error message when user starts typing
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <Card title="Set Branch Target">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading branches...</p>
        </div>
      </Card>
    );
  }

  if (message.type === 'error') {
    return (
      <Card title="Set Branch Target">
        <div className="error-container">
          <p className="error-message">{message.text}</p>
          <button onClick={fetchBranches} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Set Branch Target">
      <form onSubmit={handleSubmit} className="target-form">
        <div className="form-group">
          <label htmlFor="branchId">
            <span className="required">*</span> Select Branch:
          </label>
          <select
            id="branchId"
            name="branchId"
            value={formData.branchId}
            onChange={handleInputChange}
            required
            className={formData.branchId ? 'valid' : ''}
          >
            <option value="">Choose a branch</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name} - {branch.location}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="target_type">
            <span className="required">*</span> Target Type:
          </label>
          <select
            id="target_type"
            name="target_type"
            value={formData.target_type}
            onChange={handleInputChange}
            required
          >
            <option value="sales">Sales Amount (GHS)</option>
            <option value="registration">New Registrations</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            <span className="required">*</span> Target Amount:
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder={formData.target_type === 'sales' ? 'Enter amount in GHS' : 'Enter number of registrations'}
            required
            min="1"
            step={formData.target_type === 'sales' ? '0.01' : '1'}
            className={formData.amount && formData.amount > 0 ? 'valid' : ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="start_date">
            <span className="required">*</span> Start Date:
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
            required
            min={new Date().toISOString().split('T')[0]}
            className={formData.start_date ? 'valid' : ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end_date">
            <span className="required">*</span> End Date:
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleInputChange}
            required
            min={formData.start_date || new Date().toISOString().split('T')[0]}
            className={formData.end_date ? 'valid' : ''}
          />
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
            <span className="message-text">{message.text}</span>
            <button 
              type="button" 
              className="message-close" 
              onClick={clearMessage}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Setting Target...
              </>
            ) : (
              'Set Target'
            )}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              setFormData({
                branchId: '',
                target_type: 'sales',
                amount: '',
                start_date: '',
                end_date: ''
              });
              setMessage({ type: '', text: '' });
            }}
            disabled={isSubmitting}
          >
            Reset Form
          </button>
        </div>
      </form>
    </Card>
  );
};

export default AdminSetBranchTargetPage;
