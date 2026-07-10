import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning'
  | 'outlined-primary'
  | 'outlined-secondary'
  | 'outlined-success'
  | 'outlined-danger'
  | 'outlined-warning'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary/90 text-primary-foreground border border-primary shadow-sm',
  secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border shadow-sm',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-sm',
  danger: 'bg-destructive hover:bg-destructive/90 text-white border border-destructive shadow-sm',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-500 shadow-sm',
  'outlined-primary': 'bg-transparent hover:bg-primary/10 text-primary border border-primary/40 hover:border-primary',
  'outlined-secondary': 'bg-transparent hover:bg-muted text-foreground border border-border hover:border-foreground/20',
  'outlined-success': 'bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40',
  'outlined-danger': 'bg-transparent hover:bg-destructive/10 text-destructive border border-destructive/40',
  'outlined-warning': 'bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-500/40',
  ghost: 'bg-transparent hover:bg-muted text-foreground border border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2.5 text-sm',
  lg: 'min-h-11 px-6 py-3 text-base',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'outlined-primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';
    
    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      className
    );

    const iconElement = icon && (
      <span className={cn(iconSizeClasses[size], 'flex-shrink-0')}>
        {icon}
      </span>
    );

    const loadingSpinner = (
      <svg
        className={cn(iconSizeClasses[size], 'animate-spin flex-shrink-0')}
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && loadingSpinner}
        {!loading && icon && iconPosition === 'left' && iconElement}
        {children}
        {!loading && icon && iconPosition === 'right' && iconElement}
      </button>
    );
  }
);

Button.displayName = 'Button';
