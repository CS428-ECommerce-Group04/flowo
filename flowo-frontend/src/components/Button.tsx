import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'pink';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 inline-flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-[#2d5016] text-white hover:bg-[#1e3510]',
    outline: 'border-2 border-[#2d5016] text-[#2d5016] hover:bg-[#2d5016] hover:text-white',
    pink: 'bg-[#e91e63] text-white hover:bg-[#c2185b]'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-4 text-lg',
    lg: 'px-10 py-5 text-xl'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};
