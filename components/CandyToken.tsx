
import React from 'react';

interface Props {
    size?: number;
    className?: string;
}

export const CandyToken: React.FC<Props> = ({ size = 24, className = '' }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            className={`inline-block drop-shadow-md ${className}`}
        >
            <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
            <circle cx="50" cy="50" r="35" fill="#F4C430" stroke="none" />
            <path d="M50 20 L55 35 L70 35 L60 45 L65 60 L50 50 L35 60 L40 45 L30 35 L45 35 Z" fill="#FFF" opacity="0.6" />
            <text x="50" y="85" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#B8860B" fontFamily="sans-serif">★</text>
        </svg>
    );
};
