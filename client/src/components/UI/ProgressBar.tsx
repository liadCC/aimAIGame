import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: 'accent' | 'cyan' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'accent',
  size = 'md',
  showLabel = false,
  label,
  animated = false,
  className,
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    accent: 'bg-accent',
    cyan: 'bg-accent2',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const glowColors = {
    accent: 'rgba(108, 99, 255, 0.4)',
    cyan: 'rgba(0, 212, 255, 0.4)',
    success: 'rgba(0, 255, 136, 0.4)',
    warning: 'rgba(255, 184, 0, 0.4)',
    danger: 'rgba(255, 68, 68, 0.4)',
  };

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-text-muted">{label}</span>
          {showLabel && <span className="text-xs text-text-primary font-semibold">{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={clsx('w-full bg-bg-surface rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            colorClasses[color],
            animated && 'animate-pulse'
          )}
          style={{
            width: `${percent}%`,
            boxShadow: percent > 0 ? `0 0 8px ${glowColors[color]}` : 'none',
          }}
        />
      </div>
    </div>
  );
};
