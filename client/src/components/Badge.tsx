import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'indigo';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'green',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-rose-50 text-rose-800 border-rose-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    gray: 'bg-stone-100 text-stone-700 border-stone-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

