/**
 * Channel Data - Distribution channel performance and revenue
 */

export const channelData = [
  {
    id: 'direct',
    channel: 'Direct Booking',
    revenue: 156000,
    bookings: 620,
    percentage: 35.5,
    commission: 0,
    netRevenue: 156000,
    adr: 252,
    conversionRate: 4.2,
    trend: 'up',
    growth: 8.5
  },
  {
    id: 'ota',
    channel: 'OTA (Booking.com, Expedia)',
    revenue: 132000,
    bookings: 780,
    percentage: 30.0,
    commission: 15,
    netRevenue: 112200,
    adr: 169,
    conversionRate: 2.8,
    trend: 'stable',
    growth: 1.2
  },
  {
    id: 'corporate',
    channel: 'Corporate Contracts',
    revenue: 89000,
    bookings: 380,
    percentage: 20.2,
    commission: 5,
    netRevenue: 84550,
    adr: 234,
    conversionRate: 12.5,
    trend: 'up',
    growth: 6.8
  },
  {
    id: 'travel-agent',
    channel: 'Travel Agents',
    revenue: 42000,
    bookings: 210,
    percentage: 9.5,
    commission: 10,
    netRevenue: 37800,
    adr: 200,
    conversionRate: 3.5,
    trend: 'down',
    growth: -3.2
  },
  {
    id: 'gds',
    channel: 'GDS (Amadeus, Sabre)',
    revenue: 21000,
    bookings: 110,
    percentage: 4.8,
    commission: 12,
    netRevenue: 18480,
    adr: 191,
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
