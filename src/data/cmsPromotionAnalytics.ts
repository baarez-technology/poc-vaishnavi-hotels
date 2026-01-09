/**
 * CMS Promotion Analytics Dummy Data
 * Used for the Promotion Analytics page
 */

export const promotionAnalytics = {
  id: "promo001",
  name: "Weekend Getaway",
  status: "Active",
  dateRange: { start: "2024-01-05", end: "2024-01-20" },
  channels: ["Website", "Booking.com", "Expedia"],
  roomTypes: ["Pacific Suite", "Oceanfront Penthouse"],
  discountType: "Percentage",
  discountValue: 15,
  minLOS: 2,
  maxLOS: 7,
  bookingWindow: { start: "2024-01-01", end: "2024-01-18" },
  stayWindow: { start: "2024-01-05", end: "2024-01-20" },
  promoCodes: ["WEEKEND15", "GETAWAY2024"],
  stackable: false,
  restrictions: ["Non-refundable", "Advance purchase required"],
  metrics: {
    redemptions: 133,
    revenue: 258400,
    adrUplift: 12,
    occupancyImpact: 6,
    trend: { redemptions: +23, revenue: +18, adr: +12, occupancy: +4 }
  },
  revenueTimeline: [
    { date: "2024-01-05", incrementalRevenue: 8200, barRate: 280, promoRate: 238 },
    { date: "2024-01-06", incrementalRevenue: 9400, barRate: 280, promoRate: 238 },
    { date: "2024-01-07", incrementalRevenue: 12100, barRate: 290, promoRate: 246 },
    { date: "2024-01-08", incrementalRevenue: 7800, barRate: 275, promoRate: 234 },
    { date: "2024-01-09", incrementalRevenue: 6500, barRate: 270, promoRate: 230 },
    { date: "2024-01-10", incrementalRevenue: 8900, barRate: 285, promoRate: 242 },
    { date: "2024-01-11", incrementalRevenue: 14200, barRate: 310, promoRate: 264 },
    { date: "2024-01-12", incrementalRevenue: 18500, barRate: 340, promoRate: 289 },
    { date: "2024-01-13", incrementalRevenue: 21300, barRate: 350, promoRate: 298 },
    { date: "2024-01-14", incrementalRevenue: 16800, barRate: 320, promoRate: 272 },
    { date: "2024-01-15", incrementalRevenue: 11200, barRate: 290, promoRate: 246 },
    { date: "2024-01-16", incrementalRevenue: 9800, barRate: 280, promoRate: 238 },
    { date: "2024-01-17", incrementalRevenue: 10500, barRate: 285, promoRate: 242 },
    { date: "2024-01-18", incrementalRevenue: 15600, barRate: 315, promoRate: 268 },
    { date: "2024-01-19", incrementalRevenue: 19200, barRate: 345, promoRate: 293 },
    { date: "2024-01-20", incrementalRevenue: 17400, barRate: 330, promoRate: 280 }
  ],
  redemptionsTimeline: [
    { date: "2024-01-05", redemptions: 6 },
    { date: "2024-01-06", redemptions: 8 },
    { date: "2024-01-07", redemptions: 11 },
    { date: "2024-01-08", redemptions: 5 },
    { date: "2024-01-09", redemptions: 4 },
    { date: "2024-01-10", redemptions: 7 },
    { date: "2024-01-11", redemptions: 12 },
    { date: "2024-01-12", redemptions: 16 },
    { date: "2024-01-13", redemptions: 18 },
    { date: "2024-01-14", redemptions: 14 },
    { date: "2024-01-15", redemptions: 9 },
    { date: "2024-01-16", redemptions: 7 },
    { date: "2024-01-17", redemptions: 8 },
    { date: "2024-01-18", redemptions: 13 },
    { date: "2024-01-19", redemptions: 17 },
    { date: "2024-01-20", redemptions: 15 }
  ],
  channelPerformance: [
    { channel: "Website", redemptions: 58, revenue: 118320, adr: 342, conversion: 6.1, trend: +12 },
    { channel: "Booking.com", redemptions: 48, revenue: 92300, adr: 325, conversion: 4.2, trend: +5 },
    { channel: "Expedia", redemptions: 27, revenue: 47780, adr: 315, conversion: 3.8, trend: -2 }
  ],
  roomTypePerformance: [
    { type: "Pacific Suite", revenue: 98400, redemptions: 72, uplift: 12, trend: +7 },
    { type: "Oceanfront Penthouse", revenue: 160000, redemptions: 61, uplift: 18, trend: +11 }
  ],
  forecast: {
    next7daysRevenue: 48200,
    next7daysRedemptions: 63,
    predictedADR: 344,
    confidence: 0.92
  },
  aiInsights: [
    {
      headline: "Promotion is performing 35% above segment average",
      detail: "Based on comparison with similar weekend promotions in your market segment over the past 6 months."
    },
    {
      headline: "Website drives 45% higher ADR uplift than OTAs",
      detail: "Direct bookings through your website show significantly better revenue metrics compared to third-party channels."
    },
    {
      headline: "Oceanfront Penthouse category has the strongest conversion rate",
      detail: "Oceanfront Penthouse rooms convert at 8.2% compared to 5.4% for Pacific Suite rooms when this promotion is applied."
    },
    {
      headline: "Weekend dates show 2.3x higher redemption rate",
      detail: "Friday through Sunday bookings account for 68% of total redemptions despite representing only 43% of available dates."
    }
  ],
  recommendations: [
    {
      id: "rec1",
      title: "Extend Promotion by 7 Days",
      reason: "Strong weekend demand pattern detected with consistent upward trend. Historical data suggests continued momentum.",
      impact: "+18% expected revenue",
      impactValue: 46500,
      priority: "high"
    },
    {
      id: "rec2",
      title: "Increase Discount for Premium Rooms by 5%",
      reason: "Premium rooms show highest redemptions but lower conversion rate compared to segment benchmark.",
      impact: "+12% expected uplift",
      impactValue: 19200,
      priority: "medium"
    },
    {
      id: "rec3",
      title: "Reduce OTA Restrictions",
      reason: "Expedia channel showing negative trend. Loosening minimum stay requirement could boost conversions.",
      impact: "+8% channel recovery",
      impactValue: 7800,
      priority: "medium"
    },
    {
      id: "rec4",
      title: "Clone as High-Conversion Offer",
      reason: "This promotion has 35% higher conversion than average. Consider creating a similar offer for different dates.",
      impact: "Replicate success pattern",
      impactValue: 0,
      priority: "low"
    }
  ]
};

// Helper function to get promotion by ID
export const getPromotionById = (id) => {
  // In real app, this would fetch from API
  if (id === "promo001" || id === promotionAnalytics.id) {
    return promotionAnalytics;
  }
  // Return default data for any ID (demo purposes)
  return promotionAnalytics;
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value, showSign = false) => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value}%`;
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

// Format date range
export const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};
