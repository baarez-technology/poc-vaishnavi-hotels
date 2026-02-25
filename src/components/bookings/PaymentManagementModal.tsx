/**
 * PaymentManagementModal Component
 * Manage booking payments - Glimmora Design System v5.0
 * Side drawer following CMS pattern
 */

import { useEffect, useState } from 'react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { CreditCard, DollarSign, Receipt, RefreshCw, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react';
import { paymentStatusConfig } from '../../data/bookingsData';
import { useCurrency } from '@/hooks/useCurrency';
import { bookingService } from '@/api/services/booking.service';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600' },
  { value: 'paid', label: 'Paid', icon: CheckCircle, color: 'text-emerald-600' },
  { value: 'partial', label: 'Partial', icon: DollarSign, color: 'text-blue-600' },
  { value: 'failed', label: 'Failed', icon: AlertCircle, color: 'text-red-600' },
  { value: 'refunded', label: 'Refunded', icon: RefreshCw, color: 'text-purple-600' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'pay_at_hotel', label: 'Pay at Hotel' },
  { value: 'online', label: 'Online Payment' },
];

// Custom Select Component matching CMS pattern
function CustomSelect({ value, onChange, options, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border transition-all duration-150 text-left flex items-center justify-between focus:outline-none ${
          isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className={selectedOption ? 'text-neutral-900' : 'text-neutral-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors ${
                  value === option.value ? 'bg-terra-50 text-terra-700' : 'text-neutral-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface PaymentManagementModalProps {
  isOpen: boolean;
  booking: any;
  onClose: () => void;
  onSave: (paymentData: any) => void;
  isSaving?: boolean;
}

export default function PaymentManagementModal({
  isOpen,
  booking,
  onClose,
  onSave,
  isSaving = false
}: PaymentManagementModalProps) {
  const { formatCurrency, symbol } = useCurrency();
  const [formState, setFormState] = useState({
    paymentStatus: 'pending',
    paymentMethod: 'card',
    amountPaid: 0,
    notes: '',
  });

  useEffect(() => {
    if (booking && isOpen) {
      setFormState({
        paymentStatus: booking.paymentStatus || booking.payment_status || 'pending',
        paymentMethod: booking.paymentMethod || booking.payment_method || 'card',
        amountPaid: booking.amountPaid || booking.amount_paid || 0,
        notes: booking.paymentNotes || '',
      });
    }
  }, [booking, isOpen]);

  const totalAmount = booking?.amount || booking?.total || booking?.totalPrice || 0;
  const balanceDue = totalAmount - formState.amountPaid;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'amountPaid' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!booking) return;
    onSave({
      paymentStatus: formState.paymentStatus,
      paymentMethod: formState.paymentMethod,
      amountPaid: formState.amountPaid,
      paymentNotes: formState.notes.trim(),
      balanceDue: balanceDue,
    });
  };

  const handleMarkAsPaid = () => {
    setFormState(prev => ({
      ...prev,
      paymentStatus: 'paid',
      amountPaid: totalAmount,
    }));
  };

  if (!booking) return null;

  const currentPaymentConfig = paymentStatusConfig[formState.paymentStatus] || paymentStatusConfig['pending'];

  const drawerFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="outline"
        onClick={handleMarkAsPaid}
        disabled={formState.paymentStatus === 'paid'}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Mark as Paid
      </Button>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSaving}
        >
          Save Payment
        </Button>
      </div>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Payment"
      subtitle={`Booking #${booking.id || booking.bookingNumber}`}
      maxWidth="max-w-2xl"
      footer={drawerFooter}
    >
      <div className="space-y-8">
        {/* Payment Summary Card */}
        <section className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-terra-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-neutral-900">Payment Summary</h3>
              <p className="text-[11px] text-neutral-500">{booking.guest} - {booking.roomType}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-neutral-200">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-neutral-200">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(formState.amountPaid)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-neutral-200">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Balance Due</p>
              <p className={`text-lg font-bold ${balanceDue > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
                {formatCurrency(balanceDue)}
              </p>
            </div>
          </div>
        </section>

        {/* Current Status Display - shows SAVED status, not form edits */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Current Status
          </h3>
          {(() => {
            const savedStatus = booking.paymentStatus || booking.payment_status || 'pending';
            const savedConfig = paymentStatusConfig[savedStatus] || paymentStatusConfig['pending'];
            return (
              <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border ${savedConfig.color}`}>
                <span className="mr-2">{savedConfig.icon}</span>
                {savedConfig.label}
              </div>
            );
          })()}
        </section>

        {/* Payment Status Selection */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Update Payment Status
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {PAYMENT_STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = formState.paymentStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormState(prev => ({ ...prev, paymentStatus: option.value }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-terra-400 bg-terra-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-terra-600' : option.color}`} />
                  <span className={`text-[11px] font-medium ${isSelected ? 'text-terra-700' : 'text-neutral-600'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Payment Details */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Payment Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Payment Method
                </label>
                <CustomSelect
                  value={formState.paymentMethod}
                  onChange={(value) => setFormState(prev => ({ ...prev, paymentMethod: value }))}
                  options={PAYMENT_METHOD_OPTIONS}
                  placeholder="Select method"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Amount Paid ({symbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[13px] font-medium text-neutral-400">{symbol}</span>
                  <input
                    name="amountPaid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.amountPaid}
                    onChange={handleChange}
                    className="w-full h-9 pl-9 pr-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Notes */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Payment Notes
          </h3>
          <div className="space-y-2">
            <textarea
              name="notes"
              value={formState.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any notes about this payment..."
              className="w-full px-3.5 py-2.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150 resize-none"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="border-t border-neutral-200 pt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFormState(prev => ({ ...prev, amountPaid: totalAmount * 0.5, paymentStatus: 'partial' }))}
              className="px-3 py-1.5 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              Record 50% Deposit
            </button>
            <button
              type="button"
              onClick={handleMarkAsPaid}
              className="px-3 py-1.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              Mark Full Payment
            </button>
            <button
              type="button"
              onClick={() => setFormState(prev => ({ ...prev, paymentStatus: 'refunded', amountPaid: 0 }))}
              className="px-3 py-1.5 text-[12px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              Process Refund
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await bookingService.downloadInvoice(booking.id || booking.bookingNumber);
                } catch (err) {
                  console.error('Failed to download invoice:', err);
                  alert('Failed to download invoice. Please try again.');
                }
              }}
              className="px-3 py-1.5 text-[12px] font-medium text-terra-700 bg-terra-50 hover:bg-terra-100 rounded-lg border border-terra-200 transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Invoice
            </button>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
