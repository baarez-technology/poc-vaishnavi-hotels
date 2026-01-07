import { Bell } from 'lucide-react';
import { useNotifications, useUI } from '@/hooks/staff-portal/useStaffPortal';

export default function NotificationBell({ className = '' }: { className?: string }) {
  const { unreadCount, urgentNotifications } = useNotifications();
  const { toggleNotificationDrawer } = useUI();

  const hasUrgent = urgentNotifications.length > 0;

  return (
    <button
      onClick={toggleNotificationDrawer}
      className={`
        relative p-2 rounded-[10px] transition-all duration-200
        hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900
        ${className}
      `}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className={`w-5 h-5 ${hasUrgent ? 'animate-pulse text-red-600' : ''}`} />

      {unreadCount > 0 && (
        <span
          className={`
            absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
            flex items-center justify-center
            text-xs font-bold text-white rounded-full px-1
            ${hasUrgent ? 'bg-red-600' : 'bg-primary-500'}
          `}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}





