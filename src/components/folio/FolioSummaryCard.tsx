/**
 * FolioSummaryCard - Total charges / payments / balance KPIs
 */

import { Receipt, CreditCard, Wallet } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import type { Folio } from '@/types/folio.types';

interface FolioSummaryCardProps {
  folio: Folio | null;
}

export default function FolioSummaryCard({ folio }: FolioSummaryCardProps) {
  const { formatCurrency } = useCurrency();

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
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
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
