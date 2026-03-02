/**
 * PaymasterAccounts — Holding accounts for disputed charges.
 * Table + detail drawer with postings, transfer to booking, and write-off actions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet, Plus, ArrowRight, Trash2, Search,
} from 'lucide-react';
import {
  paymasterService, type PaymasterAccount, type PaymasterPosting,
} from '@/api/services/paymaster.service';
import { useToast } from '@/contexts/ToastContext';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter,
} from '@/components/ui2/Modal';
import { Drawer } from '@/components/ui2/Drawer';
import { Button } from '@/components/ui2/Button';
import { Badge } from '@/components/ui2/Badge';
import { SearchBar } from '@/components/ui2/SearchBar';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableEmpty, TableSkeleton, Pagination,
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
function statusVariant(status: string): 'success' | 'neutral' {
  return status === 'active' ? 'success' : 'neutral';
}

/* ── Create Modal ────────────────────────────────────────────────────────── */
function CreateModal({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: { account_name?: string; account_code?: string; notes?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ account_name: '', account_code: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const { error } = useToast();

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400';
  const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

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
      error(err?.response?.data?.detail || 'Failed to create');
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>New Paymaster Account</ModalTitle>
          <ModalDescription>Create a holding account for disputed charges</ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Account Name</label>
              <input className={inputCls} value={form.account_name}
                onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                placeholder="e.g. Disputed Charges Pool" />
            </div>
            <div>
              <label className={labelCls}>Account Code</label>
              <input className={inputCls} value={form.account_code}
                onChange={e => setForm(f => ({ ...f, account_code: e.target.value }))}
                placeholder="Optional code" />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea className={`${inputCls} min-h-[60px]`} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving} loading={saving}>
            {saving ? 'Creating...' : 'Create Account'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ── Transfer Modal ──────────────────────────────────────────────────────── */
function TransferModal({ isOpen, onClose, postings, onSave }: {
  isOpen: boolean; onClose: () => void;
  postings: PaymasterPosting[];
  onSave: (data: { posting_ids: number[]; target_booking_id: number; notes?: string }) => Promise<void>;
}) {
  const [bookingId, setBookingId] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { error } = useToast();
  const { formatSimple } = useCurrency();

  const chargePostings = postings.filter(p => p.posting_type === 'charge_in');

  const togglePosting = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400';
  const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

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
      error(err?.response?.data?.detail || 'Transfer failed');
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Transfer to Booking</ModalTitle>
          <ModalDescription>Select postings and transfer them to a guest booking</ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Target Booking ID *</label>
              <input type="number" value={bookingId} onChange={e => setBookingId(e.target.value)}
                className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Select Postings to Transfer</label>
              {chargePostings.length === 0 ? (
                <p className="text-[12px] text-neutral-400 mt-1">No charge postings available</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto mt-1">
                  {chargePostings.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => togglePosting(p.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-terra-600 focus:ring-terra-500"
                      />
                      <span className="text-[12px] text-neutral-700 flex-1">{p.description}</span>
                      <span className="text-[12px] font-medium text-neutral-900">{formatSimple(p.amount)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className={`${inputCls} min-h-[50px]`} />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || selectedIds.length === 0} loading={saving}>
            {saving ? 'Transferring...' : 'Transfer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ── Write Off Modal ─────────────────────────────────────────────────────── */
function WriteOffModal({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (amount: number, reason: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { error } = useToast();

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400';
  const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

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
      error(err?.response?.data?.detail || 'Write-off failed');
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Write Off</ModalTitle>
          <ModalDescription>Write off an amount from this paymaster account</ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Amount *</label>
              <input type="number" min={0} step={0.01} value={amount}
                onChange={e => setAmount(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Reason *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                className={`${inputCls} min-h-[60px]`} required />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={saving} loading={saving}>
            {saving ? 'Writing off...' : 'Write Off'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ── Detail Drawer ───────────────────────────────────────────────────────── */
function DetailDrawer({ account, onClose, onRefresh }: {
  account: PaymasterAccount; onClose: () => void; onRefresh: () => void;
}) {
  const [postings, setPostings] = useState<PaymasterPosting[]>([]);
  const [loadingPostings, setLoadingPostings] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const { success } = useToast();
  const { formatSimple } = useCurrency();

  useEffect(() => {
    setLoadingPostings(true);
    paymasterService.getPostings(account.id, { limit: 100 })
      .then(data => setPostings(data?.items || data || []))
      .catch(() => {})
      .finally(() => setLoadingPostings(false));
  }, [account.id]);

  const handleTransfer = async (data: any) => {
    await paymasterService.transferToBooking(account.id, data);
    success('Transfer completed');
    onRefresh();
  };

  const handleWriteOff = async (amount: number, reason: string) => {
    await paymasterService.writeOff(account.id, amount, reason);
    success('Write-off recorded');
    onRefresh();
  };

  return (
    <>
      <Drawer
        isOpen={true}
        onClose={onClose}
        title={account.account_name || 'Paymaster Account'}
        subtitle={account.account_code || `#${account.id}`}
        maxWidth="max-w-lg"
        footer={
          account.status === 'active' ? (
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setTransferOpen(true)}>
                <ArrowRight size={15} className="mr-2" />
                Transfer to Booking
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => setWriteOffOpen(true)}>
                <Trash2 size={15} className="mr-2" />
                Write Off
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-neutral-500">Total Charges</p>
              <p className="text-[14px] font-bold text-neutral-900">{formatSimple(account.total_charges)}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-neutral-500">Transferred</p>
              <p className="text-[14px] font-bold text-neutral-900">{formatSimple(account.total_transferred)}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-neutral-500">Balance</p>
              <p className={`text-[14px] font-bold ${account.current_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatSimple(account.current_balance)}
              </p>
            </div>
          </div>

          {account.notes && (
            <div className="text-[12px] text-neutral-600 bg-neutral-50 rounded-xl p-3">{account.notes}</div>
          )}

          {/* Postings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Postings</h3>
              <span className="text-[11px] text-neutral-400">{Array.isArray(postings) ? postings.length : 0} items</span>
            </div>
            {loadingPostings ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" />
              </div>
            ) : !Array.isArray(postings) || postings.length === 0 ? (
              <p className="text-[13px] text-neutral-400 text-center py-6">No postings yet</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {postings.map((p: PaymasterPosting) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2.5 bg-neutral-50 rounded-xl">
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
                      {p.posting_type === 'charge_in' ? '+' : '-'}{formatSimple(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        postings={Array.isArray(postings) ? postings : []}
        onSave={handleTransfer}
      />
      <WriteOffModal
        isOpen={writeOffOpen}
        onClose={() => setWriteOffOpen(false)}
        onSave={handleWriteOff}
      />
    </>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function PaymasterAccounts() {
  const [accounts, setAccounts] = useState<PaymasterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PaymasterAccount | null>(null);
  const perPage = 15;
  const { success, error } = useToast();
  const { formatSimple } = useCurrency();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymasterService.listAccounts({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 200,
      });
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      error('Failed to load paymaster accounts');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a =>
      (a.account_name || '').toLowerCase().includes(q) ||
      (a.account_code || '').toLowerCase().includes(q) ||
      String(a.id).includes(q)
    );
  }, [accounts, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleCreate = async (data: any) => {
    await paymasterService.createAccount(data);
    success('Account created');
    fetchAccounts();
  };

  const handleRefreshFromDrawer = () => {
    fetchAccounts();
    setSelectedAccount(null);
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Paymaster Accounts</h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            New Account
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
                  onChange={setSearch}
                  onClear={() => setSearch('')}
                  placeholder="Search accounts..."
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
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Total Charges</TableHead>
                  <TableHead>Transferred</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={7} rows={5} />
                ) : paged.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    icon={Wallet}
                    title="No paymaster accounts found"
                    description={search ? 'Try adjusting your search or filters' : 'Create a new account to get started'}
                  />
                ) : paged.map(acct => (
                  <TableRow
                    key={acct.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedAccount(acct)}
                  >
                    <TableCell className="font-mono text-neutral-600">{acct.account_code || `#${acct.id}`}</TableCell>
                    <TableCell className="font-medium text-neutral-900">{acct.account_name || '—'}</TableCell>
                    <TableCell>{formatSimple(acct.total_charges)}</TableCell>
                    <TableCell>{formatSimple(acct.total_transferred)}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${acct.current_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatSimple(acct.current_balance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(acct.status)}>{acct.status}</Badge>
                    </TableCell>
                    <TableCell className="text-neutral-500">{new Date(acct.created_at).toLocaleDateString()}</TableCell>
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

        <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />

        {selectedAccount && (
          <DetailDrawer
            account={selectedAccount}
            onClose={() => setSelectedAccount(null)}
            onRefresh={handleRefreshFromDrawer}
          />
        )}
      </div>
    </div>
  );
}
