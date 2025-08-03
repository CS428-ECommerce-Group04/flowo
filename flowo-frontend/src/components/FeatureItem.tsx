import React from 'react';

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-[#2d5016] rounded-full flex items-center justify-center mx-auto mb-4">
        <img src={icon} alt={title} className="w-8 h-8" />
      </div>
      <h4 className="font-bold text-[#2d5016] text-base mb-2">{title}</h4>
      <p className="text-[#666666] text-sm leading-5">{description}</p>
    </div>
  );
};
