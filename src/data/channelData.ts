/**
 * Channel Data - Distribution channel performance and revenue
 */

export const channelData = [
  {
    id: 'direct',
    channel: 'Direct Booking',
    revenue: 12948000,
    bookings: 620,
    percentage: 35.5,
    commission: 0,
    netRevenue: 12948000,
    adr: 21000,
    conversionRate: 4.2,
    trend: 'up',
    growth: 8.5
  },
  {
    id: 'ota',
    channel: 'OTA (Booking.com, Expedia)',
    revenue: 10956000,
    bookings: 780,
    percentage: 30.0,
    commission: 15,
    netRevenue: 9313000,
    adr: 14000,
    conversionRate: 2.8,
    trend: 'stable',
    growth: 1.2
  },
  {
    id: 'corporate',
    channel: 'Corporate Contracts',
    revenue: 7387000,
    bookings: 380,
    percentage: 20.2,
    commission: 5,
    netRevenue: 7018000,
    adr: 19500,
    conversionRate: 12.5,
    trend: 'up',
    growth: 6.8
  },
  {
    id: 'travel-agent',
    channel: 'Travel Agents',
    revenue: 3486000,
    bookings: 210,
    percentage: 9.5,
    commission: 10,
    netRevenue: 3137000,
    adr: 16500,
    conversionRate: 3.5,
    trend: 'down',
    growth: -3.2
  },
  {
    id: 'gds',
    channel: 'GDS (Amadeus, Sabre)',
    revenue: 1743000,
    bookings: 110,
    percentage: 4.8,
    commission: 12,
    netRevenue: 1534000,
    adr: 16000,
    conversionRate: 5.1,
    trend: 'stable',
    growth: 0.5
  }
];

// Channel summary
export const channelSummary = {
  totalRevenue: channelData.reduce((sum, channel) => sum + channel.revenue, 0),
  totalNetRevenue: channelData.reduce((sum, channel) => sum + channel.netRevenue, 0),
  totalBookings: channelData.reduce((sum, channel) => sum + channel.bookings, 0),
  avgCommission: Math.round(
    channelData.reduce((sum, channel) => sum + (channel.commission * channel.percentage), 0) / 100
  )
};

// Get best performing channel
export const getBestChannel = () => {
  return channelData.reduce((max, channel) =>
    channel.netRevenue > max.netRevenue ? channel : max
  );
};

// Get commission costs
export const getCommissionCosts = () => {
  return channelSummary.totalRevenue - channelSummary.totalNetRevenue;
};
