import React from 'react';
import { useContext } from 'react';
import { FiMenu } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext.jsx';
import './PageHeader.css';

const PageHeader = ({ title, isMobileMenuOpen, setIsMobileMenuOpen }) => {
    const { user } = useContext(AuthContext);

    if (!user) return null;

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="page-header">
            <div className="page-header-left">
                <button 
                    className="mobile-menu-toggle"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle mobile menu"
                >
                    <FiMenu />
                </button>
                <h2 className="page-header-title">{title}</h2>
            </div>
            <div className="page-header-user-profile">
                <div className="avatar">
                    {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role.replace('_', ' ')}</span>
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
