/**
 * Room Details Page - Staff Portal
 * Glimmora Design System v5.0
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  User,
  Clock,
  CheckCircle2,
  Play,
  Sparkles,
  Loader2,
  QrCode,
  Eye,
  AlertCircle,
  CheckCircle,
  Send,
  Ban
} from 'lucide-react';
import Card from '../../../components/staff-portal/ui/Card';
import Button from '../../../components/staff-portal/ui/Button';
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

// Status styling - Glimmora Design System v5.0
const statusConfig: Record<string, { dot: string; badge: string; label: string; iconBg: string; iconColor: string }> = {
  dirty: { dot: 'bg-gold-500', badge: 'bg-gold-50 text-gold-700 border-gold-200', label: 'Needs Cleaning', iconBg: 'bg-gold-100', iconColor: 'text-gold-600' },
  in_progress: { dot: 'bg-terra-500', badge: 'bg-terra-50 text-terra-600 border-terra-200', label: 'Being Cleaned', iconBg: 'bg-terra-100', iconColor: 'text-terra-600' },
  clean: { dot: 'bg-sage-500', badge: 'bg-sage-50 text-sage-700 border-sage-200', label: 'Ready to Use', iconBg: 'bg-sage-100', iconColor: 'text-sage-600' },
  inspected: { dot: 'bg-sage-500', badge: 'bg-sage-50 text-sage-700 border-sage-200', label: 'Inspected', iconBg: 'bg-sage-100', iconColor: 'text-sage-600' },
  out_of_order: { dot: 'bg-rose-400', badge: 'bg-rose-50 text-rose-600 border-rose-200', label: 'Out of Order', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  out_of_service: { dot: 'bg-rose-400', badge: 'bg-rose-50 text-rose-600 border-rose-200', label: 'Out of Service', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
};

const priorityConfig: Record<string, { badge: string; label: string }> = {
  low: { badge: 'bg-neutral-50 text-neutral-600 border-neutral-200', label: 'Low' },
  medium: { badge: 'bg-gold-50 text-gold-700 border-gold-200', label: 'Medium' },
  high: { badge: 'bg-rose-50 text-rose-600 border-rose-200', label: 'High' },
  urgent: { badge: 'bg-rose-50 text-rose-600 border-rose-200', label: 'Urgent' },
};

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

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const rooms = await housekeepingService.getRooms();
        const foundRoom = rooms.find((r: any) => r.id === Number(id));
        if (foundRoom) {
          setRoom(foundRoom);
          if (Array.isArray(foundRoom.checklist) && foundRoom.checklist.length > 0) {
            setChecklist(foundRoom.checklist);
          } else if (foundRoom.status === 'clean' || foundRoom.status === 'inspected') {
            setChecklist(defaultChecklist.map(c => ({ ...c, completed: true })));
          }
          if (foundRoom.notes) {
            setNote(foundRoom.notes);
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
        <Loader2 className="w-6 h-6 animate-spin text-terra-500" />
        <span className="ml-2 text-[13px] text-neutral-500">Loading room details...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <BedDouble className="w-8 h-8 text-neutral-400" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Room Not Found</h2>
        <p className="text-[13px] text-neutral-500 mb-4">The room you're looking for doesn't exist or you don't have access.</p>
        <Button variant="ghost" onClick={() => navigate('/staff/housekeeping/rooms')}>
          Back to Rooms
        </Button>
      </div>
    );
  }

  const status = statusConfig[room.status] || statusConfig.clean;
  const priority = room.priority ? (priorityConfig[room.priority] || priorityConfig.low) : null;

  const safeChecklist = Array.isArray(checklist) ? checklist : [];
  const checklistProgress = {
    completed: safeChecklist.filter(c => c.completed).length,
    total: safeChecklist.length,
    percentage: safeChecklist.length > 0 ? Math.round((safeChecklist.filter(c => c.completed).length / safeChecklist.length) * 100) : 0
  };

  const handleChecklistToggle = (checklistId: string) => {
    setChecklist(prev => {
      const updated = prev.map(item =>
        item.id === checklistId ? { ...item, completed: !item.completed } : item
      );
      if (room?.task_id) {
        housekeepingService.updateTask(room.task_id, { checklist: updated } as any).catch(() => {});
      }
      return updated;
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    let success = false;

    if (newStatus === 'in_progress' && room.task_id) {
      try {
        await housekeepingService.startTask(room.task_id);
        success = true;
      } catch {
        success = await updateRoomStatus(room.id, newStatus);
      }
    } else if (newStatus === 'clean' && room.task_id) {
      try {
        await housekeepingService.completeTask(room.task_id, { checklist, notes: note || undefined });
        success = true;
      } catch {
        success = await updateRoomStatus(room.id, newStatus);
      }
    } else if (newStatus === 'inspected') {
      try {
        await housekeepingService.inspectRoom(room.id, { passed: true });
        success = true;
      } catch {
        success = await updateRoomStatus(room.id, newStatus);
      }
    } else {
      success = await updateRoomStatus(room.id, newStatus);
    }

    if (success) {
      setRoom((prev: any) => ({ ...prev, status: newStatus }));
      if (newStatus === 'clean' || newStatus === 'inspected') {
        setChecklist(defaultChecklist.map(c => ({ ...c, completed: true })));
      } else if (newStatus === 'dirty') {
        setChecklist(defaultChecklist.map(c => ({ ...c, completed: false })));
      }
    }
  };

  const handleSaveNote = async () => {
    if (!room?.task_id) return;
    setIsSavingNote(true);
    try {
      await housekeepingService.updateTask(room.task_id, { notes: note });
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCompleteAll = () => {
    const allCompleted = defaultChecklist.map(item => ({ ...item, completed: true }));
    setChecklist(allCompleted);
    if (room?.task_id) {
      housekeepingService.updateTask(room.task_id, { checklist: allCompleted } as any).catch(() => {});
    }
  };

  return (
    <div>
      {/* ── Header: Back + Room identity + Status + Actions ── */}
      <header className="mb-6">
        {/* Row 1: Back + title + badges */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate('/staff/housekeeping/rooms')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </button>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${status.iconBg}`}>
            <BedDouble className={`w-5 h-5 ${status.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
                Room {room.number}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${status.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {priority && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priority.badge}`}>
                  <AlertCircle className="w-3 h-3" />
                  {priority.label}
                </span>
              )}
            </div>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              {room.room_type || 'Standard Room'} &bull; Floor {room.floor}
            </p>
          </div>
        </div>

        {/* Row 2: Contextual action buttons */}
        <div className="flex flex-wrap items-center gap-2 pl-[84px]">
          {room.status === 'dirty' && (
            <Button variant="primary" icon={Play} onClick={() => handleStatusChange('in_progress')} size="sm">
              Start Cleaning
            </Button>
          )}
          {room.status === 'in_progress' && (
            <>
              <Button variant="success" icon={Sparkles} onClick={() => handleStatusChange('clean')} size="sm">
                Mark as Clean
              </Button>
              <Button variant="ghost" onClick={() => handleStatusChange('dirty')} size="sm">
                Reset to Dirty
              </Button>
            </>
          )}
          {room.status === 'clean' && (
            <>
              <Button variant="primary" icon={CheckCircle} onClick={() => handleStatusChange('inspected')} size="sm">
                Mark Inspected
              </Button>
              <Button variant="ghost" onClick={() => handleStatusChange('dirty')} size="sm">
                Needs Re-Cleaning
              </Button>
            </>
          )}
          {room.status === 'inspected' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-50 border border-sage-200">
              <CheckCircle className="w-3.5 h-3.5 text-sage-600" />
              <span className="text-[12px] font-semibold text-sage-700">Room is ready for guest</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column: Checklist + Notes ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cleaning Checklist */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900">
                Cleaning Checklist
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-neutral-900">
                  {checklistProgress.completed}/{checklistProgress.total} ({checklistProgress.percentage}%)
                </span>
                <button
                  type="button"
                  onClick={handleCompleteAll}
                  disabled={checklistProgress.percentage === 100}
                  className="text-[12px] text-terra-600 hover:text-terra-700 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Complete All
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-100 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  checklistProgress.percentage === 100 ? 'bg-sage-500' :
                  checklistProgress.percentage > 50 ? 'bg-sage-400' :
                  checklistProgress.percentage > 0 ? 'bg-gold-500' :
                  'bg-neutral-200'
                }`}
                style={{ width: `${checklistProgress.percentage}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="p-3 sm:p-4 rounded-lg bg-neutral-50 border border-neutral-100 space-y-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleChecklistToggle(item.id)}
                  className="flex items-center gap-2.5 px-2 py-2 hover:bg-white rounded-lg transition-colors cursor-pointer group"
                >
                  <div
                    className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.completed
                        ? 'bg-sage-500 border-sage-500'
                        : 'bg-white border-neutral-300 group-hover:border-terra-500'
                    }`}
                  >
                    {item.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-[13px] font-medium ${
                    item.completed ? 'text-neutral-400 line-through' : 'text-neutral-900'
                  }`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
              Notes
            </h4>

            {room.notes && note === room.notes && (
              <div className="p-3 rounded-lg bg-gold-50 border border-gold-100 mb-3">
                <p className="text-[13px] text-neutral-700 leading-relaxed whitespace-pre-line">{room.notes}</p>
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes about this room..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150 resize-none"
              />
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={handleSaveNote}
                isLoading={isSavingNote}
                disabled={!note.trim()}
                className="flex-shrink-0"
              >
                Save
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Right column: Room Info + Actions ── */}
        <div className="space-y-5">
          {/* Room Information */}
          <Card>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
              Room Information
            </h4>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-terra-100 flex items-center justify-center flex-shrink-0">
                  <BedDouble className="w-4 h-4 text-terra-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-neutral-500">Room Type</p>
                  <p className="text-[13px] font-semibold text-neutral-900">{room.room_type || 'Standard'}</p>
                </div>
              </div>

              <div className="h-px bg-neutral-200" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-sage-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-neutral-500">Capacity</p>
                  <p className="text-[13px] font-semibold text-neutral-900">
                    {room.capacity || 2} guests (max {room.max_occupancy || 4})
                  </p>
                </div>
              </div>

              <div className="h-px bg-neutral-200" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-neutral-500">Last Cleaned</p>
                  <p className="text-[13px] font-semibold text-neutral-900">
                    {room.last_cleaned
                      ? new Date(room.last_cleaned).toLocaleDateString()
                      : 'Not recorded'}
                  </p>
                </div>
              </div>

              {room.bed_type && (
                <>
                  <div className="h-px bg-neutral-200" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-terra-100 flex items-center justify-center flex-shrink-0">
                      <BedDouble className="w-4 h-4 text-terra-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-neutral-500">Bed Type</p>
                      <p className="text-[13px] font-semibold text-neutral-900">{room.bed_type}</p>
                    </div>
                  </div>
                </>
              )}

              {room.view_type && (
                <>
                  <div className="h-px bg-neutral-200" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-neutral-500">View</p>
                      <p className="text-[13px] font-semibold text-neutral-900">{room.view_type}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Assigned Staff */}
          {room.assigned_to_name && (
            <Card>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
                Assigned Housekeeper
              </h4>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-terra-100 flex items-center justify-center text-terra-600 font-bold text-[13px]">
                    {room.assigned_to_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-neutral-900">{room.assigned_to_name}</p>
                    <p className="text-[11px] text-neutral-500 font-medium">Housekeeper</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Time Tracking */}
          {(room.cleaning_started_at || room.cleaning_completed_at || room.last_cleaned) && (
            <Card>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
                Time Tracking
              </h4>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100 space-y-3">
                {room.cleaning_started_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-terra-100 flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-terra-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-neutral-500">Started</p>
                      <p className="text-[13px] font-semibold text-neutral-900">
                        {new Date(room.cleaning_started_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
                {room.cleaning_completed_at && (
                  <>
                    {room.cleaning_started_at && <div className="h-px bg-neutral-200" />}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-sage-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-neutral-500">Completed</p>
                        <p className="text-[13px] font-semibold text-neutral-900">
                          {new Date(room.cleaning_completed_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {room.last_cleaned && !room.cleaning_completed_at && (
                  <>
                    {room.cleaning_started_at && <div className="h-px bg-neutral-200" />}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-neutral-500">Last Cleaned</p>
                        <p className="text-[13px] font-semibold text-neutral-900">
                          {new Date(room.last_cleaned).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Button
                variant="primary"
                fullWidth
                icon={QrCode}
                onClick={() => setScanModalOpen(true)}
                className="justify-center text-[13px]"
              >
                Scan Digital Key
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => handleStatusChange('dirty')}
                className="justify-center text-[13px]"
              >
                Mark as Dirty
              </Button>
              <button
                type="button"
                onClick={() => handleStatusChange('out_of_order')}
                className="w-full flex items-center justify-center gap-2 px-4 h-9 rounded-[var(--brand-radius-md)] text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Mark Out of Order
              </button>
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
