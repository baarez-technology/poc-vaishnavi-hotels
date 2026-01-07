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
import Card, { StatCard } from '../../../components/staff-portal/ui/Card';
import { StatusBadge, PriorityBadge } from '../../../components/staff-portal/ui/Badge';
import Button from '../../../components/staff-portal/ui/Button';
import { useStaffProfile, useHousekeepingRooms, useMyHousekeepingTasks, useNotifications, useHousekeepingActions } from '@/hooks/staff-portal/useStaffApi';
import { ScanDigitalKeyModal } from '@/components/housekeeping/modals/ScanDigitalKeyModal';

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
    if (!profile?.shift_end || !profile?.is_clocked_in) return null;
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text-light">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader name={profile?.name} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Rooms Cleaned Today"
          value={stats.cleanRooms}
          subtitle={`of ${stats.totalRooms} assigned`}
          icon={Sparkles}
          color="green"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks + stats.inProgressTasks}
          subtitle={`${stats.inProgressTasks} in progress`}
          icon={ClipboardList}
          color="gold"
        />
        <StatCard
          title="High Priority Rooms"
          value={stats.urgentRooms}
          subtitle="Require attention"
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="Shift Hours Left"
          value={shiftHoursLeft || '--'}
          subtitle={profile?.is_clocked_in ? 'Currently clocked in' : 'Not clocked in'}
          icon={Clock}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Assigned Rooms */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Today's Assigned Rooms</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/staff/housekeeping/rooms')}
                icon={ChevronRight}
                iconPosition="right"
              >
                View All
              </Button>
            </div>

            {todaysRooms.length === 0 ? (
              <div className="text-center py-8">
                <BedDouble className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
                <p className="text-neutral-600">No pending rooms</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysRooms.map((room: any) => (
                  <div
                    key={room.id}
                    className="flex items-center gap-4 p-4 rounded-[12px] bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                    onClick={() => navigate(`/staff/housekeeping/rooms/${room.id}`)}
                  >
                    <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BedDouble className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">Room {room.room_number || room.number}</span>
                        <StatusBadge status={room.status} />
                        {room.priority === 'urgent' && <PriorityBadge priority="urgent" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                        <span>{room.room_type || room.type}</span>
                        <span>•</span>
                        <span>Check-in: {room.next_checkin || 'TBD'}</span>
                      </div>
                      {room.special_requests && (
                        <p className="text-xs text-yellow-600 mt-1 truncate">
                          Note: {room.special_requests}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
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
                      <ChevronRight className="w-5 h-5 text-neutral-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full justify-start"
                icon={QrCode}
                onClick={() => setScanModalOpen(true)}
              >
                Scan Digital Key
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={Play}
                onClick={() => {
                  const nextRoom = rooms.find((r: any) => r.status === 'dirty');
                  if (nextRoom) handleStartRoom(nextRoom);
                }}
              >
                Start Next Room
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={ClipboardList}
                onClick={() => navigate('/staff/housekeeping/tasks')}
              >
                View All Tasks
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={AlertTriangle}
                onClick={() => navigate('/staff/housekeeping/rooms?priority=urgent')}
              >
                Urgent Rooms ({stats.urgentRooms})
              </Button>
            </div>
          </Card>

          {/* Active Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Active Tasks</h2>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/staff/housekeeping/tasks')}
              >
                View All
              </Button>
            </div>

            {activeTasks.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">All tasks completed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-[10px] bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                    onClick={() => navigate('/staff/housekeeping/tasks')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-600">Room {task.room_number || task.room}</span>
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>
                      {task.status === 'todo' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Play}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTask(task);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Notifications */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Alerts</h2>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/staff/notifications')}
              >
                View All
              </Button>
            </div>

            {recentNotifications.length === 0 ? (
              <p className="text-sm text-neutral-600 text-center py-4">No new alerts</p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`
                      p-3 rounded-[10px] border-l-4
                      ${notif.priority === 'urgent' ? 'border-l-red-600 bg-red-50' :
                        notif.priority === 'high' ? 'border-l-yellow-600 bg-yellow-50' :
                        'border-l-primary bg-primary/5'}
                    `}
                  >
                    <p className="text-sm font-medium text-neutral-900">{notif.title}</p>
                    <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
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





