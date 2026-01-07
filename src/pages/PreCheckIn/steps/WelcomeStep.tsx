import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Hash, User, Zap, Key, Sparkles, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import { precheckinService } from '@/api/services/precheckin.service';
import logo from '@/assets/logo.png';

const welcomeSchema = z.object({
  bookingNumber: z.string().min(3, 'Booking number required'),
  guestName: z.string().min(2, 'Guest name required'),
});

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const navigate = useNavigate();
  const { preCheckInData, updatePreCheckInData, loadPreCheckIn } = usePreCheckIn();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleLogoClick = () => {
    const confirmed = window.confirm('Are you sure you want to cancel the pre-check-in? Your progress will be lost.');
    if (confirmed) {
      navigate('/');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(welcomeSchema),
    defaultValues: {
      bookingNumber: preCheckInData?.bookingNumber || '',
      guestName: preCheckInData?.guestName || '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationSuccess(false);

    try {
      // Verify booking with backend
      const result = await precheckinService.verifyBooking({
        booking_number: data.bookingNumber,
        guest_name: data.guestName,
      });

      if (result.valid && result.reservation_id) {
        setVerificationSuccess(true);

        // Update pre-checkin context with verified data
        updatePreCheckInData({
          bookingNumber: data.bookingNumber,
          guestName: result.guest_name || data.guestName,
          reservationId: result.reservation_id,
          roomType: result.room_type || 'Standard Room',
          checkInDate: result.check_in || '',
          checkOutDate: result.check_out || '',
          personalInfo: {
            email: result.guest_email || '',
            phone: result.guest_phone || '',
            address: '',
            city: '',
            zipCode: '',
            country: '',
          },
        });

        // Load any existing pre-checkin data for this reservation
        try {
          await loadPreCheckIn(result.reservation_id);
        } catch (e) {
          // It's okay if no pre-checkin exists yet
        }

        // Small delay for UX before proceeding
        setTimeout(() => {
          onNext();
        }, 500);
      } else {
        setVerificationError(result.error || 'Unable to verify your booking. Please check your details.');
      }
    } catch (error: any) {
      console.error('Booking verification error:', error);
      setVerificationError(
        error.response?.data?.detail ||
        error.message ||
        'An error occurred while verifying your booking. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const steps = [
    { number: 1, label: 'Welcome', active: true },
    { number: 2, label: 'Guest Details', active: false },
    { number: 3, label: 'Room Preferences', active: false },
    { number: 4, label: 'Verification', active: false },
    { number: 5, label: 'Documents', active: false },
    { number: 6, label: 'Payment Info', active: false },
    { number: 7, label: 'Review', active: false },
    { number: 8, label: 'Confirmation', active: false },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT COLUMN - Vertical Stepper */}
      <div className="w-[410px] min-h-screen px-12 py-12 border-r border-neutral-200 bg-white">
        <div className="sticky top-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20"
          >
            <img
              src={logo}
              alt="Glimmora"
              className="h-10 w-auto cursor-pointer"
              onClick={handleLogoClick}
            />
          </motion.div>

          {/* Vertical Stepper */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-start gap-4">
                {/* Step Indicator Column */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      step.active
                        ? 'bg-[#A57865] text-white'
                        : 'bg-transparent text-neutral-400 border border-neutral-300'
                    }`}
                  >
                    {step.active ? <div className="w-2 h-2 bg-white rounded-full" /> : step.number}
                  </motion.div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="w-px h-10 bg-neutral-200 mt-1.5" />
                  )}
                </div>

                {/* Step Label */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="pt-1 pb-8"
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      step.active ? 'text-neutral-900' : 'text-neutral-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.active && (
                    <div className="text-xs text-neutral-500">
                      Complete your pre-check-in for a seamless arrival
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Content Card */}
      <div className="flex-1 flex items-start justify-center pt-16 px-16" style={{ backgroundColor: '#FAFAFA' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Back to Home Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {/* Content Card */}
          <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 shadow-lg">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                Welcome to Precheck-in
              </h1>
              <p className="text-sm text-neutral-500">
                Provide your booking details to get started
              </p>
            </div>

            {/* Feature Cards Row */}
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { icon: Zap, label: 'Skip the Line', color: '#5C9BA4' },
                { icon: Key, label: 'Digital Key', color: '#CDB261' },
                { icon: Sparkles, label: 'AI Match', color: '#A57865' },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="text-center p-3 rounded-lg border"
                    style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${feature.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: feature.color }} strokeWidth={2} />
                    </div>
                    <div className="text-xs font-medium text-neutral-700">{feature.label}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Booking Number */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Booking Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="e.g., TRS-ABC123"
                    {...register('bookingNumber')}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: errors.bookingNumber ? '#ef4444' : '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.bookingNumber ? '#ef4444' : '#A57865';
                      e.target.style.boxShadow = errors.bookingNumber ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.bookingNumber ? '#ef4444' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.bookingNumber && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.bookingNumber.message}</p>
                )}
              </div>

              {/* Guest Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Guest Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="John Smith"
                    {...register('guestName')}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: errors.guestName ? '#ef4444' : '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.guestName ? '#ef4444' : '#A57865';
                      e.target.style.boxShadow = errors.guestName ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.guestName ? '#ef4444' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.guestName && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.guestName.message}</p>
                )}
              </div>

              {/* Error Message */}
              {verificationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg flex items-start gap-2 mt-4"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{verificationError}</span>
                </motion.div>
              )}

              {/* Success Message */}
              {verificationSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg flex items-start gap-2 mt-4"
                  style={{ backgroundColor: '#DCFCE7' }}
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-green-700">Booking verified! Proceeding to pre-check-in...</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying || verificationSuccess}
                className="w-full py-2.5 text-white font-medium rounded-lg transition-all text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
                style={{
                  backgroundColor: verificationSuccess ? '#22C55E' : '#A57865',
                }}
                onMouseEnter={(e) => {
                  if (!isVerifying && !verificationSuccess) {
                    e.currentTarget.style.backgroundColor = '#8E6554';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isVerifying && !verificationSuccess) {
                    e.currentTarget.style.backgroundColor = '#A57865';
                  }
                }}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : verificationSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}