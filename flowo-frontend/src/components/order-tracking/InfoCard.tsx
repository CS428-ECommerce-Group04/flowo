import React from 'react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function InfoCard({ title, children, className = '', style = {} }: InfoCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 ${className}`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1.5px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.04), 0 0.25px 0.5px rgba(0,0,0,0.04)',
        ...style
      }}
    >
      <h2
        className="font-bold mb-6"
        style={{
          color: '#2d5016',
          fontSize: '20px',
          lineHeight: '28px',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
