import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Trash2,
  Check,
  Filter,
  X,
  Loader2
} from 'lucide-react';
import PageHeader from '../../../layouts/staff-portal/PageHeader';
import Card from '../../../components/staff-portal/ui/Card';
import Button, { ButtonGroup, ButtonGroupItem } from '../../../components/staff-portal/ui/Button';
import { SearchInput } from '../../../components/staff-portal/ui/Input';
import { ConfirmModal } from '../../../components/staff-portal/ui/Modal';
import { useNotifications, useUnreadNotificationCount, useNotificationActions } from '@/hooks/staff-portal/useStaffApi';

const Notifications = () => {
  const navigate = useNavigate();

  // All useState hooks MUST be at the top, before any conditional returns
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);

  // API hooks for real data
  const { data: notifications, loading, refetch: refetchNotifications } = useNotifications();
  const { count: unreadCount, refetch: refetchUnreadCount } = useUnreadNotificationCount();
  const { markAsRead, markAllAsRead, deleteNotification: apiDeleteNotification, deleteAllNotifications } = useNotificationActions();

  const notificationsList = notifications || [];

  const filteredNotifications = useMemo(() => {
    return notificationsList.filter(notif => {
      const matchesSearch =
        notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesReadFilter =
        filter === 'all' ||
        (filter === 'unread' && !notif.is_read) ||
        (filter === 'read' && notif.is_read);

      const matchesTypeFilter =
        typeFilter === 'all' || notif.notification_type === typeFilter;

      return matchesSearch && matchesReadFilter && matchesTypeFilter;
    });
  }, [notificationsList, filter, typeFilter, searchQuery]);

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(notificationsList.map(n => n.notification_type))];
    return types;
  }, [notificationsList]);

  const refetchAll = async () => {
    await Promise.all([refetchNotifications(), refetchUnreadCount()]);
  };

  // Wrapper functions for actions
  const markNotificationRead = async (id: number) => {
    await markAsRead(id);
    refetchAll();
  };

  const markAllNotificationsRead = async () => {
    await markAllAsRead();
    refetchAll();
  };

  const deleteNotification = async (id: number) => {
    await apiDeleteNotification(id);
    refetchAll();
  };

  const clearNotifications = async () => {
    await deleteAllNotifications();
    refetchAll();
  };

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text-light">Loading notifications...</span>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string, priority?: string) => {
    if (priority === 'urgent') {
      return <AlertTriangle className="w-5 h-5 text-danger" />;
    }

    switch (type) {
      case 'task_assigned':
      case 'task':
        return <CheckCircle className="w-5 h-5 text-teal" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'task_reminder':
      case 'reminder':
        return <Clock className="w-5 h-5 text-gold" />;
      case 'info':
        return <Info className="w-5 h-5 text-info" />;
      case 'system':
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task_assigned: 'Task Assigned',
      task_reminder: 'Reminder',
      task_update: 'Task Update',
      task: 'Task',
      alert: 'Alert',
      reminder: 'Reminder',
      info: 'Info',
      system: 'System'
    };
    return labels[type] || type;
  };

  const handleNotificationClick = (notification: any) => {
    markNotificationRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Check}
                onClick={markAllNotificationsRead}
              >
                Mark All Read
              </Button>
            )}
            {notificationsList.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Trash2}
                onClick={() => setShowClearModal(true)}
              >
                Clear All
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <ButtonGroup>
          <ButtonGroupItem
            isActive={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All
          </ButtonGroupItem>
          <ButtonGroupItem
            isActive={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </ButtonGroupItem>
          <ButtonGroupItem
            isActive={filter === 'read'}
            onClick={() => setFilter('read')}
          >
            Read
          </ButtonGroupItem>
        </ButtonGroup>
      </div>

      {/* Type Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 text-sm rounded-full transition-all ${
            typeFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-neutral-dark text-text-light hover:bg-beige/30'
          }`}
        >
          All Types
        </button>
        {uniqueTypes.map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
            className={`px-3 py-1.5 text-sm rounded-full transition-all flex items-center gap-1.5 ${
              typeFilter === type
                ? 'bg-primary text-white'
                : 'bg-neutral-dark text-text-light hover:bg-beige/30'
            }`}
          >
            {getNotificationIcon(type, 'normal')}
            {getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-neutral-dark flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">No notifications</h3>
          <p className="text-text-light">
            {filter === 'unread' ? 'You have no unread notifications' :
             filter === 'read' ? 'You have no read notifications' :
             'You have no notifications yet'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`
                relative cursor-pointer transition-all hover:shadow-md
                ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}
              `}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Unread indicator */}
              {!notification.is_read && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
              )}

              <div className="flex gap-4 pl-4">
                {/* Icon */}
                <div className={`
                  w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0
                  ${notification.notification_type?.includes('task') ? 'bg-teal/10' :
                    notification.notification_type === 'alert' ? 'bg-warning-light' :
                    notification.notification_type?.includes('reminder') ? 'bg-gold/10' :
                    notification.notification_type === 'info' ? 'bg-info-light' :
                    'bg-primary/10'}
                `}>
                  {getNotificationIcon(notification.notification_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`font-semibold ${notification.is_read ? 'text-text' : 'text-text'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-text-light mt-1">{notification.message}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-text-muted">
                      {formatTimestamp(notification.created_at)}
                    </span>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${notification.notification_type?.includes('task') ? 'bg-teal/10 text-teal' :
                        notification.notification_type === 'alert' ? 'bg-warning-light text-warning' :
                        notification.notification_type?.includes('reminder') ? 'bg-gold/10 text-gold' :
                        notification.notification_type === 'info' ? 'bg-info-light text-info' :
                        'bg-primary/10 text-primary'}
                    `}>
                      {getTypeLabel(notification.notification_type)}
                    </span>
                    {notification.actionUrl && (
                      <span className="text-xs text-primary hover:underline">
                        View details →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {notifications.length > 0 && (
        <div className="mt-6 text-center text-sm text-text-muted">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </div>
      )}

      {/* Clear All Confirmation */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => {
          clearNotifications();
          setShowClearModal(false);
        }}
        title="Clear All Notifications"
        message="Are you sure you want to clear all notifications? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </div>
  );
};

export default Notifications;





