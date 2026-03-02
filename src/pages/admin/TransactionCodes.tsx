/**
 * TransactionCodes — CRUD admin page for Opera-style numeric transaction codes.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Hash, Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { transactionCodesService, type TransactionCode } from '@/api/services/transaction-codes.service';
import toast from 'react-hot-toast';

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    charge: 'bg-blue-50 text-blue-700 border-blue-200',
    payment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    adjustment: 'bg-amber-50 text-amber-700 border-amber-200',
    tax: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[type] || colors.charge}`}>
      {type}
    </span>
  );
}

// ── Create/Edit Modal ───────────────────────────────────────────────────
function CodeModal({ isOpen, onClose, onSave, initial }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: Partial<TransactionCode>) => Promise<void>;
  initial?: TransactionCode | null;
}) {
  const [form, setForm] = useState({ code: '', name: '', category: '', code_type: 'charge', adjustment_code: '', department: '', sort_order: '0' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        code: initial.code || '',
        name: initial.name || '',
        category: initial.category || '',
        code_type: initial.code_type || 'charge',
        adjustment_code: initial.adjustment_code || '',
        department: initial.department || '',
        sort_order: String(initial.sort_order || 0),
      });
    } else {
      setForm({ code: '', name: '', category: '', code_type: 'charge', adjustment_code: '', department: '', sort_order: '0' });
    }
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setSaving(true);
    try {
      await onSave({
        code: form.code,
        name: form.name,
        category: form.category || undefined,
        code_type: form.code_type as any,
        adjustment_code: form.adjustment_code || undefined,
        department: form.department || undefined,
        sort_order: parseInt(form.sort_order) || 0,
      });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30';
  const labelCls = 'block text-[12px] font-medium text-neutral-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">{initial ? 'Edit Transaction Code' : 'New Transaction Code'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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

// ── Main Page ──────────────────────────────────────────────────────────────
export default function TransactionCodes() {
  const [codes, setCodes] = useState<TransactionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCode, setEditCode] = useState<TransactionCode | null>(null);
  const [seeding, setSeeding] = useState(false);
  const perPage = 20;

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionCodesService.list({ code_type: typeFilter || undefined });
      setCodes(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load transaction codes');
    }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return codes;
    const q = search.toLowerCase();
    return codes.filter(c =>
      c.code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q)
    );
  }, [codes, search]);

  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleCreate = async (data: Partial<TransactionCode>) => {
    await transactionCodesService.create(data);
    toast.success('Transaction code created');
    fetchCodes();
  };

  const handleUpdate = async (data: Partial<TransactionCode>) => {
    if (!editCode) return;
    await transactionCodesService.update(editCode.id, data);
    toast.success('Transaction code updated');
    setEditCode(null);
    fetchCodes();
  };

  const handleDelete = async (code: TransactionCode) => {
    if (!window.confirm(`Delete "${code.code} - ${code.name}"?`)) return;
    try {
      await transactionCodesService.delete(code.id);
      toast.success('Transaction code deleted');
      fetchCodes();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Delete failed');
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await transactionCodesService.seed();
      toast.success('Default codes seeded');
      fetchCodes();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Seed failed');
    }
    setSeeding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <Hash size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Transaction Codes</h1>
            <p className="text-[12px] text-neutral-500">{filtered.length} codes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSeed} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50">
            <Download size={16} />
            {seeding ? 'Seeding...' : 'Seed Defaults'}
          </button>
          <button onClick={() => { setEditCode(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700">
            <Plus size={16} /> Add Code
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input placeholder="Search codes..." className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="charge">Charge</option>
          <option value="payment">Payment</option>
          <option value="adjustment">Adjustment</option>
          <option value="tax">Tax</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['Code', 'Name', 'Type', 'Category', 'Department', 'Adj. Code', 'Active', 'Sort', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div></td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-neutral-400">No transaction codes found</td></tr>
              ) : paged.map(tc => (
                <tr key={tc.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3 text-[13px] font-mono font-bold text-neutral-900">{tc.code}</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700">{tc.name}</td>
                  <td className="px-4 py-3"><TypeBadge type={tc.code_type} /></td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{tc.category || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{tc.department || '—'}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-neutral-500">{tc.adjustment_code || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`w-2 h-2 rounded-full inline-block ${tc.is_active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-neutral-500">{tc.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditCode(tc); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-neutral-100"><Edit2 size={14} className="text-neutral-400" /></button>
                      <button onClick={() => handleDelete(tc)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-neutral-400 hover:text-red-500" /></button>
                    </div>
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

      <CodeModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditCode(null); }} onSave={editCode ? handleUpdate : handleCreate} initial={editCode} />
    </div>
  );
}
