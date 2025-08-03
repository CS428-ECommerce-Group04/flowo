import React from 'react';

interface ContactItemProps {
  icon: string;
  title: string;
  details: string[];
}

export const ContactItem: React.FC<ContactItemProps> = ({ icon, title, details }) => {
  return (
    <div className="flex items-start space-x-4 mb-6">
      <div className="w-12 h-12 bg-[#2d5016] rounded-full flex items-center justify-center flex-shrink-0">
        <img src={icon} alt={title} className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-[#2d5016] text-base mb-1">{title}</h4>
        {details.map((detail, index) => (
          <p key={index} className="text-[#666666] text-base">{detail}</p>
        ))}
      </div>
    </div>
  );
};
