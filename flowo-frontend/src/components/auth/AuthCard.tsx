interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: 'linear-gradient(to bottom, #f0f9e8, #e8f5d8)' }}>
      <div className={`bg-white rounded-2xl shadow-lg p-8 w-full max-w-md ${className}`}>
        {children}
      </div>
    </div>
  );
}
