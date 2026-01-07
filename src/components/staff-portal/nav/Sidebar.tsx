import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
  Menu,
  X
} from 'lucide-react';
import MenuItem, { MenuSection, MenuDivider } from './MenuItem';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useUI } from '@/hooks/staff-portal/useStaffPortal';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number | null;
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { sidebarOpen, toggleSidebar } = useUI();

  // Helper function to get department from role
  const getDepartment = (role?: string): string => {
    if (!role) return '';
    const housekeepingRoles = ['housekeeping', 'housekeeper', 'room_attendant', 'laundry_attendant'];
    const maintenanceRoles = ['maintenance', 'technician', 'electrician', 'plumber', 'hvac_technician'];
    const runnerRoles = ['runner', 'bellhop', 'valet'];

    if (housekeepingRoles.includes(role)) return 'housekeeping';
    if (maintenanceRoles.includes(role)) return 'maintenance';
    if (runnerRoles.includes(role)) return 'runner';
    return '';
  };

  const navigationItems = useMemo(() => {
    if (!user) return { main: [], secondary: [] };

    const department = getDepartment(user.role);

    const roleNavigation: Record<string, { main: NavItem[]; secondary: NavItem[] }> = {
      housekeeping: {
        main: [
          { to: '/staff/housekeeping/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/staff/housekeeping/tasks', icon: ClipboardList, label: 'My Tasks' },
          { to: '/staff/housekeeping/rooms', icon: BedDouble, label: 'My Rooms' }
        ],
        secondary: [
          { to: '/staff/housekeeping/notifications', icon: Bell, label: 'Notifications', badge: unreadCount || null },
          { to: '/staff/housekeeping/profile', icon: User, label: 'My Profile' }
        ]
      },
      maintenance: {
        main: [
          { to: '/staff/maintenance/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/staff/maintenance/work-orders', icon: Wrench, label: 'Work Orders' },
          { to: '/staff/maintenance/tasks', icon: ClipboardList, label: 'Maintenance Tasks' },
          { to: '/staff/maintenance/equipment', icon: AlertTriangle, label: 'Equipment Issues' }
        ],
        secondary: [
          { to: '/staff/maintenance/notifications', icon: Bell, label: 'Notifications', badge: unreadCount || null },
          { to: '/staff/maintenance/profile', icon: User, label: 'My Profile' }
        ]
      },
      runner: {
        main: [
          { to: '/staff/runner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/staff/runner/pickups', icon: Package, label: 'Pickup Requests' },
          { to: '/staff/runner/deliveries', icon: Truck, label: 'Deliveries' }
        ],
        secondary: [
          { to: '/staff/runner/notifications', icon: Bell, label: 'Notifications', badge: unreadCount || null },
          { to: '/staff/runner/profile', icon: User, label: 'My Profile' }
        ]
      }
    };

    return roleNavigation[department] || { main: [], secondary: [] };
  }, [user, unreadCount]);

  const getRoleTitle = (role?: string) => {
    if (!role) return 'Staff Portal';
    const department = getDepartment(role);
    const titles: Record<string, string> = {
      housekeeping: 'Housekeeping Portal',
      maintenance: 'Maintenance Portal',
      runner: 'Runner Portal'
    };
    return titles[department] || 'Staff Portal';
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-neutral-300 z-50
          transition-transform duration-300 ease-in-out
          w-[260px] flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h1 className="font-bold text-sm text-neutral-900">Glimmora</h1>
              <p className="text-xs text-neutral-500">{getRoleTitle(user.role)}</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <MenuSection title="Main Menu">
            {navigationItems.main.map((item) => (
              <MenuItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
              />
            ))}
          </MenuSection>

          <MenuDivider />

          <MenuSection title="Account">
            {navigationItems.secondary.map((item) => (
              <MenuItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
              />
            ))}
          </MenuSection>
        </div>

        {/* Profile Section */}
        <div className="p-3 border-t border-neutral-300">
          <ProfileMenu />
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow-md border border-neutral-300 lg:hidden"
      >
        <Menu className="w-5 h-5 text-neutral-900" />
      </button>
    </>
  );
}


