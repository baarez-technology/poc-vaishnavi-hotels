import { forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'green' | 'teal' | 'gold' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children?: ReactNode;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'default',
    icon: Icon,
    iconPosition = 'left',
    isLoading = false,
    disabled = false,
    className = '',
    type = 'button',
    ...props
  }, ref) => {
    const variantStyles = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-600/90 disabled:bg-primary-500/50',
      secondary: 'bg-beige text-neutral-900 hover:bg-beige-300 active:bg-beige disabled:bg-beige/50',
      outline: 'bg-transparent border border-neutral-300 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-50',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-50',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-700/80 disabled:bg-red-600/50',
      success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-700/80 disabled:bg-green-600/50',
      warning: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-700/80 disabled:bg-amber-600/50',
      green: 'bg-deepGreen text-white hover:bg-deepGreen-600 active:bg-deepGreen-600/90 disabled:bg-deepGreen/50',
      teal: 'bg-teal text-white hover:bg-teal-600 active:bg-teal-600/90 disabled:bg-teal/50',
      gold: 'bg-gold text-white hover:bg-gold-600 active:bg-gold-600/90 disabled:bg-gold/50',
      link: 'bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline disabled:opacity-50'
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      default: 'text-sm px-4 py-2.5 rounded-[10px] gap-2',
      lg: 'text-base px-6 py-3 rounded-[12px] gap-2.5',
      icon: 'p-2.5 rounded-[10px]'
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-1
          disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {size !== 'icon' && <span>Loading...</span>}
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'default',
  className = '',
  label,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeStyles = {
    sm: 'p-1.5',
    default: 'p-2',
    lg: 'p-2.5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-beige text-neutral-900 hover:bg-beige-300',
    outline: 'bg-transparent border border-neutral-300 text-neutral-900 hover:bg-neutral-100',
    ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
    danger: 'bg-transparent text-red-600 hover:bg-red-50'
  };

  return (
    <button
      type="button"
      className={`
        rounded-[10px] transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      aria-label={label}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}

export function ButtonGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`inline-flex rounded-[10px] overflow-hidden border border-neutral-300 ${className}`}>
      {children}
    </div>
  );
}

export function ButtonGroupItem({
  children,
  isActive = false,
  className = '',
  ...props
}: {
  children: ReactNode;
  isActive?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`
        px-4 py-2 text-sm font-medium transition-colors
        border-r border-neutral-300 last:border-r-0
        ${isActive
          ? 'bg-primary-500 text-white'
          : 'bg-white text-neutral-900 hover:bg-neutral-100'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;




