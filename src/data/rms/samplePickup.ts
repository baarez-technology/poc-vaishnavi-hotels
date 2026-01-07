// Sample Pickup/Booking Pace Data
// Tracks how bookings are accumulating over time for future dates

// Generate pickup data for the next 90 days
export function generatePickupData(startDate = new Date()) {
  const pickupData = {};
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const arrivalDate = new Date(today);
    arrivalDate.setDate(today.getDate() + i);
    const arrivalDateStr = arrivalDate.toISOString().split('T')[0];

    // Days until arrival
    const daysOut = i;

    // Expected total bookings (higher for closer dates, weekends)
    const dayOfWeek = arrivalDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const expectedTotal = isWeekend ? Math.round(55 + Math.random() * 15) : Math.round(40 + Math.random() * 15);

    // Calculate current bookings based on typical booking curve
    // Closer dates have more bookings already
    let bookingProgress;
    if (daysOut <= 0) bookingProgress = 0.98;
    else if (daysOut <= 3) bookingProgress = 0.85 + Math.random() * 0.10;
    else if (daysOut <= 7) bookingProgress = 0.65 + Math.random() * 0.15;
    else if (daysOut <= 14) bookingProgress = 0.45 + Math.random() * 0.15;
    else if (daysOut <= 30) bookingProgress = 0.25 + Math.random() * 0.15;
    else if (daysOut <= 60) bookingProgress = 0.10 + Math.random() * 0.10;
    else bookingProgress = 0.02 + Math.random() * 0.08;

    const currentBookings = Math.round(expectedTotal * bookingProgress);

    // Generate historical pickup snapshots (last 7 days of pickup for this date)
    const pickupHistory = [];
    for (let d = 7; d >= 0; d--) {
      const snapshotDate = new Date(today);
      snapshotDate.setDate(today.getDate() - d);
      const snapshotDaysOut = daysOut + d;

      // Calculate what bookings would have been d days ago
      let historicalProgress;
      if (snapshotDaysOut <= 0) historicalProgress = 0.98;
      else if (snapshotDaysOut <= 3) historicalProgress = 0.82 + Math.random() * 0.08;
      else if (snapshotDaysOut <= 7) historicalProgress = 0.60 + Math.random() * 0.12;
      else if (snapshotDaysOut <= 14) historicalProgress = 0.40 + Math.random() * 0.12;
      else if (snapshotDaysOut <= 30) historicalProgress = 0.20 + Math.random() * 0.12;
      else if (snapshotDaysOut <= 60) historicalProgress = 0.08 + Math.random() * 0.08;
      else historicalProgress = 0.01 + Math.random() * 0.05;

      const historicalBookings = Math.round(expectedTotal * historicalProgress);

      pickupHistory.push({
        snapshotDate: snapshotDate.toISOString().split('T')[0],
        daysOut: snapshotDaysOut,
        bookingsAtSnapshot: Math.min(historicalBookings, currentBookings),
      });
    }

    // Calculate daily pickup (new bookings per day)
    const dailyPickup = pickupHistory.map((snapshot, idx) => {
      if (idx === 0) return { ...snapshot, newBookings: snapshot.bookingsAtSnapshot };
      return {
        ...snapshot,
        newBookings: Math.max(0, snapshot.bookingsAtSnapshot - pickupHistory[idx - 1].bookingsAtSnapshot),
      };
    });

    // Last year same date comparison (simulated)
    const lyBookings = Math.round(expectedTotal * (0.85 + Math.random() * 0.3));
    const lyProgress = Math.min(1, bookingProgress * (0.9 + Math.random() * 0.2));

    // Last week comparison
    const lwBookings = Math.round(currentBookings * (0.92 + Math.random() * 0.16));

    // Predicted final pickup
    const predictedFinal = Math.round(currentBookings / bookingProgress);

    // Pickup pace classification
    let paceStatus;
    const paceRatio = currentBookings / (lyBookings * lyProgress);
    if (paceRatio >= 1.15) paceStatus = 'strong';
    else if (paceRatio >= 0.95) paceStatus = 'on-pace';
    else if (paceRatio >= 0.80) paceStatus = 'slow';
    else paceStatus = 'critical';

    pickupData[arrivalDateStr] = {
      arrivalDate: arrivalDateStr,
      daysOut,
      dayOfWeek,
      isWeekend,
      currentBookings,
      expectedTotal,
      predictedFinal,
      remainingToSell: expectedTotal - currentBookings,
      bookingProgress: Math.round(bookingProgress * 100),
      pickupHistory,
      dailyPickup,
      comparisons: {
        lastYear: {
          bookings: Math.round(lyBookings * lyProgress),
          finalTotal: lyBookings,
          variance: Math.round(((currentBookings / (lyBookings * lyProgress)) - 1) * 100),
        },
        lastWeek: {
          bookings: lwBookings,
          variance: Math.round(((currentBookings / lwBookings) - 1) * 100),
        },
      },
      paceStatus,
      alerts: generatePickupAlerts(daysOut, paceStatus, currentBookings, expectedTotal),
    };
  }

  return pickupData;
}

function generatePickupAlerts(daysOut, paceStatus, current, expected) {
  const alerts = [];

  if (paceStatus === 'strong' && daysOut <= 14) {
    alerts.push({
      type: 'opportunity',
      severity: 'high',
      message: `Strong pickup - consider raising rates ${daysOut <= 7 ? '10-15%' : '5-10%'}`,
    });
  }

  if (paceStatus === 'critical' && daysOut <= 21) {
    alerts.push({
      type: 'warning',
      severity: 'high',
      message: 'Critical pace - activate promotions or lower rates immediately',
    });
  }

  if (paceStatus === 'slow' && daysOut <= 14) {
    alerts.push({
      type: 'warning',
      severity: 'medium',
      message: 'Below pace - consider OTA boost or flash sale',
    });
  }

  if (current / expected < 0.5 && daysOut <= 7) {
    alerts.push({
      type: 'urgent',
      severity: 'critical',
      message: 'Occupancy gap within 7 days - last-minute pricing needed',
    });
  }

  if (current / expected > 0.90 && daysOut > 7) {
    alerts.push({
      type: 'success',
      severity: 'info',
      message: 'Nearly sold out with time remaining - maximize rates',
    });
  }

  return alerts;
}

// Aggregated pickup metrics
export function calculatePickupMetrics(pickupData) {
  const dates = Object.values(pickupData);

  const next7Days = dates.filter(d => d.daysOut <= 7);
  const next14Days = dates.filter(d => d.daysOut <= 14);
  const next30Days = dates.filter(d => d.daysOut <= 30);

  const calculateAvg = (arr, key) => {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((sum, d) => sum + d[key], 0) / arr.length);
  };

  return {
    next7Days: {
      avgBookings: calculateAvg(next7Days, 'currentBookings'),
      avgProgress: calculateAvg(next7Days, 'bookingProgress'),
      totalRemaining: next7Days.reduce((sum, d) => sum + d.remainingToSell, 0),
      strongDays: next7Days.filter(d => d.paceStatus === 'strong').length,
      criticalDays: next7Days.filter(d => d.paceStatus === 'critical').length,
    },
    next14Days: {
      avgBookings: calculateAvg(next14Days, 'currentBookings'),
      avgProgress: calculateAvg(next14Days, 'bookingProgress'),
      totalRemaining: next14Days.reduce((sum, d) => sum + d.remainingToSell, 0),
      strongDays: next14Days.filter(d => d.paceStatus === 'strong').length,
      criticalDays: next14Days.filter(d => d.paceStatus === 'critical').length,
    },
    next30Days: {
      avgBookings: calculateAvg(next30Days, 'currentBookings'),
      avgProgress: calculateAvg(next30Days, 'bookingProgress'),
      totalRemaining: next30Days.reduce((sum, d) => sum + d.remainingToSell, 0),
      strongDays: next30Days.filter(d => d.paceStatus === 'strong').length,
      criticalDays: next30Days.filter(d => d.paceStatus === 'critical').length,
    },
    alerts: dates.flatMap(d => d.alerts).filter(a => a.severity === 'critical' || a.severity === 'high'),
  };
}

export const samplePickupData = generatePickupData();
export const pickupMetrics = calculatePickupMetrics(samplePickupData);

export default samplePickupData;
