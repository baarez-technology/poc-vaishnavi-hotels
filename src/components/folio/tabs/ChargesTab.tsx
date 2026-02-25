/**
 * ChargesTab - All charges table + Post Charge button
 */

import { useState } from 'react';
import { Plus, Edit3, Scissors, ArrowRightLeft, XCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import type { Folio, FolioLineItem } from '@/types/folio.types';
import PostChargeDialog from '../dialogs/PostChargeDialog';
import AdjustChargeDialog from '../dialogs/AdjustChargeDialog';

const ITEM_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  room_charge: { label: 'Room', color: 'bg-blue-50 text-blue-700' },
  service: { label: 'Service', color: 'bg-purple-50 text-purple-700' },
  minibar: { label: 'Minibar', color: 'bg-amber-50 text-amber-700' },
  spa: { label: 'Spa', color: 'bg-pink-50 text-pink-700' },
  parking: { label: 'Parking', color: 'bg-slate-50 text-slate-700' },
  restaurant: { label: 'Restaurant', color: 'bg-orange-50 text-orange-700' },
  phone: { label: 'Phone', color: 'bg-cyan-50 text-cyan-700' },
  laundry: { label: 'Laundry', color: 'bg-teal-50 text-teal-700' },
  late_checkout: { label: 'Late C/O', color: 'bg-rose-50 text-rose-700' },
  damage: { label: 'Damage', color: 'bg-red-50 text-red-700' },
  tax: { label: 'Tax', color: 'bg-neutral-100 text-neutral-600' },
  payment: { label: 'Payment', color: 'bg-emerald-50 text-emerald-700' },
  misc: { label: 'Misc', color: 'bg-neutral-50 text-neutral-600' },
};

interface ChargesTabProps {
  folio: Folio | null;
  bookingId: number | string;
  folios: Folio[];
  onRefresh: () => void;
  onPostCharge: (data: any) => Promise<void>;
  onAdjustCharge: (itemId: number, data: any) => Promise<void>;
  onVoidCharge: (itemId: number) => Promise<void>;
  onSplitCharge: (itemId: number, splits: any[]) => Promise<void>;
  onTransferCharge: (itemIds: number[], targetFolioId: number) => Promise<void>;
}

export default function ChargesTab({
  folio, bookingId, folios, onRefresh,
  onPostCharge, onAdjustCharge, onVoidCharge, onSplitCharge, onTransferCharge
}: ChargesTabProps) {
  const { formatCurrency } = useCurrency();
  const [showPostCharge, setShowPostCharge] = useState(false);
  const [adjustItem, setAdjustItem] = useState<FolioLineItem | null>(null);

  if (!folio) return null;

  const charges = (folio.line_items || []).filter(li => li.amount > 0 || li.item_type !== 'payment');
  const isClosed = folio.status === 'closed';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-neutral-900">
          Charges ({charges.length})
        </h3>
        {!isClosed && (
          <button
            onClick={() => setShowPostCharge(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-terra-700 bg-terra-50 hover:bg-terra-100 rounded-lg border border-terra-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Post Charge
          </button>
        )}
      </div>

      {/* Table */}
      {charges.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-[13px]">
          No charges posted yet
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-3 py-2.5 font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Date</th>
                <th className="text-left px-3 py-2.5 font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Description</th>
                <th className="text-left px-3 py-2.5 font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Type</th>
                <th className="text-right px-3 py-2.5 font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Qty</th>
                <th className="text-right px-3 py-2.5 font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Unit Price</th>
                <th className="text-right px-3 py-2.5 font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Amount</th>
                {!isClosed && <th className="text-right px-3 py-2.5 font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {charges.map(item => {
                const typeInfo = ITEM_TYPE_LABELS[item.item_type] || ITEM_TYPE_LABELS.misc;
                const isVoided = item.is_voided;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-neutral-100 last:border-0 ${isVoided ? 'opacity-50' : 'hover:bg-neutral-50/50'}`}
                  >
                    <td className={`px-3 py-2.5 text-neutral-500 whitespace-nowrap ${isVoided ? 'line-through' : ''}`}>
                      {new Date(item.posted_at || item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className={`px-3 py-2.5 text-neutral-900 font-medium ${isVoided ? 'line-through' : ''}`}>
                      {item.description}
                      {isVoided && <span className="ml-2 text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">Void</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 text-right text-neutral-600 ${isVoided ? 'line-through' : ''}`}>{item.quantity}</td>
                    <td className={`px-3 py-2.5 text-right text-neutral-600 ${isVoided ? 'line-through' : ''}`}>{formatCurrency(item.unit_price)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${isVoided ? 'line-through text-neutral-400' : item.amount < 0 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                      {formatCurrency(Math.abs(item.amount))}
                    </td>
                    {!isClosed && (
                      <td className="px-3 py-2.5 text-right">
                        {!isVoided && item.item_type !== 'payment' && item.item_type !== 'tax' && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setAdjustItem(item)} title="Adjust" className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {folios.length > 1 && (
                              <button onClick={() => onTransferCharge([item.id], folios.find(f => f.id !== folio.id)!.id)} title="Transfer" className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => { if (window.confirm('Void this charge?')) onVoidCharge(item.id); }} title="Void" className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Charge Dialog */}
      {showPostCharge && (
        <PostChargeDialog
          onSubmit={async (data) => { await onPostCharge(data); setShowPostCharge(false); }}
          onClose={() => setShowPostCharge(false)}
        />
      )}

      {/* Adjust Charge Dialog */}
      {adjustItem && (
        <AdjustChargeDialog
          item={adjustItem}
          onSubmit={async (data) => { await onAdjustCharge(adjustItem.id, data); setAdjustItem(null); }}
          onClose={() => setAdjustItem(null)}
        />
      )}
    </div>
  );
}
