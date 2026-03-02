/**
 * Revenue Data - Historical and current revenue metrics
 */

// Generate last 30 days of revenue data
const generateRevenueData = () => {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate seasonal patterns with some randomness
    const baseRevenue = 1245000;
    const seasonalFactor = 1 + (Math.sin(i / 7) * 0.2); // Weekly pattern
    const randomFactor = 0.85 + (Math.random() * 0.3);

    const revenue = Math.round(baseRevenue * seasonalFactor * randomFactor);
    const rooms = Math.round(50 + (Math.random() * 30));
    const adr = Math.round(revenue / rooms);
    const occupancy = Math.round((rooms / 80) * 100);

    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: revenue,
      rooms: rooms,
      adr: adr,
      occupancy: occupancy,
      revpar: Math.round(revenue / 80) // Total rooms = 80
    });
  }

  return data;
};

export const revenueData = generateRevenueData();

// Calculate summary metrics
export const revenueSummary = {
  totalRevenue: revenueData.reduce((sum, day) => sum + day.revenue, 0),
  avgADR: Math.round(revenueData.reduce((sum, day) => sum + day.adr, 0) / revenueData.length),
  avgOccupancy: Math.round(revenueData.reduce((sum, day) => sum + day.occupancy, 0) / revenueData.length),
  avgRevPAR: Math.round(revenueData.reduce((sum, day) => sum + day.revpar, 0) / revenueData.length),
  totalRoomsSold: revenueData.reduce((sum, day) => sum + day.rooms, 0)
};

// Year-over-year comparison
export const yoyComparison = {
  revenueGrowth: 12.5, // %
  adrGrowth: 8.3, // %
  occupancyGrowth: 3.8, // %
  revparGrowth: 11.2 // %
};
