import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MenuItemProps {
  to?: string;
  icon?: LucideIcon;
  label: string;
  badge?: string | number | null;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export default function MenuItem({
  to,
  icon: Icon,
  label,
  badge,
  onClick,
  isActive: isActiveProp,
  className = ''
}: MenuItemProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-[12px]
          text-neutral-600 hover:bg-primary-500/5 hover:text-primary-600
          transition-all duration-200 text-left
          ${className}
        `}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <span className="font-medium flex-1">{label}</span>
        {badge && (
          <span className="bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>
    );
  }

  if (!to) return null;

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-[12px]
        transition-all duration-200
        ${(isActiveProp ?? isActive)
          ? 'bg-primary-500 text-white shadow-sm'
          : 'text-neutral-600 hover:bg-primary-500/5 hover:text-primary-600'
        }
        ${className}
      `}
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      <span className="font-medium flex-1">{label}</span>
      {badge && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isActiveProp ? 'bg-white/20 text-white' : 'bg-primary-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export function MenuSection({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3 className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );
}

export function MenuDivider() {
  return <div className="h-px bg-neutral-300 my-4 mx-4" />;
}




