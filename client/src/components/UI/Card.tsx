import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'accent' | 'cyan' | 'success' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = 'none',
  padding = 'md',
  onClick,
  hoverable = false,
}) => {
  const glowClasses = {
    accent: 'glow-accent border-accent/20',
    cyan: 'glow-cyan border-accent2/20',
    success: 'glow-success border-success/20',
    none: 'border-white/5',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };

  return (
    <div
      className={clsx(
        'bg-bg-card border rounded-xl',
        glowClasses[glow],
        paddingClasses[padding],
        hoverable && 'cursor-pointer hover:border-accent/30 transition-all duration-200 hover:scale-[1.01]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
