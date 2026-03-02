import { apiClient, cachedGet, clearApiCache } from '../client';
import { API_ENDPOINTS } from '@/config/constants';
import type { Booking, CreateBookingData } from '../types/booking.types';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';

export interface CheckInData {
  room_id?: number;
  id_type?: string;
  id_number?: string;
  id_verified?: boolean;
  id_verification_confidence?: number;
  notes?: string;
}

export interface CheckOutData {
  final_charges?: number;
  notes?: string;
  payment_method?: string;
  force_checkout?: boolean;
}

export interface RoomChangeData {
  new_room_id: number;
  reason?: string;
  price_adjustment?: number;
}

export interface ExtendStayData {
  new_departure_date: string;
  reason?: string;
}

export const bookingService = {
  createBooking: async (bookingData: CreateBookingData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      API_ENDPOINTS.BOOKINGS.CREATE,
      bookingData
    );
    // Clear bookings cache after creating new booking
    clearApiCache('/bookings');
    return response.data.data || response.data;
  },

  getBookings: async (page = 1, pageSize = 20, status?: string) => {
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (status) params.status = status;

    // Use cached GET to prevent duplicate calls
    const response = await cachedGet<
      ApiResponse<PaginatedResponse<Booking>>
    >(API_ENDPOINTS.BOOKINGS.LIST, { params });
    return response.data.data || response.data;
  },

  getBookingById: async (id: string) => {
    // Use cached GET for booking details
    const response = await cachedGet<ApiResponse<Booking>>(
      API_ENDPOINTS.BOOKINGS.DETAIL(id)
    );
    return response.data.data || response.data;
  },

  getBooking: async (id: string) => {
    return bookingService.getBookingById(id);
  },

  updateBooking: async (id: string, bookingData: Partial<CreateBookingData>) => {
    try {
      console.log('[bookingService.updateBooking] Request:', { id, bookingData });
      const response = await apiClient.patch<ApiResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.DETAIL(id),
        bookingData
      );
      console.log('[bookingService.updateBooking] Response:', response.data);
      // Clear bookings cache after update
      clearApiCache('/bookings');
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('[bookingService.updateBooking] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  cancelBooking: async (id: string, reason?: string, notes?: string) => {
    const payload: { reason?: string; notes?: string } = {};
    if (reason) payload.reason = reason;
    if (notes) payload.notes = notes;

    const response = await apiClient.post<ApiResponse<Booking>>(
      API_ENDPOINTS.BOOKINGS.CANCEL(id),
      Object.keys(payload).length > 0 ? payload : undefined
    );
    // Clear bookings cache after cancel
    clearApiCache('/bookings');
    return response.data.data || response.data;
  },

  // Check-in a guest
  checkIn: async (bookingId: string | number, data?: CheckInData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/checkin`,
      data || {}
    );
    // Clear bookings cache after check-in
    clearApiCache('/bookings');
    return response.data.data || response.data;
  },

  // Check-out a guest
  checkOut: async (bookingId: string | number, data?: CheckOutData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/checkout`,
      data || {}
    );
    // Clear bookings cache after check-out
    clearApiCache('/bookings');
    return response.data.data || response.data;
  },

  // Change room for a booking
  changeRoom: async (bookingId: string | number, data: RoomChangeData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/room-change`,
      data
    );
    // Clear bookings and rooms cache after room change
    clearApiCache('/bookings');
    clearApiCache('/rooms');
    return response.data.data || response.data;
  },

  // Cancel check-in (revert checked-in booking back to confirmed/arrival status)
  cancelCheckIn: async (bookingId: string | number) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/cancel-checkin`,
      {}
    );
    clearApiCache('/bookings');
    clearApiCache('/rooms');
    return response.data.data || response.data;
  },

  // Mark booking as No Show
  markNoShow: async (bookingId: string | number) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/no-show`,
      {}
    );
    clearApiCache('/bookings');
    clearApiCache('/rooms');
    return response.data.data || response.data;
  },

  // Reinstate a no-show or cancelled booking
  reinstate: async (bookingId: string | number) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/reinstate`,
      {}
    );
    clearApiCache('/bookings');
    return response.data.data || response.data;
  },

  // Download invoice PDF for a booking
  downloadInvoice: async (bookingId: string | number) => {
    const response = await apiClient.get(
      `/api/v1/bookings/${bookingId}/invoice`,
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${bookingId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Extend a guest's stay
  extendStay: async (bookingId: string | number, data: ExtendStayData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/extend`,
      data
    );
    // Clear bookings cache after extending stay
    clearApiCache('/bookings');
    return response.data.data || response.data;
  },

  // Get today's arrivals - cached
  getTodayArrivals: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await cachedGet<Booking[]>('/api/v1/bookings', {
      params: { arrival_date: today, status: 'confirmed' }
    });
    return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
  },

  // Get today's departures - cached
  getTodayDepartures: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await cachedGet<Booking[]>('/api/v1/bookings', {
      params: { departure_date: today, status: 'checked_in' }
    });
    return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
  },

  // Get in-house guests (currently checked in) - cached
  getInHouseGuests: async () => {
    const response = await cachedGet<Booking[]>('/api/v1/bookings', {
      params: { status: 'checked_in' }
    });
    return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
  },

  // Generate AI-drafted cancellation notes
  draftCancellation: async (
    bookingId: string,
    data: { reason: string; context?: string; tone?: 'professional' | 'friendly' | 'formal' | 'casual' }
  ): Promise<{ success: boolean; notes: string; reason: string }> => {
    const response = await apiClient.post<{ success: boolean; notes: string; reason: string }>(
      `/api/v1/bookings/${bookingId}/draft-cancellation`,
      data
    );
    return response.data;
  },

  // Get AI-recommended rooms for a booking
  getRoomRecommendations: async (
    bookingId: string | number,
    limit: number = 5
  ): Promise<{
    success: boolean;
    recommendations: Array<{
      room_id: number;
      room_number: string;
      floor: number | null;
      room_type: string;
      bed_type: string | null;
      view_type: string | null;
      status: string;
      is_accessible: boolean;
      is_smoking: boolean;
      match_score: number;
      last_cleaned: string | null;
    }>;
    booking_id: string;
    guest_preferences: Record<string, any> | null;
  }> => {
    try {
      // Use cached GET for room recommendations
      const response = await cachedGet(
        `/api/v1/bookings/${bookingId}/room-recommendations`,
        { params: { limit } }
      );
      return response.data;
    } catch (error: any) {
      console.error('[bookingService.getRoomRecommendations] Error:', error);
      return {
        success: false,
        recommendations: [],
        booking_id: String(bookingId),
        guest_preferences: null
      };
    }
  },

  // Smart room assignment with AI-powered matching
  smartAssignRoom: async (
    bookingId: string | number,
    data?: { room_id?: number; preferences?: Record<string, any> }
  ): Promise<{
    success: boolean;
    room_id: number;
    room_number: string;
    room_type: string;
    message: string;
  }> => {
    const response = await apiClient.post(
      `/api/v1/bookings/${bookingId}/smart-assign`,
      data || {}
    );
    return response.data;
  },

  /**
   * Toggle DNM (Do Not Move) flag on a booking
   */
  toggleDNM: async (
    bookingId: string | number,
    enabled: boolean
  ): Promise<{ success: boolean; do_not_move: boolean; message: string }> => {
    const response = await apiClient.patch(
      `/api/v1/bookings/${bookingId}/dnm`,
      { enabled }
    );
    return response.data;
  },
};

// Export as bookingApi for consistency with component imports
export const bookingApi = bookingService;
