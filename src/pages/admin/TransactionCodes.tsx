/**
 * TransactionCodes — CRUD admin page for Opera-style numeric transaction codes.
 * Glimmora Design System v5.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Hash, Plus, Edit2, Trash2, Download } from 'lucide-react';
import { transactionCodesService, type TransactionCode } from '@/api/services/transaction-codes.service';
import { useToast } from '@/contexts/ToastContext';

// UI2 Components
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter, ConfirmModal } from '@/components/ui2/Modal';
import { Button, IconButton } from '@/components/ui2/Button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableActions, TableEmpty, TableSkeleton, Pagination,
} from '@/components/ui2/Table';
import { Badge } from '@/components/ui2/Badge';
import { SearchBar } from '@/components/ui2/SearchBar';

// ── Type badge mapping ──────────────────────────────────────────────────────
const TYPE_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'secondary'> = {
  charge: 'info',
  payment: 'success',
  adjustment: 'warning',
  tax: 'secondary',
};

// ── Filter options ──────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'charge', label: 'Charge' },
  { value: 'payment', label: 'Payment' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'tax', label: 'Tax' },
];

// ── FilterSelect ────────────────────────────────────────────────────────────
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
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-[13px] bg-white border transition-all duration-150 flex items-center gap-1.5 sm:gap-2 focus:outline-none w-full sm:min-w-[140px] ${
          isOpen ? 'border-terra-400 ring-2 ring-terra-500/10'
            : hasValue ? 'border-terra-300 bg-terra-50'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}>
        <span className={hasValue ? 'text-terra-700 font-medium' : 'text-neutral-500'}>{displayLabel}</span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${hasValue ? 'text-terra-500' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden min-w-[160px]">
            {options.map((option) => (
              <button key={option.value} type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                  value === option.value ? 'bg-terra-50 text-terra-700' : 'text-neutral-700'
                }`}>
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

// ── Input styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-500/10 focus:border-terra-400 hover:border-neutral-300 transition-all duration-150';
const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

// ── Create/Edit Modal ───────────────────────────────────────────────────────
function CodeModal({ isOpen, onClose, onSave, initial }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: Partial<TransactionCode>) => Promise<void>;
  initial?: TransactionCode | null;
}) {
  const [form, setForm] = useState({ code: '', name: '', category: '', code_type: 'charge', adjustment_code: '', department: '', sort_order: '0' });
  const [saving, setSaving] = useState(false);
  const { error: showError } = useToast();

  useEffect(() => {
    if (initial) {
      setForm({
        code: initial.code || '', name: initial.name || '', category: initial.category || '',
        code_type: initial.code_type || 'charge', adjustment_code: initial.adjustment_code || '',
        department: initial.department || '', sort_order: String(initial.sort_order || 0),
      });
    } else {
      setForm({ code: '', name: '', category: '', code_type: 'charge', adjustment_code: '', department: '', sort_order: '0' });
    }
  }, [initial, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setSaving(true);
    try {
      await onSave({
        code: form.code, name: form.name, category: form.category || undefined,
        code_type: form.code_type as any, adjustment_code: form.adjustment_code || undefined,
        department: form.department || undefined, sort_order: parseInt(form.sort_order) || 0,
      });
      onClose();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <ModalTitle>{initial ? 'Edit Transaction Code' : 'New Transaction Code'}</ModalTitle>
        <ModalDescription>{initial ? 'Update code details' : 'Create a new transaction code'}</ModalDescription>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Code *</label>
                <input className={inputCls} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. 1000" required />
              </div>
              <div>
                <label className={labelCls}>Type *</label>
                <select className={inputCls} value={form.code_type} onChange={e => setForm(f => ({ ...f, code_type: e.target.value }))}>
                  <option value="charge">Charge</option>
                  <option value="payment">Payment</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="tax">Tax</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Room Charge" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Category</label>
                <input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. room_charge" />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input className={inputCls} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Front Office" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Adjustment Code</label>
                <input className={inputCls} value={form.adjustment_code} onChange={e => setForm(f => ({ ...f, adjustment_code: e.target.value }))} placeholder="e.g. 1001" />
              </div>
              <div>
                <label className={labelCls}>Sort Order</label>
                <input type="number" className={inputCls} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">Cancel</Button>
          <Button variant="primary" type="submit" loading={saving} className="px-5 py-2 text-[13px] font-semibold">
            {initial ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function TransactionCodes() {
  const { success, error: showError } = useToast();
  const [codes, setCodes] = useState<TransactionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCode, setEditCode] = useState<TransactionCode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionCode | null>(null);
  const [seeding, setSeeding] = useState(false);
  const perPage = 20;

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionCodesService.list({ code_type: typeFilter || undefined });
      setCodes(Array.isArray(data) ? data : []);
    } catch {
      showError('Failed to load transaction codes');
    }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return codes;
    const q = search.toLowerCase();
    return codes.filter(c =>
      c.code?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q)
    );
  }, [codes, search]);

  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleCreate = async (data: Partial<TransactionCode>) => {
    await transactionCodesService.create(data);
    success('Transaction code created');
    fetchCodes();
  };

  const handleUpdate = async (data: Partial<TransactionCode>) => {
    if (!editCode) return;
    await transactionCodesService.update(editCode.id, data);
    success('Transaction code updated');
    setEditCode(null);
    fetchCodes();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await transactionCodesService.delete(deleteTarget.id);
      success('Transaction code deleted');
      fetchCodes();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Delete failed');
    }
    setDeleteTarget(null);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await transactionCodesService.seed();
      success('Default codes seeded');
      fetchCodes();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Seed failed');
    }
    setSeeding(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Transaction Codes</h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">{filtered.length} codes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Download} onClick={handleSeed} loading={seeding}>
              Seed Defaults
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => { setEditCode(null); setModalOpen(true); }}>
              Add Code
            </Button>
          </div>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-[10px] overflow-hidden">

          {/* Search & Filter Bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50/30 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:flex-1 sm:max-w-md">
                <SearchBar
                  value={search}
                  onChange={(val) => { setSearch(val); setPage(1); }}
                  onClear={() => { setSearch(''); setPage(1); }}
                  placeholder="Search codes..."
                  size="md"
                  className="w-full"
                />
              </div>
              <div className="hidden sm:block sm:flex-1" />
              <div className="w-full sm:w-auto">
                <FilterSelect
                  value={typeFilter}
                  onChange={(val) => { setTypeFilter(val); setPage(1); }}
                  options={TYPE_OPTIONS}
                  placeholder="All Types"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <Table className="w-full">
            <TableHeader>
              <tr>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Adj. Code</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={9} rows={5} />
              ) : paged.length === 0 ? (
                <TableEmpty
                  icon={Hash}
                  title="No transaction codes found"
                  description="Add a transaction code or seed defaults"
                />
              ) : paged.map(tc => (
                <TableRow key={tc.id}>
                  <TableCell className="font-mono font-bold text-neutral-900">{tc.code}</TableCell>
                  <TableCell>{tc.name}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[tc.code_type] || 'neutral'} size="sm">{tc.code_type}</Badge>
                  </TableCell>
                  <TableCell className="text-neutral-600">{tc.category || '—'}</TableCell>
                  <TableCell className="text-neutral-600">{tc.department || '—'}</TableCell>
                  <TableCell className="font-mono text-neutral-500">{tc.adjustment_code || '—'}</TableCell>
                  <TableCell>
                    <span className={`w-2 h-2 rounded-full inline-block ${tc.is_active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                  </TableCell>
                  <TableCell className="text-neutral-500">{tc.sort_order}</TableCell>
                  <TableActions>
                    <IconButton icon={Edit2} label="Edit" variant="ghost" size="sm" onClick={() => { setEditCode(tc); setModalOpen(true); }} />
                    <IconButton icon={Trash2} label="Delete" variant="ghost" size="sm" onClick={() => setDeleteTarget(tc)} />
                  </TableActions>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 bg-neutral-50/30">
              <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <CodeModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditCode(null); }} onSave={editCode ? handleUpdate : handleCreate} initial={editCode} />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.code} - ${deleteTarget?.name}"?`}
        description="This transaction code will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
