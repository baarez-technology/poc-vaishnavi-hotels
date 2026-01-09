/**
 * Sample CBS Bookings Data
 * 20 realistic hotel bookings with various statuses
 */

const today = new Date();
const formatDate = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const sampleBookings = [
  {
    id: 'CBS-001',
    guestName: 'Alexandra Sterling',
    guestEmail: 'alexandra.sterling@email.com',
    guestPhone: '+1 (555) 234-5678',
    isVip: true,
    checkIn: formatDate(0),
    checkOut: formatDate(3),
    nights: 3,
    roomType: 'Oceanfront Penthouse',
    roomNumber: '301',
    ratePlan: 'BAR',
    adults: 2,
    children: 0,
    status: 'CONFIRMED',
    source: 'Direct',
    amount: 1200,
    amountPaid: 600,
    balance: 600,
    specialRequests: 'Late check-out requested, champagne on arrival',
    createdAt: formatDate(-7),
    createdBy: 'Front Desk',
    payments: [
      { id: 'PAY-001', date: formatDate(-7), amount: 600, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-7), action: 'Booking created', user: 'Front Desk' },
      { date: formatDate(-5), action: 'Rate plan updated from Corporate to BAR', user: 'Revenue Manager' }
    ]
  },
  {
    id: 'CBS-002',
    guestName: 'Marcus Chen',
    guestEmail: 'marcus.chen@business.com',
    guestPhone: '+1 (555) 345-6789',
    isVip: false,
    checkIn: formatDate(0),
    checkOut: formatDate(2),
    nights: 2,
    roomType: 'Pacific Suite',
    roomNumber: null,
    ratePlan: 'Corporate',
    adults: 1,
    children: 0,
    status: 'PENDING',
    source: 'Booking.com',
    amount: 360,
    amountPaid: 0,
    balance: 360,
    specialRequests: 'Early check-in if possible',
    createdAt: formatDate(-3),
    createdBy: 'Channel Manager',
    payments: [],
    activityLog: [
      { date: formatDate(-3), action: 'Booking imported from Booking.com', user: 'System' }
    ]
  },
  {
    id: 'CBS-003',
    guestName: 'Emily Watson',
    guestEmail: 'emily.watson@email.com',
    guestPhone: '+1 (555) 456-7890',
    isVip: true,
    checkIn: formatDate(-1),
    checkOut: formatDate(2),
    nights: 3,
    roomType: 'Sunset Vista',
    roomNumber: '502',
    ratePlan: 'BAR',
    adults: 2,
    children: 1,
    status: 'CHECKED-IN',
    source: 'Direct',
    amount: 750,
    amountPaid: 750,
    balance: 0,
    specialRequests: 'Crib in room, ground floor preferred',
    createdAt: formatDate(-10),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-002', date: formatDate(-10), amount: 750, method: 'Bank Transfer', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-10), action: 'Booking created', user: 'Reservations' },
      { date: formatDate(-1), action: 'Guest checked in', user: 'Front Desk' }
    ]
  },
  {
    id: 'CBS-004',
    guestName: 'Robert Mitchell',
    guestEmail: 'robert.m@company.org',
    guestPhone: '+1 (555) 567-8901',
    isVip: false,
    checkIn: formatDate(1),
    checkOut: formatDate(4),
    nights: 3,
    roomType: 'Minimalist Studio',
    roomNumber: '101',
    ratePlan: 'Corporate',
    adults: 1,
    children: 0,
    status: 'CONFIRMED',
    source: 'Expedia',
    amount: 360,
    amountPaid: 360,
    balance: 0,
    specialRequests: 'None',
    createdAt: formatDate(-5),
    createdBy: 'Channel Manager',
    payments: [
      { id: 'PAY-003', date: formatDate(-5), amount: 360, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-5), action: 'Booking imported from Expedia', user: 'System' }
    ]
  },
  {
    id: 'CBS-005',
    guestName: 'Jennifer Adams',
    guestEmail: 'jadams@gmail.com',
    guestPhone: '+1 (555) 678-9012',
    isVip: false,
    checkIn: formatDate(1),
    checkOut: formatDate(2),
    nights: 1,
    roomType: 'Pacific Suite',
    roomNumber: null,
    ratePlan: 'OTA',
    adults: 2,
    children: 0,
    status: 'PENDING',
    source: 'Hotels.com',
    amount: 180,
    amountPaid: 0,
    balance: 180,
    specialRequests: 'King bed preferred',
    createdAt: formatDate(-1),
    createdBy: 'Channel Manager',
    payments: [],
    activityLog: [
      { date: formatDate(-1), action: 'Booking imported from Hotels.com', user: 'System' }
    ]
  },
  {
    id: 'CBS-006',
    guestName: 'David Kim',
    guestEmail: 'david.kim@tech.io',
    guestPhone: '+1 (555) 789-0123',
    isVip: true,
    checkIn: formatDate(-2),
    checkOut: formatDate(0),
    nights: 2,
    roomType: 'Oceanfront Penthouse',
    roomNumber: '701',
    ratePlan: 'BAR',
    adults: 2,
    children: 0,
    status: 'CHECKED-OUT',
    source: 'Direct',
    amount: 800,
    amountPaid: 800,
    balance: 0,
    specialRequests: 'Airport transfer arranged',
    createdAt: formatDate(-14),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-004', date: formatDate(-14), amount: 400, method: 'Credit Card', status: 'completed' },
      { id: 'PAY-005', date: formatDate(0), amount: 400, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-14), action: 'Booking created', user: 'Reservations' },
      { date: formatDate(-2), action: 'Guest checked in', user: 'Front Desk' },
      { date: formatDate(0), action: 'Guest checked out', user: 'Front Desk' }
    ]
  },
  {
    id: 'CBS-007',
    guestName: 'Sarah Johnson',
    guestEmail: 'sarah.j@email.com',
    guestPhone: '+1 (555) 890-1234',
    isVip: false,
    checkIn: formatDate(2),
    checkOut: formatDate(5),
    nights: 3,
    roomType: 'Sunset Vista',
    roomNumber: '403',
    ratePlan: 'Long Stay',
    adults: 2,
    children: 2,
    status: 'CONFIRMED',
    source: 'Direct',
    amount: 675,
    amountPaid: 337.50,
    balance: 337.50,
    specialRequests: 'Connecting rooms if available',
    createdAt: formatDate(-8),
    createdBy: 'Front Desk',
    payments: [
      { id: 'PAY-006', date: formatDate(-8), amount: 337.50, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-8), action: 'Booking created', user: 'Front Desk' }
    ]
  },
  {
    id: 'CBS-008',
    guestName: 'Michael Brown',
    guestEmail: 'mbrown@enterprise.com',
    guestPhone: '+1 (555) 901-2345',
    isVip: false,
    checkIn: formatDate(0),
    checkOut: formatDate(1),
    nights: 1,
    roomType: 'Minimalist Studio',
    roomNumber: '202',
    ratePlan: 'Corporate',
    adults: 1,
    children: 0,
    status: 'CONFIRMED',
    source: 'Corporate Portal',
    amount: 108,
    amountPaid: 0,
    balance: 108,
    specialRequests: 'None',
    createdAt: formatDate(-2),
    createdBy: 'Corporate Booking',
    payments: [],
    activityLog: [
      { date: formatDate(-2), action: 'Booking created via corporate portal', user: 'Corporate Booking' }
    ]
  },
  {
    id: 'CBS-009',
    guestName: 'Lisa Garcia',
    guestEmail: 'lisa.garcia@travel.com',
    guestPhone: '+1 (555) 012-3456',
    isVip: true,
    checkIn: formatDate(3),
    checkOut: formatDate(7),
    nights: 4,
    roomType: 'Oceanfront Penthouse',
    roomNumber: null,
    ratePlan: 'BAR',
    adults: 2,
    children: 0,
    status: 'PENDING',
    source: 'Direct',
    amount: 1600,
    amountPaid: 800,
    balance: 800,
    specialRequests: 'Anniversary celebration - special decoration',
    createdAt: formatDate(-4),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-007', date: formatDate(-4), amount: 800, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-4), action: 'Booking created', user: 'Reservations' },
      { date: formatDate(-3), action: 'VIP flag added', user: 'Guest Relations' }
    ]
  },
  {
    id: 'CBS-010',
    guestName: 'Thomas Anderson',
    guestEmail: 'tanderson@matrix.com',
    guestPhone: '+1 (555) 123-4567',
    isVip: false,
    checkIn: formatDate(-3),
    checkOut: formatDate(-1),
    nights: 2,
    roomType: 'Pacific Suite',
    roomNumber: '304',
    ratePlan: 'OTA',
    adults: 1,
    children: 0,
    status: 'CANCELLED',
    source: 'Booking.com',
    amount: 324,
    amountPaid: 324,
    balance: -324,
    specialRequests: 'None',
    createdAt: formatDate(-10),
    createdBy: 'Channel Manager',
    payments: [
      { id: 'PAY-008', date: formatDate(-10), amount: 324, method: 'Credit Card', status: 'refunded' }
    ],
    activityLog: [
      { date: formatDate(-10), action: 'Booking imported from Booking.com', user: 'System' },
      { date: formatDate(-5), action: 'Booking cancelled by guest', user: 'System' },
      { date: formatDate(-4), action: 'Refund processed', user: 'Accounts' }
    ]
  },
  {
    id: 'CBS-011',
    guestName: 'Rachel Green',
    guestEmail: 'rgreen@fashion.com',
    guestPhone: '+1 (555) 234-5679',
    isVip: true,
    checkIn: formatDate(5),
    checkOut: formatDate(8),
    nights: 3,
    roomType: 'Oceanfront Penthouse',
    roomNumber: '901',
    ratePlan: 'BAR',
    adults: 1,
    children: 0,
    status: 'CONFIRMED',
    source: 'Direct',
    amount: 1200,
    amountPaid: 1200,
    balance: 0,
    specialRequests: 'Hypoallergenic pillows, non-smoking room',
    createdAt: formatDate(-12),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-009', date: formatDate(-12), amount: 1200, method: 'Bank Transfer', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-12), action: 'Booking created', user: 'Reservations' }
    ]
  },
  {
    id: 'CBS-012',
    guestName: 'James Wilson',
    guestEmail: 'jwilson@business.net',
    guestPhone: '+1 (555) 345-6780',
    isVip: false,
    checkIn: formatDate(0),
    checkOut: formatDate(3),
    nights: 3,
    roomType: 'Sunset Vista',
    roomNumber: null,
    ratePlan: 'Corporate',
    adults: 2,
    children: 0,
    status: 'PENDING',
    source: 'Expedia',
    amount: 675,
    amountPaid: 0,
    balance: 675,
    specialRequests: 'High floor preferred',
    createdAt: formatDate(-2),
    createdBy: 'Channel Manager',
    payments: [],
    activityLog: [
      { date: formatDate(-2), action: 'Booking imported from Expedia', user: 'System' }
    ]
  },
  {
    id: 'CBS-013',
    guestName: 'Monica Geller',
    guestEmail: 'monica.g@chef.com',
    guestPhone: '+1 (555) 456-7891',
    isVip: false,
    checkIn: formatDate(-1),
    checkOut: formatDate(1),
    nights: 2,
    roomType: 'Minimalist Studio',
    roomNumber: '104',
    ratePlan: 'OTA',
    adults: 2,
    children: 0,
    status: 'CHECKED-IN',
    source: 'Hotels.com',
    amount: 216,
    amountPaid: 216,
    balance: 0,
    specialRequests: 'Extra towels',
    createdAt: formatDate(-7),
    createdBy: 'Channel Manager',
    payments: [
      { id: 'PAY-010', date: formatDate(-7), amount: 216, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-7), action: 'Booking imported from Hotels.com', user: 'System' },
      { date: formatDate(-1), action: 'Guest checked in', user: 'Front Desk' }
    ]
  },
  {
    id: 'CBS-014',
    guestName: 'Chandler Bing',
    guestEmail: 'chandler@humor.com',
    guestPhone: '+1 (555) 567-8902',
    isVip: false,
    checkIn: formatDate(7),
    checkOut: formatDate(10),
    nights: 3,
    roomType: 'Pacific Suite',
    roomNumber: '402',
    ratePlan: 'Long Stay',
    adults: 1,
    children: 0,
    status: 'CONFIRMED',
    source: 'Direct',
    amount: 486,
    amountPaid: 243,
    balance: 243,
    specialRequests: 'None',
    createdAt: formatDate(-6),
    createdBy: 'Front Desk',
    payments: [
      { id: 'PAY-011', date: formatDate(-6), amount: 243, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-6), action: 'Booking created', user: 'Front Desk' }
    ]
  },
  {
    id: 'CBS-015',
    guestName: 'Phoebe Buffay',
    guestEmail: 'phoebe@music.com',
    guestPhone: '+1 (555) 678-9013',
    isVip: false,
    checkIn: formatDate(1),
    checkOut: formatDate(3),
    nights: 2,
    roomType: 'Sunset Vista',
    roomNumber: '603',
    ratePlan: 'BAR',
    adults: 1,
    children: 0,
    status: 'CONFIRMED',
    source: 'Direct',
    amount: 500,
    amountPaid: 500,
    balance: 0,
    specialRequests: 'Room with a view',
    createdAt: formatDate(-9),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-012', date: formatDate(-9), amount: 500, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-9), action: 'Booking created', user: 'Reservations' }
    ]
  },
  {
    id: 'CBS-016',
    guestName: 'Joey Tribbiani',
    guestEmail: 'joey@acting.com',
    guestPhone: '+1 (555) 789-0124',
    isVip: false,
    checkIn: formatDate(4),
    checkOut: formatDate(6),
    nights: 2,
    roomType: 'Minimalist Studio',
    roomNumber: null,
    ratePlan: 'OTA',
    adults: 1,
    children: 0,
    status: 'PENDING',
    source: 'Booking.com',
    amount: 216,
    amountPaid: 0,
    balance: 216,
    specialRequests: 'Extra pillows',
    createdAt: formatDate(-1),
    createdBy: 'Channel Manager',
    payments: [],
    activityLog: [
      { date: formatDate(-1), action: 'Booking imported from Booking.com', user: 'System' }
    ]
  },
  {
    id: 'CBS-017',
    guestName: 'Ross Geller',
    guestEmail: 'ross@paleontology.edu',
    guestPhone: '+1 (555) 890-1235',
    isVip: true,
    checkIn: formatDate(0),
    checkOut: formatDate(5),
    nights: 5,
    roomType: 'Oceanfront Penthouse',
    roomNumber: '1001',
    ratePlan: 'Long Stay',
    adults: 2,
    children: 1,
    status: 'CONFIRMED',
    source: 'Direct',
    amount: 2250,
    amountPaid: 1125,
    balance: 1125,
    specialRequests: 'Dinosaur documentaries on TV if possible',
    createdAt: formatDate(-15),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-013', date: formatDate(-15), amount: 1125, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-15), action: 'Booking created', user: 'Reservations' },
      { date: formatDate(-10), action: 'VIP status confirmed', user: 'Guest Relations' }
    ]
  },
  {
    id: 'CBS-018',
    guestName: 'Emma Thompson',
    guestEmail: 'emma.t@luxury.com',
    guestPhone: '+1 (555) 901-2346',
    isVip: true,
    checkIn: formatDate(6),
    checkOut: formatDate(9),
    nights: 3,
    roomType: 'Oceanfront Penthouse',
    roomNumber: null,
    ratePlan: 'BAR',
    adults: 2,
    children: 0,
    status: 'PENDING',
    source: 'Direct',
    amount: 1200,
    amountPaid: 600,
    balance: 600,
    specialRequests: 'Spa treatment booking upon arrival',
    createdAt: formatDate(-3),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-014', date: formatDate(-3), amount: 600, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-3), action: 'Booking created', user: 'Reservations' }
    ]
  },
  {
    id: 'CBS-019',
    guestName: 'William Harrison',
    guestEmail: 'w.harrison@corp.com',
    guestPhone: '+1 (555) 012-3457',
    isVip: false,
    checkIn: formatDate(0),
    checkOut: formatDate(2),
    nights: 2,
    roomType: 'Pacific Suite',
    roomNumber: '503',
    ratePlan: 'Corporate',
    adults: 1,
    children: 0,
    status: 'CHECKED-IN',
    source: 'Corporate Portal',
    amount: 324,
    amountPaid: 0,
    balance: 324,
    specialRequests: 'Quiet room away from elevator',
    createdAt: formatDate(-4),
    createdBy: 'Corporate Booking',
    payments: [],
    activityLog: [
      { date: formatDate(-4), action: 'Booking created via corporate portal', user: 'Corporate Booking' },
      { date: formatDate(0), action: 'Guest checked in', user: 'Front Desk' }
    ]
  },
  {
    id: 'CBS-020',
    guestName: 'Olivia Martinez',
    guestEmail: 'olivia.m@travel.net',
    guestPhone: '+1 (555) 123-4568',
    isVip: false,
    checkIn: formatDate(8),
    checkOut: formatDate(12),
    nights: 4,
    roomType: 'Sunset Vista',
    roomNumber: '702',
    ratePlan: 'Long Stay',
    adults: 2,
    children: 1,
    status: 'CONFIRMED',
    source: 'Direct',
    amount: 900,
    amountPaid: 450,
    balance: 450,
    specialRequests: 'Baby cot required',
    createdAt: formatDate(-11),
    createdBy: 'Reservations',
    payments: [
      { id: 'PAY-015', date: formatDate(-11), amount: 450, method: 'Credit Card', status: 'completed' }
    ],
    activityLog: [
      { date: formatDate(-11), action: 'Booking created', user: 'Reservations' }
    ]
  }
];

export const statusConfig = {
  'CONFIRMED': { color: 'bg-emerald-500', text: 'text-emerald-700', label: 'Confirmed' },
  'PENDING': { color: 'bg-amber-500', text: 'text-amber-700', label: 'Pending' },
  'CHECKED-IN': { color: 'bg-blue-500', text: 'text-blue-700', label: 'Checked In' },
  'CHECKED-OUT': { color: 'bg-neutral-400', text: 'text-neutral-600', label: 'Checked Out' },
  'CANCELLED': { color: 'bg-rose-500', text: 'text-rose-600', label: 'Cancelled' }
};

export const sourceConfig = {
  'Direct': { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Booking.com': { color: 'text-blue-600', bg: 'bg-blue-50' },
  'Expedia': { color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'Hotels.com': { color: 'text-red-600', bg: 'bg-red-50' },
  'Corporate Portal': { color: 'text-purple-600', bg: 'bg-purple-50' }
};

export default sampleBookings;
