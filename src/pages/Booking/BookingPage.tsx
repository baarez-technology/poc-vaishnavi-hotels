import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { roomTypesService } from '@/api/services/roomTypes.service';
import { DatesStep } from './steps/DatesStep';
import { GuestInfoStep } from './steps/GuestInfoStep';
import { PaymentStep } from './steps/PaymentStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { BookingSummary } from './components/BookingSummary';

const steps = [
  { id: 1, name: 'Dates & Guests', component: DatesStep },
  { id: 2, name: 'Your Information', component: GuestInfoStep },
  { id: 3, name: 'Payment', component: PaymentStep },
  { id: 4, name: 'Confirmation', component: ConfirmationStep },
];

export function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookingData, updateBookingData, resetBooking } = useBooking();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Get room and search params from URL
  useEffect(() => {
    const roomSlug = searchParams.get('room');
    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const adults = parseInt(searchParams.get('adults') || '1');
    const children = parseInt(searchParams.get('children') || '0');

    // Check if this is a new room (different from current booking)
    const isNewRoom = !hasInitialized.current || bookingData.room?.slug !== roomSlug;

    if (!roomSlug) {
      navigate('/rooms');
      return;
    }

    // Fetch room from API
    const fetchRoom = async () => {
      try {
        const room = await roomTypesService.getRoomTypeBySlug(roomSlug);
        if (room) {
          // Only reset and update if this is a new room or first load
          if (isNewRoom) {
            // Reset booking data first to clear any previous booking state
            resetBooking();

            // Check if dates are actually provided in URL
            const hasDatesInUrl = Boolean(checkIn.trim() && checkOut.trim());

            // Use setTimeout to ensure reset completes before setting new data
            setTimeout(() => {
              updateBookingData({
                room,
                checkIn: checkIn.trim(),
                checkOut: checkOut.trim(),
                guests: { adults, children },
                datesFromUrl: hasDatesInUrl, // Set flag if dates came from URL
              });
            }, 0);

            hasInitialized.current = true;
          }
          setIsLoading(false);
        } else {
          navigate('/rooms');
        }
      } catch (error) {
        console.error('Failed to fetch room:', error);
        navigate('/rooms');
      }
    };

    fetchRoom();
  }, [searchParams, navigate, updateBookingData, resetBooking, bookingData.room?.slug]);

  const CurrentStepComponent = steps.find(s => s.id === currentStep)?.component;

  // Compute back URL
  const getBackUrl = () => {
    if (currentStep > 1) return null; // Will use setCurrentStep instead
    
    if (bookingData.room?.slug) {
      const params = new URLSearchParams();
      if (bookingData.checkIn) params.set('checkIn', bookingData.checkIn);
      if (bookingData.checkOut) params.set('checkOut', bookingData.checkOut);
      params.set('adults', bookingData.guests.adults.toString());
      params.set('children', bookingData.guests.children.toString());
      return `/rooms/${bookingData.room.slug}?${params.toString()}`;
    }
    return '/rooms';
  };

  const backUrl = getBackUrl();

  if (isLoading || !bookingData.room) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-lg text-neutral-700 font-semibold">Loading your booking...</p>
          <p className="text-sm text-neutral-500 mt-2">Please wait while we prepare everything</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            {currentStep === 1 && backUrl ? (
              <Link
                to={backUrl}
                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-neutral-100"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Back to Room</span>
                <span className="sm:hidden">Back</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) {
                    setCurrentStep(currentStep - 1);
                  }
                }}
                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-neutral-100"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Previous Step</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}

            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-3">
              {steps.slice(0, 3).map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        currentStep > step.id
                          ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                          : currentStep === step.id
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/40 scale-110'
                            : 'bg-white text-neutral-400 border-2 border-neutral-300'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" strokeWidth={3} />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div>
                      <span className={`text-sm font-bold whitespace-nowrap transition-colors ${
                        currentStep >= step.id ? 'text-neutral-900' : 'text-neutral-500'
                      }`}>
                        {step.name}
                      </span>
                      {currentStep === step.id && (
                        <div className="h-0.5 bg-primary-600 rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                  {index < 2 && (
                    <div className="relative w-20 h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500 ${
                          currentStep > step.id ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="w-24 hidden md:block" /> {/* Spacer for balance */}
          </div>

          {/* Pre-filled Info Banner */}
          {currentStep === 1 && bookingData.datesFromUrl && bookingData.checkIn?.trim() && bookingData.checkOut?.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-start gap-3"
            >
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <p className="text-sm text-green-800 font-semibold">Dates Pre-filled!</p>
                <p className="text-sm text-green-700 mt-0.5">Your selected dates are ready. You can modify them below if needed.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Steps Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {CurrentStepComponent && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentStepComponent onNext={() => setCurrentStep(currentStep + 1)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Booking Summary Sidebar */}
          {currentStep < 4 && (
            <div className="lg:col-span-1">
              <BookingSummary />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}