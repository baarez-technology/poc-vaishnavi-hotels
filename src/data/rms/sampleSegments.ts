// Sample Segmentation Data
// Performance metrics by guest/booking segment

export const segments = [
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Business travelers with negotiated rates',
    icon: 'Briefcase',
    color: '#4E5840',
    rateCodes: ['CORP', 'GOV'],
  },
  {
    id: 'ota',
    name: 'OTA',
    description: 'Online Travel Agency bookings',
    icon: 'Globe',
    color: '#5C9BA4',
    rateCodes: ['OTA'],
    channels: ['Booking.com', 'Expedia', 'Agoda', 'Hotels.com'],
  },
  {
    id: 'direct',
    name: 'Direct Web',
    description: 'Website and direct channel bookings',
    icon: 'Monitor',
    color: '#A57865',
    rateCodes: ['BAR', 'ADV', 'PKG'],
  },
  {
    id: 'longstay',
    name: 'Long Stay',
    description: 'Extended stay guests (7+ nights)',
    icon: 'Calendar',
    color: '#CDB261',
    minNights: 7,
  },
  {
    id: 'repeat',
    name: 'Repeat Guests',
    description: 'Returning guests with booking history',
    icon: 'UserCheck',
    color: '#8E6554',
    loyaltyTiers: ['Silver', 'Gold', 'Platinum'],
  },
  {
    id: 'groups',
    name: 'Groups',
    description: 'Group bookings and events',
    icon: 'Users',
    color: '#6B7280',
    minRooms: 5,
  },
];

// Generate segment performance data
export function generateSegmentPerformance(startDate = new Date()) {
  const performance = {};
  const today = new Date(startDate);

  // Generate last 12 months of data for trend analysis
  const monthlyData = [];
  for (let m = 11; m >= 0; m--) {
    const monthDate = new Date(today);
    monthDate.setMonth(today.getMonth() - m);
    const monthStr = monthDate.toISOString().slice(0, 7);

    const monthData = { month: monthStr, segments: {} };

    segments.forEach(segment => {
      // Base values vary by segment
      const baseMetrics = getSegmentBaseMetrics(segment.id);

      // Add monthly variance
      const variance = 0.85 + Math.random() * 0.30;

      monthData.segments[segment.id] = {
        revenue: Math.round(baseMetrics.revenue * variance),
        roomNights: Math.round(baseMetrics.roomNights * variance),
        bookings: Math.round(baseMetrics.bookings * variance),
        adr: Math.round(baseMetrics.adr * (0.95 + Math.random() * 0.10)),
        cancellations: Math.round(baseMetrics.bookings * variance * baseMetrics.cancelRate),
      };
    });

    monthlyData.push(monthData);
  }

  // Current period metrics (MTD and YTD)
  segments.forEach(segment => {
    const baseMetrics = getSegmentBaseMetrics(segment.id);

    // MTD (current month progress ~60%)
    const mtdProgress = 0.55 + Math.random() * 0.15;

    // Calculate totals from monthly data
    const yearlyTotals = monthlyData.reduce((acc, month) => {
      const segData = month.segments[segment.id];
      return {
        revenue: acc.revenue + segData.revenue,
        roomNights: acc.roomNights + segData.roomNights,
        bookings: acc.bookings + segData.bookings,
        cancellations: acc.cancellations + segData.cancellations,
      };
    }, { revenue: 0, roomNights: 0, bookings: 0, cancellations: 0 });

    const ytdADR = Math.round(yearlyTotals.revenue / yearlyTotals.roomNights);

    // Booking pace metrics
    const avgLeadTime = getSegmentLeadTime(segment.id);
    const bookingPace = 0.90 + Math.random() * 0.20;

    // Revenue contribution
    const totalPropertyRevenue = segments.reduce((sum, s) => {
      const metrics = getSegmentBaseMetrics(s.id);
      return sum + (metrics.revenue * 12);
    }, 0);

    const revenueContribution = (yearlyTotals.revenue / totalPropertyRevenue) * 100;

    // YoY comparison
    const yoyVariance = -5 + Math.random() * 20;

    performance[segment.id] = {
      segmentId: segment.id,
      segmentName: segment.name,
      segmentColor: segment.color,
      icon: segment.icon,

      // Current Period
      mtd: {
        revenue: Math.round(baseMetrics.revenue * mtdProgress),
        roomNights: Math.round(baseMetrics.roomNights * mtdProgress),
        bookings: Math.round(baseMetrics.bookings * mtdProgress),
        adr: baseMetrics.adr,
        revPAR: Math.round(baseMetrics.adr * 0.72),
      },

      // Year to Date
      ytd: {
        revenue: yearlyTotals.revenue,
        roomNights: yearlyTotals.roomNights,
        bookings: yearlyTotals.bookings,
        adr: ytdADR,
        revPAR: Math.round(ytdADR * 0.70),
        cancellations: yearlyTotals.cancellations,
        cancelRate: Math.round((yearlyTotals.cancellations / yearlyTotals.bookings) * 100),
      },

      // Performance Metrics
      metrics: {
        revenueContribution: Math.round(revenueContribution * 10) / 10,
        avgLeadTime,
        avgLOS: getSegmentLOS(segment.id),
        bookingPace: Math.round(bookingPace * 100),
        yoyVariance: Math.round(yoyVariance * 10) / 10,
      },

      // Trends (last 12 months)
      monthlyTrend: monthlyData.map(m => ({
        month: m.month,
        ...m.segments[segment.id],
      })),

      // Optimization suggestions
      optimizations: generateSegmentOptimizations(segment.id, {
        cancelRate: baseMetrics.cancelRate,
        bookingPace,
        revenueContribution,
        yoyVariance,
      }),
    };
  });

  return performance;
}

function getSegmentBaseMetrics(segmentId) {
  const metrics = {
    corporate: { revenue: 125000, roomNights: 480, bookings: 320, adr: 260, cancelRate: 0.08 },
    ota: { revenue: 185000, roomNights: 820, bookings: 650, adr: 226, cancelRate: 0.18 },
    direct: { revenue: 145000, roomNights: 520, bookings: 380, adr: 279, cancelRate: 0.10 },
    longstay: { revenue: 78000, roomNights: 380, bookings: 45, adr: 205, cancelRate: 0.05 },
    repeat: { revenue: 95000, roomNights: 340, bookings: 220, adr: 280, cancelRate: 0.06 },
    groups: { revenue: 112000, roomNights: 560, bookings: 28, adr: 200, cancelRate: 0.12 },
  };
  return metrics[segmentId] || metrics.direct;
}

function getSegmentLeadTime(segmentId) {
  const leadTimes = {
    corporate: 8,
    ota: 12,
    direct: 21,
    longstay: 35,
    repeat: 18,
    groups: 45,
  };
  return leadTimes[segmentId] || 14;
}

function getSegmentLOS(segmentId) {
  const los = {
    corporate: 1.8,
    ota: 2.2,
    direct: 2.5,
    longstay: 10.5,
    repeat: 2.8,
    groups: 2.4,
  };
  return los[segmentId] || 2.0;
}

function generateSegmentOptimizations(segmentId, metrics) {
  const optimizations = [];

  if (metrics.cancelRate > 0.15) {
    optimizations.push({
      type: 'reduce_cancellations',
      priority: 'high',
      message: 'High cancellation rate - consider stricter policies or deposits',
      action: 'Implement 48hr cancellation policy or require deposit',
    });
  }

  if (metrics.bookingPace < 0.85) {
    optimizations.push({
      type: 'boost_pace',
      priority: 'medium',
      message: 'Booking pace below target - activate promotions',
      action: 'Launch targeted campaign or adjust rate positioning',
    });
  }

  if (metrics.revenueContribution < 10 && segmentId !== 'groups') {
    optimizations.push({
      type: 'grow_segment',
      priority: 'low',
      message: 'Low revenue contribution - opportunity for growth',
      action: 'Review rate competitiveness and marketing spend',
    });
  }

  if (metrics.yoyVariance < 0) {
    optimizations.push({
      type: 'reverse_decline',
      priority: 'high',
      message: `Segment declining ${Math.abs(metrics.yoyVariance).toFixed(1)}% YoY`,
      action: 'Analyze competitor activity and adjust strategy',
    });
  }

  if (segmentId === 'ota' && metrics.revenueContribution > 30) {
    optimizations.push({
      type: 'reduce_ota_dependency',
      priority: 'medium',
      message: 'High OTA dependency - commission costs impacting margin',
      action: 'Invest in direct booking incentives and website optimization',
    });
  }

  if (segmentId === 'direct' && metrics.revenueContribution < 25) {
    optimizations.push({
      type: 'grow_direct',
      priority: 'high',
      message: 'Direct channel underperforming - improve conversion',
      action: 'Enhance booking engine, add best rate guarantee',
    });
  }

  return optimizations;
}

// Segment comparison analysis
export function getSegmentComparison(performance) {
  const segments = Object.values(performance);

  // Sort by revenue contribution
  const byRevenue = [...segments].sort((a, b) =>
    b.metrics.revenueContribution - a.metrics.revenueContribution
  );

  // Sort by ADR
  const byADR = [...segments].sort((a, b) => b.ytd.adr - a.ytd.adr);

  // Sort by growth
  const byGrowth = [...segments].sort((a, b) =>
    b.metrics.yoyVariance - a.metrics.yoyVariance
  );

  // Calculate totals
  const totals = segments.reduce((acc, seg) => ({
    revenue: acc.revenue + seg.ytd.revenue,
    roomNights: acc.roomNights + seg.ytd.roomNights,
    bookings: acc.bookings + seg.ytd.bookings,
    cancellations: acc.cancellations + seg.ytd.cancellations,
  }), { revenue: 0, roomNights: 0, bookings: 0, cancellations: 0 });

  return {
    byRevenue,
    byADR,
    byGrowth,
    totals,
    overallADR: Math.round(totals.revenue / totals.roomNights),
    overallCancelRate: Math.round((totals.cancellations / totals.bookings) * 100),
    topPerformer: byRevenue[0],
    fastestGrowing: byGrowth[0],
    needsAttention: byGrowth.filter(s => s.metrics.yoyVariance < 0),
  };
}

export const sampleSegmentPerformance = generateSegmentPerformance();
export const segmentComparison = getSegmentComparison(sampleSegmentPerformance);

export default sampleSegmentPerformance;
