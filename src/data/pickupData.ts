/**
 * Pickup Data - Booking pace and reservation trends
 */

// Booking pace by days before arrival
export const pickupData = [
  {
    daysOut: '0-7',
    label: '0-7 Days',
    currentYear: 156,
    lastYear: 142,
    variance: 9.9,
    percentage: 18
  },
  {
    daysOut: '8-14',
    label: '8-14 Days',
    currentYear: 198,
    lastYear: 185,
    variance: 7.0,
    percentage: 23
  },
  {
    daysOut: '15-30',
    label: '15-30 Days',
    currentYear: 245,
    lastYear: 238,
    variance: 2.9,
    percentage: 28
  },
  {
    daysOut: '31-60',
    label: '31-60 Days',
    currentYear: 178,
    lastYear: 192,
    variance: -7.3,
    percentage: 20
  },
  {
    daysOut: '61-90',
    label: '61-90 Days',
    currentYear: 89,
    lastYear: 95,
    variance: -6.3,
    percentage: 10
  },
  {
    daysOut: '90+',
    label: '90+ Days',
    currentYear: 12,
    lastYear: 15,
    variance: -20.0,
    percentage: 1
  }
];

// Weekly pickup comparison (last 8 weeks)
export const weeklyPickupData = [
  { week: 'Week 1', rooms: 78, revenue: 14200 },
  { week: 'Week 2', rooms: 82, revenue: 15100 },
  { week: 'Week 3', rooms: 95, revenue: 17800 },
  { week: 'Week 4', rooms: 88, revenue: 16200 },
  { week: 'Week 5', rooms: 102, revenue: 19500 },
  { week: 'Week 6', rooms: 108, revenue: 20800 },
  { week: 'Week 7', rooms: 115, revenue: 22100 },
  { week: 'Week 8', rooms: 122, revenue: 24000 }
];

// On-the-books data (future reservations)
export const onTheBooks = {
  next7Days: {
    rooms: 312,
    revenue: 68400,
    occupancy: 78,
    adr: 219
  },
  next14Days: {
    rooms: 598,
    revenue: 128600,
    occupancy: 67,
    adr: 215
  },
  next30Days: {
    rooms: 1156,
    revenue: 242800,
    occupancy: 61,
    adr: 210
  }
};

// Pace indicators
export const paceIndicators = {
  overall: {
    status: 'ahead',
    percentage: 8.5,
    description: 'Booking pace is 8.5% ahead of last year'
  },
  shortTerm: {
    status: 'ahead',
    percentage: 12.3,
    description: 'Strong short-term pickup (0-14 days)'
  },
  longTerm: {
    status: 'behind',
    percentage: -5.8,
    description: 'Long-term bookings (60+ days) are slower'
  }
};
