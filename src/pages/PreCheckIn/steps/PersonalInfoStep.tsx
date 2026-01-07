import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useMemo } from 'react';
import { Mail, Phone, MapPin, Globe, Building2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreCheckIn } from '@/contexts/PreCheckInContext';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/api/services/user.service';
import { guestsService } from '@/api/services/guests.service';
import { COUNTRIES, searchCountries } from '@/utils/countries';
import logo from '@/assets/logo.png';

const personalInfoSchema = z.object({
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  zipCode: z.string().min(5, 'ZIP code required'),
  country: z.string().min(2, 'Country required'),
});

interface PersonalInfoStepProps {
  onNext: () => void;
  onPrevious?: () => void;
}

export function PersonalInfoStep({ onNext, onPrevious }: PersonalInfoStepProps) {
  const navigate = useNavigate();
  const { preCheckInData, updatePreCheckInData } = usePreCheckIn();
  const { user } = useAuth();

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
    reset,
  } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: preCheckInData.personalInfo,
  });

  // Autofill from user profile and guest preferences when logged in
  useEffect(() => {
    const autofillUserInfo = async () => {
      if (user && (!preCheckInData?.personalInfo?.email || !preCheckInData?.personalInfo?.phone)) {
        try {
          // First, try to get user profile
          const profile = await userService.getProfile();
          let autofilledData = {
            email: profile.email || preCheckInData?.personalInfo?.email || '',
            phone: profile.phone || preCheckInData?.personalInfo?.phone || '',
            address: profile.address || preCheckInData?.personalInfo?.address || '',
            city: profile.city || preCheckInData?.personalInfo?.city || '',
            zipCode: profile.zipCode || preCheckInData?.personalInfo?.zipCode || '',
            country: profile.country || preCheckInData?.personalInfo?.country || '',
          };

          // Try to get guest profile for saved preferences
          try {
            const guests = await guestsService.list({ email: profile.email });
            if (guests && guests.length > 0) {
              const guestProfile = await guestsService.getProfile(guests[0].id);
              if (guestProfile) {
                // Autofill address data from guest profile if not already set
                autofilledData = {
                  ...autofilledData,
                  address: autofilledData.address || guestProfile.address || '',
                  city: autofilledData.city || guestProfile.city || '',
                  zipCode: autofilledData.zipCode || guestProfile.postal_code || '',
                  country: autofilledData.country || guestProfile.country || '',
                };

                // Also autofill room preferences if available
                if (guestProfile.floor_preference || guestProfile.view_preference || guestProfile.bed_type_preference) {
                  updatePreCheckInData({
                    roomPreferences: {
                      floor: (guestProfile.floor_preference as any) || preCheckInData?.roomPreferences?.floor || 'any',
                      view: (guestProfile.view_preference as any) || preCheckInData?.roomPreferences?.view || 'any',
                      bedType: (guestProfile.bed_type_preference as any) || preCheckInData?.roomPreferences?.bedType || 'any',
                      quietness: (guestProfile.quietness_preference as any) || preCheckInData?.roomPreferences?.quietness || 'any',
                    },
                    preferences: {
                      pillowType: guestProfile.pillow_type ? [guestProfile.pillow_type] : preCheckInData?.preferences?.pillowType || [],
                      temperature: guestProfile.temperature_preference || preCheckInData?.preferences?.temperature || 72,
                      minibarPreferences: preCheckInData?.preferences?.minibarPreferences || [],
                      dietaryRestrictions: guestProfile.dietary_restrictions ? [guestProfile.dietary_restrictions] : preCheckInData?.preferences?.dietaryRestrictions || [],
                    },
                  });
                }
              }
            }
          } catch (guestError) {
            console.log('No existing guest profile found');
          }

          reset(autofilledData);
          updatePreCheckInData({ personalInfo: autofilledData });
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };

    autofillUserInfo();
  }, [user]);

  const onSubmit = (data: any) => {
    updatePreCheckInData({ personalInfo: data });
    onNext();
  };

  const steps = [
    { number: 1, label: 'Welcome', active: false },
    { number: 2, label: 'Guest Details', active: true },
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
                      Provide your contact information
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
                Personal Information
              </h1>
              <p className="text-sm text-neutral-500">
                Please confirm your contact and address details
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: errors.email ? '#ef4444' : '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.email ? '#ef4444' : '#A57865';
                      e.target.style.boxShadow = errors.email ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.email ? '#ef4444' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...register('phone')}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: errors.phone ? '#ef4444' : '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.phone ? '#ef4444' : '#A57865';
                      e.target.style.boxShadow = errors.phone ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.phone ? '#ef4444' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="123 Main Street, Apt 4B"
                    {...register('address')}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: errors.address ? '#ef4444' : '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.address ? '#ef4444' : '#A57865';
                      e.target.style.boxShadow = errors.address ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.address ? '#ef4444' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* City, ZIP, Country Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="New York"
                      {...register('city')}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                      style={{
                        borderColor: errors.city ? '#ef4444' : '#E5E7EB',
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.city ? '#ef4444' : '#A57865';
                        e.target.style.boxShadow = errors.city ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.city ? '#ef4444' : '#E5E7EB';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  {errors.city && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.city.message}</p>
                  )}
                </div>

                {/* ZIP Code */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    placeholder="10001"
                    {...register('zipCode')}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none transition-all text-sm bg-white"
                    style={{
                      borderColor: errors.zipCode ? '#ef4444' : '#E5E7EB',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.zipCode ? '#ef4444' : '#A57865';
                      e.target.style.boxShadow = errors.zipCode ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.zipCode ? '#ef4444' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {errors.zipCode && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.zipCode.message}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10" />
                    <select
                      {...register('country')}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all appearance-none bg-white text-sm"
                      style={{
                        borderColor: errors.country ? '#ef4444' : '#E5E7EB',
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.country ? '#ef4444' : '#A57865';
                        e.target.style.boxShadow = errors.country ? '0 0 0 3px #fecaca' : '0 0 0 3px rgba(165, 120, 101, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.country ? '#ef4444' : '#E5E7EB';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Select</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.country && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.country.message}</p>
                  )}
                </div>
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