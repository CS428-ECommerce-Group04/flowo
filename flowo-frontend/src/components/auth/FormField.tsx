interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function FormField({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required = false 
}: FormFieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-[#2d5016] font-medium text-base mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-[#dddddd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5016] focus:border-transparent placeholder-[#999999]"
      />
    </div>
  );
}
