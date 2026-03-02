/**
 * PreAuthHolds — Admin page for managing pre-authorization / card holds.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, Plus, Ban, CreditCard,
} from 'lucide-react';
import { preauthService, type AuthorizationHold } from '@/api/services/preauth.service';
import { useToast } from '@/contexts/ToastContext';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter,
  ConfirmModal,
} from '@/components/ui2/Modal';
import { Button } from '@/components/ui2/Button';
import { Badge } from '@/components/ui2/Badge';
import { SearchBar } from '@/components/ui2/SearchBar';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableActions, TableEmpty, TableSkeleton, Pagination,
} from '@/components/ui2/Table';

/* ── FilterSelect (matches Bookings pattern) ─────────────────────────────── */
function FilterSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = !value || value === 'all' ? placeholder : selectedOption?.label;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-[13px] bg-white border transition-all duration-150 flex items-center gap-1.5 sm:gap-2 focus:outline-none w-full sm:min-w-[140px] ${
          isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : value && value !== 'all'
              ? 'border-terra-300 bg-terra-50'
              : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className={value && value !== 'all' ? 'text-terra-700 font-medium' : 'text-neutral-500'}>
          {displayLabel}
        </span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${value && value !== 'all' ? 'text-terra-500' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden min-w-[160px]">
            {options.map(option => (
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

/* ── Status variant helper ───────────────────────────────────────────────── */
function holdStatusVariant(status: string): 'info' | 'success' | 'neutral' | 'danger' {
  switch (status) {
    case 'authorized': return 'info';
    case 'captured': return 'success';
    case 'released': return 'neutral';
    case 'expired': return 'danger';
    default: return 'info';
  }
}

/* ── Create Hold Modal ───────────────────────────────────────────────────── */
function CreateHoldModal({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: { booking_id: number; hold_amount?: number; card_last4?: string; card_brand?: string; notes?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ booking_id: '', hold_amount: '', card_last4: '', card_brand: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const { error } = useToast();

  useEffect(() => {
    if (isOpen) setForm({ booking_id: '', hold_amount: '', card_last4: '', card_brand: '', notes: '' });
  }, [isOpen]);

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400';
  const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

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
      error(err?.response?.data?.detail || 'Failed to create hold');
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>New Pre-Authorization Hold</ModalTitle>
          <ModalDescription>Create a card hold for a booking reservation</ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Booking ID *</label>
              <input className={inputCls} type="number" value={form.booking_id}
                onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))}
                placeholder="e.g. 42" required />
            </div>
            <div>
              <label className={labelCls}>Hold Amount (leave blank for auto-calc)</label>
              <input className={inputCls} type="number" step="0.01" value={form.hold_amount}
                onChange={e => setForm(f => ({ ...f, hold_amount: e.target.value }))}
                placeholder="Auto-calculated from config" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Card Last 4</label>
                <input className={inputCls} maxLength={4} value={form.card_last4}
                  onChange={e => setForm(f => ({ ...f, card_last4: e.target.value }))}
                  placeholder="1234" />
              </div>
              <div>
                <label className={labelCls}>Card Brand</label>
                <select className={inputCls} value={form.card_brand}
                  onChange={e => setForm(f => ({ ...f, card_brand: e.target.value }))}>
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
              <input className={inputCls} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes" />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving} loading={saving}>
            {saving ? 'Creating...' : 'Create Hold'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ── Capture Modal ───────────────────────────────────────────────────────── */
function CaptureModal({ isOpen, hold, onClose, onCapture }: {
  isOpen: boolean; hold: AuthorizationHold | null; onClose: () => void;
  onCapture: (holdId: number, data: { capture_amount?: number; notes?: string }) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { error } = useToast();
  const { formatSimple } = useCurrency();

  useEffect(() => {
    if (hold) { setAmount(String(hold.hold_amount)); setNotes(''); }
  }, [hold]);

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400';
  const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hold) return;
    setSaving(true);
    try {
      await onCapture(hold.id, { capture_amount: parseFloat(amount) || undefined, notes: notes || undefined });
      onClose();
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Capture failed');
    }
    setSaving(false);
  };

  if (!hold) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Capture Hold</ModalTitle>
          <ModalDescription>
            Auth: {hold.authorization_code} | Max: {formatSimple(hold.hold_amount)}
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Capture Amount</label>
              <input className={inputCls} type="number" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)} max={hold.hold_amount} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={saving} loading={saving}>
            {saving ? 'Capturing...' : 'Capture'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function PreAuthHolds() {
  const [holds, setHolds] = useState<AuthorizationHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [captureHold, setCaptureHold] = useState<AuthorizationHold | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<AuthorizationHold | null>(null);
  const perPage = 20;
  const { success, error } = useToast();
  const { formatSimple } = useCurrency();

  const fetchHolds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await preauthService.list({
        hold_status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setHolds(Array.isArray(data) ? data : []);
    } catch {
      error('Failed to load holds');
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
    success('Hold created');
    fetchHolds();
  };

  const handleRelease = async () => {
    if (!releaseTarget) return;
    try {
      await preauthService.release(releaseTarget.id, 'manual_release');
      success('Hold released');
      fetchHolds();
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Release failed');
    }
    setReleaseTarget(null);
  };

  const handleCapture = async (holdId: number, data: { capture_amount?: number; notes?: string }) => {
    await preauthService.capture(holdId, data);
    success('Hold captured');
    fetchHolds();
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'authorized', label: 'Authorized' },
    { value: 'captured', label: 'Captured' },
    { value: 'released', label: 'Released' },
    { value: 'expired', label: 'Expired' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Pre-Authorization Holds</h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">
              {filtered.length} hold{filtered.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            New Hold
          </Button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[10px] overflow-hidden">
          {/* Filter bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50/30 border-b border-neutral-100">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="sm:flex-1 sm:max-w-md w-full">
                <SearchBar
                  value={search}
                  onChange={v => { setSearch(v); setPage(1); }}
                  onClear={() => setSearch('')}
                  placeholder="Search by booking ID, auth code, card..."
                  size="sm"
                />
              </div>
              <div className="hidden sm:block sm:flex-1" />
              <FilterSelect
                value={statusFilter}
                onChange={v => { setStatusFilter(v); setPage(1); }}
                options={statusOptions}
                placeholder="Status"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Auth Code</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Authorized</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={8} rows={5} />
                ) : paged.length === 0 ? (
                  <TableEmpty
                    colSpan={8}
                    icon={Shield}
                    title="No holds found"
                    description={search ? 'Try adjusting your search or filters' : 'Create a new hold to get started'}
                  />
                ) : paged.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono font-bold text-neutral-900">#{h.booking_id}</TableCell>
                    <TableCell className="font-mono text-neutral-600">{h.authorization_code || '—'}</TableCell>
                    <TableCell className="font-semibold text-neutral-900">{h.hold_amount != null ? formatSimple(h.hold_amount) : '—'}</TableCell>
                    <TableCell className="text-neutral-600">
                      {h.card_brand && h.card_last4 ? `${h.card_brand} ••${h.card_last4}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={holdStatusVariant(h.status)}>{h.status}</Badge>
                    </TableCell>
                    <TableCell className="text-neutral-500">{fmtDate(h.authorized_at)}</TableCell>
                    <TableCell className="text-neutral-500">{fmtDate(h.expires_at)}</TableCell>
                    <TableCell>
                      {h.status === 'authorized' && (
                        <TableActions>
                          <Button
                            variant="outline-success"
                            size="xs"
                            onClick={() => setCaptureHold(h)}
                          >
                            <CreditCard size={12} className="mr-1" />
                            Capture
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="xs"
                            onClick={() => setReleaseTarget(h)}
                          >
                            <Ban size={12} className="mr-1" />
                            Release
                          </Button>
                        </TableActions>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 0 && (
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

        {/* Modals */}
        <CreateHoldModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
        <CaptureModal isOpen={!!captureHold} hold={captureHold} onClose={() => setCaptureHold(null)} onCapture={handleCapture} />

        <ConfirmModal
          isOpen={!!releaseTarget}
          onClose={() => setReleaseTarget(null)}
          onConfirm={handleRelease}
          variant="danger"
          title="Release Hold?"
          description={releaseTarget
            ? `Release hold ${releaseTarget.authorization_code} (${formatSimple(releaseTarget.hold_amount)})?`
            : ''
          }
          confirmLabel="Release"
        />
      </div>
    </div>
  );
}
