/**
 * NewBookingModal Component
 * Premium Hotel Booking Flow - Glimmora Design System
 * Refined luxury aesthetic with warm terra tones
 */

import { useState, useEffect } from 'react';
import {
  User, Calendar, Bed, Crown, Check, Users, AlertCircle,
  Sparkles, Globe, Mail, Phone, X, ChevronRight,
  Building, Wifi, Coffee, Car, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '../ui2/Modal';
import { Input, FormField, Select, Textarea } from '../ui2/Input';
import { Button } from '../ui2/Button';
import DatePicker from '../ui2/DatePicker';

const roomTypes = ['Standard', 'Premium', 'Deluxe', 'Suite'];
const ratePlans = ['BAR', 'Corporate', 'OTA', 'Long Stay'];
const sources = [
  { id: 'Direct', label: 'Direct', icon: Building },
  { id: 'Booking.com', label: 'Booking.com', icon: Globe },
  { id: 'Expedia', label: 'Expedia', icon: Globe },
  { id: 'Hotels.com', label: 'Hotels.com', icon: Globe },
  { id: 'Corporate Portal', label: 'Corporate', icon: Building },
];

export default function NewBookingModal({
  isOpen,
  onClose,
  onSubmit,
  availableRooms = [],
  getRateForBooking
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    isVip: false,
    checkIn: '',
    checkOut: '',
    nights: 0,
    ratePlan: 'BAR',
    roomType: 'Standard',
    adults: 2,
    children: 0,
    source: 'Direct',
    specialRequests: '',
    selectedRoom: null,
    amount: 0
  });

  const [errors, setErrors] = useState({});
  const [filteredRooms, setFilteredRooms] = useState([]);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const start = new Date(formData.checkIn);
      const end = new Date(formData.checkOut);
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (nights > 0) {
        setFormData(prev => ({ ...prev, nights }));
      }
    }
  }, [formData.checkIn, formData.checkOut]);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const filtered = availableRooms.filter(room =>
        room.type === formData.roomType &&
        room.cleaning !== 'dirty'
      );
      setFilteredRooms(filtered);

      if (getRateForBooking && formData.nights > 0) {
        const rateInfo = getRateForBooking(
          formData.roomType,
          formData.ratePlan,
          formData.checkIn,
          formData.checkOut
        );
        if (rateInfo) {
          setFormData(prev => ({ ...prev, amount: rateInfo.totalRate }));
        }
      }
    }
  }, [formData.roomType, formData.checkIn, formData.checkOut, formData.ratePlan, formData.nights, availableRooms, getRateForBooking]);

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!formData.guestName.trim()) newErrors.guestName = 'Name is required';
      if (!formData.guestEmail.trim()) newErrors.guestEmail = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
        newErrors.guestEmail = 'Invalid email format';
      }
      if (!formData.guestPhone.trim()) newErrors.guestPhone = 'Phone is required';
      else if (!/^[\d\s\-\+\(\)]+$/.test(formData.guestPhone)) {
        newErrors.guestPhone = 'Invalid phone number';
      } else if (formData.guestPhone.replace(/\D/g, '').length < 10) {
        newErrors.guestPhone = 'Phone must be at least 10 digits';
      }
    }

    if (stepNum === 2) {
      if (!formData.checkIn) newErrors.checkIn = 'Check-in date is required';
      if (!formData.checkOut) newErrors.checkOut = 'Check-out date is required';
      if (formData.checkIn && formData.checkOut) {
        const start = new Date(formData.checkIn);
        const end = new Date(formData.checkOut);
        if (end <= start) {
          newErrors.checkOut = 'Check-out must be after check-in';
        }
      }
      if (formData.adults < 1) newErrors.adults = 'At least 1 adult required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!formData.selectedRoom && filteredRooms.length > 0) {
      setErrors({ selectedRoom: 'Please select a room' });
      return;
    }

    const bookingData = {
      ...formData,
      roomNumber: formData.selectedRoom?.roomNumber || null,
      status: 'PENDING',
      amountPaid: 0,
      balance: formData.amount,
      createdBy: 'Front Desk'
    };

    onSubmit(bookingData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      isVip: false,
      checkIn: '',
      checkOut: '',
      nights: 0,
      ratePlan: 'BAR',
      roomType: 'Standard',
      adults: 2,
      children: 0,
      source: 'Direct',
      specialRequests: '',
      selectedRoom: null,
      amount: 0
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatCurrency = (amount) => `$${amount.toLocaleString()}`;
  const today = new Date().toISOString().split('T')[0];

  const steps = [
    { num: 1, label: 'Guest Details', shortLabel: 'Guest', icon: User },
    { num: 2, label: 'Stay Information', shortLabel: 'Stay', icon: Calendar },
    { num: 3, label: 'Room Selection', shortLabel: 'Room', icon: Bed }
  ];

  return (
    <Modal open={isOpen} onClose={handleClose} size="xl" showClose={false}>
      {/* Header with Stepper */}
      <div className="relative px-6 pt-6 pb-5 border-b border-neutral-100">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terra-500 to-terra-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">New Reservation</h2>
              <p className="text-sm text-neutral-500">Create a new guest booking</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            const isUpcoming = step < s.num;
            const Icon = s.icon;

            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                      isCompleted && "bg-terra-500 text-white",
                      isActive && "bg-terra-100 text-terra-600 border border-terra-500",
                      isUpcoming && "bg-neutral-100 text-neutral-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={cn(
                      "text-sm font-medium",
                      (isActive || isCompleted) ? "text-neutral-900" : "text-neutral-400"
                    )}>
                      {s.shortLabel}
                    </p>
                    <p className={cn(
                      "text-xs",
                      (isActive || isCompleted) ? "text-neutral-500" : "text-neutral-300"
                    )}>
                      Step {s.num}
                    </p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className="h-0.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full bg-terra-500 transition-all duration-300",
                          isCompleted ? "w-full" : "w-0"
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
        {/* Step 1 - Guest Details */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terra-500" />
                Contact Information
              </h3>

              <div className="space-y-4">
                <FormField label="Full Name" required error={errors.guestName}>
                  <Input
                    name="guestName"
                    value={formData.guestName}
                    onChange={(e) => handleChange('guestName', e.target.value)}
                    placeholder="Enter guest's full name"
                    autoComplete="name"
                    error={errors.guestName}
                    size="lg"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email Address" required error={errors.guestEmail}>
                    <Input
                      type="email"
                      name="guestEmail"
                      value={formData.guestEmail}
                      onChange={(e) => handleChange('guestEmail', e.target.value)}
                      placeholder="guest@email.com"
                      autoComplete="email"
                      error={errors.guestEmail}
                      size="lg"
                    />
                  </FormField>

                  <FormField label="Phone Number" required error={errors.guestPhone}>
                    <Input
                      type="tel"
                      name="guestPhone"
                      value={formData.guestPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9+\-\(\)\s]/g, '');
                        handleChange('guestPhone', value);
                      }}
                      placeholder="+1 (555) 123-4567"
                      autoComplete="tel"
                      error={errors.guestPhone}
                      size="lg"
                    />
                  </FormField>
                </div>
              </div>
            </div>

              {/* Guest Status */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terra-500" />
                  Guest Status
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Regular Guest */}
                  <button
                    type="button"
                    onClick={() => handleChange('isVip', false)}
                    className={cn(
                      'relative p-4 rounded-xl border transition-all duration-200 text-left group overflow-hidden',
                      !formData.isVip
                        ? 'border-terra-500 bg-terra-50/50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                        !formData.isVip
                          ? 'bg-terra-500 text-white'
                          : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
                      )}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900">Regular</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Standard guest privileges</p>
                      </div>
                      {!formData.isVip && (
                        <div className="w-5 h-5 rounded-full bg-terra-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* VIP Guest */}
                  <button
                    type="button"
                    onClick={() => handleChange('isVip', true)}
                    className={cn(
                      'relative p-4 rounded-xl border transition-all duration-200 text-left group overflow-hidden',
                      formData.isVip
                        ? 'border-gold-500 bg-gold-50/50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    )}
                  >
                    {formData.isVip && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-gold-200/50 to-transparent rounded-bl-full" />
                    )}
                    <div className="relative flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                        formData.isVip
                          ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/30'
                          : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
                      )}>
                        <Crown className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900">VIP</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Premium guest benefits</p>
                      </div>
                      {formData.isVip && (
                        <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Stay Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              {/* Dates */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terra-500" />
                  Stay Dates
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Check-in <span className="text-rose-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.checkIn}
                      onChange={(value) => handleChange('checkIn', value)}
                      minDate={today}
                      placeholder="Select date"
                      className="w-full"
                    />
                    {errors.checkIn && (
                      <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.checkIn}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Check-out <span className="text-rose-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.checkOut}
                      onChange={(value) => handleChange('checkOut', value)}
                      minDate={formData.checkIn || today}
                      placeholder="Select date"
                      className="w-full"
                    />
                    {errors.checkOut && (
                      <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.checkOut}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nights Display */}
                {formData.nights > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-terra-50 to-copper-50/50 border border-terra-100">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5 text-terra-500" />
                      <span className="text-2xl font-bold text-terra-600">{formData.nights}</span>
                      <span className="text-sm font-medium text-terra-600">night{formData.nights !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Room & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Room Type">
                  <Select
                    value={formData.roomType}
                    onChange={(e) => handleChange('roomType', e.target.value)}
                    size="lg"
                  >
                    {roomTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Rate Plan">
                  <Select
                    value={formData.ratePlan}
                    onChange={(e) => handleChange('ratePlan', e.target.value)}
                    size="lg"
                  >
                    {ratePlans.map((plan) => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </Select>
                </FormField>
              </div>

              {/* Guests */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terra-500" />
                  Guests
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Adults */}
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Adults</p>
                        <p className="text-xs text-neutral-500">Age 13+</p>
                      </div>
                      <Users className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleChange('adults', Math.max(1, formData.adults - 1))}
                        disabled={formData.adults <= 1}
                        className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all"
                      >
                        <span className="text-lg font-medium">−</span>
                      </button>
                      <span className="text-xl font-bold text-neutral-900 tabular-nums">{formData.adults}</span>
                      <button
                        type="button"
                        onClick={() => handleChange('adults', Math.min(6, formData.adults + 1))}
                        disabled={formData.adults >= 6}
                        className="w-9 h-9 rounded-lg bg-terra-500 text-white flex items-center justify-center hover:bg-terra-600 disabled:opacity-40 transition-all"
                      >
                        <span className="text-lg font-medium">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Children</p>
                        <p className="text-xs text-neutral-500">Age 0-12</p>
                      </div>
                      <Users className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleChange('children', Math.max(0, formData.children - 1))}
                        disabled={formData.children <= 0}
                        className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all"
                      >
                        <span className="text-lg font-medium">−</span>
                      </button>
                      <span className="text-xl font-bold text-neutral-900 tabular-nums">{formData.children}</span>
                      <button
                        type="button"
                        onClick={() => handleChange('children', Math.min(4, formData.children + 1))}
                        disabled={formData.children >= 4}
                        className="w-9 h-9 rounded-lg bg-terra-500 text-white flex items-center justify-center hover:bg-terra-600 disabled:opacity-40 transition-all"
                      >
                        <span className="text-lg font-medium">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Source */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terra-500" />
                  Booking Source
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sources.map(source => {
                    const Icon = source.icon;
                    const isSelected = formData.source === source.id;
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => handleChange('source', source.id)}
                        className={cn(
                          'flex items-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200',
                          isSelected
                            ? 'bg-terra-500 text-white shadow-md shadow-terra-500/25'
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:border-terra-300 hover:bg-terra-50'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {source.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Requests */}
              <FormField label="Special Requests" description="Optional - any special requirements or preferences">
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) => handleChange('specialRequests', e.target.value)}
                  rows={3}
                  placeholder="Early check-in, extra pillows, dietary requirements..."
                />
              </FormField>
            </div>
          )}

          {/* Step 3 - Room Selection */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              {/* Booking Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-50 to-terra-50/30 border border-neutral-200">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-neutral-200 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-terra-500" />
                    <span className="text-sm font-medium text-neutral-700">{formData.nights} night{formData.nights !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-neutral-200 shadow-sm">
                    <Users className="w-3.5 h-3.5 text-terra-500" />
                    <span className="text-sm font-medium text-neutral-700">
                      {formData.adults} Adult{formData.adults !== 1 ? 's' : ''}{formData.children > 0 && `, ${formData.children} Child${formData.children !== 1 ? 'ren' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-neutral-200 shadow-sm">
                    <Bed className="w-3.5 h-3.5 text-terra-500" />
                    <span className="text-sm font-medium text-neutral-700">{formData.roomType}</span>
                  </div>
                  {formData.isVip && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gold-50 rounded-full border border-gold-200 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-gold-600" />
                      <span className="text-sm font-medium text-gold-700">VIP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-terra-500" />
                    Select Room
                  </h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                    {filteredRooms.length} available
                  </span>
                </div>

                {filteredRooms.length === 0 ? (
                  <div className="p-8 rounded-xl border-2 border-dashed border-neutral-200 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-6 h-6 text-gold-600" />
                    </div>
                    <p className="font-semibold text-neutral-800">No rooms available</p>
                    <p className="text-sm text-neutral-500 mt-1">Try selecting a different room type or dates.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                    {filteredRooms.map((room) => {
                      const isSelected = formData.selectedRoom?.id === room.id;
                      const isReady = room.cleaning === 'clean';

                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => handleChange('selectedRoom', room)}
                          className={cn(
                            'w-full p-4 rounded-xl border transition-all duration-200 text-left group',
                            isSelected
                              ? 'border-terra-500 bg-terra-50/50 shadow-md shadow-terra-500/10'
                              : 'border-neutral-200 hover:border-terra-300 hover:bg-neutral-50'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            {/* Room Icon */}
                            <div className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0',
                              isSelected
                                ? 'bg-terra-500 text-white shadow-lg shadow-terra-500/30'
                                : 'bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200'
                            )}>
                              {isSelected ? <Check className="w-6 h-6" /> : <Bed className="w-6 h-6" />}
                            </div>

                            {/* Room Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-900">Room {room.roomNumber}</span>
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full font-medium',
                                  isReady
                                    ? 'bg-sage-100 text-sage-700'
                                    : 'bg-gold-100 text-gold-700'
                                )}>
                                  {isReady ? 'Ready' : 'Cleaning'}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-500 mt-0.5">Floor {room.floor} • {room.type}</p>
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-neutral-900">{formatCurrency(room.price)}</p>
                              <p className="text-xs text-neutral-400">per night</p>
                            </div>
                          </div>

                          {/* Amenities (show on selection) */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-terra-200/50">
                              <div className="flex items-center gap-4 text-xs text-terra-600">
                                <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> WiFi</span>
                                <span className="flex items-center gap-1"><Coffee className="w-3.5 h-3.5" /> Mini Bar</span>
                                <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> Parking</span>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {errors.selectedRoom && (
                  <p className="text-rose-500 text-xs mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.selectedRoom}
                  </p>
                )}
              </div>

              {/* Total */}
              {formData.amount > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-terra-500 to-terra-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-terra-100">Total Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(formData.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-terra-100">{formData.nights} night{formData.nights !== 1 ? 's' : ''}</p>
                      <p className="text-sm text-terra-200">{formData.ratePlan} Rate</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Step <span className="font-semibold text-neutral-700">{step}</span> of <span className="font-semibold text-neutral-700">3</span>
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={step === 1 ? handleClose : handleBack}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={step < 3 ? handleNext : handleSubmit}
              icon={step < 3 ? ChevronRight : Check}
            >
              {step < 3 ? 'Continue' : 'Create Booking'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
