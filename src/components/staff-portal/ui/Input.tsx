import { forwardRef, ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  wrapperClassName?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    hint,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    wrapperClassName = '',
    type = 'text',
    ...props
  }, ref) => {
    const hasIcon = !!Icon;

    return (
      <div className={wrapperClassName}>
        {label && (
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {hasIcon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              w-full px-3 py-2.5 rounded-[10px] border transition-all duration-200
              text-neutral-900 placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
              disabled:bg-neutral-100 disabled:cursor-not-allowed
              ${error ? 'border-red-600 focus:ring-red-600/20 focus:border-red-600' : 'border-neutral-300'}
              ${hasIcon && iconPosition === 'left' ? 'pl-10' : ''}
              ${hasIcon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {hasIcon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500 mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  wrapperClassName?: string;
  rows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({
    label,
    error,
    hint,
    className = '',
    wrapperClassName = '',
    rows = 4,
    ...props
  }, ref) => {
    return (
      <div className={wrapperClassName}>
        {label && (
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`
            w-full px-3 py-2.5 rounded-[10px] border transition-all duration-200
            text-neutral-900 placeholder:text-neutral-500 resize-none
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${error ? 'border-red-600 focus:ring-red-600/20 focus:border-red-600' : 'border-neutral-300'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500 mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectOption {
  value: string;
  label: string;
}

export const Select = forwardRef<HTMLSelectElement, {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({
    label,
    error,
    hint,
    options = [],
    placeholder = 'Select an option',
    className = '',
    wrapperClassName = '',
    ...props
  }, ref) => {
    return (
      <div className={wrapperClassName}>
        {label && (
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-[10px] border transition-all duration-200
            text-neutral-900 bg-white
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${error ? 'border-red-600 focus:ring-red-600/20 focus:border-red-600' : 'border-neutral-300'}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500 mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export const Checkbox = forwardRef<HTMLInputElement, {
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  wrapperClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>>(
  ({
    label,
    description,
    error,
    className = '',
    wrapperClassName = '',
    ...props
  }, ref) => {
    return (
      <div className={`flex items-start gap-3 ${wrapperClassName}`}>
        <input
          ref={ref}
          type="checkbox"
          className={`
            w-4 h-4 mt-0.5 rounded border-neutral-300 text-primary-600
            focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        <div className="flex-1">
          {label && (
            <label className="text-sm font-medium text-neutral-900 cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export const SearchInput = forwardRef<HTMLInputElement, {
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  value?: string;
} & React.InputHTMLAttributes<HTMLInputElement>>(
  ({
    placeholder = 'Search...',
    className = '',
    onClear,
    value,
    ...props
  }, ref) => {
    return (
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          className={`
            w-full pl-10 pr-10 py-2.5 rounded-[10px] border border-neutral-300
            text-neutral-900 placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            ${className}
          `}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default Input;




