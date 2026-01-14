/**
 * NotificationsDrawer Component
 * Notifications panel - Glimmora Design System v5.0
 * Side drawer pattern matching other drawers in the system
 * Persists notification state to localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Users,
  DoorOpen,
  Wrench,
  AlertCircle,
  MessageSquare,
  CreditCard,
  Star,
  Clock,
  Trash2,
  Settings
} from 'lucide-react';
import { Drawer } from '@/components/ui2/Drawer';
import { cn } from '@/lib/utils';

// Storage key for notifications persistence
const NOTIFICATIONS_STORAGE_KEY = 'glimmora_notifications_data';

interface Notification {
  id: string;
  type: 'booking' | 'guest' | 'housekeeping' | 'maintenance' | 'payment' | 'review' | 'system' | 'message';
  title: string;
  description: string;
  time: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default notifications (shown on first load before any user interaction)
const defaultNotifications: Notification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'New Booking Received',
    description: 'John Smith booked Deluxe Suite for Dec 15-18',
    time: '5 min ago',
    read: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'guest',
    title: 'Guest Check-in Pending',
    description: 'Sarah Johnson arriving today at 2:00 PM',
    time: '15 min ago',
    read: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'maintenance',
    title: 'Work Order Completed',
    description: 'AC repair in Room 304 has been completed',
    time: '1 hour ago',
    read: false
  }
];

// Helper functions for localStorage persistence
const loadNotificationsFromStorage = (): Notification[] | null => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load notifications from storage:', error);
  }
  return null;
};

const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications to storage:', error);
  }
};

const typeConfig = {
  booking: { icon: Calendar, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  guest: { icon: Users, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  housekeeping: { icon: DoorOpen, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  maintenance: { icon: Wrench, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  payment: { icon: CreditCard, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  review: { icon: Star, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  system: { icon: Settings, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  message: { icon: MessageSquare, color: 'text-neutral-600', bg: 'bg-neutral-100', border: 'border-neutral-200' }
};

export function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  // Initialize state from localStorage or use defaults
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = loadNotificationsFromStorage();
    return stored !== null ? stored : defaultNotifications;
  });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    saveNotificationsToStorage(notifications);
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Custom header
  const renderHeader = () => (
    <div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
          Notifications
        </h2>
        <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
            filter === 'all'
              ? 'bg-terra-500 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5',
            filter === 'unread'
              ? 'bg-terra-500 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          Unread
          {unreadCount > 0 && (
            <span className={cn(
              'min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold',
              filter === 'unread' ? 'bg-white text-terra-600' : 'bg-terra-500 text-white'
            )}>
              {unreadCount}
            </span>
          )}
        </button>
        <div className="flex-1" />
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[11px] font-semibold text-terra-600 hover:text-terra-700 transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>
    </div>
  );

  // Footer
  const renderFooter = () => (
    notifications.length > 0 ? (
      <div className="flex items-center">
        <button
          onClick={clearAll}
          className="text-[11px] font-semibold text-neutral-500 hover:text-rose-600 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear all
        </button>
      </div>
    ) : null
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      header={renderHeader()}
      footer={renderFooter()}
      maxWidth="max-w-xl"
      noPadding
    >
      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-neutral-400" />
          </div>
          <p className="text-[13px] font-semibold text-neutral-900 mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </p>
          <p className="text-[11px] text-neutral-500 text-center">
            {filter === 'unread'
              ? "You're all caught up!"
              : "You'll see notifications here when there's activity"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {filteredNotifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={cn(
                  'px-6 py-4 hover:bg-neutral-50/80 transition-colors cursor-pointer group',
                  !notification.read && 'bg-terra-50/40'
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 border',
                    config.bg,
                    config.border
                  )}>
                    <Icon className={cn('w-[18px] h-[18px]', config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'text-[13px] truncate',
                            notification.read ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-terra-500 flex-shrink-0" />
                          )}
                          {notification.priority === 'high' && (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                          {notification.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-sage-600 hover:bg-sage-50 transition-all"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 font-medium">{notification.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}

export default NotificationsDrawer;
