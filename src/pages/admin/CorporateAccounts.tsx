/**
 * CorporateAccounts — Admin page for managing corporate accounts.
 * Follows Guests.tsx pattern: table + search + create/edit modal + detail drawer.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, Edit2, Trash2, Link2, X,
  ChevronLeft, ChevronRight, CreditCard, FileText,
} from 'lucide-react';
import { corporateService, type CorporateAccount, type CorporateAccountCreate } from '@/api/services/corporate.service';
import { useCurrency } from '@/hooks/useCurrency';
import toast from 'react-hot-toast';

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || colors.inactive}`}>
      {status}
    </span>
  );
}

// ── Create/Edit Modal ───────────────────────────────────────────────────────

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CorporateAccountCreate) => Promise<void>;
  initial?: CorporateAccount | null;
}

function AccountModal({ isOpen, onClose, onSave, initial }: AccountModalProps) {
  const [form, setForm] = useState<CorporateAccountCreate>({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    billing_address: '',
    city: '',
    state: '',
    country: '',
    tax_id: '',
    credit_limit: 0,
    payment_terms: '30',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        company_name: initial.company_name || '',
        account_code: initial.account_code || '',
        contact_name: initial.contact_name || '',
        contact_email: initial.contact_email || '',
        contact_phone: initial.contact_phone || '',
        billing_address: initial.billing_address || '',
        city: initial.city || '',
        state: initial.state || '',
        country: initial.country || '',
        tax_id: initial.tax_id || '',
        credit_limit: initial.credit_limit || 0,
        payment_terms: initial.payment_terms || '30',
        discount_percentage: initial.discount_percentage || undefined,
        contract_start_date: initial.contract_start_date || '',
        contract_end_date: initial.contract_end_date || '',
        notes: initial.notes || '',
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
      toast.error(err?.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500';
  const labelCls = 'block text-[12px] font-medium text-neutral-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">
            {initial ? 'Edit Corporate Account' : 'New Corporate Account'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Company Info */}
          <div>
            <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Company Info</h3>
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

          {/* Billing */}
          <div>
            <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Billing Address</h3>
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

          {/* Contract Terms */}
          <div>
            <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Contract Terms</h3>
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

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Saving...' : initial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail Drawer ───────────────────────────────────────────────────────────

interface DetailDrawerProps {
  account: CorporateAccount | null;
  onClose: () => void;
  onEdit: (a: CorporateAccount) => void;
  navigate: ReturnType<typeof useNavigate>;
}

function DetailDrawer({ account, onClose, onEdit, navigate }: DetailDrawerProps) {
  const { formatCurrency } = useCurrency();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (account?.id) {
      corporateService.getBookings(account.id).then(res => setBookings(res.bookings || [])).catch(() => {});
    }
  }, [account?.id]);

  if (!account) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-xl border-l border-neutral-200 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div>
          <h2 className="text-[15px] font-semibold text-neutral-900">{account.company_name}</h2>
          <p className="text-[12px] text-neutral-500">{account.account_code}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(account)} className="p-1.5 rounded-lg hover:bg-neutral-100" title="Edit">
            <Edit2 size={16} className="text-neutral-500" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-neutral-500">Bookings</p>
            <p className="text-[18px] font-bold text-neutral-900">{account.total_bookings}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-neutral-500">Revenue</p>
            <p className="text-[14px] font-bold text-neutral-900">{formatCurrency(account.total_revenue)}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-neutral-500">AR Balance</p>
            <p className={`text-[14px] font-bold ${account.ar_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCurrency(account.ar_balance)}
            </p>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Contact</h3>
          <div className="space-y-1 text-[13px]">
            {account.contact_name && <p><span className="text-neutral-500">Name:</span> {account.contact_name}</p>}
            {account.contact_email && <p><span className="text-neutral-500">Email:</span> {account.contact_email}</p>}
            {account.contact_phone && <p><span className="text-neutral-500">Phone:</span> {account.contact_phone}</p>}
          </div>
        </div>

        {/* Billing */}
        <div>
          <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Billing</h3>
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
            <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">Linked Bookings</h3>
            <span className="text-[11px] text-neutral-400">{bookings.length} total</span>
          </div>
          {bookings.length === 0 ? (
            <p className="text-[13px] text-neutral-400">No bookings linked yet</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg text-[12px]">
                  <div>
                    <span className="font-medium text-neutral-800">#{b.booking_number}</span>
                    <span className="ml-2 text-neutral-500">{b.arrival_date}</span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View AR Ledger link */}
        <button
          onClick={() => navigate(`/admin/ar-ledger?corporate=${account.id}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-terra-700 bg-terra-50 border border-terra-200 rounded-lg hover:bg-terra-100 transition-colors"
        >
          <FileText size={15} />
          View AR Ledger
        </button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function CorporateAccounts() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
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

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateService.listAccounts({ status: statusFilter || undefined, search: search || undefined });
      setAccounts(res.accounts || []);
    } catch {
      toast.error('Failed to load corporate accounts');
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Pagination
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return accounts.slice(start, start + perPage);
  }, [accounts, page]);
  const totalPages = Math.ceil(accounts.length / perPage);

  const handleCreate = async (data: CorporateAccountCreate) => {
    await corporateService.createAccount(data);
    toast.success('Corporate account created');
    fetchAccounts();
  };

  const handleUpdate = async (data: CorporateAccountCreate) => {
    if (!editAccount) return;
    await corporateService.updateAccount(editAccount.id, data);
    toast.success('Account updated');
    setEditAccount(null);
    fetchAccounts();
  };

  const handleDelete = async (acct: CorporateAccount) => {
    if (!window.confirm(`Deactivate "${acct.company_name}"?`)) return;
    try {
      await corporateService.deleteAccount(acct.id);
      toast.success('Account deactivated');
      fetchAccounts();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const openEdit = (acct: CorporateAccount) => {
    setSelectedAccount(null);
    setEditAccount(acct);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Corporate Accounts</h1>
            <p className="text-[12px] text-neutral-500">{accounts.length} accounts</p>
          </div>
        </div>
        <button
          onClick={() => { setEditAccount(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 transition-colors"
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder="Search by company name or code..."
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['Code', 'Company', 'Contact', 'Credit Limit', 'AR Balance', 'Bookings', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-neutral-400">Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-neutral-400">No corporate accounts found</td></tr>
              ) : paged.map(acct => (
                <tr
                  key={acct.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedAccount(acct)}
                >
                  <td className="px-4 py-3 text-[12px] font-mono text-neutral-600">{acct.account_code}</td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-neutral-900">{acct.company_name}</p>
                    {acct.city && <p className="text-[11px] text-neutral-400">{acct.city}</p>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{acct.contact_name || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-700 font-medium">{formatCurrency(acct.credit_limit || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] font-medium ${acct.ar_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatCurrency(acct.ar_balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{acct.total_bookings}</td>
                  <td className="px-4 py-3"><StatusBadge status={acct.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(acct)} className="p-1.5 rounded-lg hover:bg-neutral-100" title="Edit">
                        <Edit2 size={14} className="text-neutral-400" />
                      </button>
                      {acct.status === 'active' && (
                        <button onClick={() => handleDelete(acct)} className="p-1.5 rounded-lg hover:bg-red-50" title="Deactivate">
                          <Trash2 size={14} className="text-neutral-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Modal */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditAccount(null); }}
        onSave={editAccount ? handleUpdate : handleCreate}
        initial={editAccount}
      />

      {/* Detail Drawer */}
      {selectedAccount && (
        <>
          <div className="fixed inset-0 z-30 bg-black/10" onClick={() => setSelectedAccount(null)} />
          <DetailDrawer
            account={selectedAccount}
            onClose={() => setSelectedAccount(null)}
            onEdit={openEdit}
            navigate={navigate}
          />
        </>
      )}
    </div>
  );
}
