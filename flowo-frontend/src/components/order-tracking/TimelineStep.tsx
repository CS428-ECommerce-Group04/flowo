import React from 'react';

interface TimelineStepProps {
  icon: string;
  title: string;
  date: string;
  description: string;
  isCompleted: boolean;
  isActive?: boolean;
  liveUpdate?: {
    message: string;
  };
}

export default function TimelineStep({ 
  icon, 
  title, 
  date, 
  description, 
  isCompleted, 
  isActive = false,
  liveUpdate 
}: TimelineStepProps) {
  return (
    <div className="flex gap-4 mb-8 last:mb-0">
      {/* Icon and Line */}
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
          style={{
            backgroundColor: isCompleted ? '#4caf50' : '#e5e5e5',
            fontSize: '18px',
            lineHeight: '28px'
          }}
        >
          {isCompleted ? (icon === '🚚' || icon === '🏠' ? icon : '✓') : icon}
        </div>
        <div
          className="w-1 h-16 mt-2"
          style={{
            backgroundColor: isCompleted ? '#4caf50' : '#e5e5e5'
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 pt-2">
        <div className="flex justify-between items-start mb-2">
          <h3
            className="font-bold"
            style={{
              color: isCompleted ? '#2d5016' : '#999999',
              fontSize: '18px',
              lineHeight: '28px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {title}
          </h3>
          <span
            className="text-sm"
            style={{
              color: isCompleted ? '#666666' : '#999999',
              fontSize: '14px',
              lineHeight: '20px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {date}
          </span>
        </div>
        
        <p
          className="mb-4"
          style={{
            color: isCompleted ? '#666666' : '#999999',
            fontSize: '16px',
            lineHeight: '26px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {description}
        </p>

        {/* Live Update */}
        {liveUpdate && isActive && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: '#e3f2fd',
              borderColor: '#2196f3'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#2196f3' }}
              />
              <span
                className="font-medium"
                style={{
                  color: '#2196f3',
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Live Update
              </span>
            </div>
            <p
              style={{
                color: '#1976d2',
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {liveUpdate.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
