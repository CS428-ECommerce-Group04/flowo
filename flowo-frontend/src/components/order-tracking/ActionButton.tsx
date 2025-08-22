import React from 'react';

interface ActionButtonProps {
  children: React.ReactNode;
  variant: 'primary' | 'outlined' | 'pink' | 'pink-outlined';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ActionButton({ 
  children, 
  variant, 
  onClick, 
  className = '',
  disabled = false 
}: ActionButtonProps) {
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#2196f3',
          color: '#ffffff',
          border: 'none'
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: '#2d5016',
          border: '1px solid #2d5016'
        };
      case 'pink':
        return {
          backgroundColor: '#e91e63',
          color: '#ffffff',
          border: 'none'
        };
      case 'pink-outlined':
        return {
          backgroundColor: 'transparent',
          color: '#e91e63',
          border: '1px solid #e91e63'
        };
      default:
        return {};
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-6 py-3 rounded-lg font-medium transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        ...getButtonStyles(),
        fontSize: '16px',
        lineHeight: '24px',
        fontFamily: 'Inter, sans-serif',
        height: '48px'
      }}
    >
      {children}
    </button>
  );
}
