import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BedDouble,
  Filter,
  Search,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react';
import PageHeader from '../../../layouts/staff-portal/PageHeader';
import Card from '../../../components/staff-portal/ui/Card';
import { StatusBadge, PriorityBadge } from '../../../components/staff-portal/ui/Badge';
import Button, { ButtonGroup, ButtonGroupItem } from '../../../components/staff-portal/ui/Button';
import { SearchInput } from '../../../components/staff-portal/ui/Input';
import { useMyHousekeepingRooms, useHousekeepingActions } from '@/hooks/staff-portal/useStaffApi';

const HousekeepingRooms = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // API hooks - fetch all rooms without status filter
  const { data: rooms, loading: isLoading, refetch: refetchAll } = useMyHousekeepingRooms();
  const { updateRoomStatus } = useHousekeepingActions();

  // Calculate stats from data based on actual room statuses
  const stats = useMemo(() => ({
    dirtyRooms: rooms?.filter(r => r.status === 'dirty').length || 0,
    inProgressRooms: rooms?.filter(r => r.status === 'in_progress').length || 0,
    cleanRooms: rooms?.filter(r => r.status === 'clean').length || 0,
    urgentRooms: rooms?.filter(r => r.priority === 'urgent' && r.status !== 'clean').length || 0
  }), [rooms]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter(room => {
      const roomNumber = room.room_number || room.number || '';
      const roomType = room.room_type || room.type || '';
      const guestName = room.guest_name || room.guestName || '';

      const matchesSearch = roomNumber.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guestName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || room.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [rooms, searchQuery, statusFilter, priorityFilter]);

  const getChecklistProgress = (checklist: any[]) => {
    if (!checklist || checklist.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = checklist.filter(c => c.completed).length;
    return {
      completed,
      total: checklist.length,
      percentage: Math.round((completed / checklist.length) * 100)
    };
  };

  const handleStartCleaning = async (room: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await updateRoomStatus(room.id, 'in_progress');
    if (success) refetchAll();
  };

  const handleMarkClean = async (room: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await updateRoomStatus(room.id, 'clean');
    if (success) refetchAll();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text-light">Loading rooms...</span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Rooms"
        subtitle={`${rooms.length} rooms assigned to you`}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'dirty' ? 'bg-danger-light ring-2 ring-danger' : 'bg-white border border-border hover:border-danger'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'dirty' ? 'all' : 'dirty')}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <span className="text-2xl font-bold text-text">{stats.dirtyRooms}</span>
          </div>
          <p className="text-sm text-text-light mt-1">Dirty</p>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'in_progress' ? 'bg-warning-light ring-2 ring-warning' : 'bg-white border border-border hover:border-warning'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-2xl font-bold text-text">{stats.inProgressRooms}</span>
          </div>
          <p className="text-sm text-text-light mt-1">In Progress</p>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'clean' ? 'bg-success-light ring-2 ring-success' : 'bg-white border border-border hover:border-success'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'clean' ? 'all' : 'clean')}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-text">{stats.cleanRooms}</span>
          </div>
          <p className="text-sm text-text-light mt-1">Clean</p>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            priorityFilter === 'urgent' ? 'bg-primary/10 ring-2 ring-primary' : 'bg-white border border-border hover:border-primary'
          }`}
          onClick={() => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent')}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-text">{stats.urgentRooms}</span>
          </div>
          <p className="text-sm text-text-light mt-1">High Priority</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <ButtonGroup>
          <ButtonGroupItem
            isActive={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </ButtonGroupItem>
          <ButtonGroupItem
            isActive={statusFilter === 'dirty'}
            onClick={() => setStatusFilter('dirty')}
          >
            Dirty
          </ButtonGroupItem>
          <ButtonGroupItem
            isActive={statusFilter === 'in_progress'}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
          </ButtonGroupItem>
          <ButtonGroupItem
            isActive={statusFilter === 'clean'}
            onClick={() => setStatusFilter('clean')}
          >
            Clean
          </ButtonGroupItem>
        </ButtonGroup>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <Card className="text-center py-12">
          <BedDouble className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No rooms found</h3>
          <p className="text-text-light">Try adjusting your filters</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRooms.map((room: any) => {
            const progress = getChecklistProgress(room.checklist);

            return (
              <Card
                key={room.id}
                hover
                onClick={() => navigate(`/staff/housekeeping/rooms/${room.id}`)}
                className="relative"
              >
                {/* Priority indicator */}
                {(room.priority === 'urgent' || room.priority === 'high') && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-danger rounded-l-[14px]" />
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-[10px] flex items-center justify-center
                      ${room.status === 'dirty' ? 'bg-danger-light' :
                        room.status === 'in_progress' ? 'bg-warning-light' :
                        'bg-success-light'}
                    `}>
                      <BedDouble className={`w-6 h-6 ${
                        room.status === 'dirty' ? 'text-danger' :
                        room.status === 'in_progress' ? 'text-warning' :
                        'text-success'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text">Room {room.room_number || room.number}</h3>
                      <p className="text-sm text-text-light">{room.room_type || room.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={room.status} />
                </div>

                {/* Room Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-light">Floor</span>
                    <span className="font-medium text-text">{room.floor}</span>
                  </div>
                  {(room.next_checkin || room.nextCheckin) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-light">Next Check-in</span>
                      <span className="font-medium text-text">{room.next_checkin || room.nextCheckin}</span>
                    </div>
                  )}
                  {(room.guest_name || room.guestName) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-light">Guest</span>
                      <span className="font-medium text-text truncate max-w-[150px]">{room.guest_name || room.guestName}</span>
                    </div>
                  )}
                </div>

                {/* Checklist Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-text-light">Checklist Progress</span>
                    <span className="font-medium text-text">{progress.completed}/{progress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progress.percentage === 100 ? 'bg-success' :
                        progress.percentage > 50 ? 'bg-teal' :
                        progress.percentage > 0 ? 'bg-warning' :
                        'bg-neutral-dark'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Special Requests */}
                {(room.special_requests || room.specialRequests) && (
                  <div className="p-2.5 rounded-lg bg-gold/10 mb-4">
                    <p className="text-xs text-gold font-medium">Special Request:</p>
                    <p className="text-xs text-text-light mt-0.5 line-clamp-2">{room.special_requests || room.specialRequests}</p>
                  </div>
                )}

                {/* Priority Badge */}
                {room.priority && room.priority !== 'normal' && (
                  <div className="mb-4">
                    <PriorityBadge priority={room.priority} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {room.status === 'dirty' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => handleStartCleaning(room, e)}
                    >
                      Start Cleaning
                    </Button>
                  )}
                  {room.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="success"
                      className="flex-1"
                      onClick={(e) => handleMarkClean(room, e)}
                    >
                      Mark Clean
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    icon={ChevronRight}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/staff/housekeeping/rooms/${room.id}`);
                    }}
                  >
                    Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HousekeepingRooms;





