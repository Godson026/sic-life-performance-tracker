import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './Header.css';

// A modern header component to greet the user and show page title
const Header = ({ title, subtitle, actions }) => {
    const { user } = useContext(AuthContext);

    if (!user) return null;

    // Get user initials for avatar
    const getUserInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Format role for display
    const formatRole = (role) => {
        if (!role) return 'User';
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <header className="header">
            <div className="header-title">
                <h1>{title}</h1>
            </div>
            <div className="header-user-info">
                <div className="avatar">
                    {/* Creates initials like 'GA' from 'Godson Aidoo' */}
                    {getUserInitials(user.name)}
                </div>
                <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role.replace('_', ' ')}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
