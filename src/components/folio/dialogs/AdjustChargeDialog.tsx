/**
 * AdjustChargeDialog - New amount + reason
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import type { FolioLineItem } from '@/types/folio.types';

interface AdjustChargeDialogProps {
  item: FolioLineItem;
  onSubmit: (data: { new_amount: number; reason: string }) => Promise<void>;
  onClose: () => void;
}

export default function AdjustChargeDialog({ item, onSubmit, onClose }: AdjustChargeDialogProps) {
  const [newAmount, setNewAmount] = useState(item.amount);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (newAmount <= 0 || !reason.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ new_amount: newAmount, reason: reason.trim() });
    } catch { /* parent handles */ }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[15px] font-semibold text-neutral-900">Adjust Charge</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-neutral-50 rounded-lg px-3 py-2 text-[12px]">
            <p className="text-neutral-500">Original: <span className="font-semibold text-neutral-900">{item.description}</span></p>
            <p className="text-neutral-500">Current amount: <span className="font-semibold text-neutral-900">₹{item.amount.toFixed(2)}</span></p>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">New Amount <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newAmount}
              onChange={e => setNewAmount(Math.max(0, Number(e.target.value)))}
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Reason <span className="text-red-500">*</span></label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for adjustment..."
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={newAmount <= 0 || !reason.trim() || submitting}
            className="px-4 py-2 text-[13px] font-medium text-white bg-terra-600 hover:bg-terra-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {submitting ? 'Adjusting...' : 'Adjust'}
          </button>
        </div>
      </div>
    </div>
  );
}
