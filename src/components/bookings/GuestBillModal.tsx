/**
 * GuestBillModal — Invoice-style guest bill for a booking.
 */

import { useState, useEffect } from 'react';
import { X, Printer, Building2 } from 'lucide-react';
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
        .then(data => {
          // Handle both wrapped { success, ...fields } and direct responses
          const d = data?.success !== undefined ? data : data;
          setBill(d);
        })
        .catch(() => toast.error('Failed to load invoice'))
        .finally(() => setLoading(false));
    } else {
      setBill(null);
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const fmt = (v: number | null | undefined) => {
    const n = Number(v) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
  };

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const handlePrint = () => window.print();

  const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:bg-white print:static" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col print:max-w-full print:max-h-full print:shadow-none print:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Action bar — hidden in print */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 print:hidden">
          <h2 className="text-[14px] font-semibold text-neutral-700">Invoice</h2>
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
              <X size={18} className="text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 print:px-12 print:py-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" />
            </div>
          ) : !bill ? (
            <p className="text-center text-[13px] text-neutral-400 py-16">No invoice data available</p>
          ) : (
            <div className="space-y-6">
              {/* Hotel header + Invoice # */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={20} className="text-terra-600" />
                    <h1 className="text-[18px] font-bold text-neutral-900 tracking-tight">Glimmora Hotel & Suites</h1>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    123 Hospitality Boulevard, Mumbai 400001<br />
                    GSTIN: 27AABCG1234F1ZH &nbsp;|&nbsp; Tel: +91 22 1234 5678
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[22px] font-bold text-terra-600 tracking-tight leading-none mb-1">INVOICE</p>
                  <p className="text-[11px] text-neutral-500">
                    <span className="font-medium text-neutral-700">#{bill.confirmation_code || bill.booking_number || bookingId}</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Date: {invoiceDate}</p>
                </div>
              </div>

              <div className="border-t border-neutral-200" />

              {/* Bill To + Stay Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5">Bill To</p>
                  <p className="text-[13px] font-semibold text-neutral-900">{bill.guest_name || guestName || '—'}</p>
                  {bill.guest_email && <p className="text-[11px] text-neutral-500">{bill.guest_email}</p>}
                  {bill.guest_phone && <p className="text-[11px] text-neutral-500">{bill.guest_phone}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5">Stay Details</p>
                  <div className="text-[11px] text-neutral-700 space-y-0.5">
                    {bill.room_number && (
                      <p>Room <span className="font-semibold">{bill.room_number}</span>{bill.room_type ? ` · ${bill.room_type}` : ''}</p>
                    )}
                    <p>Check-in: <span className="font-medium">{fmtDate(bill.arrival_date)}</span></p>
                    <p>Check-out: <span className="font-medium">{fmtDate(bill.departure_date)}</span></p>
                    <p>{bill.nights || 0} night{(bill.nights || 0) !== 1 ? 's' : ''} · {bill.adults || 1} adult{(bill.adults || 1) !== 1 ? 's' : ''}{bill.children ? `, ${bill.children} child${bill.children !== 1 ? 'ren' : ''}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Charges table */}
              <div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-neutral-50 border-y border-neutral-200">
                      <th className="text-left py-2.5 px-3 text-neutral-500 font-semibold text-[10px] uppercase tracking-wider">Date</th>
                      <th className="text-left py-2.5 px-3 text-neutral-500 font-semibold text-[10px] uppercase tracking-wider">Description</th>
                      <th className="text-right py-2.5 px-3 text-neutral-500 font-semibold text-[10px] uppercase tracking-wider">Amount</th>
                      <th className="text-right py-2.5 px-3 text-neutral-500 font-semibold text-[10px] uppercase tracking-wider">Tax</th>
                      <th className="text-right py-2.5 px-3 text-neutral-500 font-semibold text-[10px] uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.charges && bill.charges.length > 0 ? (
                      bill.charges.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                          <td className="py-2 px-3 text-neutral-500">{fmtDate(c.date)}</td>
                          <td className="py-2 px-3 text-neutral-900">{c.description}</td>
                          <td className="py-2 px-3 text-right text-neutral-700 tabular-nums">{fmt(c.amount)}</td>
                          <td className="py-2 px-3 text-right text-neutral-500 tabular-nums">{fmt(c.tax_amount)}</td>
                          <td className="py-2 px-3 text-right text-neutral-900 font-medium tabular-nums">{fmt(c.total || ((c.amount || 0) + (c.tax_amount || 0)))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-neutral-400 text-[11px]">No charges recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal</span>
                    <span className="text-neutral-800 tabular-nums font-medium">{fmt(bill.total_charges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tax</span>
                    <span className="text-neutral-800 tabular-nums font-medium">{fmt(bill.total_tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-300 pt-1.5">
                    <span className="font-bold text-neutral-900 text-[13px]">Grand Total</span>
                    <span className="font-bold text-neutral-900 text-[13px] tabular-nums">{fmt(bill.grand_total ?? ((bill.total_charges || 0) + (bill.total_tax || 0)))}</span>
                  </div>
                </div>
              </div>

              {/* Payments */}
              {bill.payments && bill.payments.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Payments Received</p>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-emerald-50/60 border-y border-emerald-200/50">
                        <th className="text-left py-2 px-3 text-emerald-700 font-semibold text-[10px] uppercase tracking-wider">Date</th>
                        <th className="text-left py-2 px-3 text-emerald-700 font-semibold text-[10px] uppercase tracking-wider">Method</th>
                        <th className="text-left py-2 px-3 text-emerald-700 font-semibold text-[10px] uppercase tracking-wider">Reference</th>
                        <th className="text-right py-2 px-3 text-emerald-700 font-semibold text-[10px] uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.payments.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-emerald-100/50">
                          <td className="py-2 px-3 text-neutral-600">{fmtDate(p.date)}</td>
                          <td className="py-2 px-3 text-neutral-900 capitalize">{(p.method || p.payment_method || '—').replace(/_/g, ' ')}</td>
                          <td className="py-2 px-3 text-neutral-500 font-mono text-[11px]">{p.reference || '—'}</td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-semibold tabular-nums">{fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Balance Due */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${(bill.balance || 0) > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${(bill.balance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {(bill.balance || 0) > 0 ? 'Balance Due' : 'Paid in Full'}
                  </p>
                  {bill.payment_status && (
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Payment Status: <span className="capitalize font-medium">{bill.payment_status.replace(/_/g, ' ')}</span>
                    </p>
                  )}
                </div>
                <p className={`text-[20px] font-bold tabular-nums ${(bill.balance || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {fmt(bill.balance)}
                </p>
              </div>

              {/* Footer note — print only */}
              <p className="text-[10px] text-neutral-400 text-center pt-2 hidden print:block">
                Thank you for staying at Glimmora Hotel & Suites. This is a computer-generated invoice.
              </p>
            </div>
          )}
        </div>

        {/* Action footer — hidden in print */}
        <div className="px-6 py-3 border-t border-neutral-200 flex justify-end gap-2 print:hidden">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
