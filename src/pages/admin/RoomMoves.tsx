/**
 * RoomMoves — Scheduled room moves with create, execute, and cancel actions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRightLeft, Plus, X, ChevronLeft, ChevronRight, Play, XCircle,
} from 'lucide-react';
import { roomMovesService, type RoomMove } from '@/api/services/room-moves.service';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || colors.cancelled}`}>
      {status}
    </span>
  );
}

// ── Create Modal ────────────────────────────────────────────────────────────
function CreateModal({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: { booking_id: number; to_room_id: number; scheduled_date: string; move_reason?: string; notes?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ booking_id: '', to_room_id: '', scheduled_date: '', move_reason: '', notes: '' });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

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
      onClose();
      setForm({ booking_id: '', to_room_id: '', scheduled_date: '', move_reason: '', notes: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create room move');
    }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30';
  const labelCls = 'block text-[12px] font-medium text-neutral-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">Schedule Room Move</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Booking ID *</label>
            <input type="number" className={inputCls} value={form.booking_id}
              onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>To Room ID *</label>
            <input type="number" className={inputCls} value={form.to_room_id}
              onChange={e => setForm(f => ({ ...f, to_room_id: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>Move Date *</label>
            <input type="date" className={inputCls} value={form.scheduled_date}
              onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>Reason</label>
            <input className={inputCls} value={form.move_reason}
              onChange={e => setForm(f => ({ ...f, move_reason: e.target.value }))} placeholder="e.g. Guest request, maintenance" />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Schedule Move'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RoomMoves() {
  const [moves, setMoves] = useState<RoomMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const perPage = 15;

  const fetchMoves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roomMovesService.list({ status: statusFilter || undefined, limit: 200 });
      setMoves(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load room moves');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return moves.slice(start, start + perPage);
  }, [moves, page]);
  const totalPages = Math.ceil(moves.length / perPage);

  const handleCreate = async (data: any) => {
    await roomMovesService.create(data);
    toast.success('Room move scheduled');
    fetchMoves();
  };

  const handleExecute = async (id: number) => {
    if (!window.confirm('Execute this room move now?')) return;
    try {
      await roomMovesService.execute(id);
      toast.success('Room move executed');
      fetchMoves();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to execute');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this scheduled room move?')) return;
    try {
      await roomMovesService.cancel(id);
      toast.success('Room move cancelled');
      fetchMoves();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to cancel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <ArrowRightLeft size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Room Moves</h1>
            <p className="text-[12px] text-neutral-500">{moves.length} moves</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 transition-colors"
        >
          <Plus size={16} />
          Schedule Move
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['ID', 'Booking', 'From Room', 'To Room', 'Move Date', 'Reason', 'Status', 'Moved At', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-neutral-400">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-neutral-400">No room moves found</td></tr>
              ) : paged.map(m => (
                <tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3 text-[12px] font-mono text-neutral-600">{m.id}</td>
                  <td className="px-4 py-3 text-[12px] font-medium text-neutral-900">#{m.booking_id}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{m.from_room_number || m.from_room_id}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{m.to_room_number || m.to_room_id}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{m.scheduled_date}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600 max-w-[150px] truncate">{m.move_reason || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-[11px] text-neutral-500">
                    {m.moved_at ? new Date(m.moved_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {m.status === 'scheduled' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleExecute(m.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50" title="Execute"
                        >
                          <Play size={14} className="text-emerald-600" />
                        </button>
                        <button
                          onClick={() => handleCancel(m.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50" title="Cancel"
                        >
                          <XCircle size={14} className="text-red-500" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <p className="text-[12px] text-neutral-500">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, moves.length)} of {moves.length}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-[12px] text-neutral-600">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
    </div>
  );
}
