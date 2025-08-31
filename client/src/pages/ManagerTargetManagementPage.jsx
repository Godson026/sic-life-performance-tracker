import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';
import './ManagerTargetManagementPage.css';

const ManagerTargetManagementPage = () => {
    const [pageData, setPageData] = useState({ 
        adminTargets: [], 
        coordinatorsInBranch: [] 
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        coordinatorId: '',
        target_type: 'sales',
        amount: '',
        start_date: '',
        end_date: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const { user } = useContext(AuthContext);

    // Set default dates for current month
    useEffect(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setFormData(prev => ({
            ...prev,
            start_date: startOfMonth.toISOString().split('T')[0],
            end_date: endOfMonth.toISOString().split('T')[0]
        }));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                setMessage({ type: '', text: '' }); // Clear any previous messages
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/dashboard/manager-targets-page', config);
                
                // Ensure we have the expected structure
                const safeData = {
                    adminTargets: data.adminTargets || [],
                    coordinatorsInBranch: data.coordinatorsInBranch || []
                };
                
                setPageData(safeData);
                console.log('✅ Target data loaded successfully:', safeData);
                
            } catch (error) {
                console.error("Failed to load page data", error);
                setMessage({ 
                    type: 'error', 
                    text: error.response?.data?.message || 'Failed to load target data. Please try again.' 
                });
                // Set empty arrays to prevent mapping errors
                setPageData({ adminTargets: [], coordinatorsInBranch: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);
    
    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    };

    const handleTargetTypeChange = (type) => {
        setFormData({...formData, target_type: type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setSubmitting(true);
        
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/targets/coordinator', formData, config);
            
            setMessage({ type: 'success', text: 'Target set successfully!' });
            
            // Reset form
            setFormData({
                coordinatorId: '',
                target_type: 'sales',
                amount: '',
                start_date: formData.start_date,
                end_date: formData.end_date
            });
            
            // Optionally refetch data to show new target
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to set target.' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getTargetStatus = (target) => {
        const now = new Date();
        const startDate = new Date(target.start_date);
        const endDate = new Date(target.end_date);
        
        if (now < startDate) return { status: 'pending', label: 'Pending', class: 'pending' };
        if (now > endDate) return { status: 'overdue', label: 'Overdue', class: 'overdue' };
        return { status: 'active', label: 'Active', class: 'active' };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS'
        }).format(amount);
    };

    if (loading) return (
        <div className="target-command-center">
            <Card>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>Loading Target Data...</h2>
                    <p>Please wait while we fetch your branch information.</p>
                </div>
            </Card>
        </div>
    );

    // Add error state handling
    if (message.type === 'error' && !pageData.coordinatorsInBranch) {
        return (
            <div className="target-command-center">
                <Card>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <h2>Error Loading Data</h2>
                        <p>{message.text}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="create-user-btn"
                            style={{ marginTop: '1rem' }}
                        >
                            Retry
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    // Debug log to help troubleshoot
    console.log('🔍 Current pageData:', pageData);
    console.log('🔍 coordinatorsInBranch:', pageData.coordinatorsInBranch);
    console.log('🔍 adminTargets:', pageData.adminTargets);

    return (
        <div className="target-command-center">
            <div className="action-panel">
                <Card title="🎯 Set Coordinator Target">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>SELECT COORDINATOR:</label>
                            <select 
                                name="coordinatorId" 
                                value={formData.coordinatorId} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="">Choose a coordinator</option>
                                {(pageData.coordinatorsInBranch || []).map(coordinator => (
                                    <option key={coordinator._id} value={coordinator._id}>
                                        {coordinator.name} ({coordinator.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>TARGET TYPE:</label>
                            <div className="target-type-selector">
                                <div 
                                    className={`target-type-option ${formData.target_type === 'sales' ? 'selected' : ''}`}
                                    onClick={() => handleTargetTypeChange('sales')}
                                >
                                    💰 Sales Target
                                </div>
                                <div 
                                    className={`target-type-option ${formData.target_type === 'registration' ? 'selected' : ''}`}
                                    onClick={() => handleTargetTypeChange('registration')}
                                >
                                    📝 Registration Target
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>TARGET AMOUNT:</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder={formData.target_type === 'sales' ? 'Enter amount in GHS' : 'Enter number of registrations'}
                                min="1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>TARGET PERIOD:</label>
                            <div className="date-inputs">
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="create-user-btn"
                            disabled={submitting || !formData.coordinatorId || !formData.amount}
                        >
                            {submitting ? 'Setting Target...' : '🎯 Set Target'}
                        </button>
                    </form>
                </Card>
            </div>

            <div className="intelligence-panel">
                <Card title="🏢 My Branch Targets (from Admin)">
                    {pageData.adminTargets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            <p>No admin targets have been set for your branch yet.</p>
                            <p>Targets set by administrators will appear here.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Target Type</th>
                                        <th>Amount</th>
                                        <th>Period</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(pageData.adminTargets || []).map(target => {
                                        const status = getTargetStatus(target);
                                        return (
                                            <tr key={target._id}>
                                                <td>
                                                    <strong>
                                                        {target.target_type === 'sales' ? '💰 Sales' : '📝 Registration'}
                                                    </strong>
                                                </td>
                                                <td>
                                                    {target.target_type === 'sales' 
                                                        ? formatCurrency(target.amount)
                                                        : `${target.amount} registrations`
                                                    }
                                                </td>
                                                <td>
                                                    {new Date(target.start_date).toLocaleDateString()} - {new Date(target.end_date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <span className={`target-status ${status.class}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                <Card title="👥 Coordinators in My Branch">
                    {pageData.coordinatorsInBranch.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            <p>No coordinators are currently assigned to your branch.</p>
                            <p>Contact an administrator to assign coordinators.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(pageData.coordinatorsInBranch || []).map(coordinator => (
                                        <tr key={coordinator._id}>
                                            <td>
                                                <strong>{coordinator.name}</strong>
                                            </td>
                                            <td>{coordinator.email}</td>
                                            <td>
                                                <span className="target-status active">
                                                    {coordinator.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ManagerTargetManagementPage;
