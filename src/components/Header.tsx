import {
  Bell,
  Sparkles,
  LogOut,
  UserCircle,
  Sun,
  Moon,
  ChevronRight,
  Home
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { NotificationsDrawer } from './notifications/NotificationsDrawer';
import { useAuth } from '@/hooks/useAuth';
import { notificationsService } from '@/api/services/notifications.service';

/**
 * Glimmora Design System v4.0 - Header
 * Top navigation bar with breadcrumbs and actions
 * "Warm Enterprise" aesthetic - clean borders, no shadows
 */

const Header = ({ onAIPanelToggle, onSidebarToggle, isSidebarCollapsed }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
  };

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await notificationsService.getUnreadCount();
      setUnreadCount(result.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Handle unread count updates from drawer
  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate breadcrumb items from current path
  const getBreadcrumbItems = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    const items = [];

    // Section headings (these are parent categories in sidebar)
    // When these are the last segment, "Dashboard" is added as current page
    const sectionMap = {
      'channel-manager': 'Channels',
      'revenue': 'Revenue',
      'cms': 'CMS',
      'cbs': 'Central Booking',
      'ai': 'AI Tools',
    };

    // Pages that should show a parent section (for direct routes under /admin)
    // { label, path } - path is clickable if provided
    const parentSectionMap = {
      'bookings': { label: 'Operations', path: null },
      'guests': { label: 'Operations', path: null },
      'rooms': { label: 'Operations', path: null },
      'staff': { label: 'Operations', path: null },
      'housekeeping': { label: 'Operations', path: null },
      'maintenance': { label: 'Operations', path: null },
      'analytics': { label: 'Reports', path: '/admin/reports' },
    };

    // Label mapping for individual pages/sub-menus
    const labelMap = {
      // CMS sub-pages
      'bookings': 'Bookings',
      'availability': 'Availability',
      'rate-plans': 'Rate Plans',
      'promotions': 'Promotions',

      // Channel Manager sub-pages
      'ota': 'OTA Connections',
      'mapping': 'Room Mapping',
      'rate-sync': 'Rate Sync',
      'restrictions': 'Restrictions',
      'logs': 'Sync Logs',

      // Revenue sub-pages
      'calendar': 'Rate Calendar',
      'pickup': 'Pickup Analysis',
      'forecast': 'Demand Forecast',
      'competitors': 'Competitors',
      'segments': 'Segmentation',
      'pricing': 'Pricing Rules',
      'ai': 'Revenue AI',

      // AI Tools sub-pages
      'reputation': 'Reputation AI',
      'crm': 'CRM AI',

      // Operations (direct pages under /admin)
      'rooms': 'Rooms',
      'guests': 'Guests',
      'staff': 'Staff',
      'housekeeping': 'Housekeeping',
      'maintenance': 'Maintenance',

      // Other standalone pages
      'dashboard': 'Dashboard',
      'reports': 'Reports',
      'settings': 'Settings',
      'analytics': 'Advanced Analytics',
    };

    const formatLabel = (segment) => {
      return labelMap[segment] || segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Skip 'admin' as it's represented by Home
    const startIndex = segments[0] === 'admin' ? 1 : 0;

    for (let i = startIndex; i < segments.length; i++) {
      const segment = segments[i];
      // Skip numeric segments (IDs)
      if (!isNaN(segment)) continue;

      // Check if this segment is a section (parent category)
      if (sectionMap[segment]) {
        // Add the section heading (NOT clickable - just a label)
        items.push({
          label: sectionMap[segment],
          path: null
        });

        // If this is the last segment, add "Dashboard" as the current page
        if (i === segments.length - 1) {
          items.push({
            label: 'Dashboard',
            path: null
          });
        }
      } else {
        // Check if this page needs a parent section added first
        // Only apply for direct routes under /admin (i.e., first segment after admin)
        if (parentSectionMap[segment] && i === startIndex) {
          items.push({
            label: parentSectionMap[segment].label,
            path: parentSectionMap[segment].path // Can be null or a clickable path
          });
        }

        items.push({
          label: formatLabel(segment),
          path: '/' + segments.slice(0, i + 1).join('/')
        });
      }
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Action button component for consistency
  const ActionButton = ({ icon: Icon, label, onClick, active, badge, className }) => (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
        isDark
          ? 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80'
          : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/80',
        active && (isDark
          ? 'text-terra-400 bg-terra-500/10'
          : 'text-terra-600 bg-terra-50'),
        className
      )}
    >
      <Icon className="w-5 h-5" strokeWidth={1.75} />
      {badge && (
        <span className={cn(
          'absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full',
          isDark
            ? 'bg-rose-500 text-white'
            : 'bg-rose-500 text-white'
        )}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <header className={cn(
      'relative z-40 transition-all duration-300',
      isDark
        ? 'bg-neutral-950 border-b border-neutral-800'
        : 'bg-white border-b border-neutral-100'
    )}>
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section: Breadcrumb Navigation */}
          <nav className="flex items-center gap-2" aria-label="Breadcrumb">
            {/* Check if on main dashboard - only show heading, no Home icon */}
            {(location.pathname === '/admin' || location.pathname === '/admin/dashboard') ? (
              <h1 className={cn(
                'text-lg font-semibold tracking-tight',
                isDark ? 'text-neutral-100' : 'text-neutral-900'
              )}>
                Dashboard
              </h1>
            ) : (
              <>
                {/* Home Icon */}
                <Link
                  to="/admin"
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                    isDark
                      ? 'text-neutral-500 hover:text-neutral-100 hover:bg-neutral-800'
                      : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <Home className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </Link>

                {breadcrumbItems.length > 0 && (
                  <ChevronRight className={cn(
                    'w-4 h-4',
                    isDark ? 'text-neutral-600' : 'text-neutral-300'
                  )} />
                )}

                {breadcrumbItems.map((item, index) => {
                  const isLastItem = index === breadcrumbItems.length - 1;
                  const isClickable = !isLastItem && item.path;

                  return (
                    <div key={index} className="flex items-center gap-2">
                      {index > 0 && (
                        <ChevronRight className={cn(
                          'w-4 h-4',
                          isDark ? 'text-neutral-600' : 'text-neutral-300'
                        )} />
                      )}
                      {isClickable ? (
                        <Link
                          to={item.path}
                          className={cn(
                            'text-sm font-medium px-2 py-1 rounded-lg transition-all duration-200',
                            isDark
                              ? 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                          )}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className={cn(
                          'px-1',
                          isLastItem
                            ? (isDark ? 'text-base font-semibold text-neutral-100' : 'text-base font-semibold text-neutral-900')
                            : (isDark ? 'text-sm font-medium text-neutral-500' : 'text-sm font-medium text-neutral-400')
                        )}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </nav>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-1">
            {/* Action Buttons Group */}
            <div className={cn(
              'flex items-center gap-1 p-1 rounded-xl',
              isDark ? 'bg-neutral-900/50' : 'bg-neutral-50/80'
            )}>
              {/* Theme Toggle */}
              <ActionButton
                icon={isDark ? Sun : Moon}
                label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                onClick={toggleTheme}
              />

              {/* AI Assistant */}
              <ActionButton
                icon={Sparkles}
                label="AI Assistant"
                onClick={onAIPanelToggle}
                className={isDark
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/15'
                  : 'text-terra-500 hover:text-terra-600 hover:bg-terra-50'}
              />

              {/* Notifications */}
              <ActionButton
                icon={Bell}
                label="Notifications"
                onClick={() => setIsNotificationsOpen(true)}
                badge={unreadCount > 0 ? String(unreadCount) : undefined}
              />
            </div>

            {/* Divider */}
            <div className={cn(
              'w-px h-8 mx-2',
              isDark ? 'bg-neutral-800' : 'bg-neutral-200'
            )} />

            {/* Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={cn(
                  'flex items-center gap-3 pl-1 pr-3 py-1 rounded-xl transition-all duration-200',
                  isDark
                    ? 'hover:bg-neutral-800/80'
                    : 'hover:bg-neutral-100/80',
                  isProfileMenuOpen && (isDark
                    ? 'bg-neutral-800'
                    : 'bg-neutral-100')
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl overflow-hidden ring-2 ring-offset-2 transition-all',
                  isDark
                    ? 'ring-neutral-700 ring-offset-neutral-950'
                    : 'ring-neutral-200 ring-offset-white',
                  isProfileMenuOpen && (isDark
                    ? 'ring-terra-500/50'
                    : 'ring-terra-300')
                )}>
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isDark ? 'text-neutral-100' : 'text-neutral-900'
                  )}>
                    Sarah
                  </p>
                  <p className={cn(
                    'text-xs leading-tight',
                    isDark ? 'text-neutral-500' : 'text-neutral-500'
                  )}>
                    Admin
                  </p>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className={cn(
                  'absolute right-0 top-full mt-3 w-72 rounded-2xl border overflow-hidden shadow-xl shadow-neutral-900/10 animate-scaleIn origin-top-right',
                  isDark
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-white border-neutral-200'
                )}>
                  {/* User Info Header */}
                  <div className={cn(
                    'px-5 py-5 border-b',
                    isDark ? 'border-neutral-800' : 'border-neutral-100'
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-offset-2',
                        isDark
                          ? 'ring-neutral-700 ring-offset-neutral-900'
                          : 'ring-neutral-200 ring-offset-white'
                      )}>
                        <img
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-base font-semibold truncate',
                          isDark ? 'text-neutral-100' : 'text-neutral-900'
                        )}>
                          Sarah Johnson
                        </p>
                        <p className={cn(
                          'text-sm truncate',
                          isDark ? 'text-neutral-500' : 'text-neutral-500'
                        )}>
                          sarah@glimmora.com
                        </p>
                        <span className={cn(
                          'inline-flex items-center mt-2 px-2.5 py-1 text-xs font-medium rounded-lg',
                          isDark
                            ? 'bg-terra-500/15 text-terra-400'
                            : 'bg-terra-50 text-terra-600'
                        )}>
                          Administrator
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <Link
                      to="/admin/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                        isDark
                          ? 'text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                      )}
                    >
                      <UserCircle className="w-5 h-5" strokeWidth={1.75} />
                      <span className="text-sm font-medium">View Profile</span>
                    </Link>
                  </div>

                  {/* Logout Section */}
                  <div className={cn(
                    'border-t p-2',
                    isDark ? 'border-neutral-800' : 'border-neutral-100'
                  )}>
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                        isDark
                          ? 'text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400'
                          : 'text-neutral-500 hover:bg-rose-50 hover:text-rose-600'
                      )}
                    >
                      <LogOut className="w-5 h-5" strokeWidth={1.75} />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </header>
  );
};

export default Header;
