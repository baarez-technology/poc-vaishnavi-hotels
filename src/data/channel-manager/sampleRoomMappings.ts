/**
 * Sample Room Mappings Data
 * Maps PMS room types to OTA room types
 */

export const sampleRoomMappings = [
  {
    id: 'map-001',
    pmsRoomType: 'Standard',
    pmsRoomCode: 'STD',
    otaMappings: [
      {
        otaCode: 'BOOKING',
        otaRoomType: 'Standard Double Room',
        otaRoomCode: 'STD_DBL',
        maxGuests: 2,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'EXPEDIA',
        otaRoomType: 'Standard Room',
        otaRoomCode: 'STDROOM',
        maxGuests: 2,
        defaultRatePlan: 'OTA',
        status: 'active',
        lastSync: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'AGODA',
        otaRoomType: 'Standard Double',
        otaRoomCode: 'SD',
        maxGuests: 2,
        defaultRatePlan: 'OTA',
        status: 'active',
        lastSync: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'MMT',
        otaRoomType: 'Standard Room',
        otaRoomCode: 'STD',
        maxGuests: 2,
        defaultRatePlan: 'OTA',
        status: 'active',
        lastSync: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'GOOGLE',
        otaRoomType: 'Standard',
        otaRoomCode: 'STANDARD',
        maxGuests: 2,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 1 * 60 * 1000).toISOString()
      }
    ],
    basePrice: 120,
    inventory: 12
  },
  {
    id: 'map-002',
    pmsRoomType: 'Premium',
    pmsRoomCode: 'PRM',
    otaMappings: [
      {
        otaCode: 'BOOKING',
        otaRoomType: 'Superior King Room',
        otaRoomCode: 'SUP_KNG',
        maxGuests: 2,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'EXPEDIA',
        otaRoomType: 'Premium Room',
        otaRoomCode: 'PREMIUM',
        maxGuests: 2,
        defaultRatePlan: 'OTA',
        status: 'active',
        lastSync: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'AGODA',
        otaRoomType: 'Superior Room',
        otaRoomCode: 'SR',
        maxGuests: 2,
        defaultRatePlan: 'OTA',
        status: 'active',
        lastSync: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'GOOGLE',
        otaRoomType: 'Premium',
        otaRoomCode: 'PREMIUM',
        maxGuests: 2,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 1 * 60 * 1000).toISOString()
      }
    ],
    basePrice: 180,
    inventory: 10
  },
  {
    id: 'map-003',
    pmsRoomType: 'Deluxe',
    pmsRoomCode: 'DLX',
    otaMappings: [
      {
        otaCode: 'BOOKING',
        otaRoomType: 'Deluxe Room with Ocean View',
        otaRoomCode: 'DLX_OV',
        maxGuests: 3,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'EXPEDIA',
        otaRoomType: 'Deluxe Ocean View',
        otaRoomCode: 'DLXOV',
        maxGuests: 3,
        defaultRatePlan: 'OTA',
        status: 'active',
        lastSync: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'AGODA',
        otaRoomType: 'Deluxe View Room',
        otaRoomCode: 'DVR',
        maxGuests: 3,
        defaultRatePlan: 'OTA',
        status: 'pending',
        lastSync: null
      }
    ],
    basePrice: 250,
    inventory: 8
  },
  {
    id: 'map-004',
    pmsRoomType: 'Suite',
    pmsRoomCode: 'STE',
    otaMappings: [
      {
        otaCode: 'BOOKING',
        otaRoomType: 'Executive Suite',
        otaRoomCode: 'EXEC_STE',
        maxGuests: 4,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'EXPEDIA',
        otaRoomType: 'Premium Suite',
        otaRoomCode: 'PRMSTE',
        maxGuests: 4,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        otaCode: 'GOOGLE',
        otaRoomType: 'Suite',
        otaRoomCode: 'SUITE',
        maxGuests: 4,
        defaultRatePlan: 'BAR',
        status: 'active',
        lastSync: new Date(Date.now() - 1 * 60 * 1000).toISOString()
      }
    ],
    basePrice: 400,
    inventory: 5
  }
];

export const mappingStatusConfig = {
  active: { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-100' },
  error: { label: 'Error', color: 'text-rose-600', bg: 'bg-rose-100' },
  inactive: { label: 'Inactive', color: 'text-neutral-500', bg: 'bg-neutral-100' }
};

export const suggestedMappings = {
  Standard: {
    BOOKING: 'Standard Double Room',
    EXPEDIA: 'Standard Room',
    AGODA: 'Standard Double',
    AIRBNB: 'Entire Place - Standard',
    MMT: 'Standard Room',
    TRIP: 'Standard Double',
    GOOGLE: 'Standard'
  },
  Premium: {
    BOOKING: 'Superior King Room',
    EXPEDIA: 'Premium Room',
    AGODA: 'Superior Room',
    AIRBNB: 'Entire Place - Premium',
    MMT: 'Superior Room',
    TRIP: 'Superior King',
    GOOGLE: 'Premium'
  },
  Deluxe: {
    BOOKING: 'Deluxe Room with Ocean View',
    EXPEDIA: 'Deluxe Ocean View',
    AGODA: 'Deluxe View Room',
    AIRBNB: 'Entire Place - Deluxe',
    MMT: 'Deluxe Room',
    TRIP: 'Deluxe Ocean View',
    GOOGLE: 'Deluxe'
  },
  Suite: {
    BOOKING: 'Executive Suite',
    EXPEDIA: 'Premium Suite',
    AGODA: 'Luxury Suite',
    AIRBNB: 'Entire Place - Suite',
    MMT: 'Executive Suite',
    TRIP: 'Luxury Suite',
    GOOGLE: 'Suite'
  }
};

export default sampleRoomMappings;
