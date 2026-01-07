import { apiClient } from '../client';
import { API_ENDPOINTS } from '@/config/constants';
import type { Booking, CreateBookingData } from '../types/booking.types';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';

export interface CheckInData {
  room_id?: number;
  id_type?: string;
  id_number?: string;
  notes?: string;
}

export interface CheckOutData {
  final_charges?: number;
  notes?: string;
  payment_method?: string;
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
    return response.data.data || response.data;
  },

  getBookings: async (page = 1, pageSize = 20, status?: string) => {
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (status) params.status = status;
    
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Booking>>
    >(API_ENDPOINTS.BOOKINGS.LIST, { params });
    return response.data.data || response.data;
  },

  getBookingById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Booking>>(
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
    return response.data.data || response.data;
  },

  // Check-in a guest
  checkIn: async (bookingId: string | number, data?: CheckInData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/checkin`,
      data || {}
    );
    return response.data.data || response.data;
  },

  // Check-out a guest
  checkOut: async (bookingId: string | number, data?: CheckOutData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/checkout`,
      data || {}
    );
    return response.data.data || response.data;
  },

  // Change room for a booking
  changeRoom: async (bookingId: string | number, data: RoomChangeData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/room-change`,
      data
    );
    return response.data.data || response.data;
  },

  // Extend a guest's stay
  extendStay: async (bookingId: string | number, data: ExtendStayData) => {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}/extend`,
      data
    );
    return response.data.data || response.data;
  },

  // Get today's arrivals
  getTodayArrivals: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get<Booking[]>('/api/v1/bookings', {
      params: { arrival_date: today, status: 'confirmed' }
    });
    return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
  },

  // Get today's departures
  getTodayDepartures: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get<Booking[]>('/api/v1/bookings', {
      params: { departure_date: today, status: 'checked_in' }
    });
    return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
  },

  // Get in-house guests (currently checked in)
  getInHouseGuests: async () => {
    const response = await apiClient.get<Booking[]>('/api/v1/bookings', {
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
};

// Export as bookingApi for consistency with component imports
export const bookingApi = bookingService;
