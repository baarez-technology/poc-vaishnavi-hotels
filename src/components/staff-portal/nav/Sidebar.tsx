import { useMemo, useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BedDouble,
  Bell,
  User,
  Wrench,
  AlertTriangle,
  Package,
  Truck,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  X
} from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotificationCount } from '@/hooks/staff-portal/useStaffApi';
import { LucideIcon } from 'lucide-react';
import { useSettingsContext } from '@/contexts/SettingsContext';
import GlimmoraLogo from '../../../assets/G white logo.png';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number | null;
  end?: boolean;
}

interface NavCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  items: NavItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  renderBrandOnly?: boolean;
  renderNavigationOnly?: boolean;
}

const Sidebar = ({ isCollapsed, onToggle, renderBrandOnly, renderNavigationOnly }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { count: unreadCount } = useUnreadNotificationCount();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const settingsContext = useSettingsContext() as any;
  const generalSettings = settingsContext?.generalSettings;
  const hotelName = generalSettings?.hotelName || 'Glimmora';
  const customLogo = generalSettings?.branding?.logo;

  // Helper function to get department from role or URL path
  const getDepartment = (role?: string): string => {
    // First try to determine from role
    if (role) {
      const normalizedRole = role.toLowerCase();
      const housekeepingRoles = ['housekeeping', 'housekeeper', 'room_attendant', 'laundry_attendant'];
      const maintenanceRoles = ['maintenance', 'technician', 'electrician', 'plumber', 'hvac_technician'];
      const runnerRoles = ['runner', 'bellhop', 'valet'];

      if (housekeepingRoles.includes(normalizedRole)) return 'housekeeping';
      if (maintenanceRoles.includes(normalizedRole)) return 'maintenance';
      if (runnerRoles.includes(normalizedRole)) return 'runner';
    }

    // Fallback: determine from current URL path
    if (location.pathname.includes('/staff/housekeeping')) return 'housekeeping';
    if (location.pathname.includes('/staff/maintenance')) return 'maintenance';
    if (location.pathname.includes('/staff/runner')) return 'runner';

    // Default to housekeeping if nothing matches
    return 'housekeeping';
  };

  const navigationCategories = useMemo((): NavCategory[] => {
    const department = getDepartment(user?.role);

    const roleNavigation: Record<string, NavCategory[]> = {
      housekeeping: [
        {
          id: 'main',
          name: 'Main Menu',
          icon: LayoutDashboard,
          items: [
            { to: '/staff/housekeeping/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
            { to: '/staff/housekeeping/tasks', icon: ClipboardList, label: 'My Tasks' },
            { to: '/staff/housekeeping/rooms', icon: BedDouble, label: 'My Rooms' }
          ]
        },
        {
          id: 'account',
          name: 'Account',
          icon: User,
          items: [
            { to: '/staff/housekeeping/notifications', icon: Bell, label: 'Notifications', badge: unreadCount || null },
            { to: '/staff/housekeeping/profile', icon: User, label: 'My Profile' }
          ]
        }
      ],
      maintenance: [
        {
          id: 'main',
          name: 'Main Menu',
          icon: LayoutDashboard,
          items: [
            { to: '/staff/maintenance/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
            { to: '/staff/maintenance/work-orders', icon: Wrench, label: 'Work Orders' },
            { to: '/staff/maintenance/tasks', icon: ClipboardList, label: 'Maintenance Tasks' },
            { to: '/staff/maintenance/equipment', icon: AlertTriangle, label: 'Equipment Issues' }
          ]
        },
        {
          id: 'account',
          name: 'Account',
          icon: User,
          items: [
            { to: '/staff/maintenance/notifications', icon: Bell, label: 'Notifications', badge: unreadCount || null },
            { to: '/staff/maintenance/profile', icon: User, label: 'My Profile' }
          ]
        }
      ],
      runner: [
        {
          id: 'main',
          name: 'Main Menu',
          icon: LayoutDashboard,
          items: [
            { to: '/staff/runner/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
            { to: '/staff/runner/pickups', icon: Package, label: 'Pickup Requests' },
            { to: '/staff/runner/deliveries', icon: Truck, label: 'Deliveries' }
          ]
        },
        {
          id: 'account',
          name: 'Account',
          icon: User,
          items: [
            { to: '/staff/runner/notifications', icon: Bell, label: 'Notifications', badge: unreadCount || null },
            { to: '/staff/runner/profile', icon: User, label: 'My Profile' }
          ]
        }
      ]
    };

    return roleNavigation[department] || roleNavigation['housekeeping'];
  }, [user?.role, unreadCount, location.pathname]);

  // Auto-expand active category
  useEffect(() => {
    const activeCategory = navigationCategories.find((cat) =>
      cat.items.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
    );
    if (activeCategory) {
      setExpandedSections((prev) => ({ ...prev, [activeCategory.id]: true }));
    }
  }, [location.pathname, navigationCategories]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };


  const getRoleTitle = (role?: string) => {
    const department = getDepartment(role);
    const titles: Record<string, string> = {
      housekeeping: 'Housekeeping',
      maintenance: 'Maintenance',
      runner: 'Runner'
    };
    return titles[department] || 'Staff Portal';
  };

  // Brand Section Only
  if (renderBrandOnly) {
    return (
      <div className="h-full bg-white border-r border-neutral-100">
        <div className={`h-full flex items-center ${
          isCollapsed ? 'justify-center px-3' : 'justify-between px-5'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'}`}>
              {customLogo ? (
                <div className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden bg-white border border-neutral-200">
                  <img src={customLogo} alt={hotelName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl flex items-center justify-center p-1.5 bg-[var(--brand-primary)]">
                  <img src={GlimmoraLogo} alt="Glimmora" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div>
                <h1 className="text-sm font-semibold text-neutral-800">{hotelName}</h1>
                <p className="text-[10px] text-neutral-400">{getRoleTitle(user?.role)}</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Navigation Section Only
  if (renderNavigationOnly) {
    return (
      <div className="h-full flex flex-col bg-white border-r border-neutral-100">
        {/* Expand button */}
        {isCollapsed && (
          <div className="px-2 pt-4 pb-3 flex justify-center">
            <button
              onClick={onToggle}
              className="p-2.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto custom-scrollbar ${
          isCollapsed ? 'px-2' : 'px-3'
        } pb-4`}>
          <div className="space-y-6">
            {navigationCategories.map((category) => {
              const isExpanded = expandedSections[category.id] !== false;
              const hasActiveItem = category.items.some(
                (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
              );
              const isSingleItem = category.items.length === 1;
              const CategoryIcon = category.icon;

              return (
                <div key={category.id}>
                  {/* Category Header */}
                  {!isCollapsed && !isSingleItem && (
                    <button
                      onClick={() => toggleSection(category.id)}
                      className="w-full flex items-center justify-between px-3 py-2 mb-0.5 rounded-lg group hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon className={`w-4 h-4 ${
                          hasActiveItem ? 'text-[var(--brand-primary)]' : 'text-neutral-400'
                        }`} />
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          hasActiveItem ? 'text-neutral-700' : 'text-neutral-500'
                        }`}>
                          {category.name}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                        isExpanded ? '' : '-rotate-90'
                      }`} />
                    </button>
                  )}

                  {/* Collapsed mode separator */}
                  {isCollapsed && (
                    <div className="flex justify-center py-2">
                      <div className="w-6 h-px bg-neutral-200" />
                    </div>
                  )}

                  {/* Items */}
                  <div className={`transition-all duration-200 ${
                    (isExpanded || isCollapsed || isSingleItem) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                  }`}>
                    {/* Collapsed mode - icons only */}
                    {isCollapsed ? (
                      <ul className="space-y-0.5">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.to} className="relative group/item">
                              <NavLink
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                  `relative flex items-center justify-center p-3 mx-auto rounded-xl transition-all duration-150 ${
                                    isActive
                                      ? 'bg-[var(--brand-primary-45)] text-[var(--brand-primary)]'
                                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                  }`
                                }
                              >
                                {({ isActive }) => (
                                  <Icon className={`flex-shrink-0 w-[18px] h-[18px] ${
                                    isActive ? 'text-[var(--brand-primary)]' : 'text-neutral-400'
                                  }`} strokeWidth={1.75} />
                                )}
                              </NavLink>

                              {/* Tooltip */}
                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-neutral-800 text-white text-xs font-medium opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-150 whitespace-nowrap z-50">
                                {item.label}
                                {item.badge && (
                                  <span className="ml-2 bg-[var(--brand-primary)] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : !isSingleItem ? (
                      /* Multi-item categories - tree structure */
                      <div className="relative ml-[22px] pl-4 border-l border-neutral-200">
                        <ul className="space-y-0.5">
                          {category.items.map((item) => {
                            const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                            return (
                              <li key={item.to} className="relative group/item">
                                {/* Horizontal connector line */}
                                <div className={`absolute -left-4 top-1/2 w-3 h-px ${
                                  isItemActive ? 'bg-[var(--brand-primary)]' : 'bg-neutral-200'
                                }`} />

                                <NavLink
                                  to={item.to}
                                  end={item.end}
                                  className={({ isActive }) =>
                                    `relative flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all duration-150 ${
                                      isActive
                                        ? 'bg-[var(--brand-primary-45)] text-[var(--brand-primary)]'
                                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                    }`
                                  }
                                >
                                  {({ isActive }) => (
                                    <>
                                      <span className={`text-[13px] ${
                                        isActive ? 'font-medium' : 'font-normal'
                                      }`}>
                                        {item.label}
                                      </span>
                                      {item.badge && (
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                          isActive ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]' : 'bg-[var(--brand-primary)] text-white'
                                        }`}>
                                          {item.badge}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      /* Single item categories - with icon */
                      <ul className="space-y-0.5">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.to} className="relative group/item">
                              <NavLink
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                  `relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                                    isActive
                                      ? 'bg-[var(--brand-primary-45)] text-[var(--brand-primary)]'
                                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                  }`
                                }
                              >
                                {({ isActive }) => (
                                  <>
                                    <Icon className={`flex-shrink-0 w-[18px] h-[18px] ${
                                      isActive ? 'text-[var(--brand-primary)]' : 'text-neutral-400'
                                    }`} strokeWidth={1.75} />

                                    <span className={`text-[13px] ${
                                      isActive ? 'font-medium' : 'font-normal'
                                    }`}>
                                      {item.label}
                                    </span>
                                  </>
                                )}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer - Profile Menu */}
        <div className="p-3 border-t border-neutral-100 flex-shrink-0">
          <ProfileMenu collapsed={isCollapsed} />
        </div>
      </div>
    );
  }

  // Full Sidebar (for mobile overlay - when both renderBrandOnly and renderNavigationOnly are false)
  return (
    <aside className="h-full flex flex-col bg-white border-r border-neutral-100 w-[280px]">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex-shrink-0">
            {customLogo ? (
              <div className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden bg-white border border-neutral-200">
                <img src={customLogo} alt={hotelName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-full h-full rounded-xl flex items-center justify-center p-1.5 bg-[var(--brand-primary)]">
                <img src={GlimmoraLogo} alt="Glimmora" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-neutral-800">{hotelName}</h1>
            <p className="text-[10px] text-neutral-400">{getRoleTitle(user?.role)}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
        <div className="space-y-6">
          {navigationCategories.map((category) => {
            const isExpanded = expandedSections[category.id] !== false;
            const hasActiveItem = category.items.some(
              (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            );
            const isSingleItem = category.items.length === 1;
            const CategoryIcon = category.icon;

            return (
              <div key={category.id}>
                {/* Category Header */}
                {!isSingleItem && (
                  <button
                    onClick={() => toggleSection(category.id)}
                    className="w-full flex items-center justify-between px-3 py-2 mb-0.5 rounded-lg group hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={`w-4 h-4 ${
                        hasActiveItem ? 'text-[var(--brand-primary)]' : 'text-neutral-400'
                      }`} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        hasActiveItem ? 'text-neutral-700' : 'text-neutral-500'
                      }`}>
                        {category.name}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                      isExpanded ? '' : '-rotate-90'
                    }`} />
                  </button>
                )}

                {/* Items */}
                <div className={`transition-all duration-200 ${
                  (isExpanded || isSingleItem) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                }`}>
                  {!isSingleItem ? (
                    /* Multi-item categories - tree structure */
                    <div className="relative ml-[22px] pl-4 border-l border-neutral-200">
                      <ul className="space-y-0.5">
                        {category.items.map((item) => {
                          const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                          return (
                            <li key={item.to} className="relative group/item">
                              <div className={`absolute -left-4 top-1/2 w-3 h-px ${
                                isItemActive ? 'bg-[var(--brand-primary)]' : 'bg-neutral-200'
                              }`} />
                              <NavLink
                                to={item.to}
                                end={item.end}
                                onClick={onToggle}
                                className={({ isActive }) =>
                                  `relative flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all duration-150 ${
                                    isActive
                                      ? 'bg-[var(--brand-primary-45)] text-[var(--brand-primary)]'
                                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                  }`
                                }
                              >
                                {({ isActive }) => (
                                  <>
                                    <span className={`text-[13px] ${isActive ? 'font-medium' : 'font-normal'}`}>
                                      {item.label}
                                    </span>
                                    {item.badge && (
                                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                        isActive ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]' : 'bg-[var(--brand-primary)] text-white'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    /* Single item categories - with icon */
                    <ul className="space-y-0.5">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.to}>
                            <NavLink
                              to={item.to}
                              end={item.end}
                              onClick={onToggle}
                              className={({ isActive }) =>
                                `relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                                  isActive
                                    ? 'bg-[var(--brand-primary-45)] text-[var(--brand-primary)]'
                                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <Icon className={`flex-shrink-0 w-[18px] h-[18px] ${
                                    isActive ? 'text-[var(--brand-primary)]' : 'text-neutral-400'
                                  }`} strokeWidth={1.75} />
                                  <span className={`text-[13px] ${isActive ? 'font-medium' : 'font-normal'}`}>
                                    {item.label}
                                  </span>
                                </>
                              )}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer - Profile Menu */}
      <div className="p-3 border-t border-neutral-100 flex-shrink-0">
        <ProfileMenu collapsed={false} />
      </div>
    </aside>
  );
};

export default Sidebar;
