// Sample Competitor Rate Data
// Simulates rate shopping data from OTAs

export const competitors = [
  {
    id: 'comp1',
    name: 'Grand Luxe Resort',
    starRating: 5,
    distanceKm: 0.8,
    avgRateIndex: 1.15, // 15% higher than us typically
    position: 'premium',
    sources: ['booking', 'expedia', 'hotels'],
  },
  {
    id: 'comp2',
    name: 'Seaside Boutique Hotel',
    starRating: 4,
    distanceKm: 1.2,
    avgRateIndex: 0.95, // 5% lower
    position: 'value',
    sources: ['booking', 'expedia', 'agoda'],
  },
  {
    id: 'comp3',
    name: 'Metropolitan Suites',
    starRating: 4,
    distanceKm: 0.5,
    avgRateIndex: 1.05, // 5% higher
    position: 'comparable',
    sources: ['booking', 'expedia', 'hotels', 'agoda'],
  },
  {
    id: 'comp4',
    name: 'Harbor View Inn',
    starRating: 3,
    distanceKm: 2.0,
    avgRateIndex: 0.75, // 25% lower
    position: 'budget',
    sources: ['booking', 'agoda'],
  },
  {
    id: 'comp5',
    name: 'The Ritz Downtown',
    starRating: 5,
    distanceKm: 1.5,
    avgRateIndex: 1.35, // 35% higher
    position: 'luxury',
    sources: ['booking', 'expedia', 'hotels'],
  },
];

export const otaSources = [
  { id: 'booking', name: 'Booking.com', icon: 'B', color: '#003580' },
  { id: 'expedia', name: 'Expedia', icon: 'E', color: '#00355F' },
  { id: 'agoda', name: 'Agoda', icon: 'A', color: '#5C2D91' },
  { id: 'hotels', name: 'Hotels.com', icon: 'H', color: '#D32F2F' },
];

// Generate competitor rates for next 90 days
export function generateCompetitorRates(startDate = new Date(), ourRates = {}) {
  const competitorRates = {};
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Our base rate for this date (Standard room BAR)
    const ourRate = ourRates[dateStr]?.rooms?.STD?.rates?.BAR || 15700;

    const dayRates = {
      date: dateStr,
      ourRate,
      competitors: {},
      analysis: {},
    };

    // Generate rates for each competitor
    competitors.forEach(comp => {
      // Base rate with their typical index
      let baseCompRate = Math.round(ourRate * comp.avgRateIndex);

      // Add some daily variance (+/- 10%)
      const variance = 0.9 + Math.random() * 0.2;
      baseCompRate = Math.round(baseCompRate * variance);

      // Generate rates by OTA source (slight variations)
      const sourceRates = {};
      comp.sources.forEach(source => {
        const sourceVariance = 0.98 + Math.random() * 0.04;
        sourceRates[source] = Math.round(baseCompRate * sourceVariance);
      });

      // Calculate average rate across sources
      const avgRate = Math.round(
        Object.values(sourceRates).reduce((a, b) => a + b, 0) / Object.values(sourceRates).length
      );

      // Availability simulation
      const availability = Math.random() > 0.1 ? (Math.random() > 0.7 ? 'limited' : 'available') : 'sold_out';

      dayRates.competitors[comp.id] = {
        competitorId: comp.id,
        competitorName: comp.name,
        starRating: comp.starRating,
        position: comp.position,
        rates: sourceRates,
        avgRate,
        minRate: Math.min(...Object.values(sourceRates)),
        maxRate: Math.max(...Object.values(sourceRates)),
        availability,
        lastUpdated: new Date().toISOString(),
      };
    });

    // Calculate market analysis
    const allRates = Object.values(dayRates.competitors).map(c => c.avgRate);
    const avgMarketRate = Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length);
    const minMarketRate = Math.min(...allRates);
    const maxMarketRate = Math.max(...allRates);

    // Our position in market
    const rateGap = ourRate - avgMarketRate;
    const rateGapPercent = Math.round((rateGap / avgMarketRate) * 100);

    let positioning;
    if (rateGapPercent > 15) positioning = 'significantly_above';
    else if (rateGapPercent > 5) positioning = 'above_market';
    else if (rateGapPercent >= -5) positioning = 'at_market';
    else if (rateGapPercent >= -15) positioning = 'below_market';
    else positioning = 'significantly_below';

    // Count how many competitors we're cheaper/more expensive than
    const cheaperThan = allRates.filter(r => ourRate < r).length;
    const moreExpensiveThan = allRates.filter(r => ourRate > r).length;

    dayRates.analysis = {
      avgMarketRate,
      minMarketRate,
      maxMarketRate,
      ourRate,
      rateGap,
      rateGapPercent,
      positioning,
      cheaperThan,
      moreExpensiveThan,
      recommendation: generateRateRecommendation(rateGapPercent, positioning, i),
    };

    competitorRates[dateStr] = dayRates;
  }

  return competitorRates;
}

function generateRateRecommendation(gapPercent, positioning, daysOut) {
  if (positioning === 'significantly_below' && daysOut <= 14) {
    return {
      action: 'increase',
      urgency: 'high',
      message: `You're ${Math.abs(gapPercent)}% below market - potential revenue loss of \u20B9${Math.round(Math.abs(gapPercent) * 166)}/night`,
      suggestedAdjustment: Math.round(Math.abs(gapPercent) * 0.7),
    };
  }

  if (positioning === 'below_market' && daysOut <= 7) {
    return {
      action: 'increase',
      urgency: 'medium',
      message: `Rate ${Math.abs(gapPercent)}% below average - consider adjustment for last-minute demand`,
      suggestedAdjustment: Math.round(Math.abs(gapPercent) * 0.5),
    };
  }

  if (positioning === 'significantly_above' && daysOut <= 21) {
    return {
      action: 'monitor',
      urgency: 'medium',
      message: `${gapPercent}% above market - verify pickup pace to justify premium`,
      suggestedAdjustment: 0,
    };
  }

  if (positioning === 'above_market' && daysOut > 30) {
    return {
      action: 'hold',
      urgency: 'low',
      message: 'Premium positioning acceptable for advance bookings',
      suggestedAdjustment: 0,
    };
  }

  return {
    action: 'hold',
    urgency: 'low',
    message: 'Rate positioned appropriately within market',
    suggestedAdjustment: 0,
  };
}

// Calculate rate parity issues
export function checkRateParity(competitorRates) {
  const parityIssues = [];

  Object.entries(competitorRates).forEach(([date, dayData]) => {
    const { ourRate, analysis } = dayData;

    // Check if we're significantly underpriced
    if (analysis.positioning === 'significantly_below') {
      parityIssues.push({
        date,
        type: 'underpriced',
        severity: 'high',
        ourRate,
        marketAvg: analysis.avgMarketRate,
        gap: analysis.rateGap,
        gapPercent: analysis.rateGapPercent,
        potentialRevenueLoss: Math.round(Math.abs(analysis.rateGap) * 45), // Assuming 45 rooms
      });
    }

    // Check if we're significantly overpriced
    if (analysis.positioning === 'significantly_above') {
      parityIssues.push({
        date,
        type: 'overpriced',
        severity: 'medium',
        ourRate,
        marketAvg: analysis.avgMarketRate,
        gap: analysis.rateGap,
        gapPercent: analysis.rateGapPercent,
        riskLevel: 'Low pickup expected',
      });
    }
  });

  return parityIssues;
}

// Get competitor insights
export function getCompetitorInsights(competitorRates) {
  const allDays = Object.values(competitorRates);

  // Average market positioning over next 30 days
  const next30 = allDays.slice(0, 30);
  const avgGapPercent = Math.round(
    next30.reduce((sum, d) => sum + d.analysis.rateGapPercent, 0) / next30.length
  );

  // Days where we're underpriced
  const underpricedDays = next30.filter(d => d.analysis.positioning === 'significantly_below' || d.analysis.positioning === 'below_market');

  // Days where we're overpriced
  const overpricedDays = next30.filter(d => d.analysis.positioning === 'significantly_above' || d.analysis.positioning === 'above_market');

  // Competitor trends
  const competitorTrends = competitors.map(comp => {
    const compRates = next30.map(d => d.competitors[comp.id]?.avgRate || 0);
    const avgRate = Math.round(compRates.reduce((a, b) => a + b, 0) / compRates.length);
    const trend = compRates[29] > compRates[0] ? 'increasing' : compRates[29] < compRates[0] ? 'decreasing' : 'stable';

    return {
      ...comp,
      avgRate,
      trend,
      changePercent: Math.round(((compRates[29] - compRates[0]) / compRates[0]) * 100),
    };
  });

  return {
    avgGapPercent,
    underpricedDays: underpricedDays.length,
    overpricedDays: overpricedDays.length,
    atMarketDays: 30 - underpricedDays.length - overpricedDays.length,
    potentialRevenueLoss: underpricedDays.reduce(
      (sum, d) => sum + Math.round(Math.abs(d.analysis.rateGap) * 45),
      0
    ),
    competitorTrends,
    recommendations: [
      underpricedDays.length > 10 ? 'Consider systematic rate increase - multiple underpriced days detected' : null,
      overpricedDays.length > 10 ? 'Review rate strategy - multiple overpriced days may affect pickup' : null,
      avgGapPercent < -10 ? 'Significant revenue opportunity - rates consistently below market' : null,
    ].filter(Boolean),
  };
}

export const sampleCompetitorRates = generateCompetitorRates();
export const competitorInsights = getCompetitorInsights(sampleCompetitorRates);
export const parityIssues = checkRateParity(sampleCompetitorRates);

export default sampleCompetitorRates;
