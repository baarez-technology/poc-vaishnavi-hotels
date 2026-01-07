import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Minus, Plus, Thermometer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/api/services/user.service';
import logo from '@/assets/logo.png';

interface PreferencesStepProps {
  onNext: () => void;
  onPrevious?: () => void;
}

export function PreferencesStep({ onNext, onPrevious }: PreferencesStepProps) {
  const navigate = useNavigate();
  const { preCheckInData, updatePreCheckInData } = usePreCheckIn();
  const { user } = useAuth();

  const handleLogoClick = () => {
    const confirmed = window.confirm('Are you sure you want to cancel the pre-check-in? Your progress will be lost.');
    if (confirmed) {
      navigate('/');
    }
  };

  // Autofill from saved preferences when logged in
  useEffect(() => {
    const autofillPreferences = async () => {
      if (user && (!preCheckInData.preferences?.temperature || preCheckInData.preferences?.pillowType?.length === 0)) {
        try {
          const saved = await userService.getPreferences();
          if (saved && Object.keys(saved).length > 0) {
            const autofilledPreferences = {
              temperature: saved.temperature || preCheckInData.preferences?.temperature || 72,
              pillowType: saved.pillowType || preCheckInData.preferences?.pillowType || [],
              minibarPreferences: saved.minibar || preCheckInData.preferences?.minibarPreferences || [],
              dietaryRestrictions: saved.dietary || preCheckInData.preferences?.dietaryRestrictions || [],
              floorPreference: saved.floor || preCheckInData.preferences?.floorPreference || '',
              viewPreference: saved.view || preCheckInData.preferences?.viewPreference || '',
              bedTypePreference: saved.bedType || preCheckInData.preferences?.bedTypePreference || '',
              quietnessPreference: saved.quietness || preCheckInData.preferences?.quietnessPreference || '',
            };
            
            updatePreCheckInData({ preferences: autofilledPreferences });
          }
        } catch (error) {
          console.error('Failed to load preferences:', error);
        }
      }
    };

    autofillPreferences();
  }, [user]);

  const pillowOptions = ['Soft', 'Medium', 'Firm', 'Memory Foam'];

  const toggleOption = (category: 'pillowType' | 'minibarPreferences' | 'dietaryRestrictions', option: string) => {
    const current = preCheckInData.preferences[category];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];

    updatePreCheckInData({
      preferences: { ...preCheckInData.preferences, [category]: updated }
    });
  };

  const updateTemperature = (change: number) => {
    const newTemp = Math.max(60, Math.min(80, preCheckInData.preferences.temperature + change));
    updatePreCheckInData({
      preferences: { ...preCheckInData.preferences, temperature: newTemp }
    });
  };

  const steps = [
    { number: 1, label: 'Welcome', active: false },
    { number: 2, label: 'Guest Details', active: false },
    { number: 3, label: 'Room Preferences', active: false },
    { number: 4, label: 'Verification', active: false },
    { number: 5, label: 'Documents', active: false },
    { number: 6, label: 'Payment Info', active: true },
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
                      Customize your stay experience
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
                Room Preferences
              </h1>
              <p className="text-sm text-neutral-500">
                Customize your stay experience
              </p>
            </div>

            <div className="space-y-6">
              {/* Temperature */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-4 h-4 text-[#A57865]" />
                  <label className="block text-sm font-medium text-neutral-700">
                    Preferred Room Temperature
                  </label>
                </div>
                <div className="flex items-center justify-center gap-6 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                  <button
                    onClick={() => updateTemperature(-1)}
                    className="w-10 h-10 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center hover:border-[#A57865] transition-all"
                  >
                    <Minus className="w-4 h-4 text-neutral-700" />
                  </button>
                  <div className="text-center">
                    <div className="text-4xl font-semibold text-neutral-900">
                      {preCheckInData.preferences.temperature}°
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">Fahrenheit</div>
                  </div>
                  <button
                    onClick={() => updateTemperature(1)}
                    className="w-10 h-10 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center hover:border-[#A57865] transition-all"
                  >
                    <Plus className="w-4 h-4 text-neutral-700" />
                  </button>
                </div>
              </div>

              {/* Pillow Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Pillow Preferences
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {pillowOptions.map((option) => {
                    const isSelected = preCheckInData.preferences.pillowType.includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => toggleOption('pillowType', option)}
                        className={`p-4 border-2 rounded-lg transition-all text-sm font-medium ${
                          isSelected
                            ? 'border-[#A57865] bg-[#A57865]/5 text-neutral-900'
                            : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={onNext}
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
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}