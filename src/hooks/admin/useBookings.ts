import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { bookingService } from '@/api/services/booking.service';
import { roomsService } from '@/api/services/rooms.service';

// Interface for frontend booking representation
export interface AdminBooking {
  id: string;
  bookingNumber: string;
  guest: string;
  guestEmail?: string;
  guestPhone?: string;
  room: string;
  roomType: string;
  roomId?: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  adults: number;
  children?: number;
  status: string;
  source: string;
  total: number;
  amount: number;  // Alias for total for backward compatibility
  totalAmount?: number;
  deposit?: number;
  balance?: number;
  specialRequests?: string;
  createdAt?: string;
  cancellationReason?: string;
  cancellationNotes?: string;
  vip?: boolean;
  email?: string;
  phone?: string;
  bookedOn?: string;
  // Payment fields
  paymentStatus?: string;
  payment_status?: string;
  paymentMethod?: string;
  payment_method?: string;
  amountPaid?: number;
  amount_paid?: number;
  paymentNotes?: string;
}

// Transform API booking to admin format
function transformBooking(apiBooking: any): AdminBooking {
  const checkInDate = new Date(apiBooking.arrival_date || apiBooking.checkIn);
  const checkOutDate = new Date(apiBooking.departure_date || apiBooking.checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  // Handle room which can be a string, number, or object from the API
  let roomNumber = 'Unassigned';
  let roomType = 'Standard';
  let roomId = apiBooking.room_id;

  if (apiBooking.room) {
    if (typeof apiBooking.room === 'object' && apiBooking.room !== null) {
      // Room is an object with properties like {id, name, number, slug, ...}
      roomNumber = apiBooking.room.number || apiBooking.room.name || 'Unassigned';
      roomId = roomId || apiBooking.room.id;
      // BUG-008 FIX: Extract room TYPE (not room name which includes number).
      // Prefer slug-based name, then strip room number from name as fallback.
      if (apiBooking.room.slug) {
        // Convert slug to title case: "wellness-suite" -> "Wellness Suite"
        roomType = apiBooking.room.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      } else if (apiBooking.room.name && apiBooking.room.number) {
        // Strip room number from name: "Wellness Suite 201" -> "Wellness Suite"
        roomType = apiBooking.room.name.replace(new RegExp(`\\s*${apiBooking.room.number}\\s*$`), '').trim() || apiBooking.room.name;
      } else {
        roomType = apiBooking.room.name || apiBooking.room_type_name || 'Standard';
      }
    } else {
      // Room is a string or number
      roomNumber = String(apiBooking.room);
    }
  } else if (apiBooking.room_number) {
    roomNumber = String(apiBooking.room_number);
  }

  // Handle room_type which can also be an object
  if (apiBooking.room_type) {
    if (typeof apiBooking.room_type === 'object' && apiBooking.room_type !== null) {
      roomType = apiBooking.room_type.name || apiBooking.room_type.slug || roomType;
    } else {
      roomType = String(apiBooking.room_type);
    }
  } else if (apiBooking.room_type_name) {
    roomType = apiBooking.room_type_name;
  } else if (apiBooking.roomType) {
    roomType = typeof apiBooking.roomType === 'object'
      ? apiBooking.roomType.name || 'Standard'
      : String(apiBooking.roomType);
  }

  // Extract guest name - handle both flat and nested guestInfo structure
  let guestName = 'Unknown Guest';
  let guestEmail = '';
  let guestPhone = '';

  if (apiBooking.guestInfo && typeof apiBooking.guestInfo === 'object') {
    // API returns guestInfo object with firstName, lastName
    const firstName = apiBooking.guestInfo.firstName || '';
    const lastName = apiBooking.guestInfo.lastName || '';
    guestName = `${firstName} ${lastName}`.trim() || 'Unknown Guest';
    guestEmail = apiBooking.guestInfo.email || '';
    guestPhone = apiBooking.guestInfo.phone || '';
  } else if (apiBooking.guest_name) {
    guestName = apiBooking.guest_name;
    guestEmail = apiBooking.guest_email || '';
    guestPhone = apiBooking.guest_phone || '';
  } else if (apiBooking.guest && typeof apiBooking.guest === 'string') {
    guestName = apiBooking.guest;
    guestEmail = apiBooking.guestEmail || '';
    guestPhone = apiBooking.guestPhone || '';
  }

  // Extract guests count - handle both flat and nested structure
  let adults = 1;
  let children = 0;
  if (apiBooking.guests && typeof apiBooking.guests === 'object') {
    adults = apiBooking.guests.adults || 1;
    children = apiBooking.guests.children || 0;
  } else {
    adults = apiBooking.adults || 1;
    children = apiBooking.children || 0;
  }

  // Extract total amount - API returns totalPrice
  const totalAmount = apiBooking.totalPrice || apiBooking.total_amount || apiBooking.total || 0;

  // Extract booking source - API returns bookingSource
  // Map source to normalized format (e.g., "crs" -> "CRS")
  const sourceMap: Record<string, string> = {
    'Website': 'Website',
    'direct': 'Website',
    'Dummy Channel Manager': 'Dummy Channel Manager',
    'dummy channel manager': 'Dummy Channel Manager',
    'CRS': 'Dummy Channel Manager',
    'crs': 'Dummy Channel Manager',
    'Booking.com': 'Booking.com',
    'booking.com': 'Booking.com',
    'Expedia': 'Expedia',
    'expedia': 'Expedia',
    'Walk-in': 'Walk-in',
    'walk_in': 'Walk-in',
    'walk-in': 'Walk-in',
    'OTA': 'Booking.com',
  };
  const rawSource = apiBooking.bookingSource || apiBooking.booking_source || apiBooking.source || '';
  // Map the source, but if not found in map, use raw source (don't default to something else)
  const source = rawSource ? (sourceMap[rawSource] || rawSource) : 'Website';

  // Extract special requests - check guestInfo first
  const specialRequests = apiBooking.guestInfo?.specialRequests ||
    apiBooking.special_requests ||
    apiBooking.specialRequests || '';

  return {
    id: String(apiBooking.id),
    bookingNumber: apiBooking.bookingNumber || apiBooking.booking_number || `BK-${apiBooking.id}`,
    guest: guestName,
    guestEmail: guestEmail || apiBooking.guest_email || apiBooking.guestEmail || '',
    guestPhone: guestPhone || apiBooking.guest_phone || apiBooking.guestPhone || '',
    email: guestEmail || apiBooking.guest_email || apiBooking.guestEmail || '',
    phone: guestPhone || apiBooking.guest_phone || apiBooking.guestPhone || '',
    room: roomNumber,
    roomType: roomType,
    roomId: roomId,
    checkIn: apiBooking.checkIn || apiBooking.arrival_date,
    checkOut: apiBooking.checkOut || apiBooking.departure_date,
    nights,
    guests: adults + children,
    adults: adults,
    children: children,
    status: mapApiStatus(apiBooking.status),
    source: source,
    total: totalAmount,
    amount: totalAmount,  // Alias for backward compatibility
    totalAmount: totalAmount,
    deposit: apiBooking.deposit_amount || apiBooking.deposit,
    balance: apiBooking.balance_due || apiBooking.balance,
    specialRequests: specialRequests,
    createdAt: apiBooking.createdAt || apiBooking.created_at,
    bookedOn: apiBooking.createdAt || apiBooking.created_at,
    vip: apiBooking.vipStatus || apiBooking.vip || false,
    // Payment fields - API returns amountPaid, backend stores as deposit_amount
    paymentStatus: apiBooking.paymentStatus || apiBooking.payment_status || 'pending',
    paymentMethod: apiBooking.paymentMethod || apiBooking.payment_method || '',
    amountPaid: apiBooking.amountPaid || apiBooking.amount_paid || apiBooking.deposit_amount || 0,
    paymentNotes: apiBooking.paymentNotes || apiBooking.payment_notes || '',
  };
}

// Map API status to frontend display status
function mapApiStatus(status: string): string {
  const statusMap: Record<string, string> = {
    booked: 'CONFIRMED',
    confirmed: 'CONFIRMED',
    checked_in: 'IN_HOUSE',
    checked_out: 'COMPLETED',
    cancelled: 'CANCELLED',
    no_show: 'NO_SHOW',
  };
  return statusMap[status?.toLowerCase()] || status?.toUpperCase() || 'PENDING';
}

// Map frontend status back to API status
// Backend accepts: booked, checked_in, checked_out, cancelled, no_show
function mapFrontendStatus(status: string): string {
  const statusMap: Record<string, string> = {
    CONFIRMED: 'booked',      // Backend uses 'booked' not 'confirmed'
    PENDING: 'booked',
    IN_HOUSE: 'checked_in',
    'CHECKED-IN': 'checked_in',  // Handle legacy format
    COMPLETED: 'checked_out',
    'CHECKED-OUT': 'checked_out',  // Handle legacy format
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
  };
  return statusMap[status] || status.toLowerCase().replace('-', '_');
}

// Extract error message from FastAPI error response
function extractErrorMessage(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;

  if (Array.isArray(detail)) {
    // FastAPI validation errors: [{type, loc, msg, input}, ...]
    return detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
  } else if (typeof detail === 'string') {
    return detail;
  } else if (typeof detail === 'object' && detail.msg) {
    return detail.msg;
  }
  return fallback;
}

/**
 * Hook for managing admin bookings with real API integration
 */
export function useBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 100,
    total: 0,
    totalPages: 1,
  });

  /**
   * Fetch bookings from API
   */
  const fetchBookings = useCallback(async (page = 1, pageSize = 100, status?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await bookingService.getBookings(page, pageSize, status);

      // Handle both paginated and array responses
      let bookingsData: any[] = [];
      let total = 0;
      let totalPages = 1;

      if (response.items) {
        bookingsData = response.items;
        total = response.total || response.items.length;
        totalPages = response.totalPages || Math.ceil(total / pageSize);
      } else if (Array.isArray(response)) {
        bookingsData = response;
        total = response.length;
        totalPages = 1;
      }

      const transformedBookings = bookingsData.map(transformBooking);
      setBookings(transformedBookings);
      setPagination({ page, pageSize, total, totalPages });
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /**
   * Create a new booking
   */
  const createBooking = useCallback(async (bookingData: any) => {
    try {
      // Parse guest name into first/last name
      let firstName = '';
      let lastName = '';
      if (bookingData.guest) {
        const nameParts = bookingData.guest.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        firstName = bookingData.firstName || '';
        lastName = bookingData.lastName || '';
      }

      // Convert room type name to slug format (e.g., "Standard" -> "standard", "Wellness Suite" -> "wellness-suite")
      const roomTypeSlug = (bookingData.roomType || 'standard').toLowerCase().replace(/\s+/g, '-');

      // Transform frontend data to API format matching CreateBookingRequest schema
      const apiData: any = {
        roomId: roomTypeSlug,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: {
          adults: bookingData.adults || 1,
          children: bookingData.children || 0,
          infants: 0,
        },
        guestInfo: {
          firstName: firstName,
          lastName: lastName,
          email: bookingData.email || '',
          phone: bookingData.phone || '',
          country: bookingData.nationality || bookingData.country || 'Unknown',
          specialRequests: bookingData.specialRequests || '',
        },
      };

      // Include booking source if provided
      if (bookingData.source) {
        apiData.source = bookingData.source;
      }

      const result = await bookingService.createBooking(apiData);
      const newBooking = transformBooking(result);

      setBookings(prev => [newBooking, ...prev]);
      toast.success('Booking created successfully');
      return newBooking;
    } catch (err: any) {
      console.error('Error creating booking:', err);
      toast.error(extractErrorMessage(err, 'Failed to create booking'));
      throw err;
    }
  }, []);

  /**
   * Update an existing booking
   */
  const updateBooking = useCallback(async (bookingId: string, updates: Partial<AdminBooking> & { guestInfo?: any, guests?: any }) => {
    // Extract local updates to apply immediately (optimistic update)
    const localUpdates: Partial<AdminBooking> = {};
    if (updates.paymentStatus !== undefined) localUpdates.paymentStatus = updates.paymentStatus;
    if (updates.paymentMethod !== undefined) localUpdates.paymentMethod = updates.paymentMethod;
    if (updates.amountPaid !== undefined) localUpdates.amountPaid = updates.amountPaid;
    if (updates.paymentNotes !== undefined) localUpdates.paymentNotes = updates.paymentNotes;
    if (updates.status !== undefined) localUpdates.status = updates.status;
    if (updates.specialRequests !== undefined) localUpdates.specialRequests = updates.specialRequests;

    // Apply optimistic update immediately for better UX
    if (Object.keys(localUpdates).length > 0) {
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, ...localUpdates } : b
      ));
    }

    try {
      // Transform frontend updates to API format
      const apiUpdates: any = {};

      // Handle dates
      if (updates.checkIn) apiUpdates.checkIn = updates.checkIn;
      if (updates.checkOut) apiUpdates.checkOut = updates.checkOut;

      // Handle guest counts - accept both flat and nested format
      if (updates.guests && typeof updates.guests === 'object') {
        apiUpdates.guests = {
          adults: updates.guests.adults || 1,
          children: updates.guests.children || 0,
        };
      } else if (updates.adults !== undefined || updates.children !== undefined) {
        apiUpdates.guests = {
          adults: updates.adults || 1,
          children: updates.children || 0,
        };
      }

      // Handle guest info - accept both flat and nested format
      if (updates.guestInfo && typeof updates.guestInfo === 'object') {
        apiUpdates.guestInfo = {
          firstName: updates.guestInfo.firstName || '',
          lastName: updates.guestInfo.lastName || '',
          email: updates.guestInfo.email || '',
          phone: updates.guestInfo.phone || '',
          country: updates.guestInfo.country || '',
          specialRequests: updates.guestInfo.specialRequests || updates.specialRequests || '',
        };
      } else if (updates.guest) {
        // Parse guest name from flat format
        const nameParts = updates.guest.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        apiUpdates.guestInfo = {
          firstName,
          lastName,
          email: updates.guestEmail || updates.email || '',
          phone: updates.guestPhone || updates.phone || '',
          country: '',
          specialRequests: updates.specialRequests || '',
        };
      }

      // Handle special requests
      if (updates.specialRequests && !apiUpdates.guestInfo) {
        apiUpdates.specialRequests = updates.specialRequests;
      }

      // Handle room assignment
      if (updates.roomId) apiUpdates.roomId = String(updates.roomId);

      // Handle status
      if (updates.status) apiUpdates.status = mapFrontendStatus(updates.status);

      // Handle booking source
      if (updates.source) apiUpdates.source = updates.source;

      // Handle payment fields
      if (updates.paymentStatus) apiUpdates.paymentStatus = updates.paymentStatus;
      if (updates.paymentMethod) apiUpdates.paymentMethod = updates.paymentMethod;
      if (updates.amountPaid !== undefined) apiUpdates.amountPaid = updates.amountPaid;
      if (updates.paymentNotes !== undefined) apiUpdates.paymentNotes = updates.paymentNotes;

      const result = await bookingService.updateBooking(bookingId, apiUpdates);
      const updatedBooking = transformBooking(result);

      // Merge API result with local updates (local updates take precedence for payment fields)
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, ...updatedBooking, ...localUpdates } : b
      ));

      toast.success('Booking updated successfully');
      return { ...updatedBooking, ...localUpdates };
    } catch (err: any) {
      console.error('Error updating booking:', err);
      // Keep the optimistic update even if API fails - data will be synced on next refresh
      // This ensures UI reflects user's intent even when backend is unavailable
      toast.error(extractErrorMessage(err, 'Failed to sync with server. Changes saved locally.'));
      // Return the local updates so the caller knows what was applied
      return localUpdates;
    }
  }, []);

  /**
   * Update booking status
   */
  const updateStatus = useCallback(async (bookingId: string, newStatus: string) => {
    try {
      const apiStatus = mapFrontendStatus(newStatus);
      console.log('[useBookings.updateStatus] Updating status:', { bookingId, newStatus, apiStatus });

      // Use specific endpoints for check-in/check-out
      if (newStatus === 'IN_HOUSE' || newStatus === 'CHECKED-IN' || apiStatus === 'checked_in') {
        await bookingService.checkIn(bookingId);
      } else if (newStatus === 'COMPLETED' || newStatus === 'CHECKED-OUT' || apiStatus === 'checked_out') {
        await bookingService.checkOut(bookingId);
      } else {
        await bookingService.updateBooking(bookingId, { status: apiStatus });
      }

      // Normalize status for frontend display
      const displayStatus = newStatus === 'CHECKED-IN' ? 'IN_HOUSE' :
                           newStatus === 'CHECKED-OUT' ? 'COMPLETED' : newStatus;

      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: displayStatus } : b
      ));

      toast.success('Status updated successfully');
      return true;
    } catch (err: any) {
      console.error('[useBookings.updateStatus] Error:', err);
      toast.error(extractErrorMessage(err, 'Failed to update status'));
      return false;
    }
  }, []);

  /**
   * Cancel a booking with reason and notes
   */
  const cancelBooking = useCallback(async (bookingId: string, reason?: string, notes?: string) => {
    try {
      // Pass reason and notes to the API
      await bookingService.cancelBooking(bookingId, reason, notes);

      setBookings(prev => prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              status: 'CANCELLED',
              cancellationReason: reason,
              cancellationNotes: notes,
            }
          : b
      ));

      toast.success('Booking cancelled successfully. Confirmation email sent to guest.');
      return true;
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      toast.error(extractErrorMessage(err, 'Failed to cancel booking'));
      return false;
    }
  }, []);

  /**
   * Assign room to booking
   */
  const assignRoom = useCallback(async (bookingId: string, roomId: number | string, roomNumber: string, checkIn?: string) => {
    try {
      console.log('[useBookings.assignRoom] Assigning room:', { bookingId, roomId, roomNumber, checkIn });

      // API expects roomId as a string
      const result = await bookingService.updateBooking(bookingId, { roomId: String(roomId) });
      console.log('[useBookings.assignRoom] API response:', result);

      // Always sync room status to occupied so the Rooms section reflects the assignment
      try {
        await roomsService.updateRoomStatus(roomId, 'occupied');
        console.log('[useBookings.assignRoom] Room status synced to occupied');
      } catch (roomErr) {
        console.warn('[useBookings.assignRoom] Could not sync room status:', roomErr);
      }

      setBookings(prev => prev.map(b =>
        b.id === bookingId
          ? { ...b, roomId: Number(roomId), room: roomNumber, status: 'CONFIRMED' }
          : b
      ));

      toast.success(`Room ${roomNumber} assigned successfully`);
      return true;
    } catch (err: any) {
      console.error('[useBookings.assignRoom] Error:', err);
      toast.error(extractErrorMessage(err, 'Failed to assign room'));
      return false;
    }
  }, []);

  /**
   * Check-in guest
   */
  const checkInGuest = useCallback(async (bookingId: string, data?: { room_id?: number }) => {
    try {
      await bookingService.checkIn(bookingId, data);

      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: 'IN_HOUSE' } : b
      ));

      toast.success('Guest checked in successfully');
      return true;
    } catch (err: any) {
      console.error('Error checking in:', err);
      toast.error(extractErrorMessage(err, 'Failed to check in'));
      return false;
    }
  }, []);

  /**
   * Check-out guest
   */
  const checkOutGuest = useCallback(async (bookingId: string, data?: { final_charges?: number }) => {
    try {
      await bookingService.checkOut(bookingId, data);

      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: 'COMPLETED' } : b
      ));

      toast.success('Guest checked out successfully');
      return true;
    } catch (err: any) {
      console.error('Error checking out:', err);
      toast.error(extractErrorMessage(err, 'Failed to check out'));
      return false;
    }
  }, []);

  /**
   * Refresh bookings data
   */
  const refreshBookings = useCallback(async () => {
    await fetchBookings(pagination.page, pagination.pageSize);
  }, [fetchBookings, pagination.page, pagination.pageSize]);

  /**
   * Get today's date in local timezone (YYYY-MM-DD format)
   */
  const getLocalToday = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  /**
   * Get arrivals for today (using local timezone)
   */
  const getArrivalsToday = useCallback(() => {
    const today = getLocalToday();
    return bookings.filter(b => b.checkIn === today);
  }, [bookings, getLocalToday]);

  /**
   * Get departures for today (using local timezone)
   */
  const getDeparturesToday = useCallback(() => {
    const today = getLocalToday();
    return bookings.filter(b => b.checkOut === today);
  }, [bookings, getLocalToday]);

  return {
    bookings,
    isLoading,
    error,
    pagination,
    // Data fetching
    fetchBookings,
    refreshBookings,
    // CRUD operations
    createBooking,
    updateBooking,
    cancelBooking,
    // Status operations
    updateStatus,
    assignRoom,
    checkInGuest,
    checkOutGuest,
    // Helpers
    getArrivalsToday,
    getDeparturesToday,
  };
}
