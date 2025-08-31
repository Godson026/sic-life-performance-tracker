import React from 'react';

const LoginIllustration = () => (
  <svg 
    width="100%" 
    height="100%" 
    viewBox="0 0 400 300" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ maxWidth: '450px', height: 'auto' }}
  >
    {/* Background */}
    <rect width="400" height="300" fill="#E6F0E9" rx="20" ry="20"/>
    
    {/* Decorative elements */}
    <circle cx="80" cy="80" r="30" fill="#006837" opacity="0.1"/>
    <circle cx="320" cy="120" r="25" fill="#006837" opacity="0.1"/>
    <circle cx="350" cy="250" r="20" fill="#006837" opacity="0.1"/>
    
    {/* Main illustration placeholder */}
    <rect x="150" y="100" width="100" height="80" fill="#006837" rx="10" ry="10"/>
    <rect x="160" y="110" width="80" height="60" fill="#E6F0E9" rx="5" ry="5"/>
    
    {/* Data visualization elements */}
    <rect x="170" y="120" width="15" height="30" fill="#006837"/>
    <rect x="190" y="130" width="15" height="20" fill="#006837"/>
    <rect x="210" y="125" width="15" height="25" fill="#006837"/>
    <rect x="230" y="115" width="15" height="35" fill="#006837"/>
    
    {/* Text placeholder */}
    <text 
      x="50%" 
      y="280" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fill="#006837" 
      fontSize="16"
      fontFamily="Arial, sans-serif"
      fontWeight="500"
    >
      Performance Analytics Dashboard
    </text>
  </svg>
);

export default LoginIllustration;
