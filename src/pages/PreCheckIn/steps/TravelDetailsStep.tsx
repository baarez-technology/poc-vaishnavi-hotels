import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Plane, Briefcase, Car, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import logo from '@/assets/logo.png';

const travelSchema = z.object({
  arrivalTime: z.string().min(1, 'Arrival time required'),
  flightNumber: z.string().optional(),
  purpose: z.enum(['business', 'leisure', 'event', 'other']),
  transportationNeeded: z.boolean(),
});

interface TravelDetailsStepProps {
  onNext: () => void;
  onPrevious?: () => void;
}

export function TravelDetailsStep({ onNext, onPrevious }: TravelDetailsStepProps) {
  const navigate = useNavigate();
  const { preCheckInData, updatePreCheckInData } = usePreCheckIn();

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
    watch,
  } = useForm({
    resolver: zodResolver(travelSchema),
    defaultValues: preCheckInData.travelDetails,
  });

  const onSubmit = (data: any) => {
    updatePreCheckInData({ travelDetails: data });
    onNext();
  };

  const transportationNeeded = watch('transportationNeeded');

  const steps = [
    { number: 1, label: 'Welcome', active: false },
    { number: 2, label: 'Guest Details', active: false },
    { number: 3, label: 'Room Preferences', active: false },
    { number: 4, label: 'Verification', active: true },
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
                      Help us prepare for your arrival
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
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Content Card */}
          <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 shadow-lg">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                Travel Details
              </h1>
              <p className="text-sm text-neutral-500">
                Help us prepare for your seamless arrival
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Arrival Time */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Expected Arrival Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="time"
                    {...register('arrivalTime')}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: errors.arrivalTime ? '#ef4444' : '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.arrivalTime ? '#ef4444' : '#A57865';
                      e.target.style.boxShadow = errors.arrivalTime ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.arrivalTime ? '#ef4444' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.arrivalTime && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.arrivalTime.message}</p>
                )}
              </div>

              {/* Flight Number */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Flight Number <span className="text-neutral-500 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Plane className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="e.g., UA1234"
                    {...register('flightNumber')}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#A57865';
                      e.target.style.boxShadow = '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Purpose of Visit */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Purpose of Visit
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'business', label: 'Business', icon: Briefcase },
                    { value: 'leisure', label: 'Leisure', icon: Plane },
                    { value: 'event', label: 'Event', icon: Briefcase },
                    { value: 'other', label: 'Other', icon: Plane },
                  ].map((purpose) => {
                    const isSelected = watch('purpose') === purpose.value;
                    return (
                      <label
                        key={purpose.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#A57865] bg-[#A57865]/5'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={purpose.value}
                          {...register('purpose')}
                          className="sr-only"
                        />
                        <div className="text-sm font-medium text-neutral-900 text-center">
                          {purpose.label}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Transportation */}
              <div>
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-neutral-300"
                  style={{
                    borderColor: transportationNeeded ? '#A57865' : '#E5E7EB',
                    backgroundColor: transportationNeeded ? 'rgba(165, 120, 101, 0.05)' : 'white',
                  }}
                >
                  <input
                    type="checkbox"
                    {...register('transportationNeeded')}
                    className="mt-0.5 w-4 h-4 rounded border-2 border-neutral-300 text-[#A57865] focus:ring-[#A57865] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-neutral-900 mb-1">
                      <Car className="w-4 h-4" />
                      <span className="text-sm">Airport Transportation</span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      I need transportation from the airport to the hotel
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 text-white font-medium rounded-lg transition-all text-sm mt-6"
                style={{
                  backgroundColor: '#A57865',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#8E6554';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#A57865';
                }}
              >
                Next
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}