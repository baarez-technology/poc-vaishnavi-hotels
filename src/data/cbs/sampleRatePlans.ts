/**
 * Sample Rate Plans Data
 * 4 complete rate plans with rules and restrictions
 */

export const sampleRatePlans = [
  {
    id: 'RP-001',
    name: 'BAR',
    fullName: 'Best Available Rate',
    description: 'Our standard flexible rate with free cancellation up to 24 hours before arrival',
    isActive: true,
    basePrice: {
      'Standard': 120,
      'Premium': 180,
      'Deluxe': 250,
      'Suite': 400
    },
    priceRules: [
      { type: 'weekend', adjustment: 15, adjustmentType: 'percentage' },
      { type: 'high_season', adjustment: 25, adjustmentType: 'percentage', startDate: '2024-12-20', endDate: '2025-01-05' },
      { type: 'high_season', adjustment: 20, adjustmentType: 'percentage', startDate: '2025-06-15', endDate: '2025-08-31' }
    ],
    minStay: 1,
    maxStay: 30,
    ctaEnabled: false,
    ctdEnabled: false,
    cancellationPolicy: 'Free cancellation up to 24 hours before arrival',
    mealPlan: 'Room Only',
    commission: 0,
    channels: ['Direct', 'Booking.com', 'Expedia', 'Hotels.com'],
    createdAt: '2024-01-01',
    updatedAt: '2024-11-15'
  },
  {
    id: 'RP-002',
    name: 'Corporate',
    fullName: 'Corporate Rate',
    description: 'Special negotiated rate for business travelers with flexible check-in/out',
    isActive: true,
    basePrice: {
      'Standard': 108,
      'Premium': 162,
      'Deluxe': 225,
      'Suite': 360
    },
    priceRules: [
      { type: 'flat', adjustment: -10, adjustmentType: 'percentage' }
    ],
    minStay: 1,
    maxStay: 14,
    ctaEnabled: false,
    ctdEnabled: false,
    cancellationPolicy: 'Free cancellation up to 6 hours before arrival',
    mealPlan: 'Breakfast Included',
    commission: 0,
    channels: ['Direct', 'Corporate Portal'],
    createdAt: '2024-01-15',
    updatedAt: '2024-10-20'
  },
  {
    id: 'RP-003',
    name: 'OTA',
    fullName: 'Online Travel Agent Rate',
    description: 'Competitive rate for OTA channels with prepayment required',
    isActive: true,
    basePrice: {
      'Standard': 108,
      'Premium': 162,
      'Deluxe': 225,
      'Suite': 360
    },
    priceRules: [
      { type: 'weekend', adjustment: 10, adjustmentType: 'percentage' },
      { type: 'last_minute', adjustment: -5, adjustmentType: 'percentage', daysBeforeArrival: 3 }
    ],
    minStay: 1,
    maxStay: 21,
    ctaEnabled: true,
    ctdEnabled: false,
    cancellationPolicy: 'Non-refundable, prepayment required',
    mealPlan: 'Room Only',
    commission: 15,
    channels: ['Booking.com', 'Expedia', 'Hotels.com', 'Agoda'],
    createdAt: '2024-02-01',
    updatedAt: '2024-11-10'
  },
  {
    id: 'RP-004',
    name: 'Long Stay',
    fullName: 'Extended Stay Discount',
    description: 'Discounted rate for guests staying 3 nights or more',
    isActive: true,
    basePrice: {
      'Standard': 102,
      'Premium': 153,
      'Deluxe': 212.50,
      'Suite': 340
    },
    priceRules: [
      { type: 'length_of_stay', minNights: 3, adjustment: -15, adjustmentType: 'percentage' },
      { type: 'length_of_stay', minNights: 7, adjustment: -20, adjustmentType: 'percentage' },
      { type: 'length_of_stay', minNights: 14, adjustment: -25, adjustmentType: 'percentage' }
    ],
    minStay: 3,
    maxStay: 90,
    ctaEnabled: false,
    ctdEnabled: true,
    cancellationPolicy: 'Free cancellation up to 48 hours before arrival',
    mealPlan: 'Breakfast Included',
    commission: 0,
    channels: ['Direct', 'Corporate Portal'],
    createdAt: '2024-03-01',
    updatedAt: '2024-11-01'
  }
];

export const roomTypes = ['Standard', 'Premium', 'Deluxe', 'Suite'];

export const mealPlans = [
  { id: 'RO', name: 'Room Only' },
  { id: 'BB', name: 'Breakfast Included' },
  { id: 'HB', name: 'Half Board' },
  { id: 'FB', name: 'Full Board' },
  { id: 'AI', name: 'All Inclusive' }
];

export const channels = [
  { id: 'direct', name: 'Direct', color: 'text-emerald-600' },
  { id: 'booking', name: 'Booking.com', color: 'text-blue-600' },
  { id: 'expedia', name: 'Expedia', color: 'text-yellow-600' },
  { id: 'hotels', name: 'Hotels.com', color: 'text-red-600' },
  { id: 'agoda', name: 'Agoda', color: 'text-purple-600' },
  { id: 'corporate', name: 'Corporate Portal', color: 'text-indigo-600' }
];

export default sampleRatePlans;
