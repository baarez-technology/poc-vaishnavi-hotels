import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  ClipboardList,
  AlertTriangle,
  Clock,
  Play,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Loader2,
  QrCode
} from 'lucide-react';
import { DashboardHeader } from '../../../layouts/staff-portal/PageHeader';
import { StatCard } from '../../../components/staff-portal/ui/Card';
import { StatusBadge, PriorityBadge } from '../../../components/staff-portal/ui/Badge';
import Button from '../../../components/staff-portal/ui/Button';
import { useStaffProfile, useHousekeepingRooms, useMyHousekeepingTasks, useNotifications, useHousekeepingActions } from '@/hooks/staff-portal/useStaffApi';
import { ScanDigitalKeyModal } from '@/components/housekeeping/modals/ScanDigitalKeyModal';

/**
 * Glimmora Design System v5.0 - Housekeeping Dashboard
 * Matching admin dashboard styling patterns with improved responsiveness
 */

// Section Card matching admin LuxurySectionCard
function SectionCard({
  title,
  subtitle,
  action,
  actionLabel,
  children,
  className = '',
  noPadding = false
}: {
  title?: string;
  subtitle?: string;
  action?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={`rounded-[10px] bg-white overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-neutral-100 flex-shrink-0">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-neutral-800">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && (
            <button
              onClick={action}
              className="flex items-center gap-1 text-[11px] font-semibold text-terra-600 px-3 py-1.5 rounded-lg hover:bg-terra-50 transition-colors flex-shrink-0"
            >
              <span className="hidden xs:inline">{actionLabel}</span>
              <span className="xs:hidden">View</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'px-4 sm:px-6 pb-4 sm:pb-6'}>{children}</div>
    </div>
  );
}

const HousekeepingDashboard = () => {
  const navigate = useNavigate();
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const { data: profile } = useStaffProfile();
  const { data: dirtyRooms, loading: dirtyLoading, refetch: refetchDirty } = useHousekeepingRooms('dirty');
  const { data: inProgressRooms, loading: inProgressRoomLoading, refetch: refetchInProgressRooms } = useHousekeepingRooms('in_progress');
  const { data: cleanRooms } = useHousekeepingRooms('clean');
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useMyHousekeepingTasks();
  const { data: notifications } = useNotifications();
  const { updateRoomStatus, startTask } = useHousekeepingActions();

  // Combine all rooms
  const rooms = useMemo(() => {
    return [...(dirtyRooms || []), ...(inProgressRooms || []), ...(cleanRooms || [])];
  }, [dirtyRooms, inProgressRooms, cleanRooms]);

  const refetchAll = async () => {
    await Promise.all([refetchDirty(), refetchInProgressRooms(), refetchTasks()]);
  };

  const isLoading = dirtyLoading || inProgressRoomLoading || tasksLoading;

  // Calculate stats from data
  const stats = useMemo(() => ({
    cleanRooms: cleanRooms?.length || 0,
    totalRooms: rooms.length,
    pendingTasks: tasks?.filter(t => t.status === 'pending' || t.status === 'todo').length || 0,
    inProgressTasks: tasks?.filter(t => t.status === 'in_progress').length || 0,
    urgentRooms: rooms.filter(r => r.priority === 'urgent' && r.status !== 'clean').length
  }), [cleanRooms, rooms, tasks]);

  const shiftHoursLeft = useMemo(() => {
    if (!profile?.shift_end || !profile?.clocked_in) return null;
    const [endHour, endMin] = profile.shift_end.split(':').map(Number);
    const now = new Date();
    const shiftEnd = new Date();
    shiftEnd.setHours(endHour, endMin, 0);

    const diffMs = shiftEnd.getTime() - now.getTime();
    if (diffMs <= 0) return '0h 0m';

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }, [profile]);

  const todaysRooms = useMemo(() => {
    return rooms
      .filter((r: any) => r.status === 'dirty' || r.status === 'in_progress')
      .slice(0, 4);
  }, [rooms]);

  const activeTasks = useMemo(() => {
    const tasksList = tasks || [];
    return tasksList
      .filter((t: any) => t.status !== 'completed')
      .sort((a: any, b: any) => {
        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      })
      .slice(0, 3);
  }, [tasks]);

  const recentNotifications = useMemo(() => {
    const notificationsList = notifications || [];
    return notificationsList.filter((n: any) => !n.is_read).slice(0, 3);
  }, [notifications]);

  const handleStartTask = async (task: any) => {
    const success = await startTask(task.id);
    if (success) refetchAll();
  };

  const handleStartRoom = async (room: any) => {
    const success = await updateRoomStatus(room.id, 'in_progress');
    if (success) {
      refetchAll();
      navigate(`/staff/housekeeping/rooms/${room.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-terra-50 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-terra-600" />
        </div>
        <span className="text-[13px] text-neutral-500 font-medium">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader name={profile?.name} />

      {/* KPI Cards - 12 Column Grid matching admin dashboard */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            title="Rooms Cleaned"
            value={stats.cleanRooms}
            subtitle={`of ${stats.totalRooms} assigned`}
            icon={Sparkles}
            color="sage"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks + stats.inProgressTasks}
            subtitle={`${stats.inProgressTasks} in progress`}
            icon={ClipboardList}
            color="gold"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            title="High Priority"
            value={stats.urgentRooms}
            subtitle="Require attention"
            icon={AlertTriangle}
            color="terra"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            title="Shift Hours Left"
            value={shiftHoursLeft || '--'}
            subtitle={profile?.clocked_in ? 'Currently clocked in' : 'Not clocked in'}
            icon={Clock}
            color="ocean"
          />
        </div>
      </div>

      {/* Main Content - 12 Column Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Today's Assigned Rooms - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          <SectionCard
            title="Today's Assigned Rooms"
            subtitle={`${todaysRooms.length} room${todaysRooms.length !== 1 ? 's' : ''} pending`}
            action={() => navigate('/staff/housekeeping/rooms')}
            actionLabel="View All"
            className="h-full"
          >
            {todaysRooms.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <BedDouble className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-neutral-600 mb-1">No pending rooms</p>
                <p className="text-[11px] text-neutral-400">New room assignments will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                {todaysRooms.map((room: any) => (
                  <div
                    key={room.id}
                    className={`
                      flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-colors cursor-pointer
                      ${room.priority === 'urgent' ? 'bg-rose-50/50 border-l-4 border-l-rose-500' :
                        room.status === 'in_progress' ? 'bg-gold-50/50' :
                        'bg-neutral-50/50 hover:bg-neutral-50'}
                    `}
                    onClick={() => navigate(`/staff/housekeeping/rooms/${room.id}`)}
                  >
                    {/* Top row on mobile: Icon + Content */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-terra-50 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-4.5 h-4.5 text-terra-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold text-neutral-800">Room {room.room_number || room.number}</span>
                          <StatusBadge status={room.status} />
                          {room.priority === 'urgent' && <PriorityBadge priority="urgent" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-neutral-500">
                          <span className="font-medium truncate">{room.room_type || room.type}</span>
                          <span className="text-neutral-300 hidden sm:inline">•</span>
                          <span className="hidden sm:inline">Check-in: {room.next_checkin || 'TBD'}</span>
                        </div>
                        {room.special_requests && (
                          <p className="text-[10px] text-gold-600 mt-1 truncate font-medium">
                            Note: {room.special_requests}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom row on mobile: Actions */}
                    <div className="flex items-center justify-end gap-2 sm:flex-shrink-0 pl-13 sm:pl-0">
                      {room.status === 'dirty' && (
                        <Button
                          size="sm"
                          icon={Play}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRoom(room);
                          }}
                        >
                          Start
                        </Button>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 hidden sm:block" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Quick Actions - 4 columns on desktop */}
        <div className="col-span-12 lg:col-span-4">
          <SectionCard
            title="Quick Actions"
            subtitle="Common tasks"
            className="h-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-4">
              <button
                onClick={() => setScanModalOpen(true)}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-terra-50 text-left hover:bg-terra-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-terra-100 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-4.5 h-4.5 text-terra-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 mb-0.5">Scan Digital Key</p>
                  <p className="text-[11px] text-neutral-400 font-medium">Quick room access</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-terra-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>

              <button
                onClick={() => {
                  const nextRoom = rooms.find((r: any) => r.status === 'dirty');
                  if (nextRoom) handleStartRoom(nextRoom);
                }}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-sage-50/50 text-left hover:bg-sage-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <Play className="w-4.5 h-4.5 text-sage-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 mb-0.5">Start Next Room</p>
                  <p className="text-[11px] text-neutral-400 font-medium">Begin cleaning</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-sage-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate('/staff/housekeeping/tasks')}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gold-50/50 text-left hover:bg-gold-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4.5 h-4.5 text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 mb-0.5">View All Tasks</p>
                  <p className="text-[11px] text-neutral-400 font-medium">{stats.pendingTasks + stats.inProgressTasks} active</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-gold-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate('/staff/housekeeping/rooms?priority=urgent')}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-rose-50/50 text-left hover:bg-rose-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 mb-0.5">Urgent Rooms</p>
                  <p className="text-[11px] text-neutral-400 font-medium">{stats.urgentRooms} require attention</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Active Tasks & Recent Alerts - 8 + 4 = 12 columns */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Active Tasks - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          <SectionCard
            title="Active Tasks"
            subtitle={`${activeTasks.length} task${activeTasks.length !== 1 ? 's' : ''} pending`}
            action={() => navigate('/staff/housekeeping/tasks')}
            actionLabel="View All"
            className="h-full"
          >
            {activeTasks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <CheckCircle className="w-12 h-12 text-sage-300 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-neutral-600 mb-1">All tasks completed!</p>
                <p className="text-[11px] text-neutral-400">New tasks will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                {activeTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={`
                      flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-colors cursor-pointer
                      ${task.priority === 'urgent' ? 'bg-rose-50/50 border-l-4 border-l-rose-500' :
                        task.status === 'in_progress' ? 'bg-gold-50/50' :
                        'bg-neutral-50/50 hover:bg-neutral-50'}
                    `}
                    onClick={() => navigate('/staff/housekeeping/tasks')}
                  >
                    {/* Top row on mobile: Icon + Content */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-4.5 h-4.5 text-neutral-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold text-neutral-800 truncate">{task.title}</span>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-neutral-500">
                          <span className="font-medium">Room {task.room_number || task.room}</span>
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
                    </div>

                    {/* Bottom row on mobile: Actions */}
                    <div className="flex items-center justify-end gap-2 sm:flex-shrink-0 pl-13 sm:pl-0">
                      {task.status === 'todo' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Play}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTask(task);
                          }}
                        >
                          Start
                        </Button>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 hidden sm:block" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Today's Summary & Recent Alerts - 4 columns on desktop */}
        <div className="col-span-12 lg:col-span-4">
          <SectionCard
            title="Today's Summary"
            subtitle="Performance overview"
            className="h-full"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-3 pt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sage-600" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] text-neutral-600 font-medium">Cleaned</span>
                </div>
                <span className="text-[14px] sm:text-[15px] font-bold text-neutral-900 tabular-nums">{stats.cleanRooms}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-terra-50 flex items-center justify-center flex-shrink-0">
                    <BedDouble className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-terra-600" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] text-neutral-600 font-medium">Total</span>
                </div>
                <span className="text-[14px] sm:text-[15px] font-bold text-neutral-900 tabular-nums">{stats.totalRooms}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gold-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-600" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] text-neutral-600 font-medium">Tasks</span>
                </div>
                <span className="text-[14px] sm:text-[15px] font-bold text-neutral-900 tabular-nums">{stats.pendingTasks + stats.inProgressTasks}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] text-neutral-600 font-medium">Urgent</span>
                </div>
                <span className="text-[14px] sm:text-[15px] font-bold text-neutral-900 tabular-nums">{stats.urgentRooms}</span>
              </div>
            </div>

            {/* Recent Alerts */}
            {recentNotifications.length > 0 && (
              <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h4 className="text-sm font-semibold text-neutral-800">Recent Alerts</h4>
                </div>
                <div className="space-y-2">
                  {recentNotifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`
                        p-3 rounded-lg border-l-4 transition-colors
                        ${notif.priority === 'urgent' ? 'bg-rose-50/50 border-l-rose-500' :
                          notif.priority === 'high' ? 'bg-gold-50/50 border-l-gold-500' :
                          'bg-ocean-50/50 border-l-ocean-500'}
                      `}
                    >
                      <p className="text-[12px] sm:text-[13px] font-semibold text-neutral-800">{notif.title}</p>
                      <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Scan Digital Key Modal */}
      <ScanDigitalKeyModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
      />
    </div>
  );
};

export default HousekeepingDashboard;
