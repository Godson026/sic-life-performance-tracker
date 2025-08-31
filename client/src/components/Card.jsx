import React from 'react';
import './Card.css';

// A simple, reusable Card component
const Card = ({ children, className, title, variant }) => {
  // Combines default 'card' class with any additional classes passed in
  const cardClassName = `card ${variant ? `card-${variant}` : ''} ${className || ''}`.trim();

  return (
    <div className={cardClassName}>
      {title && <h2 className="card-title">{title}</h2>}
      {children}
    </div>
  );
};

// Specialized StatCard component for displaying metrics
export const StatCard = ({ label, value, subtitle, className }) => {
  return (
    <Card className={`stat-card ${className || ''}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </Card>
  );
};

export default Card;
