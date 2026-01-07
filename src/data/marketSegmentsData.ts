/**
 * Market Segments Data - Revenue distribution by customer segment
 */

export const marketSegmentsData = [
  {
    id: 'corporate',
    name: 'Corporate',
    revenue: 185000,
    rooms: 820,
    percentage: 42,
    adr: 226,
    color: '#2563eb' // primary blue
  },
  {
    id: 'leisure',
    name: 'Leisure',
    revenue: 142000,
    rooms: 950,
    percentage: 32,
    adr: 149,
    color: '#7c3aed' // aurora purple
  },
  {
    id: 'group',
    name: 'Group',
    revenue: 78000,
    rooms: 520,
    percentage: 18,
    adr: 150,
    color: '#f59e0b' // sunset amber
  },
  {
    id: 'other',
    name: 'Other',
    revenue: 35000,
    rooms: 210,
    percentage: 8,
    adr: 167,
    color: '#6b7280' // neutral gray
  }
];

// Segment performance metrics
export const segmentPerformance = [
  {
    segment: 'Corporate',
    currentMonth: 185000,
    lastMonth: 172000,
    growth: 7.6,
    trend: 'up',
    forecast: 195000
  },
  {
    segment: 'Leisure',
    currentMonth: 142000,
    lastMonth: 138000,
    growth: 2.9,
    trend: 'up',
    forecast: 148000
  },
  {
    segment: 'Group',
    currentMonth: 78000,
    lastMonth: 82000,
    growth: -4.9,
    trend: 'down',
    forecast: 76000
  },
  {
    segment: 'Other',
    currentMonth: 35000,
    lastMonth: 33000,
    growth: 6.1,
    trend: 'up',
    forecast: 37000
  }
];

export const getTotalRevenue = () => {
  return marketSegmentsData.reduce((sum, segment) => sum + segment.revenue, 0);
};

export const getTopSegment = () => {
  return marketSegmentsData.reduce((max, segment) =>
    segment.revenue > max.revenue ? segment : max
  );
};
