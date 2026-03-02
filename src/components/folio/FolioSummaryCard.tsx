/**
 * FolioSummaryCard - Total charges / payments / balance / avg rate KPIs
 */

import { useMemo } from 'react';
import { Receipt, CreditCard, Wallet, Moon } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import type { Folio } from '@/types/folio.types';

interface FolioSummaryCardProps {
  folio: Folio | null;
  nights?: number; // number of stay nights from booking
}

export default function FolioSummaryCard({ folio, nights }: FolioSummaryCardProps) {
  const { formatCurrency } = useCurrency();

  // Compute average rate per night from room charges
  const avgRate = useMemo(() => {
    if (!folio?.line_items) return null;
    const roomCharges = folio.line_items.filter(li => li.item_type === 'room_charge' && !li.is_voided);
    if (roomCharges.length === 0) return null;
    const totalRoomCharges = roomCharges.reduce((sum, li) => sum + li.amount, 0);
    // Use nights from booking if available, otherwise count distinct dates
    const n = nights && nights > 0
      ? nights
      : new Set(roomCharges.map(li => new Date(li.posted_at || li.created_at).toLocaleDateString('en-CA'))).size;
    return n > 0 ? totalRoomCharges / n : null;
  }, [folio, nights]);

  if (!folio) return null;

  const kpis = [
    {
      label: 'Total Charges',
      value: formatCurrency(folio.total_charges),
      icon: Receipt,
      color: 'text-neutral-900',
    },
    {
      label: 'Payments',
      value: formatCurrency(folio.total_payments),
      icon: CreditCard,
      color: 'text-emerald-600',
    },
    {
      label: 'Balance Due',
      value: formatCurrency(folio.balance),
      icon: Wallet,
      color: folio.balance > 0 ? 'text-amber-600' : folio.balance < 0 ? 'text-red-600' : 'text-emerald-600',
    },
    ...(avgRate !== null ? [{
      label: 'Avg Rate/Night',
      value: formatCurrency(avgRate),
      icon: Moon,
      color: 'text-blue-600',
    }] : []),
  ];

  const cols = kpis.length === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className={`grid ${cols} gap-3`}>
      {kpis.map(kpi => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="bg-white rounded-xl p-4 border border-neutral-200/80">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{kpi.label}</p>
            </div>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        );
      })}
    </div>
  );
}
