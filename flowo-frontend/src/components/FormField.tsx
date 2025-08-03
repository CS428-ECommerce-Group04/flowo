import React from 'react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'textarea';
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false
}) => {
  const inputClasses = "w-full px-4 py-3 border border-[#dddddd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5016] focus:border-transparent";

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block text-[#2d5016] font-medium text-base mb-2">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={6}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />
      )}
    </div>
  );
};
