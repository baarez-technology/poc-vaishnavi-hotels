/**
 * Sample Availability Data
 * 30-day availability grid with rates and restrictions
 */

const today = new Date();
// Use local date formatting to avoid timezone issues
const formatDate = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const roomTypes = [
  'Minimalist Studio',
  'Coastal Retreat',
  'Urban Oasis',
  'Sunset Vista',
  'Pacific Suite',
  'Wellness Suite',
  'Family Sanctuary',
  'Oceanfront Penthouse'
];

// Room counts match seed_database.py
const totalInventory = {
  'Minimalist Studio': 3,
  'Coastal Retreat': 3,
  'Urban Oasis': 4,
  'Sunset Vista': 4,
  'Pacific Suite': 3,
  'Wellness Suite': 2,
  'Family Sanctuary': 2,
  'Oceanfront Penthouse': 2
};

// Base rates match seed_database.py
const baseRates = {
  'Minimalist Studio': 180,
  'Coastal Retreat': 185,
  'Urban Oasis': 245,
  'Sunset Vista': 315,
  'Pacific Suite': 385,
  'Wellness Suite': 425,
  'Family Sanctuary': 485,
  'Oceanfront Penthouse': 750
};

// Generate 30 days of availability data
const generateAvailability = () => {
  const availability = {};

  for (let i = 0; i < 30; i++) {
    const date = formatDate(i);
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    availability[date] = {};

    roomTypes.forEach(roomType => {
      // Simulate varying availability based on date
      let soldRooms = Math.floor(Math.random() * (totalInventory[roomType] * 0.6));
      if (isWeekend) soldRooms = Math.floor(soldRooms * 1.3);
      if (i < 3) soldRooms = Math.floor(soldRooms * 1.2); // Higher occupancy near-term

      const available = Math.max(0, totalInventory[roomType] - soldRooms);

      // Dynamic pricing based on demand
      let rateMultiplier = 1;
      if (isWeekend) rateMultiplier += 0.15;
      if (available <= 2) rateMultiplier += 0.20; // Scarcity pricing
      if (i >= 20 && i <= 25) rateMultiplier += 0.10; // Event period

      const rate = Math.round(baseRates[roomType] * rateMultiplier);

      // Restrictions
      let minStay = 1;
      let cta = false;
      let ctd = false;
      let stopSell = false;
      let notes = '';

      // Apply restrictions for specific scenarios
      if (i >= 23 && i <= 26) {
        minStay = 2;
        notes = 'High demand period';
      }
      if (i === 14 || i === 15) {
        cta = true;
        notes = 'Conference event - CTA applied';
      }
      if (available === 0) {
        stopSell = true;
        notes = 'Sold out';
      }

      availability[date][roomType] = {
        date,
        roomType,
        totalInventory: totalInventory[roomType],
        available,
        sold: totalInventory[roomType] - available,
        rate,
        minStay,
        maxStay: 30,
        cta,
        ctd,
        stopSell,
        notes
      };
    });
  }

  return availability;
};

export const sampleAvailability = generateAvailability();

// Helper function to get availability for a specific date range
export function getAvailabilityForRange(startDate, endDate, roomType = null) {
  const result = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (sampleAvailability[dateStr]) {
      if (roomType) {
        result.push(sampleAvailability[dateStr][roomType]);
      } else {
        result.push(sampleAvailability[dateStr]);
      }
    }
  }

  return result;
}

// Helper function to check availability for booking
export function checkAvailability(checkIn, checkOut, roomType, roomsNeeded = 1) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  let isAvailable = true;
  let minAvailable = Infinity;
  let totalRate = 0;
  const issues = [];

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayData = sampleAvailability[dateStr]?.[roomType];

    if (!dayData) {
      isAvailable = false;
      issues.push(`No availability data for ${dateStr}`);
      continue;
    }

    if (dayData.stopSell) {
      isAvailable = false;
      issues.push(`Stop sell on ${dateStr}`);
    }

    if (dayData.cta) {
      isAvailable = false;
      issues.push(`Closed to arrival on ${dateStr}`);
    }

    if (dayData.available < roomsNeeded) {
      isAvailable = false;
      issues.push(`Only ${dayData.available} rooms available on ${dateStr}`);
    }

    minAvailable = Math.min(minAvailable, dayData.available);
    totalRate += dayData.rate;
  }

  return {
    isAvailable,
    minAvailable: minAvailable === Infinity ? 0 : minAvailable,
    totalRate,
    averageRate: totalRate / Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24))),
    issues
  };
}

// Get dates array for calendar display
export function getCalendarDates(daysCount = 30) {
  const dates = [];
  const currentDate = new Date();
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + i);
    // Use local date formatting to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push({
      date: `${year}-${month}-${day}`,
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayOfMonth: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isToday: i === 0
    });
  }
  return dates;
}

export const roomTypeColors = {
  'Minimalist Studio': 'bg-neutral-100 text-neutral-700',
  'Coastal Retreat': 'bg-[#5C9BA4]/10 text-[#5C9BA4]',
  'Urban Oasis': 'bg-[#4E5840]/10 text-[#4E5840]',
  'Sunset Vista': 'bg-[#CDB261]/10 text-[#CDB261]',
  'Pacific Suite': 'bg-[#A57865]/10 text-[#A57865]',
  'Wellness Suite': 'bg-emerald-100 text-emerald-700',
  'Family Sanctuary': 'bg-[#C8B29D]/20 text-[#A57865]',
  'Oceanfront Penthouse': 'bg-amber-100 text-amber-700'
};

export default sampleAvailability;
