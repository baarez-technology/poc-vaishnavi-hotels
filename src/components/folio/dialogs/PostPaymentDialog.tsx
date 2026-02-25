/**
 * PostPaymentDialog - Amount + method + type + card fields
 * Also used for refunds (isRefund=true)
 */

import { useState } from 'react';
import { X } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'comp', label: 'Complimentary' },
];

const PAYMENT_TYPES = [
  { value: 'full_payment', label: 'Full Payment' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'deposit', label: 'Deposit' },
];

interface PostPaymentDialogProps {
  balance: number;
  isRefund?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function PostPaymentDialog({ balance, isRefund = false, onSubmit, onClose }: PostPaymentDialogProps) {
  const [amount, setAmount] = useState(isRefund ? 0 : Math.max(0, balance));
  const [method, setMethod] = useState('card');
  const [paymentType, setPaymentType] = useState(isRefund ? 'refund' : 'full_payment');
  const [transactionId, setTransactionId] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (amount <= 0) return;
    if (isRefund && !reason.trim()) return;
    setSubmitting(true);
    try {
      if (isRefund) {
        await onSubmit({ amount, reason: reason.trim(), method, notes: notes.trim() || undefined });
      } else {
        await onSubmit({
          amount,
          method,
          payment_type: paymentType,
          transaction_id: transactionId.trim() || undefined,
          card_last4: cardLast4.trim() || undefined,
          card_brand: cardBrand.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
    } catch { /* parent handles */ }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[15px] font-semibold text-neutral-900">{isRefund ? 'Process Refund' : 'Post Payment'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Amount <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            />
            {!isRefund && balance > 0 && (
              <p className="text-[11px] text-neutral-400 mt-1">Outstanding balance: ${balance.toFixed(2)}</p>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Payment Type (non-refund only) */}
          {!isRefund && (
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Payment Type</label>
              <select
                value={paymentType}
                onChange={e => setPaymentType(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
              >
                {PAYMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Refund reason */}
          {isRefund && (
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Reason <span className="text-red-500">*</span></label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for refund..."
                className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
              />
            </div>
          )}

          {/* Card fields (only for card method) */}
          {method === 'card' && !isRefund && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Tx ID</label>
                <input
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="TXN..."
                  className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Last 4</label>
                <input
                  value={cardLast4}
                  onChange={e => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Brand</label>
                <select
                  value={cardBrand}
                  onChange={e => setCardBrand(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
                >
                  <option value="">—</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">Amex</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={amount <= 0 || (isRefund && !reason.trim()) || submitting}
            className={`px-4 py-2 text-[13px] font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRefund ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {submitting ? 'Processing...' : isRefund ? 'Process Refund' : 'Post Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
