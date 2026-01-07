// Lifetime Value (LTV) Trend Data
export const ltvTrendData = [
  { month: 'Jan', avgLTV: 2890, vipLTV: 7200, frequentLTV: 3800, occasionalLTV: 1600 },
  { month: 'Feb', avgLTV: 2945, vipLTV: 7350, frequentLTV: 3900, occasionalLTV: 1650 },
  { month: 'Mar', avgLTV: 3012, vipLTV: 7500, frequentLTV: 4000, occasionalLTV: 1680 },
  { month: 'Apr', avgLTV: 3087, vipLTV: 7650, frequentLTV: 4100, occasionalLTV: 1710 },
  { month: 'May', avgLTV: 3145, vipLTV: 7800, frequentLTV: 4150, occasionalLTV: 1740 },
  { month: 'Jun', avgLTV: 3198, vipLTV: 7950, frequentLTV: 4200, occasionalLTV: 1760 },
  { month: 'Jul', avgLTV: 3256, vipLTV: 8100, frequentLTV: 4250, occasionalLTV: 1780 },
  { month: 'Aug', avgLTV: 3312, vipLTV: 8250, frequentLTV: 4300, occasionalLTV: 1795 },
  { month: 'Sep', avgLTV: 3365, vipLTV: 8400, frequentLTV: 4350, occasionalLTV: 1810 },
  { month: 'Oct', avgLTV: 3398, vipLTV: 8450, frequentLTV: 4380, occasionalLTV: 1825 },
  { month: 'Nov', avgLTV: 3420, vipLTV: 8500, frequentLTV: 4200, occasionalLTV: 1800 },
  { month: 'Dec', avgLTV: 3420, vipLTV: 8500, frequentLTV: 4200, occasionalLTV: 1800 }
];

export const ltvMetrics = {
  averageLTV: 3420,
  highestLTV: 45600,
  lowestLTV: 280,
  medianLTV: 2850,

  vipSegmentLTV: 8500,
  frequentSegmentLTV: 4200,
  occasionalSegmentLTV: 1800,
  corporateSegmentLTV: 5200,

  ltvGrowthYoY: '+18.3%',
  ltvGrowthMoM: '+1.2%',

  top10PercentLTV: 12400,
  bottom10PercentLTV: 420
};

export const ltvByBookingSource = [
  { source: 'Direct Website', avgLTV: 4200, guestCount: 847 },
  { source: 'Booking.com', avgLTV: 2800, guestCount: 623 },
  { source: 'Expedia', avgLTV: 2950, guestCount: 412 },
  { source: 'Corporate Portal', avgLTV: 5200, guestCount: 198 },
  { source: 'Referral Program', avgLTV: 3900, guestCount: 423 },
  { source: 'Google Hotel Ads', avgLTV: 2600, guestCount: 210 },
  { source: 'TripAdvisor', avgLTV: 2400, guestCount: 134 }
];

export const ltvProjections = {
  next3Months: 3580,
  next6Months: 3740,
  next12Months: 4120,
  projectedGrowth: '+20.5%'
};
