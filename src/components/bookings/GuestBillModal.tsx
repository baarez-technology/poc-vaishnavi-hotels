/**
 * GuestBillModal — Shows the itemized guest bill for a booking.
 */

import { useState, useEffect } from 'react';
import { X, Receipt, Printer } from 'lucide-react';
import { frontdeskService } from '@/api/services/frontdesk.service';
import toast from 'react-hot-toast';

interface GuestBillModalProps {
  isOpen: boolean;
  bookingId: number | string | null;
  guestName?: string;
  onClose: () => void;
}

export default function GuestBillModal({ isOpen, bookingId, guestName, onClose }: GuestBillModalProps) {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      setLoading(true);
      frontdeskService.getGuestBill(Number(bookingId))
        .then(data => setBill(data))
        .catch(() => toast.error('Failed to load guest bill'))
        .finally(() => setLoading(false));
    } else {
      setBill(null);
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const fmt = (v: number | null | undefined) => v != null ? `${Number(v).toFixed(2)}` : '0.00';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-terra-600" />
            <h2 className="text-[15px] font-semibold text-neutral-900">
              Guest Bill {guestName ? `— ${guestName}` : ''}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-1.5 rounded-lg hover:bg-neutral-100" title="Print">
              <Printer size={16} className="text-neutral-500" />
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" />
            </div>
          ) : !bill ? (
            <p className="text-center text-[13px] text-neutral-400 py-12">No bill data available</p>
          ) : (
            <div className="space-y-5">
              {/* Guest & Booking Info */}
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <p className="text-neutral-500">Guest</p>
                  <p className="font-medium text-neutral-900">{bill.guest_name || guestName || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Booking #</p>
                  <p className="font-mono font-medium text-neutral-900">{bill.booking_number || bookingId}</p>
                </div>
                {bill.room_number && (
                  <div>
                    <p className="text-neutral-500">Room</p>
                    <p className="font-medium text-neutral-900">{bill.room_number}</p>
                  </div>
                )}
                {bill.arrival_date && (
                  <div>
                    <p className="text-neutral-500">Stay</p>
                    <p className="font-medium text-neutral-900">{bill.arrival_date} → {bill.departure_date}</p>
                  </div>
                )}
              </div>

              {/* Charges */}
              {bill.charges && bill.charges.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Charges</h3>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-2 text-neutral-500 font-medium">Date</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">Description</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">Folio</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Amount</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.charges.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-neutral-100">
                          <td className="py-1.5 text-neutral-600">{c.date || c.created_at?.split('T')[0] || '—'}</td>
                          <td className="py-1.5 text-neutral-900">{c.description}</td>
                          <td className="py-1.5 text-neutral-500">{c.folio_window || c.folio_label || '—'}</td>
                          <td className="py-1.5 text-right text-neutral-900">{fmt(c.amount)}</td>
                          <td className="py-1.5 text-right text-neutral-500">{fmt(c.tax_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payments */}
              {bill.payments && bill.payments.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Payments</h3>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-2 text-neutral-500 font-medium">Date</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">Method</th>
                        <th className="text-left py-2 text-neutral-500 font-medium">Reference</th>
                        <th className="text-right py-2 text-neutral-500 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.payments.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-neutral-100">
                          <td className="py-1.5 text-neutral-600">{p.date || p.created_at?.split('T')[0] || '—'}</td>
                          <td className="py-1.5 text-neutral-900">{p.method || p.payment_method}</td>
                          <td className="py-1.5 text-neutral-500">{p.reference || '—'}</td>
                          <td className="py-1.5 text-right text-emerald-700 font-medium">{fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              <div className="border-t border-neutral-200 pt-4 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Charges</span>
                  <span className="font-semibold text-neutral-900">{fmt(bill.total_charges)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Tax</span>
                  <span className="font-semibold text-neutral-900">{fmt(bill.total_tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Payments</span>
                  <span className="font-semibold text-emerald-700">{fmt(bill.total_payments)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2">
                  <span className="font-bold text-neutral-900">Balance Due</span>
                  <span className={`font-bold ${(bill.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {fmt(bill.balance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
