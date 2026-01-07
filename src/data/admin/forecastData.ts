/**
 * Forecast Data - AI-predicted revenue, occupancy, and demand
 */

// Generate next 30 days forecast
const generateForecastData = () => {
  const data = [];
  const today = new Date();

  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // Simulate forecasted patterns with confidence intervals
    const baseRevenue = 16500;
    const trendFactor = 1 + (i / 100); // Growing trend
    const seasonalFactor = 1 + (Math.sin(i / 7) * 0.15);
    const revenue = Math.round(baseRevenue * trendFactor * seasonalFactor);

    const rooms = Math.round(55 + (i * 0.3) + (Math.random() * 10));
    const occupancy = Math.round((rooms / 80) * 100);
    const adr = Math.round(revenue / rooms);

    // Confidence intervals (upper and lower bounds)
    const confidenceFactor = 0.12;
    const lowerBound = Math.round(revenue * (1 - confidenceFactor));
    const upperBound = Math.round(revenue * (1 + confidenceFactor));

    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      forecastRevenue: revenue,
      lowerBound: lowerBound,
      upperBound: upperBound,
      forecastRooms: rooms,
      forecastOccupancy: occupancy,
      forecastADR: adr,
      forecastRevPAR: Math.round(revenue / 80),
      confidence: Math.round(85 + (Math.random() * 10)) // 85-95% confidence
    });
  }

  return data;
};

export const forecastData = generateForecastData();

// Forecast summary
export const forecastSummary = {
  projectedRevenue: forecastData.reduce((sum, day) => sum + day.forecastRevenue, 0),
  avgForecastADR: Math.round(forecastData.reduce((sum, day) => sum + day.forecastADR, 0) / forecastData.length),
  avgForecastOccupancy: Math.round(forecastData.reduce((sum, day) => sum + day.forecastOccupancy, 0) / forecastData.length),
  avgConfidence: Math.round(forecastData.reduce((sum, day) => sum + day.confidence, 0) / forecastData.length)
};

// Demand indicators
export const demandIndicators = [
  { period: 'Next 7 Days', demand: 'High', color: 'red', percentage: 88 },
  { period: 'Next 14 Days', demand: 'Medium-High', color: 'amber', percentage: 76 },
  { period: 'Next 30 Days', demand: 'Medium', color: 'green', percentage: 65 }
];
