/**
 * useHotelInfo Hook
 * Provides dynamic hotel information from settings context.
 * All guest-facing pages should use this instead of hardcoded constants.
 */

import { useMemo } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';

const defaultAddress = {
  street: '123 Luxury Avenue',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'United States',
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
    name: generalSettings?.hotelName || 'Glimmora',
    tagline: generalSettings?.tagline || 'Grounded in Luxury',
    address: generalSettings?.address || defaultAddress,
    phone: generalSettings?.contactPhone || '',
    email: generalSettings?.contactEmail || '',
    website: generalSettings?.website || '',
    logo: generalSettings?.branding?.logo || null,
    socialMedia: generalSettings?.socialMedia || defaultSocial,
    checkInTime: generalSettings?.checkInTime || '3:00 PM',
    checkOutTime: generalSettings?.checkOutTime || '11:00 AM',
  }), [generalSettings]);
}

export default useHotelInfo;
