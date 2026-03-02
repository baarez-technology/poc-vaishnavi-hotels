/**
 * CheckoutDialog — Pre-checkout folio balance gate
 * Shows per-window balance summary. Blocks checkout unless all windows = $0.
 * Exception: company folios (→ AR) are marked as exempt.
 */

import { useState, useEffect } from 'react';
import { LogOut, AlertTriangle, CheckCircle, Building2, Wallet, X, Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { folioService } from '@/api/services/folio.service';
import type { Folio } from '@/types/folio.types';

interface CheckoutDialogProps {
  isOpen: boolean;
  booking: any;
  onClose: () => void;
  onCheckout: (force?: boolean) => Promise<boolean>;
  onOpenFolio: (booking: any) => void;
}

interface WindowSummary {
  id: number;
  label: string;
  type: string;
  balance: number;
  status: string;
  exempt: boolean; // company folio with corporate account → will route to AR
}

export default function CheckoutDialog({ isOpen, booking, onClose, onCheckout, onOpenFolio }: CheckoutDialogProps) {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [windows, setWindows] = useState<WindowSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bookingId = booking?.id || booking?.bookingNumber;
  const hasCorporate = !!booking?.corporate_account_id || !!booking?.corporateAccountId;

  // Load folio windows on open
  useEffect(() => {
    if (!isOpen || !bookingId) return;
    setLoading(true);
    setError(null);

    folioService.listFolios(bookingId).then(res => {
      const folios: Folio[] = res.folios || [];
      const summaries: WindowSummary[] = folios
        .filter(f => f.status === 'open')
        .map(f => ({
          id: f.id,
          label: f.window_label || 'A',
          type: f.folio_type || 'guest',
          balance: f.balance,
          status: f.status,
          exempt: f.folio_type === 'company' && hasCorporate,
        }));
      setWindows(summaries);
      setLoading(false);
    }).catch(() => {
      // No folios — that's OK, checkout can proceed
      setWindows([]);
      setLoading(false);
    });
  }, [isOpen, bookingId, hasCorporate]);

  const unsettled = windows.filter(w => w.balance > 0 && !w.exempt);
  const exempt = windows.filter(w => w.balance > 0 && w.exempt);
  const settled = windows.filter(w => w.balance <= 0);
  const canCheckout = unsettled.length === 0;
  const totalUnsettled = unsettled.reduce((sum, w) => sum + w.balance, 0);

  const handleCheckout = async (force = false) => {
    setChecking(true);
    setError(null);
    try {
      const success = await onCheckout(force);
      if (success) onClose();
      else setError('Checkout failed. Please try again.');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (typeof detail === 'object' && detail?.unsettled_windows) {
        setError(`${detail.message} (${formatCurrency(detail.total_unsettled)} unsettled)`);
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Checkout failed');
      }
    }
    setChecking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terra-50 border border-terra-200 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-terra-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-neutral-900">Check Out</h3>
              <p className="text-[12px] text-neutral-500">{booking?.guest} &middot; Room {booking?.room}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-terra-600 animate-spin" />
              <span className="ml-2 text-[13px] text-neutral-500">Checking folio balances...</span>
            </div>
          ) : windows.length === 0 ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-emerald-800">No open folios</p>
                <p className="text-[11px] text-emerald-600">Ready for checkout</p>
              </div>
            </div>
          ) : (
            <>
              {/* Folio windows summary */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Folio Windows</h4>

                {/* Settled windows */}
                {settled.map(w => (
                  <div key={w.id} className="flex items-center justify-between px-3 py-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-[12px] font-medium text-neutral-700">
                        Window {w.label}
                      </span>
                      <span className="text-[10px] text-neutral-400 capitalize">({w.type})</span>
                    </div>
                    <span className="text-[12px] font-semibold text-emerald-600">{formatCurrency(0)}</span>
                  </div>
                ))}

                {/* Exempt company windows (→ AR) */}
                {exempt.map(w => (
                  <div key={w.id} className="flex items-center justify-between px-3 py-2.5 bg-blue-50/60 border border-blue-200/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-[12px] font-medium text-neutral-700">
                        Window {w.label}
                      </span>
                      <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">BTC → AR</span>
                    </div>
                    <span className="text-[12px] font-semibold text-blue-600">{formatCurrency(w.balance)}</span>
                  </div>
                ))}

                {/* Unsettled windows — blocking checkout */}
                {unsettled.map(w => (
                  <div key={w.id} className="flex items-center justify-between px-3 py-2.5 bg-amber-50/60 border border-amber-200/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-amber-500" />
                      <span className="text-[12px] font-medium text-neutral-700">
                        Window {w.label}
                      </span>
                      <span className="text-[10px] text-neutral-400 capitalize">({w.type})</span>
                    </div>
                    <span className="text-[12px] font-bold text-amber-600">{formatCurrency(w.balance)}</span>
                  </div>
                ))}
              </div>

              {/* Warning or ready message */}
              {!canCheckout ? (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-medium text-amber-800">
                      {formatCurrency(totalUnsettled)} unsettled across {unsettled.length} window{unsettled.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      Settle all folio windows before checkout, or force checkout to proceed with outstanding balance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-emerald-800">All balances settled</p>
                    <p className="text-[11px] text-emerald-600">
                      {exempt.length > 0 ? `${exempt.length} company window${exempt.length > 1 ? 's' : ''} will be routed to AR` : 'Ready for checkout'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-[12px] text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!canCheckout && !loading && windows.length > 0 && (
              <button
                onClick={() => { onClose(); onOpenFolio(booking); }}
                className="px-4 py-2 text-[12px] font-medium text-terra-700 bg-terra-50 hover:bg-terra-100 border border-terra-200 rounded-lg transition-colors"
              >
                Open Folio
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </button>
            {canCheckout ? (
              <button
                onClick={() => handleCheckout(false)}
                disabled={checking || loading}
                className="px-5 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50 flex items-center gap-2"
              >
                {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Checkout
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(true)}
                disabled={checking || loading}
                className="px-5 py-2 text-[13px] text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Force Checkout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
