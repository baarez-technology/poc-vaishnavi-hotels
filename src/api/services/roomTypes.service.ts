import { apiClient } from '../client';
import { API_ENDPOINTS } from '@/config/constants';
import type { Room, RoomFilters } from '../types/room.types';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';

export const roomTypesService = {
  getRoomTypes: async (filters?: RoomFilters) => {
    const params: Record<string, string> = {};
    if (filters?.checkIn) params.checkIn = filters.checkIn;
    if (filters?.checkOut) params.checkOut = filters.checkOut;
    if (filters?.guests) params.guests = String(filters.guests);
    if (filters?.minPrice) params.minPrice = String(filters.minPrice);
    if (filters?.maxPrice) params.maxPrice = String(filters.maxPrice);
    if (filters?.type) params.category = filters.type;
    
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Room>>>(
      API_ENDPOINTS.ROOM_TYPES.LIST,
      { params }
    );
    // API returns { items: Room[], total, page, pageSize, totalPages }
    // Extract the items array from the paginated response
    const data = response.data.data || response.data;
    if (data && 'items' in data && Array.isArray((data as any).items)) {
      return (data as any).items;
    }
    return Array.isArray(data) ? data : [];
  },

  getRoomTypeBySlug: async (slug: string, filters?: { checkIn?: string; checkOut?: string; guests?: number }) => {
    const params: Record<string, string> = {};
    if (filters?.checkIn) params.checkIn = filters.checkIn;
    if (filters?.checkOut) params.checkOut = filters.checkOut;
    if (filters?.guests) params.guests = String(filters.guests);
    
    const response = await apiClient.get<ApiResponse<Room>>(
      API_ENDPOINTS.ROOM_TYPES.DETAIL(slug),
      { params }
    );
    return response.data.data || response.data;
  },
};

