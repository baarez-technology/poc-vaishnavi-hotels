/**
 * useHotelInfo Hook
 * Provides dynamic hotel information from settings context.
 * All guest-facing pages should use this instead of hardcoded constants.
 */

import { useMemo } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';

const defaultAddress = {
  street: '503 Orchid Sadashivpuram, Moriwali Pada',
  city: 'Ambernath, Kalyan, Thane',
  state: 'Maharashtra',
  zip: '421501',
  country: 'India',
};

const defaultSocial = {
  facebook: '',
  instagram: '',
  twitter: '',
  linkedin: '',
};

export function useHotelInfo() {
  const { generalSettings } = useSettingsContext() as any;

  return useMemo(() => ({
    name: generalSettings?.hotelName || 'Glimmora International Pvt Limited',
    tagline: generalSettings?.tagline || 'Grounded in Luxury',
    address: generalSettings?.address || defaultAddress,
    phone: generalSettings?.contactPhone || '+971 501371105',
    phone2: generalSettings?.contactPhone2 || '+91-6300275340',
    email: generalSettings?.contactEmail || 'info@glimmora.ai',
    website: generalSettings?.website || '',
    logo: generalSettings?.branding?.logo || null,
    socialMedia: generalSettings?.socialMedia || defaultSocial,
    checkInTime: generalSettings?.checkInTime || '3:00 PM',
    checkOutTime: generalSettings?.checkOutTime || '11:00 AM',
  }), [generalSettings]);
}

export default useHotelInfo;
