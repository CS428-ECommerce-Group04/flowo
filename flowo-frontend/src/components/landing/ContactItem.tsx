interface ContactItemProps {
  icon: string;
  title: string;
  details: string[];
}

export default function ContactItem({ icon, title, details }: ContactItemProps) {
  return (
    <div className="flex items-start space-x-4 mb-6">
      <div className="w-12 h-12 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xl">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-green-800 text-base mb-1">{title}</h4>
        {details.map((detail, index) => (
          <p key={index} className="text-slate-600 text-base">{detail}</p>
        ))}
      </div>
    </div>
  );
}
