/**
 * CorporateAccounts — Admin page for managing corporate accounts.
 * Glimmora Design System v5.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Edit2, Trash2, FileText, CheckCircle2,
  DollarSign, Loader2,
} from 'lucide-react';
import { corporateService, type CorporateAccount, type CorporateAccountCreate } from '@/api/services/corporate.service';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/contexts/ToastContext';

// UI2 Components
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter, ConfirmModal } from '@/components/ui2/Modal';
import { Drawer } from '@/components/ui2/Drawer';
import { Button, IconButton } from '@/components/ui2/Button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableActions, TableEmpty, TableSkeleton, Pagination,
} from '@/components/ui2/Table';
import { Badge } from '@/components/ui2/Badge';
import { SearchBar } from '@/components/ui2/SearchBar';
import { SimpleDropdown } from '@/components/ui/Select';

// ── Status badge mapping ────────────────────────────────────────────────────
const STATUS_VARIANT: Record<string, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'warning',
};

// ── Filter options ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

// ── Input styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400 hover:border-neutral-300 transition-all duration-150';
const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

// ── Create/Edit Modal ───────────────────────────────────────────────────────
function AccountModal({ isOpen, onClose, onSave, initial }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: CorporateAccountCreate) => Promise<void>;
  initial?: CorporateAccount | null;
}) {
  const [form, setForm] = useState<CorporateAccountCreate>({
    company_name: '', contact_name: '', contact_email: '', contact_phone: '',
    billing_address: '', city: '', state: '', country: '', tax_id: '',
    credit_limit: 0, payment_terms: '30', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { error: showError } = useToast();

  useEffect(() => {
    if (initial) {
      setForm({
        company_name: initial.company_name || '', account_code: initial.account_code || '',
        contact_name: initial.contact_name || '', contact_email: initial.contact_email || '',
        contact_phone: initial.contact_phone || '', billing_address: initial.billing_address || '',
        city: initial.city || '', state: initial.state || '', country: initial.country || '',
        tax_id: initial.tax_id || '', credit_limit: initial.credit_limit || 0,
        payment_terms: initial.payment_terms || '30',
        discount_percentage: initial.discount_percentage || undefined,
        contract_start_date: initial.contract_start_date || '',
        contract_end_date: initial.contract_end_date || '', notes: initial.notes || '',
      });
    } else {
      setForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', billing_address: '', city: '', state: '', country: '', tax_id: '', credit_limit: 0, payment_terms: '30', notes: '' });
    }
  }, [initial, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <ModalTitle>{initial ? 'Edit Corporate Account' : 'New Corporate Account'}</ModalTitle>
        <ModalDescription>{initial ? 'Update account details' : 'Create a new corporate account'}</ModalDescription>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <div className="space-y-5">
            <div>
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Company Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Company Name *</label>
                  <input className={inputCls} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelCls}>Contact Name</label>
                  <input className={inputCls} value={form.contact_name || ''} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Contact Email</label>
                  <input className={inputCls} type="email" value={form.contact_email || ''} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Contact Phone</label>
                  <input className={inputCls} value={form.contact_phone || ''} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Tax ID / GST</label>
                  <input className={inputCls} value={form.tax_id || ''} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Billing Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Address</label>
                  <input className={inputCls} value={form.billing_address || ''} onChange={e => setForm(f => ({ ...f, billing_address: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input className={inputCls} value={form.state || ''} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <input className={inputCls} value={form.country || ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Contract Terms</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Credit Limit</label>
                  <input className={inputCls} type="number" min={0} step={1000} value={form.credit_limit || 0} onChange={e => setForm(f => ({ ...f, credit_limit: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className={labelCls}>Payment Terms (days)</label>
                  <input className={inputCls} value={form.payment_terms || '30'} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Discount %</label>
                  <input className={inputCls} type="number" min={0} max={100} step={0.5} value={form.discount_percentage || ''} onChange={e => setForm(f => ({ ...f, discount_percentage: parseFloat(e.target.value) || undefined }))} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea className={`${inputCls} min-h-[60px] resize-none`} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" loading={saving}>
            {initial ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ── Detail Drawer ───────────────────────────────────────────────────────────
function DetailDrawer({ account, isOpen, onClose, onEdit, navigate }: {
  account: CorporateAccount | null; isOpen: boolean; onClose: () => void;
  onEdit: (a: CorporateAccount) => void; navigate: ReturnType<typeof useNavigate>;
}) {
  const { formatCurrency } = useCurrency();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (account?.id) {
      corporateService.getBookings(account.id).then(res => setBookings(res.bookings || [])).catch(() => {});
    }
  }, [account?.id]);

  if (!account) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={account.company_name}
      subtitle={account.account_code}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" icon={Edit2} onClick={() => onEdit(account)}>Edit</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#FAF8F6] rounded-xl p-3 text-center">
            <p className="text-[11px] text-neutral-500">Bookings</p>
            <p className="text-[18px] font-bold text-neutral-900">{account.total_bookings}</p>
          </div>
          <div className="bg-[#FAF8F6] rounded-xl p-3 text-center">
            <p className="text-[11px] text-neutral-500">Revenue</p>
            <p className="text-[14px] font-bold text-neutral-900">{formatCurrency(account.total_revenue)}</p>
          </div>
          <div className="bg-[#FAF8F6] rounded-xl p-3 text-center">
            <p className="text-[11px] text-neutral-500">AR Balance</p>
            <p className={`text-[14px] font-bold ${account.ar_balance > 0 ? 'text-gold-600' : 'text-sage-600'}`}>
              {formatCurrency(account.ar_balance)}
            </p>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Contact</h3>
          <div className="space-y-1 text-[13px]">
            {account.contact_name && <p><span className="text-neutral-500">Name:</span> {account.contact_name}</p>}
            {account.contact_email && <p><span className="text-neutral-500">Email:</span> {account.contact_email}</p>}
            {account.contact_phone && <p><span className="text-neutral-500">Phone:</span> {account.contact_phone}</p>}
          </div>
        </div>

        {/* Billing */}
        <div>
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Billing</h3>
          <div className="space-y-1 text-[13px]">
            {account.billing_address && <p>{account.billing_address}</p>}
            {(account.city || account.state) && <p>{[account.city, account.state].filter(Boolean).join(', ')}</p>}
            {account.tax_id && <p><span className="text-neutral-500">Tax ID:</span> {account.tax_id}</p>}
            <p><span className="text-neutral-500">Credit Limit:</span> {formatCurrency(account.credit_limit || 0)}</p>
            <p><span className="text-neutral-500">Payment Terms:</span> {account.payment_terms || '30'} days</p>
            {account.discount_percentage ? <p><span className="text-neutral-500">Discount:</span> {account.discount_percentage}%</p> : null}
          </div>
        </div>

        {/* Linked Bookings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Linked Bookings</h3>
            <span className="text-[11px] text-neutral-400">{bookings.length} total</span>
          </div>
          {bookings.length === 0 ? (
            <p className="text-[13px] text-neutral-400">No bookings linked yet</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-[#FAF8F6] rounded-lg text-[12px]">
                  <div>
                    <span className="font-medium text-neutral-800">#{b.booking_number}</span>
                    <span className="ml-2 text-neutral-500">{b.arrival_date}</span>
                  </div>
                  <Badge variant={STATUS_VARIANT[b.status] || 'neutral'} size="sm">{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View AR Ledger link */}
        <Button
          variant="outline"
          icon={FileText}
          onClick={() => navigate(`/admin/ar-ledger?corporate=${account.id}`)}
          fullWidth
        >
          View AR Ledger
        </Button>
      </div>
    </Drawer>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function CorporateAccounts() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { success, error: showError } = useToast();
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<CorporateAccount | null>(null);

  // Drawer state
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);

  // Confirm state
  const [deleteTarget, setDeleteTarget] = useState<CorporateAccount | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateService.listAccounts({ status: statusFilter || undefined, search: search || undefined });
      setAccounts(res.accounts || []);
    } catch {
      showError('Failed to load corporate accounts');
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // KPI calculations
  const activeCount = useMemo(() => accounts.filter(a => a.status === 'active').length, [accounts]);
  const totalAR = useMemo(() => accounts.reduce((sum, a) => sum + (a.ar_balance || 0), 0), [accounts]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return accounts.slice(start, start + perPage);
  }, [accounts, page]);
  const totalPages = Math.ceil(accounts.length / perPage);

  const handleCreate = async (data: CorporateAccountCreate) => {
    await corporateService.createAccount(data);
    success('Corporate account created');
    fetchAccounts();
  };

  const handleUpdate = async (data: CorporateAccountCreate) => {
    if (!editAccount) return;
    await corporateService.updateAccount(editAccount.id, data);
    success('Account updated');
    setEditAccount(null);
    fetchAccounts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await corporateService.deleteAccount(deleteTarget.id);
      success('Account deactivated');
      fetchAccounts();
    } catch {
      showError('Failed to deactivate');
    }
    setDeleteTarget(null);
  };

  const openEdit = (acct: CorporateAccount) => {
    setSelectedAccount(null);
    setEditAccount(acct);
    setModalOpen(true);
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F7' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-terra-500" />
          <p className="text-[13px] text-neutral-500 animate-pulse">Loading corporate accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Corporate Accounts</h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">
              Manage corporate accounts, credit limits and AR balances
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => { setEditAccount(null); setModalOpen(true); }} className="w-full sm:w-auto">
            Add Account
          </Button>
        </header>

        {/* ─── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-[10px] border border-neutral-100 p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-terra-50 flex items-center justify-center">
                <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-terra-600" />
              </div>
              <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Total Accounts</p>
            </div>
            <p className="text-[15px] sm:text-2xl font-semibold tracking-tight text-neutral-900">{accounts.length}</p>
            <p className="text-[9px] sm:text-[11px] text-neutral-400 font-medium mt-1">
              All corporate accounts
            </p>
          </div>

          <div className="bg-white rounded-[10px] border border-neutral-100 p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-sage-50 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-sage-600" />
              </div>
              <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Active</p>
            </div>
            <p className="text-[15px] sm:text-2xl font-semibold tracking-tight text-neutral-900">{activeCount}</p>
            <p className="text-[9px] sm:text-[11px] text-sage-600 font-medium mt-1">
              {accounts.length > 0 ? `${Math.round((activeCount / accounts.length) * 100)}% of total` : '—'}
            </p>
          </div>

          <div className="bg-white rounded-[10px] border border-neutral-100 p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${totalAR > 0 ? 'bg-gold-50' : 'bg-sage-50'}`}>
                {totalAR > 0
                  ? <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gold-600" />
                  : <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-sage-600" />
                }
              </div>
              <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Outstanding AR</p>
            </div>
            <p className="text-[15px] sm:text-2xl font-semibold tracking-tight text-neutral-900">{formatCurrency(totalAR)}</p>
            {totalAR > 0 ? (
              <p className="text-[9px] sm:text-[11px] text-gold-600 font-medium mt-1">Receivables pending</p>
            ) : (
              <p className="text-[9px] sm:text-[11px] text-sage-600 font-medium mt-1">All settled</p>
            )}
          </div>
        </div>

        {/* ─── Table Card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[10px] border border-neutral-100 overflow-hidden">

          {/* Search & Filter Bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50/30 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-full sm:flex-1 sm:max-w-xs">
                <SearchBar
                  value={search}
                  onChange={val => { setSearch(val); setPage(1); }}
                  onClear={() => { setSearch(''); setPage(1); }}
                  placeholder="Search by company name or code..."
                  size="md"
                />
              </div>
              <div className="hidden sm:block sm:flex-1" />
              <div className="w-[170px] flex-shrink-0">
                <SimpleDropdown
                  value={statusFilter}
                  onChange={val => { setStatusFilter(val); setPage(1); }}
                  options={STATUS_OPTIONS}
                  placeholder="All Status"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>AR Balance</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={8} rows={5} />
                ) : paged.length === 0 ? (
                  <TableEmpty
                    colSpan={8}
                    icon={Building2}
                    title="No corporate accounts found"
                    description="Add a corporate account to get started"
                  />
                ) : paged.map(acct => (
                  <TableRow key={acct.id} clickable onClick={() => setSelectedAccount(acct)}>
                    <TableCell className="font-mono text-neutral-500 text-[12px]">{acct.account_code}</TableCell>
                    <TableCell>
                      <p className="font-medium text-neutral-900">{acct.company_name}</p>
                      {acct.city && <p className="text-[11px] text-neutral-400">{acct.city}</p>}
                    </TableCell>
                    <TableCell className="text-neutral-600">{acct.contact_name || '—'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(acct.credit_limit || 0)}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${acct.ar_balance > 0 ? 'text-gold-600' : 'text-sage-600'}`}>
                        {formatCurrency(acct.ar_balance)}
                      </span>
                    </TableCell>
                    <TableCell>{acct.total_bookings}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[acct.status] || 'neutral'} dot>{acct.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <IconButton icon={Edit2} label="Edit" variant="ghost" size="sm" onClick={() => openEdit(acct)} />
                        {acct.status === 'active' && (
                          <IconButton icon={Trash2} label="Deactivate" variant="ghost" size="sm" onClick={() => setDeleteTarget(acct)} />
                        )}
                      </div>
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
                totalItems={accounts.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditAccount(null); }}
        onSave={editAccount ? handleUpdate : handleCreate}
        initial={editAccount}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        account={selectedAccount}
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        onEdit={openEdit}
        navigate={navigate}
      />

      {/* Deactivate Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Deactivate "${deleteTarget?.company_name}"?`}
        description="This corporate account will be marked as inactive."
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
