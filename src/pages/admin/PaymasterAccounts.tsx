/**
 * PaymasterAccounts — Holding accounts for disputed charges.
 * Table + detail drawer with postings, transfer to booking, and write-off actions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet, Plus, X, ChevronLeft, ChevronRight, ArrowRight, Trash2,
} from 'lucide-react';
import {
  paymasterService, type PaymasterAccount, type PaymasterPosting,
} from '@/api/services/paymaster.service';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || colors.closed}`}>
      {status}
    </span>
  );
}

// ── Create Modal ────────────────────────────────────────────────────────────
function CreateModal({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: { account_name?: string; account_code?: string; notes?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ account_name: '', account_code: '', notes: '' });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        account_name: form.account_name || undefined,
        account_code: form.account_code || undefined,
        notes: form.notes || undefined,
      });
      onClose();
      setForm({ account_name: '', account_code: '', notes: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create');
    }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30';
  const labelCls = 'block text-[12px] font-medium text-neutral-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">New Paymaster Account</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Account Name</label>
            <input className={inputCls} value={form.account_name}
              onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="e.g. Disputed Charges Pool" />
          </div>
          <div>
            <label className={labelCls}>Account Code</label>
            <input className={inputCls} value={form.account_code}
              onChange={e => setForm(f => ({ ...f, account_code: e.target.value }))} placeholder="Optional code" />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Transfer Modal ─────────────────────────────────────────────────────────
function TransferModal({ isOpen, onClose, accountId, postings, onSave }: {
  isOpen: boolean; onClose: () => void; accountId: number;
  postings: PaymasterPosting[];
  onSave: (data: { posting_ids: number[]; target_booking_id: number; notes?: string }) => Promise<void>;
}) {
  const [bookingId, setBookingId] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const chargePostings = postings.filter(p => p.posting_type === 'charge_in');

  const togglePosting = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || selectedIds.length === 0) return;
    setSaving(true);
    try {
      await onSave({ posting_ids: selectedIds, target_booking_id: parseInt(bookingId), notes: notes || undefined });
      onClose();
      setBookingId('');
      setSelectedIds([]);
      setNotes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Transfer failed');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">Transfer to Booking</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Target Booking ID *</label>
            <input type="number" value={bookingId} onChange={e => setBookingId(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30" required />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-2">Select Postings to Transfer</label>
            {chargePostings.length === 0 ? (
              <p className="text-[12px] text-neutral-400">No charge postings available</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {chargePostings.map(p => (
                  <label key={p.id} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100">
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => togglePosting(p.id)} />
                    <span className="text-[12px] text-neutral-700 flex-1">{p.description}</span>
                    <span className="text-[12px] font-medium text-neutral-900">{p.amount.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 min-h-[50px]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving || selectedIds.length === 0} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Write Off Modal ─────────────────────────────────────────────────────────
function WriteOffModal({ isOpen, onClose, accountId, onSave }: {
  isOpen: boolean; onClose: () => void; accountId: number;
  onSave: (amount: number, reason: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason) return;
    setSaving(true);
    try {
      await onSave(parseFloat(amount), reason);
      onClose();
      setAmount('');
      setReason('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Write-off failed');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">Write Off</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Amount *</label>
            <input type="number" min={0} step={0.01} value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30" required />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 min-h-[60px]" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Writing off...' : 'Write Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────
function DetailDrawer({ account, onClose, onRefresh }: {
  account: PaymasterAccount; onClose: () => void; onRefresh: () => void;
}) {
  const [postings, setPostings] = useState<PaymasterPosting[]>([]);
  const [loadingPostings, setLoadingPostings] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);

  useEffect(() => {
    setLoadingPostings(true);
    paymasterService.getPostings(account.id, { limit: 100 })
      .then(data => setPostings(data?.items || data || []))
      .catch(() => {})
      .finally(() => setLoadingPostings(false));
  }, [account.id]);

  const handleTransfer = async (data: any) => {
    await paymasterService.transferToBooking(account.id, data);
    toast.success('Transfer completed');
    onRefresh();
  };

  const handleWriteOff = async (amount: number, reason: string) => {
    await paymasterService.writeOff(account.id, amount, reason);
    toast.success('Write-off recorded');
    onRefresh();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-xl border-l border-neutral-200 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div>
          <h2 className="text-[15px] font-semibold text-neutral-900">{account.account_name || 'Paymaster Account'}</h2>
          <p className="text-[12px] text-neutral-500">{account.account_code || `#${account.id}`}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-neutral-500">Total Charges</p>
            <p className="text-[14px] font-bold text-neutral-900">{account.total_charges.toFixed(2)}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-neutral-500">Transferred</p>
            <p className="text-[14px] font-bold text-neutral-900">{account.total_transferred.toFixed(2)}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-neutral-500">Balance</p>
            <p className={`text-[14px] font-bold ${account.current_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {account.current_balance.toFixed(2)}
            </p>
          </div>
        </div>

        {account.notes && (
          <div className="text-[12px] text-neutral-600 bg-neutral-50 rounded-lg p-3">{account.notes}</div>
        )}

        {/* Postings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">Postings</h3>
            <span className="text-[11px] text-neutral-400">{Array.isArray(postings) ? postings.length : 0} items</span>
          </div>
          {loadingPostings ? (
            <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div>
          ) : !Array.isArray(postings) || postings.length === 0 ? (
            <p className="text-[13px] text-neutral-400">No postings yet</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {postings.map((p: PaymasterPosting) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="text-[12px] font-medium text-neutral-800">{p.description}</p>
                    <p className="text-[10px] text-neutral-400">
                      {p.posting_type} — {new Date(p.posted_at).toLocaleDateString()}
                      {p.source_booking_id ? ` — Booking #${p.source_booking_id}` : ''}
                    </p>
                  </div>
                  <span className={`text-[12px] font-medium ${
                    p.posting_type === 'charge_in' ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {p.posting_type === 'charge_in' ? '+' : '-'}{p.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {account.status === 'active' && (
          <div className="flex gap-3">
            <button
              onClick={() => setTransferOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-terra-700 bg-terra-50 border border-terra-200 rounded-lg hover:bg-terra-100"
            >
              <ArrowRight size={15} />
              Transfer to Booking
            </button>
            <button
              onClick={() => setWriteOffOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              <Trash2 size={15} />
              Write Off
            </button>
          </div>
        )}
      </div>

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        accountId={account.id}
        postings={Array.isArray(postings) ? postings : []}
        onSave={handleTransfer}
      />
      <WriteOffModal
        isOpen={writeOffOpen}
        onClose={() => setWriteOffOpen(false)}
        accountId={account.id}
        onSave={handleWriteOff}
      />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PaymasterAccounts() {
  const [accounts, setAccounts] = useState<PaymasterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PaymasterAccount | null>(null);
  const perPage = 15;

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymasterService.listAccounts({ status: statusFilter || undefined, limit: 200 });
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load paymaster accounts');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return accounts.slice(start, start + perPage);
  }, [accounts, page]);
  const totalPages = Math.ceil(accounts.length / perPage);

  const handleCreate = async (data: any) => {
    await paymasterService.createAccount(data);
    toast.success('Account created');
    fetchAccounts();
  };

  const handleRefreshFromDrawer = () => {
    fetchAccounts();
    setSelectedAccount(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Paymaster Accounts</h1>
            <p className="text-[12px] text-neutral-500">{accounts.length} accounts</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 transition-colors"
        >
          <Plus size={16} />
          New Account
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
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['Code', 'Account Name', 'Total Charges', 'Transferred', 'Balance', 'Status', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-neutral-400">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-neutral-400">No paymaster accounts found</td></tr>
              ) : paged.map(acct => (
                <tr
                  key={acct.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedAccount(acct)}
                >
                  <td className="px-4 py-3 text-[12px] font-mono text-neutral-600">{acct.account_code || `#${acct.id}`}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">{acct.account_name || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{acct.total_charges.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700">{acct.total_transferred.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] font-medium ${acct.current_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {acct.current_balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={acct.status} /></td>
                  <td className="px-4 py-3 text-[11px] text-neutral-500">{new Date(acct.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <p className="text-[12px] text-neutral-500">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, accounts.length)} of {accounts.length}
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

      {selectedAccount && (
        <>
          <div className="fixed inset-0 z-30 bg-black/10" onClick={() => setSelectedAccount(null)} />
          <DetailDrawer account={selectedAccount} onClose={() => setSelectedAccount(null)} onRefresh={handleRefreshFromDrawer} />
        </>
      )}
    </div>
  );
}
