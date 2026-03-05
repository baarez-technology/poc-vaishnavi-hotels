/**
 * StatementTab - Printable folio statement view
 */

import { useState, useEffect } from 'react';
import { Printer, Download } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { folioService } from '@/api/services/folio.service';
import type { Folio } from '@/types/folio.types';

interface StatementTabProps {
  folio: Folio | null;
  bookingId: number | string;
}

export default function StatementTab({ folio, bookingId }: StatementTabProps) {
  const { formatCurrency } = useCurrency();
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!folio) return;
    setLoading(true);
    folioService.getStatement(bookingId, folio.id)
      .then(res => {
        // Backend returns { success, statement: { folio, guest, line_items, ... } }
        const data = res?.statement || res;
        setStatement(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [folio?.id, bookingId]);

  if (!folio) return null;

  if (loading) {
    return (
      <div className="text-center py-16 text-neutral-400 text-[13px]">
        Loading statement...
      </div>
    );
  }

  // Backend returns line_items (with running_balance) not timeline
  const timeline = statement?.line_items || statement?.timeline || [];
  const guestName = statement?.guest?.name || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-neutral-900">
          Folio Statement
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-neutral-700 bg-white hover:bg-neutral-50 rounded-lg border border-neutral-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Statement card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 print:border-0 print:shadow-none relative">
        {folio.status === 'closed' && (
          <div className="absolute top-6 right-6 text-[28px] font-black text-emerald-200/60 uppercase tracking-[0.2em] rotate-[-15deg] pointer-events-none select-none">
            SETTLED
          </div>
        )}

        {/* Hotel header */}
        <div className="text-center mb-6 pb-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">GLIMMORA HOTEL</h2>
          <p className="text-[11px] text-neutral-500 mt-1">Folio Statement</p>
        </div>

        {/* Guest + folio info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-[12px]">
          <div>
            <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Guest</p>
            <p className="text-neutral-900 font-medium">{guestName || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Folio #</p>
            <p className="text-neutral-900 font-mono font-medium">{folio.folio_number}</p>
          </div>
        </div>

        {/* Timeline table */}
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-[13px]">
            No transactions
          </div>
        ) : (
          <table className="w-full text-[12px] mb-6">
            <thead>
              <tr className="border-b border-neutral-300">
                <th className="text-left pb-2 font-semibold text-neutral-600">Date</th>
                <th className="text-left pb-2 font-semibold text-neutral-600">Description</th>
                <th className="text-right pb-2 font-semibold text-neutral-600">Debit</th>
                <th className="text-right pb-2 font-semibold text-neutral-600">Credit</th>
                <th className="text-right pb-2 font-semibold text-neutral-600">Balance</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row: any, i: number) => {
                const displayAmount = row.amount_with_tax ?? row.amount;
                const hasTax = row.amount > 0 && row.tax_amount && row.tax_amount > 0;
                return (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-500">{new Date(row.posted_at || row.date || row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="py-2 text-neutral-800">
                      {row.description}
                      {hasTax && (
                        <span className="block text-[10px] text-neutral-400 mt-0.5">
                          Base: {formatCurrency(row.amount)} + GST {row.tax_rate_pct || ''}%: {formatCurrency(row.tax_amount)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right text-neutral-700">{displayAmount > 0 ? formatCurrency(displayAmount) : ''}</td>
                    <td className="py-2 text-right text-emerald-600">{displayAmount < 0 ? formatCurrency(Math.abs(displayAmount)) : ''}</td>
                    <td className="py-2 text-right font-medium text-neutral-900">{formatCurrency(row.running_balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div className="border-t-2 border-neutral-900 pt-3 flex justify-end">
          <div className="text-right space-y-1 text-[12px]">
            <div className="flex justify-between gap-8">
              <span className="text-neutral-500">Total Charges:</span>
              <span className="font-semibold text-neutral-900">{formatCurrency(folio.total_charges)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-neutral-500">Total Payments:</span>
              <span className="font-semibold text-emerald-600">-{formatCurrency(folio.total_payments)}</span>
            </div>
            <div className="flex justify-between gap-8 pt-1 border-t border-neutral-200">
              <span className="font-bold text-neutral-900">Balance Due:</span>
              <span className={`font-bold text-lg ${folio.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatCurrency(folio.balance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
