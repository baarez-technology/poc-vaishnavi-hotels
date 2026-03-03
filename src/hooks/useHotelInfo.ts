/**
 * useHotelInfo Hook
 * Provides dynamic hotel information from settings context.
 * All guest-facing pages should use this instead of hardcoded constants.
 */

import { useMemo } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';

const defaultAddress = {
  street: 'Mahatma Gandhi Rd, Nallagutta, Rani Gunj, Secunderabad',
  city: 'Hyderabad',
  state: 'Telangana',
  zip: '500003',
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
    name: generalSettings?.hotelName || 'Vaishnavi Group of Hotels',
    tagline: generalSettings?.tagline || 'Grounded in Luxury',
    address: generalSettings?.address || defaultAddress,
    phone: generalSettings?.contactPhone || '+91-9640688885',
    phone2: generalSettings?.contactPhone2 || '',
    email: generalSettings?.contactEmail || 'hotelvaishnaviclassic@gmail.com',
    website: generalSettings?.website || '',
    logo: generalSettings?.branding?.logo || null,
    socialMedia: generalSettings?.socialMedia || defaultSocial,
    checkInTime: generalSettings?.checkInTime || '3:00 PM',
    checkOutTime: generalSettings?.checkOutTime || '11:00 AM',
  }), [generalSettings]);
}

export default useHotelInfo;
