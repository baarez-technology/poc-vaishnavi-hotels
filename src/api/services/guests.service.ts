import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  avatar?: string;
  status: string;
  loyalty_points: number;
  loyalty_tier?: string;
  total_bookings: number;
  total_spent: number;
  total_nights: number;
  member_since: string;
  vip_status: boolean;
  last_visit?: string;
  updated_at?: string;
  preferences?: Record<string, any>;
  tags?: string[];
  emotion: string;
  sentiment?: string;  // Alternative field name for emotion
}

export interface GuestFullProfile extends Guest {
  user_id?: number;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  avg_stay_duration: number;
  preferred_room_type?: string;
  // Pre-checkin preferences
  floor_preference?: string;
  view_preference?: string;
  bed_type_preference?: string;
  quietness_preference?: string;
  pillow_type?: string;
  temperature_preference?: number;
  dietary_restrictions?: string;
  special_requests?: string;
  arrival_time?: string;
  transportation_needed?: boolean;
  notes?: Array<{
    id: number;
    text: string;
    category: string;
    author: string;
    author_id: number;
    date: string;
  }>;
  booking_source?: string;
  id_type?: string;
  id_number?: string;
  id_verified: boolean;
  stay_history?: Array<{
    booking_id: number;
    check_in: string;
    check_out: string;
    nights: number;
    total_spent: number;
    room_type?: string;
    status: string;
  }>;
  bookings?: Array<{
    id: number;
    booking_number?: string;
    confirmation_code?: string;
    arrival_date: string;
    departure_date: string;
    nights?: number;
    room_id?: number;
    room_type_id?: number;
    room_type?: string;
    status: string;
    total_price?: number;
    payment_status?: string;
  }>;
}

export interface GuestCreate {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  notes?: string;
}

export interface GuestUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  avatar?: string;
  status?: string;
  vip_status?: boolean;
  preferred_room_type?: string;
  emotion?: string;
  tags?: string[];
  preferences?: string[] | Record<string, any>;
}

export interface PreferencesUpdate {
  room_preferences?: Record<string, any>;
  dining_preferences?: Record<string, any>;
  special_requests?: string[];
}

export interface GuestNote {
  text: string;
  category?: string;
}

export interface GuestFeedback {
  booking_id?: number;
  rating: number;
  comment?: string;
  categories?: Record<string, number>;
}

export interface LoyaltyInfo {
  guest_id: number;
  loyalty_points: number;
  loyalty_tier: string;
  total_bookings: number;
  total_spent: number;
  total_nights: number;
  vip_status: boolean;
  points_to_next_tier: number;
  next_tier?: string;
}

export interface GuestStats {
  all: number;
  returning: number;
  vip: number;
  blacklisted: number;
}

export const guestsService = {
  // Get guest counts for tabs
  getStats: async (): Promise<GuestStats> => {
    const response = await apiClient.get<GuestStats>('/api/v1/guests/stats');
    return response.data;
  },

  // List guests with filters
  list: async (params?: {
    search?: string;
    email?: string;
    status?: string;
    filter_type?: 'all' | 'returning' | 'vip' | 'blacklisted';
    vip_only?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<Guest[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.email) queryParams.email = params.email;
    if (params?.status) queryParams.status = params.status;
    if (params?.filter_type) queryParams.filter_type = params.filter_type;
    if (params?.vip_only) queryParams.vip_only = 'true';
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

    const response = await apiClient.get<Guest[]>('/api/v1/guests', { params: queryParams });
    return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
  },

  // Alias for backwards compatibility
  getGuests: async (search?: string, email?: string, page = 1, pageSize = 20) => {
    return guestsService.list({ search, email, page, pageSize });
  },

  // Get single guest
  get: async (guestId: number | string): Promise<Guest> => {
    const response = await apiClient.get<Guest>(`/api/v1/guests/${guestId}`);
    // Handle both wrapped { data: guest } and unwrapped guest responses
    const data = response.data as any;
    return data?.data || data;
  },

  // Get full guest profile with history
  getProfile: async (guestId: number | string): Promise<GuestFullProfile> => {
    const response = await apiClient.get<GuestFullProfile>(`/api/v1/guests/${guestId}/profile`);
    // Handle both wrapped { data: profile } and unwrapped profile responses
    const data = response.data as any;
    return data?.data || data;
  },

  // Get guest bookings
  getBookings: async (guestId: number | string, status?: string) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await apiClient.get(`/api/v1/guests/${guestId}/bookings`, { params });
    return response.data;
  },

  // Get guest preferences
  getPreferences: async (guestId: number | string) => {
    const response = await apiClient.get(`/api/v1/guests/${guestId}/preferences`);
    return response.data;
  },

  // Update guest preferences
  updatePreferences: async (guestId: number | string, data: PreferencesUpdate) => {
    const response = await apiClient.patch(`/api/v1/guests/${guestId}/preferences`, data);
    return response.data;
  },

  // Get guest notes
  getNotes: async (guestId: number | string) => {
    const response = await apiClient.get(`/api/v1/guests/${guestId}/notes`);
    return response.data;
  },

  // Add a note
  addNote: async (guestId: number | string, data: GuestNote) => {
    const response = await apiClient.post(`/api/v1/guests/${guestId}/notes`, data);
    return response.data;
  },

  // Delete a note
  deleteNote: async (guestId: number | string, noteId: number | string) => {
    const response = await apiClient.delete(`/api/v1/guests/${guestId}/notes/${noteId}`);
    return response.data;
  },

  // Get loyalty info
  getLoyalty: async (guestId: number | string): Promise<LoyaltyInfo> => {
    const response = await apiClient.get<LoyaltyInfo>(`/api/v1/guests/${guestId}/loyalty`);
    return response.data;
  },

  // Submit feedback
  submitFeedback: async (guestId: number | string, data: GuestFeedback) => {
    const response = await apiClient.post(`/api/v1/guests/${guestId}/feedback`, data);
    return response.data;
  },

  // Create guest
  create: async (data: GuestCreate): Promise<Guest> => {
    console.log('[GuestsService.create] Sending:', data);
    const response = await apiClient.post<Guest>('/api/v1/guests', data);
    console.log('[GuestsService.create] Raw response:', response);
    console.log('[GuestsService.create] Response data:', response.data);
    // Handle both wrapped { success: true, data: guest } and unwrapped guest responses
    const responseData = response.data as any;
    const result = responseData?.data || responseData;
    console.log('[GuestsService.create] Returning:', result);
    return result;
  },

  // Alias for backwards compatibility
  createGuest: async (data: GuestCreate) => {
    return guestsService.create(data);
  },

  // Update guest
  update: async (guestId: number | string, data: GuestUpdate): Promise<Guest> => {
    console.log('[GuestsService.update] Sending data:', JSON.stringify(data, null, 2));
    const response = await apiClient.patch<Guest>(`/api/v1/guests/${guestId}`, data);
    console.log('[GuestsService.update] Response:', response.data);
    // Handle both wrapped { success: true, data: guest } and unwrapped guest responses
    const responseData = response.data as any;
    return responseData?.data || responseData;
  },

  // Alias for backwards compatibility
  updateGuest: async (guestId: number | string, data: GuestUpdate) => {
    return guestsService.update(guestId, data);
  },

  // Delete (soft delete) guest
  delete: async (guestId: number | string) => {
    const response = await apiClient.delete(`/api/v1/guests/${guestId}`);
    return response.data;
  },

  // Update guest tags
  updateTags: async (guestId: number | string, tags: string[]) => {
    const response = await apiClient.post(`/api/v1/guests/${guestId}/tags`, tags);
    return response.data;
  },

  // Send message to guest
  sendMessage: async (guestId: number | string, data: {
    subject: string;
    message: string;
    template?: string;
  }): Promise<{ success: boolean; message: string; email_sent: boolean }> => {
    const response = await apiClient.post(`/api/v1/guests/${guestId}/message`, data);
    return response.data;
  },

  // Draft message using AI
  draftMessage: async (guestId: number | string, data: {
    template: string;
    context?: string;
    tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  }): Promise<{ success: boolean; subject: string; message: string; template: string }> => {
    const response = await apiClient.post(`/api/v1/guests/${guestId}/draft-message`, data);
    return response.data;
  },
};
