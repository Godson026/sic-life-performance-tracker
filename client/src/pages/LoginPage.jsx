import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = await login(formData.email, formData.password);
      
      // Navigate based on user role
      switch (userData.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'branch_manager':
          navigate('/manager-dashboard');
          break;
        case 'coordinator':
          navigate('/dashboard');
          break;
        default:
          // Fallback to coordinator dashboard
          navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="login-page">
      {/* Left Section - Background Image Only */}
      <div className="login-illustration">
        {/* Only background image shows - no content */}
      </div>

      {/* Right Section - Login Form */}
      <div className="login-form-section">
        <div className="login-form-card">
          <div className="form-header">
            <div className="form-logo">
              <img 
                src="/images/sic-life-logo.png" 
                alt="SIC Life Logo" 
                className="form-company-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="fallback-form-logo">
                <div className="gear-icon">
                  <div className="wrench-icon"></div>
                </div>
              </div>
            </div>
            <h2 className="form-title">LOG IN</h2>
            <p className="form-subtitle">Login with your Admin, Manager, or Coordinator credentials to access your Performance Workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>

            <div className="form-links">
              <a href="#" className="forgot-password">Forgot Password?</a>
              <div className="signup-link">
                <span>Don't have an account? Contact your Administrator</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
