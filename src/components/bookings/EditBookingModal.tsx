/**
 * EditBookingModal Component
 * Edit booking details - Glimmora Design System v5.0
 * Side drawer following CMS pattern
 */

import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { DatePicker } from '../ui2/DatePicker';

const SOURCE_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'Dummy Channel Manager', label: 'Dummy Channel Manager' },
  { value: 'CRS', label: 'CRS' },
  { value: 'Walk-in', label: 'Walk-in' },
  { value: 'Booking.com', label: 'Booking.com' },
  { value: 'Expedia', label: 'Expedia' },
];

const calculateNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return diff;
};

const validateEmail = (email: string): string => {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return '';
};

const validatePhone = (phone: string): string => {
  if (!phone.trim()) return 'Phone number is required';
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  if (cleaned.length < 7 || cleaned.length > 15) return 'Phone must be 7–15 digits';
  if (!/^\d+$/.test(cleaned)) return 'Phone must contain only digits';
  return '';
};

// Custom Select Component matching CMS pattern
function CustomSelect({ value, onChange, options, placeholder = 'Select...' }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border transition-all duration-200 ease-out text-left flex items-center justify-between focus:outline-none ${
          isOpen
            ? 'border-terra-400/60 ring-2 ring-terra-500/10'
            : 'border-neutral-200/80 hover:border-terra-300/60'
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
            {options.map((option: any) => (
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

interface FieldErrors {
  guest?: string;
  email?: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
}

export default function EditBookingModal({ isOpen, booking, onClose, onSave, isSaving }: any) {
  const [formState, setFormState] = useState({
    guest: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    notes: '',
    source: 'Website',
    eta: '',
    etd: '',
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (booking && isOpen) {
      setFormState({
        guest: booking.guest || '',
        email: booking.email || '',
        phone: booking.phone || '',
        checkIn: booking.checkIn || '',
        checkOut: booking.checkOut || '',
        notes: booking.specialRequests || '',
        source: booking.source || 'Website',
        eta: booking.eta || '',
        etd: booking.etd || '',
      });
      setErrors({});
      setTouched({});
    }
  }, [booking, isOpen]);

  const nights = useMemo(
    () => calculateNights(formState.checkIn, formState.checkOut),
    [formState.checkIn, formState.checkOut]
  );

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'guest':
        return value.trim() ? '' : 'Guest name is required';
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'checkIn':
        return value ? '' : 'Check-in date is required';
      case 'checkOut':
        if (!value) return 'Check-out date is required';
        if (formState.checkIn && new Date(value) <= new Date(formState.checkIn))
          return 'Check-out must be after check-in';
        return '';
      default:
        return '';
    }
  };

  const validateAll = (): boolean => {
    const newErrors: FieldErrors = {};
    let valid = true;
    const fields: (keyof FieldErrors)[] = ['guest', 'email', 'phone', 'checkIn', 'checkOut'];

    fields.forEach((field) => {
      const msg = validateField(field, formState[field]);
      if (msg) {
        newErrors[field] = msg;
        valid = false;
      }
    });

    setErrors(newErrors);
    setTouched({ guest: true, email: true, phone: true, checkIn: true, checkOut: true });
    return valid;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const msg = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
  };

  const handleDateChange = (name: 'checkIn' | 'checkOut', value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!booking || !validateAll()) return;
    onSave({
      guest: formState.guest.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      checkIn: formState.checkIn,
      checkOut: formState.checkOut,
      nights,
      specialRequests: formState.notes.trim(),
      source: formState.source,
      eta: formState.eta.trim() || undefined,
      etd: formState.etd.trim() || undefined,
    });
  };

  if (!booking) return null;

  const inputBase =
    'w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border transition-all duration-200 ease-out focus:outline-none';
  const inputNormal = `${inputBase} border-neutral-200/80 hover:border-terra-300/60 focus:border-terra-400/60 focus:ring-2 focus:ring-terra-500/10`;
  const inputError = `${inputBase} border-red-300 hover:border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/10`;

  const getInputClass = (field: keyof FieldErrors) =>
    errors[field] && touched[field] ? inputError : inputNormal;

  const drawerFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        loading={isSaving}
      >
        Save Changes
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Booking"
      subtitle="Update stay and guest details"
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
            <div className="grid grid-cols-2 gap-4">
              {/* Guest Name */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Guest Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="guest"
                  value={formState.guest}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  className={getInputClass('guest')}
                />
                {errors.guest && touched.guest && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.guest}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="john@example.com"
                  className={getInputClass('email')}
                />
                {errors.email && touched.email && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+1 (555) 123-4567"
                  className={getInputClass('phone')}
                />
                {errors.phone && touched.phone && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* Booking Source */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Booking Source
                </label>
                <CustomSelect
                  value={formState.source}
                  onChange={(value: string) => setFormState(prev => ({ ...prev, source: value }))}
                  options={SOURCE_OPTIONS}
                  placeholder="Select source"
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
            <div className="grid grid-cols-3 gap-4">
              {/* Check-in */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Check-in <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formState.checkIn}
                  onChange={(val) => handleDateChange('checkIn', val)}
                  placeholder="Select check-in"
                  className="w-full"
                />
                {errors.checkIn && touched.checkIn && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.checkIn}</p>
                )}
              </div>

              {/* Check-out */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Check-out <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formState.checkOut}
                  onChange={(val) => handleDateChange('checkOut', val)}
                  placeholder="Select check-out"
                  minDate={formState.checkIn || undefined}
                  className="w-full"
                />
                {errors.checkOut && touched.checkOut && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.checkOut}</p>
                )}
              </div>

              {/* Nights */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  Nights
                </label>
                <div className="h-9 px-3.5 bg-neutral-50 border border-neutral-200/80 rounded-lg text-neutral-700 font-medium flex items-center text-[13px]">
                  {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : '—'}
                </div>
              </div>
            </div>

            {/* ETA / ETD - Expected arrival and departure times (e.g. 14:30 or 2:30 PM) */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  ETA (Expected arrival time)
                </label>
                <input
                  name="eta"
                  type="text"
                  value={formState.eta}
                  onChange={handleChange}
                  placeholder="e.g. 14:30 or 2:30 PM"
                  className={inputNormal}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-700">
                  ETD (Expected departure time)
                </label>
                <input
                  name="etd"
                  type="text"
                  value={formState.etd}
                  onChange={handleChange}
                  placeholder="e.g. 11:00 or 11:00 AM"
                  className={inputNormal}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Additional Notes */}
        {formState.notes && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Guest Special Requests
            </h3>
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-700">
                Special Requests <span className="text-neutral-400 font-normal">(read-only, set by guest)</span>
              </label>
              <textarea
                name="notes"
                value={formState.notes}
                readOnly
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg text-[13px] bg-neutral-50 border border-neutral-200/80 text-neutral-600 cursor-not-allowed resize-none"
              />
            </div>
          </section>
        )}
      </form>
    </Drawer>
  );
}
