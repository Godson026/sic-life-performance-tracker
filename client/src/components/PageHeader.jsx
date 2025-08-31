import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './PageHeader.css';

const PageHeader = ({ title }) => {
    const { user } = useContext(AuthContext);

    if (!user) return null;

    return (
        <div className="page-header">
            <h2 className="page-header-title">{title}</h2>
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
