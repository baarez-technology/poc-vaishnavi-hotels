import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Save,
  Play,
  Sparkles,
  MessageSquare,
  Loader2,
  QrCode
} from 'lucide-react';
import PageHeader from '../../../layouts/staff-portal/PageHeader';
import Card from '../../../components/staff-portal/ui/Card';
import { StatusBadge, PriorityBadge } from '../../../components/staff-portal/ui/Badge';
import Button from '../../../components/staff-portal/ui/Button';
import { Textarea } from '../../../components/staff-portal/ui/Input';
import { useHousekeepingActions } from '@/hooks/staff-portal/useStaffApi';
import { housekeepingService } from '@/api/services/housekeeping.service';
import { ScanDigitalKeyModal } from '@/components/housekeeping/modals/ScanDigitalKeyModal';

// Default checklist for housekeeping
const defaultChecklist = [
  { id: '1', task: 'Make bed with fresh linens', completed: false },
  { id: '2', task: 'Vacuum carpet/mop floor', completed: false },
  { id: '3', task: 'Clean and sanitize bathroom', completed: false },
  { id: '4', task: 'Wipe down all surfaces', completed: false },
  { id: '5', task: 'Empty trash bins', completed: false },
  { id: '6', task: 'Replenish toiletries', completed: false },
  { id: '7', task: 'Check minibar and replenish', completed: false },
  { id: '8', task: 'Clean mirrors and windows', completed: false },
];

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateRoomStatus } = useHousekeepingActions();

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        // Fetch all rooms and find the one we need
        const rooms = await housekeepingService.getRooms();
        const foundRoom = rooms.find((r: any) => r.id === Number(id));
        if (foundRoom) {
          setRoom(foundRoom);
          // Reset checklist based on room status
          if (foundRoom.status === 'clean' || foundRoom.status === 'inspected') {
            setChecklist(defaultChecklist.map(c => ({ ...c, completed: true })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch room:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text-light">Loading room details...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-16">
        <BedDouble className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text mb-2">Room Not Found</h2>
        <p className="text-text-light mb-4">The room you're looking for doesn't exist or you don't have access.</p>
        <Button variant="outline" onClick={() => navigate('/staff/housekeeping/rooms')}>
          Back to Rooms
        </Button>
      </div>
    );
  }

  const checklistProgress = {
    completed: checklist.filter(c => c.completed).length,
    total: checklist.length,
    percentage: Math.round((checklist.filter(c => c.completed).length / checklist.length) * 100)
  };

  const handleChecklistToggle = (checklistId: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === checklistId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleStatusChange = async (status: string) => {
    const success = await updateRoomStatus(room.id, status);
    if (success) {
      setRoom((prev: any) => ({ ...prev, status }));
      // Update checklist based on new status
      if (status === 'clean' || status === 'inspected') {
        setChecklist(defaultChecklist.map(c => ({ ...c, completed: true })));
      } else if (status === 'dirty') {
        setChecklist(defaultChecklist.map(c => ({ ...c, completed: false })));
      }
    }
  };

  const handleSaveNote = () => {
    setIsSavingNote(true);
    // In a real app, this would save to the API
    setTimeout(() => setIsSavingNote(false), 500);
  };

  const handleCompleteAll = () => {
    setChecklist(prev => prev.map(item => ({ ...item, completed: true })));
  };

  return (
    <div>
      <PageHeader
        title={`Room ${room.number}`}
        subtitle={room.room_type || 'Standard Room'}
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/staff/housekeeping/rooms')}
          >
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Status Card */}
          <Card>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`
                  w-16 h-16 rounded-[14px] flex items-center justify-center
                  ${room.status === 'dirty' ? 'bg-danger-light' :
                    room.status === 'in_progress' ? 'bg-warning-light' :
                    room.status === 'clean' ? 'bg-success-light' :
                    'bg-teal/10'}
                `}>
                  <BedDouble className={`w-8 h-8 ${
                    room.status === 'dirty' ? 'text-danger' :
                    room.status === 'in_progress' ? 'text-warning' :
                    room.status === 'clean' ? 'text-success' :
                    'text-teal'
                  }`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text">Room {room.number}</h2>
                  <p className="text-text-light">{room.room_type || 'Standard'} - Floor {room.floor}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={room.status} />
              </div>
            </div>

            {/* Quick Status Actions */}
            <div className="flex flex-wrap gap-2">
              {room.status === 'dirty' && (
                <Button icon={Play} onClick={() => handleStatusChange('in_progress')}>
                  Start Cleaning
                </Button>
              )}
              {room.status === 'in_progress' && (
                <>
                  <Button
                    variant="success"
                    icon={Sparkles}
                    onClick={() => handleStatusChange('clean')}
                  >
                    Mark as Clean
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('dirty')}
                  >
                    Reset to Dirty
                  </Button>
                </>
              )}
              {room.status === 'clean' && (
                <>
                  <Button
                    variant="teal"
                    icon={CheckCircle}
                    onClick={() => handleStatusChange('inspected')}
                  >
                    Mark Inspected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('dirty')}
                  >
                    Needs Re-Cleaning
                  </Button>
                </>
              )}
              {room.status === 'inspected' && (
                <div className="flex items-center gap-2 text-teal">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Room is ready for guest</span>
                </div>
              )}
            </div>
          </Card>

          {/* Checklist */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text">Cleaning Checklist</h3>
                <p className="text-sm text-text-light">
                  {checklistProgress.completed} of {checklistProgress.total} completed
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompleteAll}
                disabled={checklistProgress.percentage === 100}
              >
                Complete All
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full h-3 bg-neutral-dark rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    checklistProgress.percentage === 100 ? 'bg-success' :
                    checklistProgress.percentage > 50 ? 'bg-teal' :
                    checklistProgress.percentage > 0 ? 'bg-warning' :
                    'bg-neutral-dark'
                  }`}
                  style={{ width: `${checklistProgress.percentage}%` }}
                />
              </div>
              <p className="text-right text-sm text-text-muted mt-1">
                {checklistProgress.percentage}% complete
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all
                    ${item.completed
                      ? 'bg-success-light/50 hover:bg-success-light'
                      : 'bg-neutral hover:bg-neutral-dark'}
                  `}
                >
                  <button
                    onClick={() => handleChecklistToggle(item.id)}
                    className={`
                      w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                      ${item.completed
                        ? 'bg-success text-white'
                        : 'border-2 border-border bg-white'}
                    `}
                  >
                    {item.completed && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <span className={`flex-1 ${item.completed ? 'line-through text-text-light' : 'text-text'}`}>
                    {item.task}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-text-muted" />
              <h3 className="text-lg font-semibold text-text">Notes</h3>
            </div>

            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add notes about this room..."
              rows={4}
            />

            <div className="flex justify-end mt-3">
              <Button
                size="sm"
                icon={Save}
                onClick={handleSaveNote}
                isLoading={isSavingNote}
              >
                Save Note
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Room Info */}
          <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Room Information</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center">
                  <BedDouble className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Room Type</p>
                  <p className="font-medium text-text">{room.room_type || 'Standard'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-teal/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Capacity</p>
                  <p className="font-medium text-text">{room.capacity || 2} guests (max {room.max_occupancy || 4})</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-beige/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-beige" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Last Cleaned</p>
                  <p className="font-medium text-text">
                    {room.last_cleaned
                      ? new Date(room.last_cleaned).toLocaleDateString()
                      : 'Not recorded'}
                  </p>
                </div>
              </div>

              {room.bed_type && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-gold/10 flex items-center justify-center">
                    <BedDouble className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Bed Type</p>
                    <p className="font-medium text-text">{room.bed_type}</p>
                  </div>
                </div>
              )}

              {room.view_type && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-info-light flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">View</p>
                    <p className="font-medium text-text">{room.view_type}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
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
                onClick={() => handleStatusChange('dirty')}
              >
                Mark as Dirty
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleStatusChange('out_of_order')}
              >
                Mark Out of Order
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Scan Digital Key Modal */}
      <ScanDigitalKeyModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        roomNumber={room?.number}
      />
    </div>
  );
};

export default RoomDetails;
