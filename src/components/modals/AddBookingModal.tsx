/**
 * AddBookingModal Component
 * Create new bookings - Glimmora Design System v5.0
 * Side drawer following CMS pattern
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ROOM_TYPES,
  calculateNights,
  calculateBookingAmount,
  formatCurrency,
  generateBookingId,
} from '../../utils/bookings';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { Input, FormField, Textarea } from '../ui2/Input';
import DatePicker from '../ui2/DatePicker';

const SOURCE_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'Walk-in', label: 'Walk-in' },
  { value: 'Booking.com', label: 'Booking.com' },
  { value: 'Expedia', label: 'Expedia' },
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

export default function AddBookingModal({ isOpen, onClose, onSubmit, isCreating = false }) {
  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    nationality: '',
    checkIn: '',
    checkOut: '',
    roomType: 'Minimalist Studio',
    adults: 1,
    children: 0,
    specialRequests: '',
    source: 'Website',
    rateOverride: '',
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        guestName: '',
        email: '',
        phone: '',
        nationality: '',
        checkIn: '',
        checkOut: '',
        roomType: 'Minimalist Studio',
        adults: 1,
        children: 0,
        specialRequests: '',
        source: 'Website',
        rateOverride: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  // Calculate booking details
  const bookingCalc = useMemo(() => {
    const nights = calculateNights(formData.checkIn, formData.checkOut);
    const roomTypeConfig = ROOM_TYPES.find(r => r.value === formData.roomType);
    const baseRate = formData.rateOverride ? parseFloat(formData.rateOverride) : (roomTypeConfig?.price || 150);
    const { subtotal, taxes, total } = calculateBookingAmount(formData.roomType, nights);

    // Recalculate if rate override
    const actualSubtotal = baseRate * nights;
    const actualTaxes = actualSubtotal * 0.12;
    const actualTotal = actualSubtotal + actualTaxes;

    return {
      nights,
      baseRate,
      subtotal: formData.rateOverride ? actualSubtotal : subtotal,
      taxes: formData.rateOverride ? actualTaxes : taxes,
      total: formData.rateOverride ? Math.round(actualTotal) : total,
    };
  }, [formData.checkIn, formData.checkOut, formData.roomType, formData.rateOverride]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.guestName.trim()) {
      newErrors.guestName = 'Guest name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.checkIn) {
      newErrors.checkIn = 'Check-in date is required';
    }

    if (!formData.checkOut) {
      newErrors.checkOut = 'Check-out date is required';
    }

    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = 'Check-out must be after check-in';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isCreating) return; // Prevent double submission
    if (validate()) {
      const bookingData = {
        id: generateBookingId(),
        guest: formData.guestName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        nationality: formData.nationality.trim(),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nights: bookingCalc.nights,
        roomType: formData.roomType,
        room: '',
        guests: formData.adults + formData.children,
        adults: formData.adults,
        children: formData.children,
        specialRequests: formData.specialRequests.trim(),
        source: formData.source,
        amount: bookingCalc.total,
        status: 'PENDING',
        bookedOn: new Date().toISOString().split('T')[0],
        vip: false,
        upsells: [],
      };
      // Don't close here - let parent handle closing after API response
      onSubmit(bookingData);
    }
  };

  const drawerFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose} disabled={isCreating}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={isCreating} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Booking'}
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="New Booking"
      subtitle="Create a new reservation"
      maxWidth="max-w-2xl"
      footer={drawerFooter}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Guest Information */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Guest Information
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-700">
                Guest Name
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                name="guestName"
                value={formData.guestName}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border transition-all duration-150 focus:outline-none ${
                  errors.guestName
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                    : 'border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10'
                }`}
              />
              {errors.guestName && (
                <p className="text-[11px] text-rose-500">{errors.guestName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Email
                  <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border transition-all duration-150 focus:outline-none ${
                    errors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                      : 'border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10'
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stay Details */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Stay Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Check-in Date
                  <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <DatePicker
                  value={formData.checkIn}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, checkIn: value }));
                    if (errors.checkIn) {
                      setErrors(prev => ({ ...prev, checkIn: null }));
                    }
                  }}
                  placeholder="Select check-in date"
                  minDate={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
                {errors.checkIn && (
                  <p className="text-[11px] text-rose-500">{errors.checkIn}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Check-out Date
                  <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <DatePicker
                  value={formData.checkOut}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, checkOut: value }));
                    if (errors.checkOut) {
                      setErrors(prev => ({ ...prev, checkOut: null }));
                    }
                  }}
                  placeholder="Select check-out date"
                  minDate={formData.checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
                {errors.checkOut && (
                  <p className="text-[11px] text-rose-500">{errors.checkOut}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Adults
                </label>
                <input
                  type="number"
                  name="adults"
                  value={formData.adults}
                  onChange={handleChange}
                  min="1"
                  max="4"
                  className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Children
                </label>
                <input
                  type="number"
                  name="children"
                  value={formData.children}
                  onChange={handleChange}
                  min="0"
                  max="3"
                  className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Nights
                </label>
                <div className="h-9 px-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 font-medium flex items-center text-[13px]">
                  {bookingCalc.nights || '-'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Room & Source */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Room & Source
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Room Type
                </label>
                <CustomSelect
                  value={formData.roomType}
                  onChange={(value) => setFormData(prev => ({ ...prev, roomType: value }))}
                  options={ROOM_TYPES.map(type => ({
                    value: type.value,
                    label: `${type.label} - ${formatCurrency(type.price)}/night`
                  }))}
                  placeholder="Select room type"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Booking Source
                </label>
                <CustomSelect
                  value={formData.source}
                  onChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                  options={SOURCE_OPTIONS}
                  placeholder="Select source"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-700">
                Special Requests
              </label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows={2}
                placeholder="Any special requirements..."
                className="w-full px-3.5 py-2.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Payment Summary */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Payment
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-700">
                Rate per Night (Optional Override)
              </label>
              <input
                type="number"
                name="rateOverride"
                value={formData.rateOverride}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder={`Default: ${formatCurrency(ROOM_TYPES.find(r => r.value === formData.roomType)?.price || 150)}`}
                className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
              />
            </div>

            {bookingCalc.nights > 0 && (
              <div className="p-4 bg-terra-50 rounded-lg border border-terra-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-neutral-600">
                      {formatCurrency(bookingCalc.baseRate)} x {bookingCalc.nights} night{bookingCalc.nights > 1 ? 's' : ''}
                    </span>
                    <span className="text-neutral-700">{formatCurrency(bookingCalc.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-neutral-600">Taxes (12%)</span>
                    <span className="text-neutral-700">{formatCurrency(bookingCalc.taxes)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-terra-200">
                    <span className="font-semibold text-neutral-900 text-[13px]">Total</span>
                    <span className="font-bold text-lg text-terra-600">{formatCurrency(bookingCalc.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </form>
    </Drawer>
  );
}
