// Sample Demand Forecast Data
// AI-simulated demand forecasting for next 90 days

// Historical demand patterns (baseline)
const historicalPatterns = {
  // Day of week indices (0 = Sunday)
  dayOfWeek: {
    0: { demandIndex: 0.75, typicalOcc: 62 },
    1: { demandIndex: 0.65, typicalOcc: 55 },
    2: { demandIndex: 0.70, typicalOcc: 58 },
    3: { demandIndex: 0.80, typicalOcc: 65 },
    4: { demandIndex: 0.90, typicalOcc: 72 },
    5: { demandIndex: 1.15, typicalOcc: 85 },
    6: { demandIndex: 1.20, typicalOcc: 88 },
  },
  // Month indices
  month: {
    1: { demandIndex: 0.75, typicalOcc: 58 },
    2: { demandIndex: 0.80, typicalOcc: 62 },
    3: { demandIndex: 0.90, typicalOcc: 70 },
    4: { demandIndex: 0.95, typicalOcc: 74 },
    5: { demandIndex: 1.05, typicalOcc: 78 },
    6: { demandIndex: 1.20, typicalOcc: 85 },
    7: { demandIndex: 1.30, typicalOcc: 90 },
    8: { demandIndex: 1.25, typicalOcc: 88 },
    9: { demandIndex: 1.00, typicalOcc: 76 },
    10: { demandIndex: 0.90, typicalOcc: 70 },
    11: { demandIndex: 0.85, typicalOcc: 66 },
    12: { demandIndex: 1.35, typicalOcc: 92 },
  },
};

// Upcoming events that affect demand
const upcomingEvents = [
  { startDate: '2025-12-20', endDate: '2025-12-26', name: 'Christmas Week', impactMultiplier: 1.45, type: 'holiday' },
  { startDate: '2025-12-27', endDate: '2026-01-02', name: 'New Year Week', impactMultiplier: 1.55, type: 'holiday' },
  { startDate: '2026-01-15', endDate: '2026-01-17', name: 'MLK Weekend', impactMultiplier: 1.20, type: 'holiday' },
  { startDate: '2026-02-14', endDate: '2026-02-16', name: 'Valentine\'s Weekend', impactMultiplier: 1.25, type: 'special' },
  { startDate: '2026-02-21', endDate: '2026-02-23', name: 'Presidents Day Weekend', impactMultiplier: 1.15, type: 'holiday' },
];

// Generate forecast for 90 days
export function generateForecast(startDate = new Date()) {
  const forecast = {};
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  // Total rooms in property
  const totalRooms = 70;

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;

    // Get base demand indices
    const dowPattern = historicalPatterns.dayOfWeek[dayOfWeek];
    const monthPattern = historicalPatterns.month[month];

    // Check for events
    const activeEvent = upcomingEvents.find(e =>
      dateStr >= e.startDate && dateStr <= e.endDate
    );

    // Calculate combined demand index
    let demandIndex = (dowPattern.demandIndex + monthPattern.demandIndex) / 2;

    // Apply event multiplier if applicable
    if (activeEvent) {
      demandIndex *= activeEvent.impactMultiplier;
    }

    // Add some randomness (+/- 10%)
    const randomFactor = 0.90 + Math.random() * 0.20;
    demandIndex *= randomFactor;

    // Calculate forecasted metrics
    const forecastedOccupancy = Math.min(98, Math.round(
      ((dowPattern.typicalOcc + monthPattern.typicalOcc) / 2) * demandIndex
    ));

    // ADR calculation based on demand
    const baseADR = 245;
    const forecastedADR = Math.round(baseADR * demandIndex);

    // Revenue calculation
    const roomsSold = Math.round(totalRooms * (forecastedOccupancy / 100));
    const forecastedRevenue = roomsSold * forecastedADR;

    // RevPAR
    const revPAR = Math.round(forecastedADR * (forecastedOccupancy / 100));

    // Demand classification
    let demandLevel;
    if (demandIndex >= 1.30) demandLevel = 'compression';
    else if (demandIndex >= 1.15) demandLevel = 'high';
    else if (demandIndex >= 0.95) demandLevel = 'normal';
    else if (demandIndex >= 0.75) demandLevel = 'low';
    else demandLevel = 'very_low';

    // Confidence score (higher for closer dates, lower for far out)
    const confidenceScore = Math.max(50, Math.min(95, 95 - (i * 0.5)));

    // Price recommendation
    let priceRecommendation;
    if (demandLevel === 'compression') {
      priceRecommendation = {
        action: 'maximize',
        adjustment: '+20-30%',
        message: 'Compression day - maximize rates, apply min stay restrictions',
      };
    } else if (demandLevel === 'high') {
      priceRecommendation = {
        action: 'increase',
        adjustment: '+10-18%',
        message: 'High demand expected - increase rates gradually',
      };
    } else if (demandLevel === 'normal') {
      priceRecommendation = {
        action: 'maintain',
        adjustment: '0%',
        message: 'Standard demand - maintain current pricing strategy',
      };
    } else if (demandLevel === 'low') {
      priceRecommendation = {
        action: 'stimulate',
        adjustment: '-5-10%',
        message: 'Soft demand - consider promotions or OTA boost',
      };
    } else {
      priceRecommendation = {
        action: 'aggressive_discount',
        adjustment: '-15-20%',
        message: 'Very low demand - activate discounts, remove restrictions',
      };
    }

    forecast[dateStr] = {
      date: dateStr,
      dayOfWeek,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      daysOut: i,
      event: activeEvent ? {
        name: activeEvent.name,
        type: activeEvent.type,
        impact: activeEvent.impactMultiplier,
      } : null,
      demandIndex: Math.round(demandIndex * 100) / 100,
      demandLevel,
      forecast: {
        occupancy: forecastedOccupancy,
        adr: forecastedADR,
        revPAR,
        roomsSold,
        revenue: forecastedRevenue,
      },
      confidenceScore: Math.round(confidenceScore),
      priceRecommendation,
      comparisonToLastYear: {
        occupancyVariance: Math.round((Math.random() - 0.3) * 20),
        adrVariance: Math.round((Math.random() - 0.2) * 15),
        revenueVariance: Math.round((Math.random() - 0.25) * 25),
      },
    };
  }

  return forecast;
}

// Calculate summary metrics
export function calculateForecastSummary(forecast) {
  const days = Object.values(forecast);

  const next7 = days.slice(0, 7);
  const next14 = days.slice(0, 14);
  const next30 = days.slice(0, 30);
  const next90 = days;

  const summarize = (arr) => ({
    avgOccupancy: Math.round(arr.reduce((s, d) => s + d.forecast.occupancy, 0) / arr.length),
    avgADR: Math.round(arr.reduce((s, d) => s + d.forecast.adr, 0) / arr.length),
    avgRevPAR: Math.round(arr.reduce((s, d) => s + d.forecast.revPAR, 0) / arr.length),
    totalRevenue: arr.reduce((s, d) => s + d.forecast.revenue, 0),
    highDemandDays: arr.filter(d => d.demandLevel === 'high' || d.demandLevel === 'compression').length,
    lowDemandDays: arr.filter(d => d.demandLevel === 'low' || d.demandLevel === 'very_low').length,
    compressionDays: arr.filter(d => d.demandLevel === 'compression').length,
    events: arr.filter(d => d.event).map(d => ({ date: d.date, ...d.event })),
  });

  return {
    next7Days: summarize(next7),
    next14Days: summarize(next14),
    next30Days: summarize(next30),
    next90Days: summarize(next90),
  };
}

// Get high-impact days (compression + high demand)
export function getHighImpactDays(forecast, limit = 10) {
  return Object.values(forecast)
    .filter(d => d.demandLevel === 'compression' || d.demandLevel === 'high')
    .sort((a, b) => b.demandIndex - a.demandIndex)
    .slice(0, limit);
}

// Get opportunity days (low demand that need attention)
export function getOpportunityDays(forecast, limit = 10) {
  return Object.values(forecast)
    .filter(d => d.demandLevel === 'low' || d.demandLevel === 'very_low')
    .filter(d => d.daysOut <= 30) // Focus on near-term
    .sort((a, b) => a.demandIndex - b.demandIndex)
    .slice(0, limit);
}

// Generate AI insights
export function generateForecastInsights(forecast) {
  const summary = calculateForecastSummary(forecast);
  const highImpact = getHighImpactDays(forecast, 5);
  const opportunities = getOpportunityDays(forecast, 5);

  const insights = [];

  // Compression day insights
  if (summary.next14Days.compressionDays > 0) {
    const compressionDays = Object.values(forecast)
      .filter(d => d.daysOut <= 14 && d.demandLevel === 'compression');

    insights.push({
      type: 'compression',
      severity: 'high',
      title: `${compressionDays.length} Compression Day${compressionDays.length > 1 ? 's' : ''} Detected`,
      message: `High demand expected on ${compressionDays.map(d => d.date.slice(5)).join(', ')}. Increase rates 20-30% and apply min-stay restrictions.`,
      dates: compressionDays.map(d => d.date),
      potentialRevenue: Math.round(compressionDays.length * 3500),
    });
  }

  // Weak days insights
  if (summary.next7Days.lowDemandDays > 2) {
    insights.push({
      type: 'weak_demand',
      severity: 'warning',
      title: 'Soft Demand in Next 7 Days',
      message: `${summary.next7Days.lowDemandDays} days showing below-average demand. Consider flash promotions or OTA rate boost.`,
      dates: opportunities.slice(0, 3).map(d => d.date),
      riskAmount: Math.round(summary.next7Days.lowDemandDays * 2000),
    });
  }

  // Event-based insights
  const upcomingEventDays = Object.values(forecast)
    .filter(d => d.event && d.daysOut <= 30);

  if (upcomingEventDays.length > 0) {
    const nextEvent = upcomingEventDays[0];
    insights.push({
      type: 'event',
      severity: 'info',
      title: `${nextEvent.event.name} Approaching`,
      message: `${nextEvent.event.type === 'holiday' ? 'Holiday' : 'Special'} period starting ${nextEvent.date}. Expected ${Math.round((nextEvent.event.impact - 1) * 100)}% demand increase.`,
      dates: upcomingEventDays.slice(0, 5).map(d => d.date),
    });
  }

  // ADR opportunity
  if (summary.next30Days.avgADR < 250) {
    insights.push({
      type: 'adr_opportunity',
      severity: 'medium',
      title: 'ADR Below Target',
      message: `30-day average ADR of $${summary.next30Days.avgADR} is below target. Review rate positioning on high-demand days.`,
      targetADR: 265,
      currentADR: summary.next30Days.avgADR,
    });
  }

  return insights;
}

export const sampleForecast = generateForecast();
export const forecastSummary = calculateForecastSummary(sampleForecast);
export const forecastInsights = generateForecastInsights(sampleForecast);
export const highImpactDays = getHighImpactDays(sampleForecast);
export const opportunityDays = getOpportunityDays(sampleForecast);

export default sampleForecast;
