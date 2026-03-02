/**
 * ARLedger — Accounts Receivable Ledger page.
 * Shows AR accounts, ledger postings, payment recording, credit notes, aging report.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt, DollarSign, CreditCard, FileText, X, Plus,
  ChevronDown, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import { arService, type ARAccount, type ARPosting, type AgingBucket } from '@/api/services/ar.service';
import { useCurrency } from '@/hooks/useCurrency';
import toast from 'react-hot-toast';

// ── Helpers ─────────────────────────────────────────────────────────────────

function PostingTypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    charge:      { bg: 'bg-red-50 border-red-200',    text: 'text-red-700',     label: 'Charge' },
    payment:     { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Payment' },
    credit_note: { bg: 'bg-blue-50 border-blue-200',  text: 'text-blue-700',    label: 'Credit Note' },
    adjustment:  { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700',  label: 'Adjustment' },
  };
  const m = map[type] || map.charge;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${m.bg} ${m.text}`}>{m.label}</span>
  );
}

// ── Payment Modal ───────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: number;
  onSuccess: () => void;
  mode: 'payment' | 'credit_note';
}

function PaymentModal({ isOpen, onClose, accountId, onSuccess, mode }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) { setAmount(''); setMethod('bank_transfer'); setReference(''); setDescription(''); }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      if (mode === 'payment') {
        await arService.postPayment(accountId, { amount: amt, payment_method: method, reference_number: reference || undefined });
        toast.success(`Payment of ${amt.toFixed(2)} recorded`);
      } else {
        await arService.creditNote(accountId, { amount: amt, description: description || 'Credit note', reference_number: reference || undefined });
        toast.success(`Credit note of ${amt.toFixed(2)} issued`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">
            {mode === 'payment' ? 'Record Payment' : 'Issue Credit Note'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Amount *</label>
            <input className={inputCls} type="number" min={0} step={0.01} value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
          </div>
          {mode === 'payment' && (
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1">Payment Method</label>
              <select className={inputCls} value={method} onChange={e => setMethod(e.target.value)}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
          )}
          {mode === 'credit_note' && (
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1">Description *</label>
              <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Reference #</label>
            <input className={inputCls} value={reference} onChange={e => setReference(e.target.value)} placeholder="Invoice/receipt number" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50">
              {saving ? 'Processing...' : mode === 'payment' ? 'Record Payment' : 'Issue Credit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ARLedger() {
  const { formatCurrency } = useCurrency();
  const [searchParams] = useSearchParams();
  const corpFilter = searchParams.get('corporate');

  const [accounts, setAccounts] = useState<ARAccount[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ARAccount | null>(null);
  const [postings, setPostings] = useState<ARPosting[]>([]);
  const [aging, setAging] = useState<{ items: AgingBucket[]; totals: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Modals
  const [paymentModal, setPaymentModal] = useState(false);
  const [creditModal, setCreditModal] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (corpFilter) params.corporate_account_id = parseInt(corpFilter);
      const res = await arService.listAccounts(params);
      const list: ARAccount[] = res.accounts || [];
      setAccounts(list);
      // Auto-select first or the one matching corporate filter
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch {
      toast.error('Failed to load AR accounts');
    }
    setLoading(false);
  }, [corpFilter]);

  const fetchLedger = useCallback(async () => {
    if (!selectedId) return;
    setLedgerLoading(true);
    try {
      const [acctRes, ledgerRes] = await Promise.all([
        arService.getAccount(selectedId),
        arService.getLedger(selectedId, { limit: 200 }),
      ]);
      setSelectedAccount(acctRes.account || null);
      setPostings(ledgerRes.postings || []);
    } catch {
      toast.error('Failed to load ledger');
    }
    setLedgerLoading(false);
  }, [selectedId]);

  const fetchAging = useCallback(async () => {
    try {
      const res = await arService.getAgingReport();
      setAging(res.aging_report || null);
    } catch {}
  }, []);

  useEffect(() => { fetchAccounts(); fetchAging(); }, [fetchAccounts, fetchAging]);
  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  const refresh = () => {
    fetchAccounts();
    fetchLedger();
    fetchAging();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <Receipt size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">AR Ledger</h1>
            <p className="text-[12px] text-neutral-500">{accounts.length} accounts receivable</p>
          </div>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Aging Report Summary */}
      {aging && aging.totals && aging.totals.total > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-[13px] font-semibold text-neutral-700 mb-3">AR Aging Summary</h2>
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: 'Current', value: aging.totals.current, color: 'text-emerald-600' },
              { label: '1–30 days', value: aging.totals.days_30, color: 'text-blue-600' },
              { label: '31–60 days', value: aging.totals.days_60, color: 'text-amber-600' },
              { label: '61–90 days', value: aging.totals.days_90, color: 'text-orange-600' },
              { label: '90+ days', value: aging.totals.days_90_plus, color: 'text-red-600' },
              { label: 'Total', value: aging.totals.total, color: 'text-neutral-900 font-bold' },
            ].map(b => (
              <div key={b.label} className="text-center">
                <p className="text-[11px] text-neutral-500 mb-0.5">{b.label}</p>
                <p className={`text-[14px] font-semibold ${b.color}`}>{formatCurrency(b.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        {/* Left: Account List */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50">
              <h3 className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">AR Accounts</h3>
            </div>
            {loading ? (
              <div className="px-4 py-8 text-center text-[13px] text-neutral-400">Loading...</div>
            ) : accounts.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-neutral-400">No AR accounts</div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                {accounts.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${selectedId === a.id ? 'bg-terra-50 border-l-2 border-terra-600' : 'hover:bg-neutral-50 border-l-2 border-transparent'}`}
                  >
                    <p className="text-[13px] font-medium text-neutral-900">{a.account_name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-neutral-500">{a.account_number}</span>
                      <span className={`text-[12px] font-semibold ${a.current_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatCurrency(a.current_balance)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Ledger View */}
        <div className="col-span-8">
          {!selectedId ? (
            <div className="bg-white rounded-xl border border-neutral-200 flex items-center justify-center py-20">
              <p className="text-[13px] text-neutral-400">Select an AR account to view its ledger</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account Summary */}
              {selectedAccount && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-[15px] font-semibold text-neutral-900">{selectedAccount.account_name}</h2>
                      <p className="text-[12px] text-neutral-500">{selectedAccount.account_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPaymentModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                      >
                        <DollarSign size={14} />
                        Record Payment
                      </button>
                      <button
                        onClick={() => setCreditModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                      >
                        <FileText size={14} />
                        Credit Note
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-[11px] text-neutral-500">Balance</p>
                      <p className={`text-[16px] font-bold ${selectedAccount.current_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatCurrency(selectedAccount.current_balance)}
                      </p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-[11px] text-neutral-500">Credit Limit</p>
                      <p className="text-[16px] font-bold text-neutral-900">{formatCurrency(selectedAccount.credit_limit)}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-[11px] text-neutral-500">Available</p>
                      <p className="text-[16px] font-bold text-emerald-600">{formatCurrency(selectedAccount.available_credit)}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-[11px] text-neutral-500">Terms</p>
                      <p className="text-[16px] font-bold text-neutral-900">{selectedAccount.payment_terms_days}d</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ledger Table */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">Ledger Postings</h3>
                  <span className="text-[11px] text-neutral-400">{postings.length} entries</span>
                </div>
                {ledgerLoading ? (
                  <div className="px-4 py-12 text-center text-[13px] text-neutral-400">Loading ledger...</div>
                ) : postings.length === 0 ? (
                  <div className="px-4 py-12 text-center text-[13px] text-neutral-400">No postings yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          {['Date', 'Type', 'Description', 'Booking', 'Debit', 'Credit', 'Balance', 'Status'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {postings.map(p => {
                          const isDebit = p.amount > 0;
                          return (
                            <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                              <td className="px-3 py-2.5 text-[12px] text-neutral-600 whitespace-nowrap">
                                {p.posted_at ? new Date(p.posted_at).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-3 py-2.5"><PostingTypeBadge type={p.posting_type} /></td>
                              <td className="px-3 py-2.5 text-[12px] text-neutral-700 max-w-[200px] truncate">{p.description}</td>
                              <td className="px-3 py-2.5 text-[12px] text-neutral-500">{p.booking_id ? `#${p.booking_id}` : '—'}</td>
                              <td className="px-3 py-2.5 text-[12px] font-medium text-red-600">
                                {isDebit ? formatCurrency(p.amount) : ''}
                              </td>
                              <td className="px-3 py-2.5 text-[12px] font-medium text-emerald-600">
                                {!isDebit ? formatCurrency(Math.abs(p.amount)) : ''}
                              </td>
                              <td className="px-3 py-2.5 text-[12px] font-semibold text-neutral-800">
                                {formatCurrency(p.balance_after)}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                  p.status === 'overdue' ? 'bg-red-50 text-red-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>{p.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedId && (
        <>
          <PaymentModal isOpen={paymentModal} onClose={() => setPaymentModal(false)} accountId={selectedId} onSuccess={refresh} mode="payment" />
          <PaymentModal isOpen={creditModal} onClose={() => setCreditModal(false)} accountId={selectedId} onSuccess={refresh} mode="credit_note" />
        </>
      )}
    </div>
  );
}
