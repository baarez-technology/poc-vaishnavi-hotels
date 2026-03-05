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
  generateBookingId,
} from '../../utils/bookings';
import { useGSTCalculator } from '@/hooks/useGSTCalculator';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { Input, FormField, Textarea } from '../ui2/Input';
import DatePicker from '../ui2/DatePicker';
import { useCurrency } from '@/hooks/useCurrency';
import { corporateService, type CorporateAccount } from '@/api/services/corporate.service';
import { apiClient } from '@/api/client';
import { roomTypesService } from '@/api/services/roomTypes.service';

const SOURCE_OPTIONS = [
  { value: 'Direct', label: 'Direct (Walk-in)' },
  { value: 'Website', label: 'Website' },
  { value: 'Corporate Portal', label: 'Corporate Portal' },
  { value: 'Booking.com', label: 'Booking.com' },
  { value: 'Expedia', label: 'Expedia' },
  { value: 'Dummy Channel Manager', label: 'Channel Manager' },
  { value: 'OTA', label: 'OTA (Other)' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'pay_at_hotel', label: 'Pay at Hotel' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
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
  const { formatCurrency } = useCurrency();
  const { calculateGST } = useGSTCalculator();

  const initialFormData = {
    guestName: '',
    email: '',
    phone: '',
    nationality: '',
    checkIn: '',
    checkOut: '',
    roomType: 'Minimalist Studio',
    adults: 1,
    children: 0,
    infants: 0,
    specialRequests: '',
    source: 'Direct',
    rateOverride: '',
    isVip: false,
    corporateAccountId: null as number | null,
    eta: '',
    etd: '',
    paymentMethod: 'card',
    ratePlan: 'BAR',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccount[]>([]);
  const [apiRoomTypes, setApiRoomTypes] = useState<any[]>([]);
  const [apiRatePlans, setApiRatePlans] = useState<any[]>([]);

  // Fetch corporate accounts, room types, rate plans on mount
  useEffect(() => {
    corporateService.listAccounts({ status: 'active' }).then((data) => {
      setCorporateAccounts(Array.isArray(data) ? data : data?.items || []);
    }).catch(() => {});

    roomTypesService.getRoomTypes().then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        setApiRoomTypes(items);
        // Auto-select the first room type from the API
        setFormData(prev => ({ ...prev, roomType: items[0].name }));
      }
    }).catch(() => {});

    apiClient.get('/api/v1/rates/plans', { params: { is_active: true } }).then((res) => {
      const plans = Array.isArray(res.data) ? res.data : res.data?.items || [];
      if (plans.length > 0) setApiRatePlans(plans);
    }).catch(() => {});
  }, []);

  // Compute room type options: prefer API, fallback to hardcoded
  const roomTypeOptions = useMemo(() => {
    if (apiRoomTypes.length > 0) {
      return apiRoomTypes.map(rt => ({
        value: rt.name,
        label: rt.name,
        price: rt.price ?? rt.originalPrice ?? 150,
      }));
    }
    return ROOM_TYPES;
  }, [apiRoomTypes]);

  // Compute rate plan options: prefer API, fallback to hardcoded
  const ratePlanOptions = useMemo(() => {
    if (apiRatePlans.length > 0) {
      return apiRatePlans.map(rp => ({
        value: rp.name || rp.code,
        label: rp.name || rp.code,
      }));
    }
    return [
      { value: 'BAR', label: 'BAR (Best Available)' },
      { value: 'Corporate', label: 'Corporate' },
      { value: 'OTA', label: 'OTA' },
      { value: 'Long Stay', label: 'Long Stay' },
    ];
  }, [apiRatePlans]);

  // Reset form when modal opens, defaulting roomType to first available API room type
  useEffect(() => {
    if (isOpen) {
      const defaultRoomType = apiRoomTypes.length > 0 ? apiRoomTypes[0].name : initialFormData.roomType;
      setFormData({ ...initialFormData, roomType: defaultRoomType });
      setErrors({});
    }
  }, [isOpen]);

  // Calculate booking details — always use roomTypeOptions (API-backed) for prices
  // Uses GST slab-based tax calculation (12% for ≤₹7,500/night, 18% for >₹7,500/night)
  const bookingCalc = useMemo(() => {
    const nights = calculateNights(formData.checkIn, formData.checkOut);
    const roomTypeConfig = roomTypeOptions.find(r => r.value === formData.roomType);
    const defaultRate = roomTypeConfig?.price || 150;
    const parsed = formData.rateOverride !== '' ? parseFloat(formData.rateOverride) : NaN;
    const baseRate = !isNaN(parsed) && parsed > 0 ? parsed : defaultRate;
    const subtotal = baseRate * nights;
    const gst = calculateGST(baseRate, nights);
    const taxes = gst.taxAmount;
    const serviceFee = gst.serviceFee;
    const total = Math.round(subtotal + taxes + serviceFee);
    const taxRate = gst.taxRate;

    return { nights, baseRate, subtotal, taxes, serviceFee, total, taxRate };
  }, [formData.checkIn, formData.checkOut, formData.roomType, formData.rateOverride, roomTypeOptions, calculateGST]);

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
        guests: formData.adults + formData.children + formData.infants,
        adults: formData.adults,
        children: formData.children,
        infants: formData.infants,
        specialRequests: formData.specialRequests.trim(),
        source: formData.source,
        amount: bookingCalc.total,
        status: 'PENDING',
        bookedOn: new Date().toISOString().split('T')[0],
        vip: formData.isVip,
        isVip: formData.isVip,
        corporateAccountId: formData.corporateAccountId,
        eta: formData.eta || undefined,
        etd: formData.etd || undefined,
        paymentMethod: formData.paymentMethod,
        ratePlan: formData.ratePlan,
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

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-700">
                Nationality / Country
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="e.g. India, United States"
                className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
              />
            </div>
          </div>
        </section>

        {/* Guest Status & Corporate */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Guest Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isVip: false }))}
                className={`flex-1 h-10 rounded-lg text-[13px] font-medium border-2 transition-all ${
                  !formData.isVip
                    ? 'border-terra-500 bg-terra-50 text-terra-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isVip: true }))}
                className={`flex-1 h-10 rounded-lg text-[13px] font-medium border-2 transition-all ${
                  formData.isVip
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                VIP
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-700">
                Corporate Account
              </label>
              <CustomSelect
                value={formData.corporateAccountId ? String(formData.corporateAccountId) : ''}
                onChange={(value) => {
                  const id = value ? Number(value) : null;
                  setFormData(prev => ({
                    ...prev,
                    corporateAccountId: id,
                    ...(id ? { source: 'Corporate Portal', ratePlan: 'Corporate' } : {}),
                  }));
                }}
                options={[
                  { value: '', label: 'None (Walk-in)' },
                  ...corporateAccounts.map(c => ({ value: String(c.id), label: c.company_name })),
                ]}
                placeholder="Select corporate account"
              />
              {formData.corporateAccountId && (
                <p className="text-[11px] text-blue-600 font-medium">
                  Source and rate plan auto-set to Corporate
                </p>
              )}
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

            <div className="grid grid-cols-4 gap-4">
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
                  max="6"
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
                  max="4"
                  className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Infants
                </label>
                <input
                  type="number"
                  name="infants"
                  value={formData.infants}
                  onChange={handleChange}
                  min="0"
                  max="2"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  ETA (Expected Arrival)
                </label>
                <input
                  type="time"
                  name="eta"
                  value={formData.eta}
                  onChange={handleChange}
                  className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  ETD (Expected Departure)
                </label>
                <input
                  type="time"
                  name="etd"
                  value={formData.etd}
                  onChange={handleChange}
                  className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Room, Rate & Source */}
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
                  onChange={(value) => setFormData(prev => ({ ...prev, roomType: value, rateOverride: '' }))}
                  options={roomTypeOptions.map(type => ({
                    value: type.value,
                    label: `${type.label} - ${formatCurrency(type.price)}/night`
                  }))}
                  placeholder="Select room type"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Rate Plan
                </label>
                <CustomSelect
                  value={formData.ratePlan}
                  onChange={(value) => setFormData(prev => ({ ...prev, ratePlan: value }))}
                  options={ratePlanOptions}
                  placeholder="Select rate plan"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Payment Method
                </label>
                <CustomSelect
                  value={formData.paymentMethod}
                  onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  options={PAYMENT_METHOD_OPTIONS}
                  placeholder="Select payment method"
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
                onFocus={() => {
                  if (!formData.rateOverride) {
                    const defaultRate = roomTypeOptions.find(r => r.value === formData.roomType)?.price || 150;
                    setFormData(prev => ({ ...prev, rateOverride: String(defaultRate) }));
                  }
                }}
                min="0"
                step="0.01"
                placeholder={`Default: ${formatCurrency(roomTypeOptions.find(r => r.value === formData.roomType)?.price || 150)}`}
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
                    <span className="text-neutral-600">GST ({bookingCalc.taxRate}%)</span>
                    <span className="text-neutral-700">{formatCurrency(bookingCalc.taxes)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-neutral-600">Service Fee (5%)</span>
                    <span className="text-neutral-700">{formatCurrency(bookingCalc.serviceFee)}</span>
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
