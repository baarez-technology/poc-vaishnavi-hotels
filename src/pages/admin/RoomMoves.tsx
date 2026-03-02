/**
 * RoomMoves — Scheduled room moves with create, execute, and cancel actions.
 * Glimmora Design System v5.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowRightLeft, Plus, Play, XCircle } from 'lucide-react';
import { roomMovesService, type RoomMove } from '@/api/services/room-moves.service';
import { useToast } from '@/contexts/ToastContext';

// UI2 Components
import { ConfirmModal } from '@/components/ui2/Modal';
import { Drawer } from '@/components/ui2/Drawer';
import { Button, IconButton } from '@/components/ui2/Button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableActions, TableEmpty, TableSkeleton, Pagination,
} from '@/components/ui2/Table';
import { Badge } from '@/components/ui2/Badge';
import DatePicker from '@/components/ui2/DatePicker';
import { SearchBar } from '@/components/ui2/SearchBar';

// ── Status badge mapping ────────────────────────────────────────────────────
const STATUS_VARIANT: Record<string, 'info' | 'success' | 'neutral'> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'neutral',
};

// ── Filter options ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ── Input styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-500/10 focus:border-terra-400 hover:border-neutral-300 transition-all duration-150';
const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

// ── FilterSelect (matches Bookings/Guests pattern) ──────────────────────────
function FilterSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (val: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = !value ? placeholder : selectedOption?.label || placeholder;
  const hasValue = !!value;

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-[13px] bg-white border transition-all duration-150 flex items-center gap-1.5 sm:gap-2 focus:outline-none w-full sm:min-w-[140px] ${
          isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : hasValue
              ? 'border-terra-300 bg-terra-50'
              : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className={hasValue ? 'text-terra-700 font-medium' : 'text-neutral-500'}>
          {displayLabel}
        </span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${hasValue ? 'text-terra-500' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden min-w-[160px]">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                  value === option.value ? 'bg-terra-50 text-terra-700' : 'text-neutral-700'
                }`}
              >
                {option.label}
                {value === option.value && (
                  <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Create Drawer ───────────────────────────────────────────────────────────
function CreateDrawer({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: { booking_id: number; to_room_id: number; scheduled_date: string; move_reason?: string; notes?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ booking_id: '', to_room_id: '', scheduled_date: '', move_reason: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const { error: showError } = useToast();

  const resetForm = () => setForm({ booking_id: '', to_room_id: '', scheduled_date: '', move_reason: '', notes: '' });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.booking_id || !form.to_room_id || !form.scheduled_date) return;
    setSaving(true);
    try {
      await onSave({
        booking_id: parseInt(form.booking_id),
        to_room_id: parseInt(form.to_room_id),
        scheduled_date: form.scheduled_date,
        move_reason: form.move_reason || undefined,
        notes: form.notes || undefined,
      });
      handleClose();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Failed to create room move');
    }
    setSaving(false);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Room Move"
      subtitle="Create a new scheduled room move for a booking"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={handleClose} className="px-5 py-2 text-[13px] font-semibold">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            loading={saving}
            onClick={handleSubmit as any}
            className="px-5 py-2 text-[13px] font-semibold"
          >
            Schedule Move
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>Booking ID *</label>
          <input
            type="number"
            className={inputCls}
            value={form.booking_id}
            onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))}
            placeholder="Enter booking ID"
            required
          />
        </div>
        <div>
          <label className={labelCls}>To Room ID *</label>
          <input
            type="number"
            className={inputCls}
            value={form.to_room_id}
            onChange={e => setForm(f => ({ ...f, to_room_id: e.target.value }))}
            placeholder="Enter destination room ID"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Move Date *</label>
          <DatePicker
            value={form.scheduled_date}
            onChange={val => setForm(f => ({ ...f, scheduled_date: val }))}
            placeholder="Select move date"
            className="w-full"
          />
        </div>
        <div>
          <label className={labelCls}>Reason</label>
          <input
            className={inputCls}
            value={form.move_reason}
            onChange={e => setForm(f => ({ ...f, move_reason: e.target.value }))}
            placeholder="e.g. Guest request, maintenance"
          />
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            className={`${inputCls} min-h-[80px] resize-none`}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Additional notes..."
          />
        </div>
      </form>
    </Drawer>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RoomMoves() {
  const [moves, setMoves] = useState<RoomMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'execute' | 'cancel'; moveId: number } | null>(null);
  const perPage = 15;
  const { success, error: showError } = useToast();

  const fetchMoves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roomMovesService.list({ status: statusFilter || undefined, limit: 200 });
      setMoves(Array.isArray(data) ? data : []);
    } catch {
      showError('Failed to load room moves');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return moves;
    const q = searchQuery.toLowerCase();
    return moves.filter(m =>
      String(m.id).includes(q) ||
      String(m.booking_id).includes(q) ||
      (m.from_room_number && m.from_room_number.toLowerCase().includes(q)) ||
      (m.to_room_number && m.to_room_number.toLowerCase().includes(q)) ||
      String(m.from_room_id).includes(q) ||
      String(m.to_room_id).includes(q) ||
      (m.move_reason && m.move_reason.toLowerCase().includes(q)) ||
      (m.status && m.status.toLowerCase().includes(q))
    );
  }, [moves, searchQuery]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleCreate = async (data: any) => {
    await roomMovesService.create(data);
    success('Room move scheduled');
    fetchMoves();
  };

  const handleExecute = async (id: number) => {
    try {
      await roomMovesService.execute(id);
      success('Room move executed');
      fetchMoves();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Failed to execute');
    }
    setConfirmAction(null);
  };

  const handleCancel = async (id: number) => {
    try {
      await roomMovesService.cancel(id);
      success('Room move cancelled');
      fetchMoves();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Failed to cancel');
    }
    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
              Room Moves
            </h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">
              {filtered.length} total move{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            Schedule Move
          </Button>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-[10px] overflow-hidden">

          {/* Search & Filter Bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50/30 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:flex-1 sm:max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={(val) => { setSearchQuery(val); setPage(1); }}
                  onClear={() => { setSearchQuery(''); setPage(1); }}
                  placeholder="Search by booking ID, room, or reason..."
                  size="md"
                  className="w-full"
                />
              </div>
              <div className="hidden sm:block sm:flex-1" />
              <div className="w-full sm:w-auto">
                <FilterSelect
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setPage(1); }}
                  options={STATUS_OPTIONS}
                  placeholder="All Status"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <Table className="w-full">
            <TableHeader>
              <tr>
                <TableHead>ID</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>From Room</TableHead>
                <TableHead>To Room</TableHead>
                <TableHead>Move Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Moved At</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={9} rows={5} />
              ) : paged.length === 0 ? (
                <TableEmpty
                  icon={ArrowRightLeft}
                  title="No room moves found"
                  description={searchQuery ? 'Try adjusting your search or filters' : 'Schedule a room move to get started'}
                />
              ) : paged.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-neutral-500">{m.id}</TableCell>
                  <TableCell className="font-medium">#{m.booking_id}</TableCell>
                  <TableCell>{m.from_room_number || m.from_room_id}</TableCell>
                  <TableCell>{m.to_room_number || m.to_room_id}</TableCell>
                  <TableCell className="text-neutral-600">{m.scheduled_date}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-neutral-600">{m.move_reason || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.status] || 'neutral'} size="sm">
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-500 text-[11px]">
                    {m.moved_at ? new Date(m.moved_at).toLocaleString() : '—'}
                  </TableCell>
                  <TableActions>
                    {m.status === 'scheduled' && (
                      <>
                        <IconButton
                          icon={Play}
                          label="Execute"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmAction({ type: 'execute', moveId: m.id })}
                        />
                        <IconButton
                          icon={XCircle}
                          label="Cancel"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmAction({ type: 'cancel', moveId: m.id })}
                        />
                      </>
                    )}
                  </TableActions>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 bg-neutral-50/30">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Drawer */}
      <CreateDrawer isOpen={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />

      {/* Execute Confirm Modal */}
      <ConfirmModal
        open={confirmAction?.type === 'execute'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleExecute(confirmAction.moveId)}
        title="Execute Room Move?"
        description="This will move the guest to the new room immediately. This action cannot be undone."
        confirmText="Execute"
        cancelText="Cancel"
        variant="primary"
      />

      {/* Cancel Confirm Modal */}
      <ConfirmModal
        open={confirmAction?.type === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleCancel(confirmAction.moveId)}
        title="Cancel Room Move?"
        description="This scheduled room move will be cancelled."
        confirmText="Cancel Move"
        cancelText="Go Back"
        variant="danger"
      />
    </div>
  );
}
