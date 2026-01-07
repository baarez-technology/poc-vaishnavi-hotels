// Sample Rate History Data - 90 days of historical and future rates
// Room types with their base rates and rate codes

export const roomTypes = [
  { id: 'STD', name: 'Standard Room', baseRate: 189, maxOccupancy: 2 },
  { id: 'DLX', name: 'Deluxe Room', baseRate: 259, maxOccupancy: 2 },
  { id: 'SUP', name: 'Superior Suite', baseRate: 349, maxOccupancy: 3 },
  { id: 'EXE', name: 'Executive Suite', baseRate: 449, maxOccupancy: 4 },
  { id: 'PRS', name: 'Presidential Suite', baseRate: 789, maxOccupancy: 6 },
];

export const rateCodes = [
  { id: 'BAR', name: 'Best Available Rate', discount: 0 },
  { id: 'OTA', name: 'OTA Rate', discount: -15 }, // Higher for commission
  { id: 'CORP', name: 'Corporate Rate', discount: 20 },
  { id: 'AAA', name: 'AAA/CAA Rate', discount: 15 },
  { id: 'GOV', name: 'Government Rate', discount: 25 },
  { id: 'PKG', name: 'Package Rate', discount: 10 },
  { id: 'LNR', name: 'Last Night Rate', discount: 30 },
  { id: 'ADV', name: 'Advance Purchase', discount: 18 },
];

// Seasonality factors by month
export const seasonalityFactors = {
  1: 0.85,  // January - low season
  2: 0.90,  // February
  3: 1.00,  // March - spring break
  4: 1.05,  // April
  5: 1.10,  // May
  6: 1.25,  // June - high season
  7: 1.35,  // July - peak
  8: 1.30,  // August
  9: 1.10,  // September
  10: 1.00, // October
  11: 0.95, // November
  12: 1.40, // December - holiday peak
};

// Day of week factors
export const dayOfWeekFactors = {
  0: 0.85,  // Sunday
  1: 0.80,  // Monday
  2: 0.85,  // Tuesday
  3: 0.90,  // Wednesday
  4: 1.00,  // Thursday
  5: 1.20,  // Friday
  6: 1.25,  // Saturday
};

// Special events that affect pricing
export const specialEvents = [
  { date: '2025-12-24', name: 'Christmas Eve', factor: 1.45 },
  { date: '2025-12-25', name: 'Christmas Day', factor: 1.50 },
  { date: '2025-12-31', name: 'New Year\'s Eve', factor: 1.60 },
  { date: '2026-01-01', name: 'New Year\'s Day', factor: 1.40 },
  { date: '2025-12-20', name: 'Holiday Rush Start', factor: 1.25 },
  { date: '2025-12-21', name: 'Holiday Rush', factor: 1.30 },
  { date: '2025-12-22', name: 'Holiday Rush', factor: 1.35 },
  { date: '2025-12-23', name: 'Holiday Rush', factor: 1.40 },
  { date: '2025-12-26', name: 'Boxing Day', factor: 1.20 },
  { date: '2025-12-27', name: 'Post-Holiday', factor: 1.15 },
  { date: '2025-12-28', name: 'Weekend Rush', factor: 1.25 },
  { date: '2025-12-29', name: 'NYE Leadup', factor: 1.30 },
  { date: '2025-12-30', name: 'NYE Leadup', factor: 1.45 },
];

// Generate 90 days of rate calendar data
export function generateRateCalendar(startDate = new Date()) {
  const calendar = {};
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();
    const seasonFactor = seasonalityFactors[month] || 1.0;
    const dowFactor = dayOfWeekFactors[dayOfWeek] || 1.0;

    // Check for special events
    const event = specialEvents.find(e => e.date === dateStr);
    const eventFactor = event ? event.factor : 1.0;

    // Calculate lead time factor (closer dates = higher prices if high demand)
    const daysOut = i;
    const leadTimeFactor = daysOut <= 3 ? 1.15 : daysOut <= 7 ? 1.05 : daysOut <= 14 ? 1.0 : 0.95;

    // Random occupancy simulation (higher on weekends, events)
    const baseOccupancy = 0.55 + (Math.random() * 0.25);
    const occupancy = Math.min(0.98, baseOccupancy * dowFactor * eventFactor);

    calendar[dateStr] = {
      date: dateStr,
      dayOfWeek,
      event: event?.name || null,
      seasonFactor,
      dowFactor,
      eventFactor,
      leadTimeFactor,
      occupancy: Math.round(occupancy * 100),
      rooms: {}
    };

    // Generate rates for each room type
    roomTypes.forEach(room => {
      const combinedFactor = seasonFactor * dowFactor * eventFactor;
      const dynamicRate = Math.round(room.baseRate * combinedFactor);

      // Calculate rates for different rate codes
      const rates = {};
      rateCodes.forEach(code => {
        const discountMultiplier = 1 - (code.discount / 100);
        rates[code.id] = Math.round(dynamicRate * discountMultiplier);
      });

      // Random availability (based on occupancy)
      const totalRooms = room.id === 'STD' ? 25 : room.id === 'DLX' ? 20 : room.id === 'SUP' ? 15 : room.id === 'EXE' ? 8 : 2;
      const soldRooms = Math.round(totalRooms * occupancy);
      const available = totalRooms - soldRooms;

      // Random restrictions
      const restrictions = {
        CTA: occupancy > 0.9 ? true : false, // Closed to arrival on high occupancy
        CTD: false,
        minStay: occupancy > 0.85 && (dayOfWeek === 5 || dayOfWeek === 6) ? 2 : 1,
        maxStay: 14,
        stopSell: available <= 0,
      };

      calendar[dateStr].rooms[room.id] = {
        roomTypeId: room.id,
        roomTypeName: room.name,
        baseRate: room.baseRate,
        dynamicRate,
        rates,
        totalInventory: totalRooms,
        sold: soldRooms,
        available,
        restrictions,
        overrideRate: null,
        overrideReason: null,
      };
    });
  }

  return calendar;
}

// Generate initial rate calendar
export const sampleRateCalendar = generateRateCalendar();

export default sampleRateCalendar;
