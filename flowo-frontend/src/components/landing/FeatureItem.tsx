interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
        {icon}
      </div>
      <h4 className="font-bold text-green-800 text-base mb-2">{title}</h4>
      <p className="text-slate-600 text-sm leading-5">{description}</p>
    </div>
  );
}
