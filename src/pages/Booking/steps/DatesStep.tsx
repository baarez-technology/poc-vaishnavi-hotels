import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef } from 'react';
import { Calendar, Plus, Minus, CheckCircle, Clock, BedDouble } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { format } from 'date-fns';

const datesSchema = z.object({
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
}).refine(data => {
  if (data.checkIn && data.checkOut) {
    return new Date(data.checkOut) > new Date(data.checkIn);
  }
  return true;
}, {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

interface DatesStepProps {
  onNext: () => void;
}

export function DatesStep({ onNext }: DatesStepProps) {
  const { bookingData, updateBookingData, calculateTotal } = useBooking();
  const { nights } = calculateTotal();
  const isInitialLoad = useRef(true);

  // Check if dates are pre-filled from URL (not manually selected)
  const hasPreFilledDates = Boolean(
    bookingData.datesFromUrl &&
    bookingData.checkIn?.trim() &&
    bookingData.checkOut?.trim()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(datesSchema),
    defaultValues: {
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
    },
  });

  // Update form values when bookingData changes (pre-filled from URL) - only on initial load
  useEffect(() => {
    if (isInitialLoad.current && (bookingData.checkIn || bookingData.checkOut)) {
      reset({
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
      });
      isInitialLoad.current = false;
    }
  }, [bookingData.checkIn, bookingData.checkOut, reset]);

  const onSubmit = (data: any) => {
    updateBookingData({
      checkIn: data.checkIn,
      checkOut: data.checkOut,
    });
    onNext();
  };

  const updateGuests = (type: 'adults' | 'children', change: number) => {
    const current = bookingData.guests[type];
    const newValue = Math.max(type === 'adults' ? 1 : 0, Math.min(bookingData.room!.maxGuests, current + change));

    updateBookingData({
      guests: {
        ...bookingData.guests,
        [type]: newValue,
      },
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const checkInDate = watch('checkIn');
  const checkOutDate = watch('checkOut');
  const minCheckOut = checkInDate || today;

  // Update bookingData in real-time as form values change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      updateBookingData({
        checkIn: checkInDate,
        checkOut: checkOutDate,
        datesFromUrl: false, // Clear the flag when user manually changes dates
      });
    }
  }, [checkInDate, checkOutDate, updateBookingData]);

  const totalGuests = bookingData.guests.adults + bookingData.guests.children;
  const hasSelectedDates = checkInDate && checkOutDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-8 sm:p-10 border border-neutral-200 shadow-lg"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
          {hasPreFilledDates ? 'Confirm Your Dates' : 'Select Your Dates'}
        </h2>
        <p className="text-base text-neutral-600 font-medium">
          {hasPreFilledDates
            ? 'Your selected dates are ready. You can modify them below if needed.'
            : 'Choose your check-in and check-out dates, and number of guests'
          }
        </p>
      </div>

      {/* Pre-filled Confirmation Card */}
      <AnimatePresence mode="wait">
        {hasPreFilledDates && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-4">Dates from Your Search</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-green-200">
                      <div className="text-sm text-green-700 font-semibold mb-1">Check-in</div>
                      <div className="text-green-900 font-bold text-base">
                        {format(new Date(bookingData.checkIn), 'EEEE, MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-green-200">
                      <div className="text-sm text-green-700 font-semibold mb-1">Check-out</div>
                      <div className="text-green-900 font-bold text-base">
                        {format(new Date(bookingData.checkOut), 'EEEE, MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200 flex items-center gap-4 text-sm text-green-800">
                    <span className="font-bold">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                    <div className="w-1 h-1 rounded-full bg-green-500"></div>
                    <span className="font-bold">{totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Check-in Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" strokeWidth={2} />
              <input
                type="date"
                min={today}
                {...register('checkIn')}
                className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                  errors.checkIn
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : hasPreFilledDates
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
                }`}
              />
            </div>
            <AnimatePresence>
              {errors.checkIn && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-red-600 font-medium"
                >
                  {errors.checkIn.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Check-out */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Check-out Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" strokeWidth={2} />
              <input
                type="date"
                min={minCheckOut}
                {...register('checkOut')}
                className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                  errors.checkOut
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : hasPreFilledDates
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
                }`}
              />
            </div>
            <AnimatePresence>
              {errors.checkOut && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-red-600 font-medium"
                >
                  {errors.checkOut.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Selected Dates Summary - Only show when manually selected */}
        <AnimatePresence>
          {hasSelectedDates && !hasPreFilledDates && nights > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary-600" strokeWidth={2} />
                  <span className="text-primary-900 font-bold">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                </div>
                <div className="text-sm text-primary-700 font-medium">
                  {format(new Date(checkInDate), 'MMM dd')} - {format(new Date(checkOutDate), 'MMM dd, yyyy')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guest Selection */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-4">
            Number of Guests
          </label>
          <div className="space-y-4">
            {/* Adults */}
            <div className={`flex items-center justify-between p-5 rounded-lg border ${
              hasPreFilledDates ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div>
                <div className="font-bold text-neutral-900 text-base">Adults</div>
                <div className="text-sm text-neutral-600 font-medium">Age 13+</div>
              </div>
              <div className="flex items-center gap-4">
                <motion.button
                  type="button"
                  onClick={() => updateGuests('adults', -1)}
                  disabled={bookingData.guests.adults <= 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-lg border-2 border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Minus className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
                <span className="w-10 text-center font-bold text-xl">
                  {bookingData.guests.adults}
                </span>
                <motion.button
                  type="button"
                  onClick={() => updateGuests('adults', 1)}
                  disabled={bookingData.guests.adults >= bookingData.room!.maxGuests}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-lg border-2 border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>

            {/* Children */}
            <div className={`flex items-center justify-between p-5 rounded-lg border ${
              hasPreFilledDates ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div>
                <div className="font-bold text-neutral-900 text-base">Children</div>
                <div className="text-sm text-neutral-600 font-medium">Age 0-12</div>
              </div>
              <div className="flex items-center gap-4">
                <motion.button
                  type="button"
                  onClick={() => updateGuests('children', -1)}
                  disabled={bookingData.guests.children <= 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-lg border-2 border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Minus className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
                <span className="w-10 text-center font-bold text-xl">
                  {bookingData.guests.children}
                </span>
                <motion.button
                  type="button"
                  onClick={() => updateGuests('children', 1)}
                  disabled={bookingData.guests.children >= 5}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-lg border-2 border-neutral-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Room Capacity Info */}
          <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-start gap-3">
            <BedDouble className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-sm text-primary-900 font-semibold">Room Capacity</p>
              <p className="text-sm text-primary-700 mt-1">
                This suite accommodates up to {bookingData.room!.maxGuests} adults. Children do not count towards the room capacity. Currently selected: {bookingData.guests.adults} {bookingData.guests.adults === 1 ? 'adult' : 'adults'}{bookingData.guests.children > 0 ? ` + ${bookingData.guests.children} ${bookingData.guests.children === 1 ? 'child' : 'children'}` : ''}.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-lg transition-all shadow-lg"
        >
          {hasPreFilledDates ? 'Confirm & Continue' : 'Continue to Guest Information'}
        </motion.button>
      </form>
    </motion.div>
  );
}