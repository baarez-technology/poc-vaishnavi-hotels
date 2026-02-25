/**
 * PostChargeDialog - Category selector + description + qty + price
 */

import { useState } from 'react';
import { X } from 'lucide-react';

const CHARGE_CATEGORIES = [
  { value: 'room_charge', label: 'Room Charge' },
  { value: 'service', label: 'Room Service' },
  { value: 'minibar', label: 'Minibar' },
  { value: 'spa', label: 'Spa' },
  { value: 'parking', label: 'Parking' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'phone', label: 'Phone' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'late_checkout', label: 'Late Checkout' },
  { value: 'damage', label: 'Damage' },
  { value: 'misc', label: 'Miscellaneous' },
];

interface PostChargeDialogProps {
  onSubmit: (data: { item_type: string; description: string; quantity: number; unit_price: number; notes?: string }) => Promise<void>;
  onClose: () => void;
}

export default function PostChargeDialog({ onSubmit, onClose }: PostChargeDialogProps) {
  const [itemType, setItemType] = useState('service');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = quantity * unitPrice;

  const handleSubmit = async () => {
    if (!description.trim() || unitPrice <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ item_type: itemType, description: description.trim(), quantity, unit_price: unitPrice, notes: notes.trim() || undefined });
    } catch { /* parent handles */ }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[15px] font-semibold text-neutral-900">Post Charge</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Category</label>
            <select
              value={itemType}
              onChange={e => setItemType(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            >
              {CHARGE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Description <span className="text-red-500">*</span></label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Minibar - 2x Water, 1x Snack"
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            />
          </div>

          {/* Qty + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Unit Price <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={e => setUnitPrice(Math.max(0, Number(e.target.value)))}
                className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-neutral-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-[12px] font-medium text-neutral-500">Total Amount</span>
            <span className="text-lg font-bold text-neutral-900">${total.toFixed(2)}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Notes (optional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim() || unitPrice <= 0 || submitting}
            className="px-4 py-2 text-[13px] font-medium text-white bg-terra-600 hover:bg-terra-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Charge'}
          </button>
        </div>
      </div>
    </div>
  );
}
