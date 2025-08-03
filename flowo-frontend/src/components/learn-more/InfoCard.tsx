interface InfoCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm mx-auto">
      <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mb-6">
        <img src={icon} alt={title} className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-green-800 mb-3">{title}</h3>
      <p className="text-slate-600 text-base leading-6">{description}</p>
    </div>
  );
}
