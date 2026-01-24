// Bookings data for Glimmora CMS

const today = new Date();
const formatDate = (daysOffset) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const bookingsData = [
  { id: 'BK-001247', guest: 'James Rothwell', email: 'j.rothwell@email.com', phone: '+1 555-234-5678', checkIn: formatDate(0), checkOut: formatDate(3), nights: 3, roomType: 'Ocean Suite', room: '501', status: 'CONFIRMED', source: 'Booking.com', vip: true, amount: 1275, guests: 2, specialRequests: 'Ocean view', upsells: ['Spa Package'], createdAt: formatDate(-7) },
  { id: 'BK-001248', guest: 'Sofia Martinez', email: 'sofia.m@gmail.com', phone: '+34 612 345', checkIn: formatDate(0), checkOut: formatDate(5), nights: 5, roomType: 'Deluxe King', room: '302', status: 'CONFIRMED', source: 'Expedia', vip: false, amount: 1450, guests: 2, specialRequests: 'Quiet room', upsells: ['Breakfast'], createdAt: formatDate(-10) },
  { id: 'BK-001249', guest: 'Michael Chen', email: 'mchen@corp.com', phone: '+852 9123', checkIn: formatDate(0), checkOut: formatDate(2), nights: 2, roomType: 'Executive Suite', room: '601', status: 'CONFIRMED', source: 'Website', vip: true, amount: 890, guests: 1, specialRequests: 'Early check-in', upsells: [], createdAt: formatDate(-3) },
  { id: 'BK-001243', guest: 'Emily Johnson', email: 'emily.j@outlook.com', phone: '+1 555-876', checkIn: formatDate(-2), checkOut: formatDate(1), nights: 3, roomType: 'Premium Double', room: '204', status: 'CHECKED-IN', source: 'Website', vip: false, amount: 720, guests: 2, specialRequests: 'None', upsells: [], createdAt: formatDate(-14) },
  { id: 'BK-001244', guest: 'Alexander Weber', email: 'a.weber@biz.de', phone: '+49 171', checkIn: formatDate(-3), checkOut: formatDate(0), nights: 3, roomType: 'Wellness Suite', room: '503', status: 'CHECKED-IN', source: 'Booking.com', vip: true, amount: 1680, guests: 2, specialRequests: 'Massage', upsells: ['Wellness'], createdAt: formatDate(-20) },
  { id: 'BK-001240', guest: 'Rachel Green', email: 'rgreen@email.com', phone: '+1 555-567', checkIn: formatDate(-4), checkOut: formatDate(0), nights: 4, roomType: 'Standard King', room: '108', status: 'CHECKED-IN', source: 'Expedia', vip: false, amount: 680, guests: 1, specialRequests: 'Late checkout', upsells: [], createdAt: formatDate(-21) },
  { id: 'BK-001250', guest: 'David Thompson', email: 'd.thompson@co.uk', phone: '+44 7911', checkIn: formatDate(1), checkOut: formatDate(4), nights: 3, roomType: 'Ocean Suite', room: '502', status: 'CONFIRMED', source: 'Website', vip: true, amount: 1275, guests: 2, specialRequests: 'Champagne', upsells: ['Romance'], createdAt: formatDate(-5) },
  { id: 'BK-001251', guest: 'Nina Petrov', email: 'nina.p@mail.ru', phone: '+7 926', checkIn: formatDate(1), checkOut: formatDate(7), nights: 6, roomType: 'Family Suite', room: '401', status: 'CONFIRMED', source: 'Booking.com', vip: false, amount: 2340, guests: 4, specialRequests: 'Extra bed', upsells: ['Kids Club'], createdAt: formatDate(-8) },
  { id: 'BK-001252', guest: 'Robert Kim', email: 'rkim@tech.com', phone: '+82 10', checkIn: formatDate(2), checkOut: formatDate(4), nights: 2, roomType: 'Executive Suite', room: '602', status: 'CONFIRMED', source: 'Expedia', vip: true, amount: 890, guests: 1, specialRequests: 'Conference', upsells: [], createdAt: formatDate(-2) },
  { id: 'BK-001253', guest: 'Isabella Rossi', email: 'isabella@mail.it', phone: '+39 335', checkIn: formatDate(3), checkOut: formatDate(8), nights: 5, roomType: 'Premium Double', room: null, status: 'PENDING', source: 'Walk-in', vip: false, amount: 1200, guests: 2, specialRequests: 'Honeymoon', upsells: [], createdAt: formatDate(-1) },
  { id: 'BK-001254', guest: 'William Foster', email: 'wfoster@gmail.com', phone: '+1 555-111', checkIn: formatDate(4), checkOut: formatDate(6), nights: 2, roomType: 'Standard King', room: null, status: 'PENDING', source: 'Booking.com', vip: false, amount: 340, guests: 1, specialRequests: 'None', upsells: [], createdAt: formatDate(-1) },
  { id: 'BK-001255', guest: 'Charlotte Hughes', email: 'c.hughes@co.com', phone: '+1 555-333', checkIn: formatDate(5), checkOut: formatDate(9), nights: 4, roomType: 'Deluxe King', room: null, status: 'CONFIRMED', source: 'Website', vip: false, amount: 1160, guests: 2, specialRequests: 'Anniversary', upsells: [], createdAt: formatDate(-3) },
  { id: 'BK-001235', guest: 'George Anderson', email: 'ganderson@mail.com', phone: '+1 555-444', checkIn: formatDate(-7), checkOut: formatDate(-4), nights: 3, roomType: 'Ocean Suite', room: '501', status: 'CHECKED-OUT', source: 'Expedia', vip: true, amount: 1275, guests: 2, specialRequests: 'None', upsells: [], createdAt: formatDate(-30) },
  { id: 'BK-001236', guest: 'Sarah Mitchell', email: 'smitchell@corp.com', phone: '+1 555-666', checkIn: formatDate(-10), checkOut: formatDate(-7), nights: 3, roomType: 'Executive Suite', room: '601', status: 'CHECKED-OUT', source: 'Website', vip: true, amount: 1335, guests: 1, specialRequests: 'Work desk', upsells: [], createdAt: formatDate(-35) },
  { id: 'BK-001238', guest: 'John Williams', email: 'jwilliams@email.com', phone: '+1 555-888', checkIn: formatDate(2), checkOut: formatDate(5), nights: 3, roomType: 'Standard King', room: null, status: 'CANCELLED', source: 'Booking.com', vip: false, amount: 510, guests: 1, specialRequests: 'None', upsells: [], createdAt: formatDate(-12) }
];

export function getBookingById(id) { return bookingsData.find((b) => b.id === id); }
export function filterByStatus(bookings, status) { if (!status || status === 'all') return bookings; return bookings.filter((b) => b.status === status); }
export function filterBySource(bookings, source) { if (!source || source === 'all') return bookings; return bookings.filter((b) => b.source === source); }
export function getArrivalsToday(bookings) { const td = new Date().toISOString().split('T')[0]; return bookings.filter((b) => b.checkIn === td); }
export function getDeparturesToday(bookings) { const td = new Date().toISOString().split('T')[0]; return bookings.filter((b) => b.checkOut === td); }
export function searchBookings(bookings, query) { if (!query || query.trim() === '') return bookings; const s = query.toLowerCase().trim(); return bookings.filter((b) => b.id.toLowerCase().includes(s) || b.guest.toLowerCase().includes(s) || (b.room && b.room.toLowerCase().includes(s)) || b.roomType.toLowerCase().includes(s) || b.email.toLowerCase().includes(s)); }

export const statusConfig = {
  'CONFIRMED': { color: 'bg-[#5C9BA4]/10 text-[#5C9BA4] border-[#5C9BA4]/30', label: 'Confirmed' },
  'PENDING': { color: 'bg-[#CDB261]/20 text-[#CDB261] border-[#CDB261]/30', label: 'Pending' },
  'CHECKED-IN': { color: 'bg-[#4E5840]/10 text-[#4E5840] border-[#4E5840]/30', label: 'Checked In' },
  'CHECKED-OUT': { color: 'bg-neutral-200 text-neutral-700 border-neutral-300', label: 'Checked Out' },
  'CANCELLED': { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled' },
};

export const sourceConfig = {
  'Website': { color: 'bg-[#A57865]/10 text-[#A57865]', icon: '🌐' },
  'Booking.com': { color: 'bg-[#5C9BA4]/10 text-[#5C9BA4]', icon: '🏨' },
  'Expedia': { color: 'bg-[#CDB261]/20 text-[#CDB261]', icon: '✈️' },
  'Walk-in': { color: 'bg-neutral-100 text-neutral-700', icon: '🚶' },
  'CRS': { color: 'bg-[#7B68EE]/10 text-[#7B68EE]', icon: '💻' },
  'Dummy Channel Manager': { color: 'bg-[#7B68EE]/10 text-[#7B68EE]', icon: '💻' },
};
