/**
 * ARLedger — Accounts Receivable Ledger page.
 * Glimmora Design System v5.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt, DollarSign, CreditCard, FileText, RefreshCw,
} from 'lucide-react';
import { arService, type ARAccount, type ARPosting, type AgingBucket } from '@/api/services/ar.service';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/contexts/ToastContext';

// UI2 Components
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '@/components/ui2/Modal';
import { Button, IconButton } from '@/components/ui2/Button';
import { Badge } from '@/components/ui2/Badge';

// ── Posting badge mapping ───────────────────────────────────────────────────
const POSTING_VARIANT: Record<string, 'danger' | 'success' | 'info' | 'warning'> = {
  charge: 'danger',
  payment: 'success',
  credit_note: 'info',
  adjustment: 'warning',
};
const POSTING_LABEL: Record<string, string> = {
  charge: 'Charge', payment: 'Payment', credit_note: 'Credit Note', adjustment: 'Adjustment',
};

// ── Input styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-500/10 focus:border-terra-400 hover:border-neutral-300 transition-all duration-150';
const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

// ── Payment Modal ───────────────────────────────────────────────────────────
function PaymentModal({ isOpen, onClose, accountId, onSuccess, mode }: {
  isOpen: boolean; onClose: () => void; accountId: number; onSuccess: () => void;
  mode: 'payment' | 'credit_note';
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isOpen) { setAmount(''); setMethod('bank_transfer'); setReference(''); setDescription(''); }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { showError('Enter a valid amount'); return; }
    setSaving(true);
    try {
      if (mode === 'payment') {
        await arService.postPayment(accountId, { amount: amt, payment_method: method, reference_number: reference || undefined });
        success(`Payment of ${amt.toFixed(2)} recorded`);
      } else {
        await arService.creditNote(accountId, { amount: amt, description: description || 'Credit note', reference_number: reference || undefined });
        success(`Credit note of ${amt.toFixed(2)} issued`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.response?.data?.detail || 'Failed');
    }
    setSaving(false);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <ModalTitle>{mode === 'payment' ? 'Record Payment' : 'Issue Credit Note'}</ModalTitle>
        <ModalDescription>{mode === 'payment' ? 'Record an incoming payment' : 'Issue a credit note for this account'}</ModalDescription>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Amount *</label>
              <input className={inputCls} type="number" min={0} step={0.01} value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
            </div>
            {mode === 'payment' && (
              <div>
                <label className={labelCls}>Payment Method</label>
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
                <label className={labelCls}>Description *</label>
                <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
            )}
            <div>
              <label className={labelCls}>Reference #</label>
              <input className={inputCls} value={reference} onChange={e => setReference(e.target.value)} placeholder="Invoice/receipt number" />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">Cancel</Button>
          <Button variant="primary" type="submit" loading={saving} className="px-5 py-2 text-[13px] font-semibold">
            {mode === 'payment' ? 'Record Payment' : 'Issue Credit'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function ARLedger() {
  const { formatCurrency } = useCurrency();
  const { error: showError } = useToast();
  const [searchParams] = useSearchParams();
  const corpFilter = searchParams.get('corporate');

  const [accounts, setAccounts] = useState<ARAccount[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ARAccount | null>(null);
  const [postings, setPostings] = useState<ARPosting[]>([]);
  const [aging, setAging] = useState<{ items: AgingBucket[]; totals: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);

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
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
    } catch {
      showError('Failed to load AR accounts');
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
      showError('Failed to load ledger');
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

  const refresh = () => { fetchAccounts(); fetchLedger(); fetchAging(); };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">AR Ledger</h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">{accounts.length} accounts receivable</p>
          </div>
          <IconButton icon={RefreshCw} label="Refresh" variant="outline" size="md" onClick={refresh} />
        </header>

        {/* Aging Report Summary */}
        {aging && aging.totals && aging.totals.total > 0 && (
          <div className="bg-white rounded-[10px] border border-neutral-100 p-5">
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
            <div className="bg-white rounded-[10px] border border-neutral-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/30">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">AR Accounts</h3>
              </div>
              {loading ? (
                <div className="px-4 py-8 text-center text-[13px] text-neutral-400">Loading...</div>
              ) : accounts.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-neutral-400">No AR accounts</div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                  {accounts.map(a => (
                    <button key={a.id} onClick={() => setSelectedId(a.id)}
                      className={`w-full px-4 py-3 text-left transition-colors ${selectedId === a.id ? 'bg-terra-50 border-l-2 border-terra-600' : 'hover:bg-neutral-50 border-l-2 border-transparent'}`}>
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
              <div className="bg-white rounded-[10px] border border-neutral-100 flex items-center justify-center py-20">
                <p className="text-[13px] text-neutral-400">Select an AR account to view its ledger</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Account Summary */}
                {selectedAccount && (
                  <div className="bg-white rounded-[10px] border border-neutral-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-[15px] font-semibold text-neutral-900">{selectedAccount.account_name}</h2>
                        <p className="text-[12px] text-neutral-500">{selectedAccount.account_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline-success" size="sm" icon={DollarSign} onClick={() => setPaymentModal(true)}>
                          Record Payment
                        </Button>
                        <Button variant="outline" size="sm" icon={FileText} onClick={() => setCreditModal(true)}>
                          Credit Note
                        </Button>
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
                <div className="bg-white rounded-[10px] border border-neutral-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Ledger Postings</h3>
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
                          <tr className="border-b border-neutral-100 bg-neutral-50/30">
                            {['Date', 'Type', 'Description', 'Booking', 'Debit', 'Credit', 'Balance', 'Status'].map(h => (
                              <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {postings.map(p => {
                            const isDebit = p.amount > 0;
                            return (
                              <tr key={p.id} className="hover:bg-neutral-50/50">
                                <td className="px-3 py-2.5 text-[12px] text-neutral-600 whitespace-nowrap">
                                  {p.posted_at ? new Date(p.posted_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge variant={POSTING_VARIANT[p.posting_type] || 'neutral'} size="sm">
                                    {POSTING_LABEL[p.posting_type] || p.posting_type}
                                  </Badge>
                                </td>
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
                                  <Badge variant={p.status === 'paid' ? 'success' : p.status === 'overdue' ? 'danger' : 'warning'} size="xs">
                                    {p.status}
                                  </Badge>
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
