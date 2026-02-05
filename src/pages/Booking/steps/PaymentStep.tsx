import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Lock, MapPin, Shield, CheckCircle, Calendar, User, Building2, ArrowRight, ChevronDown, Mail, KeyRound, Globe } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { paymentMethodsService } from '@/api/services/payment-methods.service';
import { bookingService } from '@/api/services/booking.service';
import { otpService } from '@/api/services/otp.service';
import { useAuth } from '@/hooks/useAuth';
import { Country } from 'country-state-city';
import { SearchableSelect } from '@/components/ui2/SearchableSelect';
import toast from 'react-hot-toast';

const paymentSchema = z.object({
  cardNumber: z.string().refine((val) => {
    // Allow masked saved cards (**** **** **** 1234) or full card numbers
    if (val.startsWith('****')) return true;
    const cleaned = val.replace(/\s/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
  }, 'Card number must be valid'),
  cardName: z.string().min(3, 'Name on card is required'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  billingAddress: z.string().min(5, 'Billing address is required'),
  city: z.string().min(2, 'City is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
});

interface PaymentStepProps {
  onNext: () => void;
}

interface SavedCard {
  id: string | number;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  cardholderName?: string;
}

export function PaymentStep({ onNext }: PaymentStepProps) {
  const { bookingData, updateBookingData } = useBooking();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showCardDropdown, setShowCardDropdown] = useState(false);
  
  // OTP verification state
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: bookingData.payment,
  });

  const countryOptions = useMemo(
    () => Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name })),
    []
  );

  // Load saved cards from database
  useEffect(() => {
    loadSavedCards();
  }, []);

  const loadSavedCards = async () => {
    try {
      const methods = await paymentMethodsService.list();
      const cards: SavedCard[] = methods.map(m => ({
        id: m.id,
        type: m.card_type,
        last4: m.last4,
        expiryMonth: m.expiry_month,
        expiryYear: m.expiry_year,
        isDefault: m.is_default,
        cardholderName: m.cardholder_name,
      }));
      setSavedCards(cards);
      
      // Auto-select default card if available
      const defaultCard = cards.find((c: SavedCard) => c.isDefault);
      if (defaultCard) {
        handleSelectCard(defaultCard);
      }
    } catch (error) {
      console.error('Failed to load saved cards:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCardDropdown && !target.closest('.card-dropdown-container')) {
        setShowCardDropdown(false);
      }
    };

    if (showCardDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCardDropdown]);

  const handleSelectCard = (card: SavedCard) => {
    setSelectedCardId(card.id);
    setShowCardDropdown(false);
    
    // Fill form with card details (masked)
    setValue('cardNumber', `**** **** **** ${card.last4}`);
    setValue('cardName', card.cardholderName || '');
    setValue('expiryDate', `${card.expiryMonth.toString().padStart(2, '0')}/${card.expiryYear.toString().slice(-2)}`);
    // Note: CVV and billing address still need to be entered for security
  };

  const handleUseNewCard = () => {
    setSelectedCardId('');
    setShowCardDropdown(false);
    setValue('cardNumber', '');
    setValue('cardName', '');
    setValue('expiryDate', '');
    setValue('cvv', '');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const onSubmit = async (data: any) => {
    setIsProcessing(true);

    try {
      // Validate booking data
      if (!bookingData.room || !bookingData.checkIn || !bookingData.checkOut) {
        toast.error('Missing booking information. Please go back and complete all steps.');
        setIsProcessing(false);
        return;
      }

      if (!bookingData.guestInfo.firstName || !bookingData.guestInfo.lastName || !bookingData.guestInfo.email || !bookingData.guestInfo.phone) {
        toast.error('Missing guest information. Please go back and complete your details.');
        setIsProcessing(false);
        return;
      }

      // If using saved card, we need to get the actual card number
      // For now, we'll use the masked version but in production this would be handled securely
      let paymentData = { ...data };
      
      if (selectedCardId) {
        const selectedCard = savedCards.find(c => c.id === selectedCardId);
        if (selectedCard) {
          // Use saved card info but keep CVV and billing address from form
          paymentData = {
            ...paymentData,
            cardNumber: `**** **** **** ${selectedCard.last4}`, // Masked for display
            cardName: selectedCard.cardholderName || data.cardName,
            expiryDate: `${selectedCard.expiryMonth.toString().padStart(2, '0')}/${selectedCard.expiryYear.toString().slice(-2)}`,
          };
        }
      }

      let bookingResponse;

      // Debug: Log modification mode status
      console.log('[PaymentStep] Modification mode check:', {
        isModifyMode: bookingData.isModifyMode,
        originalBookingId: bookingData.originalBooking?.id,
        originalBookingNumber: bookingData.originalBooking?.bookingNumber,
      });

      // Check if we're in modification mode
      if (bookingData.isModifyMode && bookingData.originalBooking?.id) {
        console.log('[PaymentStep] UPDATING existing booking:', bookingData.originalBooking.id);
        // Update existing booking instead of creating new one
        bookingResponse = await bookingService.updateBooking(
          bookingData.originalBooking.id,
          {
            roomId: String(bookingData.room.id),
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            guests: {
              adults: bookingData.guests.adults,
              children: bookingData.guests.children,
              infants: 0,
            },
            guestInfo: {
              firstName: bookingData.guestInfo.firstName,
              lastName: bookingData.guestInfo.lastName,
              email: bookingData.guestInfo.email,
              phone: bookingData.guestInfo.phone,
              country: paymentData.country || 'US',
              specialRequests: bookingData.guestInfo.specialRequests || '',
            },
          }
        );

        // Update booking data with response
        updateBookingData({
          payment: paymentData,
          bookingNumber: bookingResponse.bookingNumber || bookingData.originalBooking.bookingNumber,
        });

        toast.success('Booking modified successfully!');
      } else {
        console.log('[PaymentStep] CREATING new booking (not in modify mode)');
        // Create new booking via API
        bookingResponse = await bookingService.createBooking({
          roomId: String(bookingData.room.id),
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: {
            adults: bookingData.guests.adults,
            children: bookingData.guests.children,
            infants: 0,
          },
          guestInfo: {
            firstName: bookingData.guestInfo.firstName,
            lastName: bookingData.guestInfo.lastName,
            email: bookingData.guestInfo.email,
            phone: bookingData.guestInfo.phone,
            country: paymentData.country || 'US',
            specialRequests: bookingData.guestInfo.specialRequests || '',
          },
          paymentMethodId: selectedCardId ? String(selectedCardId) : 'new',
          saveCard: false, // Can be set based on user preference
        });

        // Update booking data with response
        updateBookingData({
          payment: paymentData,
          bookingNumber: bookingResponse.bookingNumber || bookingResponse.id || `RES-${bookingResponse.id}`,
        });

        toast.success('Booking created successfully!');
      }
      onNext();
    } catch (error: any) {
      console.error('Booking error:', error);
      const defaultErrorMsg = bookingData.isModifyMode
        ? 'Failed to modify booking. Please try again.'
        : 'Failed to create booking. Please try again.';
      toast.error(error.response?.data?.detail || error.message || defaultErrorMsg);
      setIsProcessing(false);
    }
  };

  // Watch fields for validation feedback
  const cardNumber = watch('cardNumber');
  const cardName = watch('cardName');
  const expiryDate = watch('expiryDate');
  const cvv = watch('cvv');
  const billingAddress = watch('billingAddress');
  const city = watch('city');
  const zipCode = watch('zipCode');

  const isFieldValid = (fieldName: string, value: any) => {
    return value && value.length > 0 && !errors[fieldName as keyof typeof errors];
  };

  // Auto-send OTP when component mounts if email is available
  useEffect(() => {
    const email = bookingData.guestInfo?.email || user?.email;
    if (email && !otpSent && !otpVerified) {
      handleSendOTP();
    }
  }, []);

  const handleSendOTP = async () => {
    const email = bookingData.guestInfo?.email || user?.email;
    if (!email) {
      toast.error('Email is required for verification');
      return;
    }

    setSendingOtp(true);
    setOtpError('');
    try {
      await otpService.sendOTP({
        email,
        purpose: 'booking_payment',
      });
      setOtpSent(true);
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      setOtpError(error.response?.data?.detail || error.message || 'Failed to send verification code');
      toast.error('Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }

    const email = bookingData.guestInfo?.email || user?.email;
    if (!email) {
      setOtpError('Email is required');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');
    try {
      await otpService.verifyOTP({
        email,
        otp_code: otpCode,
        purpose: 'booking_payment',
      });
      setOtpVerified(true);
      toast.success('Email verified successfully!');
    } catch (error: any) {
      setOtpError(error.response?.data?.detail || error.message || 'Invalid verification code');
      toast.error('Invalid verification code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Show OTP verification if not verified
  if (!otpVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 sm:p-10 border border-neutral-200 shadow-lg"
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center shadow-md">
              <Mail className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Email Verification Required</h2>
              <p className="text-neutral-600">Please verify your email to proceed with payment</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Verification Code Sent To:</strong> {bookingData.guestInfo?.email || user?.email || 'N/A'}
            </p>
            {otpSent && (
              <p className="text-xs text-blue-700 mt-2">
                Check your inbox for a 6-digit verification code. The code expires in 10 minutes.
              </p>
            )}
          </div>

          {otpError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">{otpError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Enter Verification Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(value);
                  setOtpError('');
                }}
                placeholder="000000"
                className="flex-1 px-4 py-3 border-2 border-neutral-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength={6}
                disabled={verifyingOtp}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={!otpCode || otpCode.length !== 6 || verifyingOtp}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifyingOtp ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  Verify Email
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={sendingOtp}
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 text-neutral-900 font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {sendingOtp ? 'Sending...' : 'Resend'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-8 sm:p-10 border border-neutral-200 shadow-lg"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center shadow-md">
            <CreditCard className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">Payment Details</h2>
          </div>
        </div>
        <p className="text-base text-neutral-600 font-medium">
          Your payment information is secure and encrypted
        </p>
        
        {/* Email Verified Badge */}
        {otpVerified && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 mt-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Email Verified</span>
          </motion.div>
        )}

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mt-5 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
        >
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-900">Secure SSL Encrypted Payment</p>
            <p className="text-xs text-green-700 mt-0.5">256-bit encryption protects your data</p>
          </div>
        </motion.div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Saved Cards Dropdown */}
        {savedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Use Saved Card
            </label>
            <div className="relative card-dropdown-container">
              <button
                type="button"
                onClick={() => setShowCardDropdown(!showCardDropdown)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-left flex items-center justify-between bg-white"
              >
                <span className="text-sm text-neutral-900">
                  {selectedCardId
                    ? `${savedCards.find(c => c.id === selectedCardId)?.type.toUpperCase()} •••• ${savedCards.find(c => c.id === selectedCardId)?.last4}`
                    : 'Select a saved card or enter new card'}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showCardDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCardDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto card-dropdown-container">
                  <button
                    type="button"
                    onClick={handleUseNewCard}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100"
                  >
                    + Use New Card
                  </button>
                  {savedCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectCard(card)}
                      className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${
                        selectedCardId === card.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 capitalize">
                            {card.type} •••• {card.last4}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {card.cardholderName || 'Card'} • Expires {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear}
                          </div>
                        </div>
                        {card.isDefault && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Card Number */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Card Number <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <CreditCard className={`w-5 h-5 transition-colors ${
                isFieldValid('cardNumber', cardNumber)
                  ? 'text-green-500'
                  : errors.cardNumber
                    ? 'text-red-500'
                    : 'text-neutral-400 group-focus-within:text-primary-600'
              }`} strokeWidth={2} />
            </div>
            <input
              type="text"
              {...register('cardNumber', {
                onChange: (e) => {
                  // Don't format if it's a saved card (starts with ****)
                  if (e.target.value.startsWith('****')) {
                    return;
                  }
                  const formatted = formatCardNumber(e.target.value);
                  e.target.value = formatted;
                  setValue('cardNumber', formatted.replace(/\s/g, ''));
                }
              })}
              placeholder={selectedCardId ? "Using saved card" : "1234 5678 9012 3456"}
              maxLength={19}
              disabled={!!selectedCardId}
              className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                selectedCardId
                  ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed'
                  : errors.cardNumber
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                    : isFieldValid('cardNumber', cardNumber)
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
              }`}
            />
            {isFieldValid('cardNumber', cardNumber) && (
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" strokeWidth={2} />
            )}
          </div>
          <AnimatePresence>
            {errors.cardNumber && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-sm text-red-600 font-medium"
              >
                {errors.cardNumber.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Name on Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Name on Card <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <User className={`w-5 h-5 transition-colors ${
                isFieldValid('cardName', cardName)
                  ? 'text-green-500'
                  : errors.cardName
                    ? 'text-red-500'
                    : 'text-neutral-400 group-focus-within:text-primary-600'
              }`} strokeWidth={2} />
            </div>
            <input
              type="text"
              {...register('cardName')}
              placeholder="JOHN DOE"
              disabled={!!selectedCardId}
              className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium uppercase ${
                selectedCardId
                  ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed'
                  : errors.cardName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                    : isFieldValid('cardName', cardName)
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
              }`}
            />
            {isFieldValid('cardName', cardName) && (
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" strokeWidth={2} />
            )}
          </div>
          <AnimatePresence>
            {errors.cardName && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-sm text-red-600 font-medium"
              >
                {errors.cardName.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-6">
          {/* Expiry Date */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className={`w-5 h-5 transition-colors ${
                  isFieldValid('expiryDate', expiryDate)
                    ? 'text-green-500'
                    : errors.expiryDate
                      ? 'text-red-500'
                      : 'text-neutral-400 group-focus-within:text-primary-600'
                }`} strokeWidth={2} />
              </div>
            <input
              type="text"
              {...register('expiryDate', {
                onChange: (e) => {
                  // Don't format if it's from a saved card
                  if (selectedCardId) return;
                  const formatted = formatExpiryDate(e.target.value);
                  e.target.value = formatted;
                  setValue('expiryDate', formatted);
                }
              })}
              placeholder="MM/YY"
              maxLength={5}
              disabled={!!selectedCardId}
              className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                selectedCardId
                  ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed'
                  : errors.expiryDate
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                    : isFieldValid('expiryDate', expiryDate)
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
              }`}
            />
              {isFieldValid('expiryDate', expiryDate) && (
                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" strokeWidth={2} />
              )}
            </div>
            <AnimatePresence>
              {errors.expiryDate && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-red-600 font-medium"
                >
                  {errors.expiryDate.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CVV */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              CVV <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className={`w-5 h-5 transition-colors ${
                  isFieldValid('cvv', cvv)
                    ? 'text-green-500'
                    : errors.cvv
                      ? 'text-red-500'
                      : 'text-neutral-400 group-focus-within:text-primary-600'
                }`} strokeWidth={2} />
              </div>
              <input
                type="text"
                {...register('cvv')}
                placeholder="123"
                maxLength={4}
                className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                  errors.cvv
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                    : isFieldValid('cvv', cvv)
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
                }`}
              />
              {isFieldValid('cvv', cvv) && (
                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" strokeWidth={2} />
              )}
            </div>
            <AnimatePresence>
              {errors.cvv && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-red-600 font-medium"
                >
                  {errors.cvv.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Billing Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="pt-6 border-t border-neutral-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-600" strokeWidth={2.5} />
            <h3 className="text-lg font-bold text-neutral-900">Billing Address</h3>
          </div>

          {/* Street Address */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <MapPin className={`w-5 h-5 transition-colors ${
                  isFieldValid('billingAddress', billingAddress)
                    ? 'text-green-500'
                    : errors.billingAddress
                      ? 'text-red-500'
                      : 'text-neutral-400 group-focus-within:text-primary-600'
                }`} strokeWidth={2} />
              </div>
              <input
                type="text"
                {...register('billingAddress')}
                placeholder="123 Main Street"
                className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                  errors.billingAddress
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                    : isFieldValid('billingAddress', billingAddress)
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
                }`}
              />
              {isFieldValid('billingAddress', billingAddress) && (
                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" strokeWidth={2} />
              )}
            </div>
            <AnimatePresence>
              {errors.billingAddress && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-red-600 font-medium"
                >
                  {errors.billingAddress.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* City, ZIP, Country */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Building2 className={`w-5 h-5 transition-colors ${
                    isFieldValid('city', city)
                      ? 'text-green-500'
                      : errors.city
                        ? 'text-red-500'
                        : 'text-neutral-400 group-focus-within:text-primary-600'
                  }`} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  {...register('city')}
                  placeholder="San Francisco"
                  className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                    errors.city
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                      : isFieldValid('city', city)
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                        : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
                  }`}
                />
                {isFieldValid('city', city) && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" strokeWidth={2} />
                )}
              </div>
              <AnimatePresence>
                {errors.city && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                  >
                    {errors.city.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ZIP Code */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  {...register('zipCode')}
                  placeholder="94102"
                  className={`w-full px-4 py-4 border rounded-lg focus:outline-none focus:ring-2 transition-all font-medium ${
                    errors.zipCode
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                      : isFieldValid('zipCode', zipCode)
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                        : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 bg-neutral-50'
                  }`}
                />
                {isFieldValid('zipCode', zipCode) && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" strokeWidth={2} />
                )}
              </div>
              <AnimatePresence>
                {errors.zipCode && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                  >
                    {errors.zipCode.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={countryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Country"
                    icon={<Globe className="w-5 h-5" />}
                    error={!!errors.country}
                    searchable
                  />
                )}
              />
              <AnimatePresence>
                {errors.country && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                  >
                    {errors.country.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isProcessing}
          whileHover={{ scale: isProcessing ? 1 : 1.01 }}
          whileTap={{ scale: isProcessing ? 1 : 0.99 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-lg transition-all shadow-lg flex items-center justify-center gap-3 group ${
            isProcessing ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{bookingData.isModifyMode ? 'Updating Booking...' : 'Processing Payment...'}</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
              <span>{bookingData.isModifyMode ? 'Confirm Modification' : 'Complete Booking'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </>
          )}
        </motion.button>

        {/* Terms & Conditions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-sm text-neutral-600 font-medium">
            By completing this booking, you agree to our{' '}
            <span className="text-primary-600 font-semibold">Terms & Conditions</span>
          </p>
        </motion.div>
      </form>
    </motion.div>
  );
}