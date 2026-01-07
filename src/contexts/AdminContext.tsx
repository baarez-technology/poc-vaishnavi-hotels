import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bookingService } from '../api/services/booking.service';

const AdminContext = createContext();

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}

// Safe version that returns null if not within provider
export function useAdminSafe() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }) {
  // Load from localStorage or use defaults
  const loadState = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(`glimmora_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // User & Auth
  const [user] = useState({
    id: 'usr_001',
    name: 'Sarah Admin',
    email: 'sarah.admin@glimmora.com',
    role: 'Manager',
    avatar: null,
  });

  // Theme & UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadState('sidebarCollapsed', false));
  const [theme, setTheme] = useState(loadState('theme', 'light'));

  // Hotel Info
  const [hotelInfo] = useState({
    name: 'Glimmora Resort & Spa',
    totalRooms: 120,
    location: 'Bali, Indonesia',
    rating: 4.8,
  });

  // Notifications
  const [notifications, setNotifications] = useState(loadState('notifications', [
    {
      id: 'notif_001',
      type: 'booking',
      title: 'New Booking Received',
      message: 'John Doe booked Premium Suite for 3 nights',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/admin/bookings',
    },
    {
      id: 'notif_002',
      type: 'housekeeping',
      title: 'Room 305 Cleaned',
      message: 'Room is ready for inspection',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      read: false,
      link: '/admin/housekeeping',
    },
    {
      id: 'notif_003',
      type: 'ai',
      title: 'Revenue Forecast Updated',
      message: 'AI predicts 15% increase next week',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: true,
      link: '/admin/revenue-ai',
    },
  ]));

  // AI Insights
  const [aiInsights, setAiInsights] = useState(loadState('aiInsights', [
    {
      id: 'insight_001',
      type: 'revenue',
      priority: 'high',
      title: 'Dynamic Pricing Opportunity',
      description: 'Increase rates by 12% for next weekend based on demand forecast',
      impact: '+$2,400 revenue',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'insight_002',
      type: 'reputation',
      priority: 'medium',
      title: 'Review Response Needed',
      description: '3 reviews pending response on TripAdvisor',
      impact: 'Maintain 4.8 rating',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ]));

  // Bookings
  const [bookings, setBookings] = useState(loadState('bookings', []));

  // Rooms
  const [rooms, setRooms] = useState(loadState('rooms', []));

  // Guests
  const [guests, setGuests] = useState(loadState('guests', []));

  // Staff
  const [staff, setStaff] = useState(loadState('staff', []));

  // Housekeeping
  const [housekeeping, setHousekeeping] = useState(loadState('housekeeping', []));

  // CRM Data
  const [crm, setCrm] = useState(loadState('crm', {
    segments: [],
    loyaltyTiers: ['Bronze', 'Silver', 'Gold', 'Platinum'],
  }));

  // Roles & Permissions
  const [roles, setRoles] = useState(loadState('roles', [
    { id: 'role_001', name: 'Admin', permissions: ['all'] },
    { id: 'role_002', name: 'Manager', permissions: ['bookings', 'guests', 'rooms', 'staff', 'housekeeping', 'reports'] },
    { id: 'role_003', name: 'Receptionist', permissions: ['bookings', 'guests', 'check-in', 'check-out'] },
    { id: 'role_004', name: 'Housekeeper', permissions: ['housekeeping', 'rooms'] },
  ]));

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('glimmora_sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('glimmora_theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('glimmora_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('glimmora_aiInsights', JSON.stringify(aiInsights));
  }, [aiInsights]);

  useEffect(() => {
    localStorage.setItem('glimmora_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('glimmora_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('glimmora_guests', JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem('glimmora_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('glimmora_housekeeping', JSON.stringify(housekeeping));
  }, [housekeeping]);

  useEffect(() => {
    localStorage.setItem('glimmora_crm', JSON.stringify(crm));
  }, [crm]);

  useEffect(() => {
    localStorage.setItem('glimmora_roles', JSON.stringify(roles));
  }, [roles]);

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingService.getBookings(1, 100);
      if (response && (response.items || Array.isArray(response))) {
        const bookingsData = response.items || response;
        // Transform API format to context format
        const formattedBookings = bookingsData.map(b => ({
          id: b.id?.toString() || b.booking_number,
          bookingNumber: b.booking_number,
          confirmationCode: b.confirmation_code,
          guestName: b.guest_name || `${b.guest?.first_name || ''} ${b.guest?.last_name || ''}`.trim(),
          guestEmail: b.guest?.email || b.email,
          checkIn: b.arrival_date,
          checkOut: b.departure_date,
          roomType: b.room_type?.name || b.room_type_name,
          room: b.room?.number || b.room_number,
          status: b.status?.toUpperCase() || 'CONFIRMED',
          source: b.booking_source || 'Direct',
          vip: b.guest?.vip_status || false,
          amount: b.total_price || 0,
          guests: (b.adults || 1) + (b.children || 0),
          nights: b.nights || 1,
          createdAt: b.created_at || new Date().toISOString()
        }));
        setBookings(formattedBookings);
      }
    } catch (error) {
      console.log('Failed to fetch bookings from API, using cached data');
    }
  }, []);

  // Fetch bookings on mount and periodically
  useEffect(() => {
    fetchBookings();
    // Refresh bookings every 2 minutes
    const interval = setInterval(fetchBookings, 120000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Actions
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const addNotification = (notification) => {
    const newNotification = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateBookingStatus = (bookingId, status) => {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status } : b)
    );
    addNotification({
      type: 'booking',
      title: 'Booking Updated',
      message: `Booking status changed to ${status}`,
      link: `/admin/bookings`,
    });
  };

  const createBooking = (booking) => {
    const newBooking = {
      id: `bkg_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...booking,
    };
    setBookings(prev => [newBooking, ...prev]);
    addNotification({
      type: 'booking',
      title: 'New Booking Created',
      message: `Booking for ${booking.guestName} has been created`,
      link: '/admin/bookings',
    });
  };

  const assignRoom = (bookingId, roomId) => {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, roomId } : b)
    );
    setRooms(prev =>
      prev.map(r => r.id === roomId ? { ...r, status: 'Occupied' } : r)
    );
  };

  const updateRoomStatus = (roomId, status) => {
    setRooms(prev =>
      prev.map(r => r.id === roomId ? { ...r, status } : r)
    );
    if (status === 'Clean') {
      addNotification({
        type: 'housekeeping',
        title: 'Room Cleaned',
        message: `Room ${roomId} is now clean`,
        link: '/admin/housekeeping',
      });
    }
  };

  const addStaff = (staffMember) => {
    const newStaff = {
      id: `stf_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...staffMember,
    };
    setStaff(prev => [newStaff, ...prev]);
  };

  const updateStaff = (staffId, updates) => {
    setStaff(prev =>
      prev.map(s => s.id === staffId ? { ...s, ...updates } : s)
    );
  };

  const createRole = (role) => {
    const newRole = {
      id: `role_${Date.now()}`,
      ...role,
    };
    setRoles(prev => [...prev, newRole]);
  };

  const addGuest = (guest) => {
    const newGuest = {
      id: `gst_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...guest,
    };
    setGuests(prev => [newGuest, ...prev]);
  };

  const updateGuest = (guestId, updates) => {
    setGuests(prev =>
      prev.map(g => g.id === guestId ? { ...g, ...updates } : g)
    );
  };

  const value = {
    // State
    user,
    sidebarCollapsed,
    theme,
    hotelInfo,
    notifications,
    aiInsights,
    bookings,
    rooms,
    guests,
    staff,
    housekeeping,
    crm,
    roles,

    // Actions
    toggleSidebar,
    setTheme,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    updateBookingStatus,
    createBooking,
    assignRoom,
    updateRoomStatus,
    addStaff,
    updateStaff,
    createRole,
    addGuest,
    updateGuest,
    setBookings,
    setRooms,
    setGuests,
    setStaff,
    setHousekeeping,
    setCrm,
    fetchBookings,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
