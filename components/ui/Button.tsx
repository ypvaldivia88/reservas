import React from 'react';

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
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-2 border-gray-600 hover:border-gray-700 shadow-md hover:shadow-lg',
  success: 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700 shadow-md hover:shadow-lg',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700 shadow-md hover:shadow-lg',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-2 border-yellow-600 hover:border-yellow-700 shadow-md hover:shadow-lg',
  'outlined-primary': 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-2 border-blue-500 hover:border-blue-600 dark:border-blue-400 dark:hover:border-blue-300',
  'outlined-secondary': 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-400 hover:border-gray-500 dark:border-gray-500 dark:hover:border-gray-400',
  'outlined-success': 'bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-500 hover:border-green-600 dark:border-green-400 dark:hover:border-green-300',
  'outlined-danger': 'bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-500 hover:border-red-600 dark:border-red-400 dark:hover:border-red-300',
  'outlined-warning': 'bg-transparent hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-2 border-yellow-500 hover:border-yellow-600 dark:border-yellow-400 dark:hover:border-yellow-300',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
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
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation';
    
    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${fullWidth ? 'w-full' : ''}
      ${!disabled && !loading ? 'hover:-translate-y-0.5 active:translate-y-0' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const iconElement = icon && (
      <span className={`${iconSizeClasses[size]} flex-shrink-0`}>
        {icon}
      </span>
    );

    const loadingSpinner = (
      <svg
        className={`${iconSizeClasses[size]} animate-spin flex-shrink-0`}
        fill="none"
        viewBox="0 0 24 24"
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
