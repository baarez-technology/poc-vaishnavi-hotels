import { motion } from 'framer-motion';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import logo from '@/assets/logo.png';

interface SpecialRequestsStepProps {
  onNext: () => void;
  onPrevious?: () => void;
}

export function SpecialRequestsStep({ onNext, onPrevious }: SpecialRequestsStepProps) {
  const navigate = useNavigate();
  const { preCheckInData, updatePreCheckInData } = usePreCheckIn();

  const handleLogoClick = () => {
    const confirmed = window.confirm('Are you sure you want to cancel the pre-check-in? Your progress will be lost.');
    if (confirmed) {
      navigate('/');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const steps = [
    { number: 1, label: 'Welcome', active: false },
    { number: 2, label: 'Guest Details', active: false },
    { number: 3, label: 'Room Preferences', active: false },
    { number: 4, label: 'Verification', active: false },
    { number: 5, label: 'Documents', active: false },
    { number: 6, label: 'Payment Info', active: false },
    { number: 7, label: 'Review', active: true },
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
                      Let us know your special requests
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
                Special Requests
              </h1>
              <p className="text-sm text-neutral-500">
                Let us know how we can make your stay perfect
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Special Requests Textarea */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Additional Requests <span className="text-neutral-500 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <textarea
                    value={preCheckInData.specialRequests.requests}
                    onChange={(e) => updatePreCheckInData({
                      specialRequests: { ...preCheckInData.specialRequests, requests: e.target.value }
                    })}
                    rows={5}
                    placeholder="E.g., High floor, quiet location, extra towels..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-all resize-none text-sm bg-white"
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

              {/* Early Check-in */}
              <div>
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-neutral-300"
                  style={{
                    borderColor: preCheckInData.specialRequests.earlyCheckIn ? '#A57865' : '#E5E7EB',
                    backgroundColor: preCheckInData.specialRequests.earlyCheckIn ? 'rgba(165, 120, 101, 0.05)' : 'white',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={preCheckInData.specialRequests.earlyCheckIn}
                    onChange={(e) => updatePreCheckInData({
                      specialRequests: { ...preCheckInData.specialRequests, earlyCheckIn: e.target.checked }
                    })}
                    className="mt-0.5 w-4 h-4 rounded border-2 border-neutral-300 text-[#A57865] focus:ring-[#A57865] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900 mb-1">
                      Early Check-in Request
                    </div>
                    <p className="text-xs text-neutral-600">
                      Standard check-in is 3:00 PM (subject to availability)
                    </p>
                  </div>
                </label>
              </div>

              {/* Late Check-out */}
              <div>
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-neutral-300"
                  style={{
                    borderColor: preCheckInData.specialRequests.lateCheckOut ? '#A57865' : '#E5E7EB',
                    backgroundColor: preCheckInData.specialRequests.lateCheckOut ? 'rgba(165, 120, 101, 0.05)' : 'white',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={preCheckInData.specialRequests.lateCheckOut}
                    onChange={(e) => updatePreCheckInData({
                      specialRequests: { ...preCheckInData.specialRequests, lateCheckOut: e.target.checked }
                    })}
                    className="mt-0.5 w-4 h-4 rounded border-2 border-neutral-300 text-[#A57865] focus:ring-[#A57865] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900 mb-1">
                      Late Check-out Request
                    </div>
                    <p className="text-xs text-neutral-600">
                      Standard check-out is 11:00 AM (subject to availability)
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