/**
 * PreAuthHolds — Admin page for managing pre-authorization / card holds.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, Plus, Search, X, ChevronLeft, ChevronRight, Ban, CreditCard,
} from 'lucide-react';
import { preauthService, type AuthorizationHold } from '@/api/services/preauth.service';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    authorized: 'bg-blue-50 text-blue-700 border-blue-200',
    captured: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    released: 'bg-neutral-50 text-neutral-500 border-neutral-200',
    expired: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || colors.authorized}`}>
      {status}
    </span>
  );
}

// ── Create Hold Modal ────────────────────────────────────────────────────
function CreateHoldModal({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: { booking_id: number; hold_amount?: number; card_last4?: string; card_brand?: string; notes?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ booking_id: '', hold_amount: '', card_last4: '', card_brand: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ booking_id: '', hold_amount: '', card_last4: '', card_brand: '', notes: '' });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.booking_id) return;
    setSaving(true);
    try {
      await onSave({
        booking_id: parseInt(form.booking_id),
        hold_amount: form.hold_amount ? parseFloat(form.hold_amount) : undefined,
        card_last4: form.card_last4 || undefined,
        card_brand: form.card_brand || undefined,
        notes: form.notes || undefined,
      });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create hold');
    }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30';
  const labelCls = 'block text-[12px] font-medium text-neutral-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">New Pre-Authorization Hold</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Booking ID *</label>
            <input className={inputCls} type="number" value={form.booking_id} onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))} placeholder="e.g. 42" required />
          </div>
          <div>
            <label className={labelCls}>Hold Amount (leave blank for auto-calc)</label>
            <input className={inputCls} type="number" step="0.01" value={form.hold_amount} onChange={e => setForm(f => ({ ...f, hold_amount: e.target.value }))} placeholder="Auto-calculated from config" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Card Last 4</label>
              <input className={inputCls} maxLength={4} value={form.card_last4} onChange={e => setForm(f => ({ ...f, card_last4: e.target.value }))} placeholder="1234" />
            </div>
            <div>
              <label className={labelCls}>Card Brand</label>
              <select className={inputCls} value={form.card_brand} onChange={e => setForm(f => ({ ...f, card_brand: e.target.value }))}>
                <option value="">Select</option>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">Amex</option>
                <option value="rupay">RuPay</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input className={inputCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Hold'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Capture Modal ────────────────────────────────────────────────────
function CaptureModal({ isOpen, hold, onClose, onCapture }: {
  isOpen: boolean; hold: AuthorizationHold | null; onClose: () => void;
  onCapture: (holdId: number, data: { capture_amount?: number; notes?: string }) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hold) { setAmount(String(hold.hold_amount)); setNotes(''); }
  }, [hold]);

  if (!isOpen || !hold) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onCapture(hold.id, { capture_amount: parseFloat(amount) || undefined, notes: notes || undefined });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Capture failed');
    }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">Capture Hold</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-[12px] text-neutral-500">Auth: {hold.authorization_code} | Max: {hold.hold_amount?.toFixed(2)}</p>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Capture Amount</label>
            <input className={inputCls} type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} max={hold.hold_amount} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Notes</label>
            <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Capturing...' : 'Capture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PreAuthHolds() {
  const [holds, setHolds] = useState<AuthorizationHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [captureHold, setCaptureHold] = useState<AuthorizationHold | null>(null);
  const perPage = 20;

  const fetchHolds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await preauthService.list({ hold_status: statusFilter || undefined });
      setHolds(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load holds');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchHolds(); }, [fetchHolds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return holds;
    const q = search.toLowerCase();
    return holds.filter(h =>
      String(h.booking_id).includes(q) ||
      h.authorization_code?.toLowerCase().includes(q) ||
      h.card_last4?.includes(q)
    );
  }, [holds, search]);

  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleCreate = async (data: Parameters<typeof preauthService.create>[0]) => {
    await preauthService.create(data);
    toast.success('Hold created');
    fetchHolds();
  };

  const handleRelease = async (hold: AuthorizationHold) => {
    if (!window.confirm(`Release hold ${hold.authorization_code} (${hold.hold_amount?.toFixed(2)})?`)) return;
    try {
      await preauthService.release(hold.id, 'manual_release');
      toast.success('Hold released');
      fetchHolds();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Release failed');
    }
  };

  const handleCapture = async (holdId: number, data: { capture_amount?: number; notes?: string }) => {
    await preauthService.capture(holdId, data);
    toast.success('Hold captured');
    fetchHolds();
  };

  const fmt = (v: number | null | undefined) => v != null ? `${v.toFixed(2)}` : '—';
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Pre-Authorization Holds</h1>
            <p className="text-[12px] text-neutral-500">{filtered.length} holds</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700">
          <Plus size={16} /> New Hold
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input placeholder="Search by booking ID, auth code, card..." className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="authorized">Authorized</option>
          <option value="captured">Captured</option>
          <option value="released">Released</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['Booking', 'Auth Code', 'Amount', 'Card', 'Status', 'Authorized', 'Expires', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div></td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-neutral-400">No holds found</td></tr>
              ) : paged.map(h => (
                <tr key={h.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3 text-[13px] font-mono font-bold text-neutral-900">#{h.booking_id}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-neutral-600">{h.authorization_code || '—'}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-neutral-900">{fmt(h.hold_amount)}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">
                    {h.card_brand && h.card_last4 ? `${h.card_brand} ••${h.card_last4}` : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                  <td className="px-4 py-3 text-[12px] text-neutral-500">{fmtDate(h.authorized_at)}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-500">{fmtDate(h.expires_at)}</td>
                  <td className="px-4 py-3">
                    {h.status === 'authorized' && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCaptureHold(h)} className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100">
                          <CreditCard size={12} className="inline mr-1" />Capture
                        </button>
                        <button onClick={() => handleRelease(h)} className="px-2 py-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                          <Ban size={12} className="inline mr-1" />Release
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
            <p className="text-[12px] text-neutral-500">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="px-2 text-[12px] text-neutral-600">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <CreateHoldModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      <CaptureModal isOpen={!!captureHold} hold={captureHold} onClose={() => setCaptureHold(null)} onCapture={handleCapture} />
    </div>
  );
}
