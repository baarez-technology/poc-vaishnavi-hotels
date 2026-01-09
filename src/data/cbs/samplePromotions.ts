/**
 * Sample Promotions Data
 * 3 promotional campaigns with various types
 */

const today = new Date();
const formatDate = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const samplePromotions = [
  {
    id: 'PROMO-001',
    title: 'Winter Wonderland Special',
    code: 'WINTER2024',
    description: 'Enjoy 20% off on all room types during the winter season',
    discountType: 'percentage',
    discountValue: 20,
    isActive: true,
    validFrom: formatDate(-10),
    validTo: formatDate(60),
    minNights: 2,
    maxNights: null,
    minBookingAmount: 200,
    applicableRoomTypes: ['Minimalist Studio', 'Coastal Retreat', 'Urban Oasis', 'Sunset Vista', 'Pacific Suite', 'Wellness Suite', 'Family Sanctuary', 'Oceanfront Penthouse'],
    applicableRatePlans: ['BAR', 'Long Stay'],
    applicableChannels: ['Direct'],
    usageLimit: 100,
    usageCount: 34,
    stackable: false,
    termsAndConditions: 'Valid for direct bookings only. Cannot be combined with other offers. Blackout dates may apply.',
    createdAt: formatDate(-30),
    createdBy: 'Marketing Team'
  },
  {
    id: 'PROMO-002',
    title: 'OTA Flash Sale',
    code: null,
    description: 'Limited time 15% discount for OTA bookings during low season',
    discountType: 'percentage',
    discountValue: 15,
    isActive: true,
    validFrom: formatDate(0),
    validTo: formatDate(30),
    minNights: 1,
    maxNights: 7,
    minBookingAmount: null,
    applicableRoomTypes: ['Minimalist Studio', 'Coastal Retreat', 'Urban Oasis'],
    applicableRatePlans: ['OTA'],
    applicableChannels: ['Booking.com', 'Expedia', 'Hotels.com'],
    usageLimit: null,
    usageCount: 87,
    stackable: false,
    termsAndConditions: 'OTA channels only. Subject to availability. Rate visible on partner sites.',
    createdAt: formatDate(-5),
    createdBy: 'Revenue Manager'
  },
  {
    id: 'PROMO-003',
    title: 'Stay 4, Pay 3 - Free Night Offer',
    code: 'FREENIGHT',
    description: 'Book 4 nights and get the 4th night absolutely free',
    discountType: 'free_night',
    discountValue: 1,
    isActive: true,
    validFrom: formatDate(-20),
    validTo: formatDate(90),
    minNights: 4,
    maxNights: null,
    minBookingAmount: null,
    applicableRoomTypes: ['Pacific Suite', 'Wellness Suite', 'Family Sanctuary', 'Oceanfront Penthouse'],
    applicableRatePlans: ['BAR'],
    applicableChannels: ['Direct'],
    usageLimit: 50,
    usageCount: 12,
    stackable: false,
    termsAndConditions: 'Valid for Deluxe and Suite rooms only. Direct booking required. Subject to availability.',
    createdAt: formatDate(-25),
    createdBy: 'Marketing Team'
  }
];

export const promotionTypes = [
  { id: 'percentage', name: 'Percentage Discount', icon: '%' },
  { id: 'fixed', name: 'Fixed Amount Off', icon: '$' },
  { id: 'free_night', name: 'Free Night', icon: 'night' },
  { id: 'upgrade', name: 'Room Upgrade', icon: 'up' },
  { id: 'addon', name: 'Free Add-on', icon: 'gift' }
];

export default samplePromotions;
