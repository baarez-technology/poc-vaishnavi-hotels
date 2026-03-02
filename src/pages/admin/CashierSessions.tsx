/**
 * CashierSessions — Cash register management with open/close/record modals.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard, Plus, X, ChevronLeft, ChevronRight, DollarSign, AlertTriangle,
} from 'lucide-react';
import { cashierSessionService, type CashierSession } from '@/api/services/cashier-session.service';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    variance_flagged: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || colors.closed}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ── Open Session Modal ─────────────────────────────────────────────────────
function OpenModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [balance, setBalance] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ opening_balance: balance, notes: notes || undefined });
      onClose();
      setBalance(0);
      setNotes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to open session');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">Open Cashier Session</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Opening Balance</label>
            <input type="number" min={0} step={0.01} value={balance} onChange={e => setBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 min-h-[60px]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Opening...' : 'Open Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Record Cash Modal ─────────────────────────────────────────────────────
function RecordCashModal({ isOpen, onClose, session, onSave }: {
  isOpen: boolean; onClose: () => void; session: CashierSession | null;
  onSave: (id: number, amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === 0) return;
    setSaving(true);
    try {
      await onSave(session.id, amount);
      onClose();
      setAmount(0);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to record cash');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">Record Cash Transaction</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-[12px] text-neutral-500">Session #{session.id} — Current received: {session.cash_received.toFixed(2)}</p>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Amount (positive = cash in, negative = cash out)</label>
            <input type="number" step={0.01} value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving || amount === 0} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Recording...' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Close Session Modal ──────────────────────────────────────────────────
function CloseModal({ isOpen, onClose, session, onSave }: {
  isOpen: boolean; onClose: () => void; session: CashierSession | null;
  onSave: (id: number, data: { closing_balance: number; notes?: string }) => Promise<void>;
}) {
  const [closingBalance, setClosingBalance] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !session) return null;

  const expectedBalance = session.opening_balance + session.cash_received - session.cash_paid_out;
  const variance = closingBalance - expectedBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(session.id, { closing_balance: closingBalance, notes: notes || undefined });
      onClose();
      setClosingBalance(0);
      setNotes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to close session');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">Close Cashier Session</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-neutral-500">Opening</p>
              <p className="text-[14px] font-bold text-neutral-900">{session.opening_balance.toFixed(2)}</p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-neutral-500">Expected</p>
              <p className="text-[14px] font-bold text-neutral-900">{expectedBalance.toFixed(2)}</p>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Actual Closing Balance</label>
            <input type="number" min={0} step={0.01} value={closingBalance} onChange={e => setClosingBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30" />
          </div>
          {closingBalance > 0 && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium ${
              Math.abs(variance) > 0.01 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {Math.abs(variance) > 0.01 && <AlertTriangle size={14} />}
              Variance: {variance >= 0 ? '+' : ''}{variance.toFixed(2)}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 min-h-[60px]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Closing...' : 'Close Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CashierSessions() {
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Modal state
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [recordSession, setRecordSession] = useState<CashierSession | null>(null);
  const [closeSession, setCloseSession] = useState<CashierSession | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cashierSessionService.list({ status: statusFilter || undefined, limit: 200 });
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load cashier sessions');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openCount = useMemo(() => sessions.filter(s => s.status === 'open').length, [sessions]);
  const totalCash = useMemo(() => sessions.filter(s => s.status === 'open').reduce((sum, s) => sum + s.cash_received, 0), [sessions]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return sessions.slice(start, start + perPage);
  }, [sessions, page]);
  const totalPages = Math.ceil(sessions.length / perPage);

  const handleOpen = async (data: any) => {
    await cashierSessionService.open(data);
    toast.success('Session opened');
    fetchSessions();
  };

  const handleRecordCash = async (id: number, amount: number) => {
    await cashierSessionService.recordCash(id, amount);
    toast.success('Cash recorded');
    fetchSessions();
  };

  const handleClose = async (id: number, data: { closing_balance: number; notes?: string }) => {
    await cashierSessionService.close(id, data);
    toast.success('Session closed');
    fetchSessions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Cashier Sessions</h1>
            <p className="text-[12px] text-neutral-500">{sessions.length} sessions</p>
          </div>
        </div>
        <button
          onClick={() => setOpenModalVisible(true)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 transition-colors"
        >
          <Plus size={16} />
          Open Session
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Open Sessions</p>
          <p className="text-[22px] font-bold text-neutral-900 mt-1">{openCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Total Cash (Open)</p>
          <p className="text-[22px] font-bold text-neutral-900 mt-1">{totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Total Sessions</p>
          <p className="text-[22px] font-bold text-neutral-900 mt-1">{sessions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Flagged</p>
          <p className="text-[22px] font-bold text-red-600 mt-1">{sessions.filter(s => s.status === 'variance_flagged').length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="variance_flagged">Variance Flagged</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['ID', 'Staff ID', 'Date', 'Status', 'Opening', 'Cash Received', 'Cash Paid Out', 'Expected', 'Closing', 'Variance', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-[13px] text-neutral-400">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-[13px] text-neutral-400">No sessions found</td></tr>
              ) : paged.map(s => (
                <tr key={s.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3 text-[12px] font-mono text-neutral-600">{s.id}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{s.staff_id}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{s.session_date}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{s.opening_balance.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[12px] text-emerald-600 font-medium">{s.cash_received.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[12px] text-red-600 font-medium">{s.cash_paid_out.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{s.expected_balance?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{s.closing_balance?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s.variance != null ? (
                      <span className={`text-[12px] font-medium ${Math.abs(s.variance) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {s.variance >= 0 ? '+' : ''}{s.variance.toFixed(2)}
                      </span>
                    ) : <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'open' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRecordSession(s)}
                          className="px-2 py-1 text-[11px] font-medium text-terra-700 bg-terra-50 border border-terra-200 rounded hover:bg-terra-100"
                        >
                          Record
                        </button>
                        <button
                          onClick={() => setCloseSession(s)}
                          className="px-2 py-1 text-[11px] font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded hover:bg-neutral-100"
                        >
                          Close
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
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, sessions.length)} of {sessions.length}
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

      {/* Modals */}
      <OpenModal isOpen={openModalVisible} onClose={() => setOpenModalVisible(false)} onSave={handleOpen} />
      <RecordCashModal isOpen={!!recordSession} onClose={() => setRecordSession(null)} session={recordSession} onSave={handleRecordCash} />
      <CloseModal isOpen={!!closeSession} onClose={() => setCloseSession(null)} session={closeSession} onSave={handleClose} />
    </div>
  );
}
