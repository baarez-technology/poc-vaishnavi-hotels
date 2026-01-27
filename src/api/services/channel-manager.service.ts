/**
 * Channel Manager API Service
 * 
 * Provides API functions for managing OTA connections, room mappings, rates,
 * restrictions, promotions, sync logs, and channel statistics
 */

import { apiClient } from '../client';

// ==================== TYPES ====================

export interface OTAConnection {
  id: string;
  name: string;
  code: string;
  logo?: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  nextSync?: string | null;
  errorMessage?: string;
  credentials: {
    username: string;
    apiKey: string;
    hotelId: string;
  };
  syncSettings: {
    autoSync: boolean;
    syncInterval: number;
    syncRates: boolean;
    syncAvailability: boolean;
    syncRestrictions: boolean;
  };
  stats: {
    totalBookings: number;
    revenue: number;
    avgRating: number;
    commission: number;
  };
  color: string;
}

export interface RoomMapping {
  id: string;
  pmsRoomType: string;
  pmsRoomTypeId: string;
  pmsRoomCode?: string;
  basePrice: number;
  inventory: number;
  otaMappings: OTARoomMapping[];
}

export interface OTARoomMapping {
  otaCode: string;
  otaRoomType: string;
  otaRoomId: string;
  otaRoomCode?: string;
  maxGuests?: number;
  defaultRatePlan?: string;
  status: 'active' | 'inactive' | 'pending';
  lastSync: string;
}

export interface RateCalendarEntry {
  date: string;
  roomType: string;
  rates: {
    BAR?: number;
    [ratePlan: string]: number;
  };
  otaRates: {
    [otaCode: string]: number;
  };
  availability: number;
  stopSell: boolean;
  cta: boolean;
  ctd: boolean;
}

export interface Restriction {
  id: string;
  roomType: string;
  otaCode: string;
  dateRange: {
    start: string;
    end: string;
  };
  restriction: {
    minStay: number;
    maxStay: number | null;
    cta: boolean;
    ctd: boolean;
    stopSell: boolean;
  };
  reason?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ChannelPromotion {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validTo: string;
  otaCodes: string[];
  roomTypes: string[];
  minStay: number;
  bookingWindow?: {
    start: string;
    end: string;
  };
  usageCount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  otaCode: string;
  otaName: string;
  action: 'rate_update' | 'availability_update' | 'restriction_update' | 
         'promotion_sync' | 'booking_import' | 'connection' | 'bulk_sync';
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: {
    [key: string]: any;
  };
}

export interface ChannelStats {
  connectedOTAs: number;
  disconnectedOTAs: number;
  errorOTAs: number;
  totalBookings: number;
  totalRevenue: number;
  mappedRoomTypes: number;
  totalRoomTypes: number;
  activeRestrictions: number;
  rateParityIssues: Array<{
    roomType: string;
    minRate: number;
    maxRate: number;
    difference: number;
  }>;
  lastSync: string;
  revenueTrend: number[];
  bookingsTrend: number[];
  channelPerformance: Array<{
    name: string;
    code: string;
    color: string;
    bookings: number;
    revenue: number;
    rating: number;
    commission: number;
    conversionRate: number;
  }>;
  avgCommission: number;
  avgConversionRate: number;
  revenueGrowth: string;
  bookingsGrowth: string;
  avgRate?: number;
  occupancyRate?: number;
}

export interface AIInsight {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action: string;
}

// ==================== API SERVICE ====================

const BASE_URL = '/api/v1/channel-manager';

export const channelManagerService = {
  // ==================== OTA CONNECTIONS ====================

  /**
   * Get all OTA connections
   */
  async getOTAs(): Promise<{ items: OTAConnection[]; total: number }> {
    const response = await apiClient.get(`${BASE_URL}/otas`);
    return response.data?.data || response.data || { items: [], total: 0 };
  },

  /**
   * Get specific OTA connection
   */
  async getOTA(id: string): Promise<OTAConnection> {
    const response = await apiClient.get(`${BASE_URL}/otas/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create/Connect new OTA
   */
  async createOTA(data: {
    name?: string;
    code: string;
    credentials: {
      username: string;
      apiKey: string;
      hotelId: string;
    };
    syncSettings?: {
      autoSync?: boolean;
      syncInterval?: number;
      syncRates?: boolean;
      syncAvailability?: boolean;
      syncRestrictions?: boolean;
    };
    commission?: number;
  }): Promise<OTAConnection> {
    const response = await apiClient.post(`${BASE_URL}/otas`, data);
    return response.data?.data || response.data;
  },

  /**
   * Update OTA connection
   */
  async updateOTA(id: string, data: Partial<OTAConnection>): Promise<OTAConnection> {
    const response = await apiClient.put(`${BASE_URL}/otas/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Disconnect OTA
   */
  async deleteOTA(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/otas/${id}`);
  },

  /**
   * Test OTA connection
   */
  async testOTA(id: string): Promise<{
    connected: boolean;
    message: string;
    responseTime: number;
  }> {
    const response = await apiClient.post(`${BASE_URL}/otas/${id}/test`);
    return response.data?.data || response.data;
  },

  /**
   * Trigger manual sync for specific OTA
   */
  async syncOTA(id: string, options?: {
    syncType?: 'rates' | 'availability' | 'restrictions' | 'all';
    dateRange?: {
      start: string;
      end: string;
    };
  }): Promise<{
    syncId: string;
    status: 'pending' | 'in_progress';
    estimatedDuration: number;
  }> {
    const response = await apiClient.post(`${BASE_URL}/otas/${id}/sync`, options || {});
    return response.data?.data || response.data;
  },

  /**
   * Trigger sync for all connected OTAs
   */
  async syncAllOTAs(): Promise<{
    syncId: string;
    status: 'pending' | 'in_progress';
    estimatedDuration: number;
  }> {
    const response = await apiClient.post(`${BASE_URL}/otas/sync/all`);
    return response.data?.data || response.data;
  },

  // ==================== ROOM MAPPINGS ====================

  /**
   * Get all room mappings
   */
  async getRoomMappings(filters?: {
    otaCode?: string;
    pmsRoomTypeId?: string;
  }): Promise<{ items: RoomMapping[]; total: number }> {
    const response = await apiClient.get(`${BASE_URL}/room-mappings`, { params: filters });
    return response.data?.data || response.data || { items: [], total: 0 };
  },

  /**
   * Get specific room mapping
   */
  async getRoomMapping(id: string): Promise<RoomMapping> {
    const response = await apiClient.get(`${BASE_URL}/room-mappings/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create new room mapping
   */
  async createRoomMapping(data: {
    pmsRoomTypeId: string;
    pmsRoomType: string;
    otaCode: string;
    otaRoomType: string;
    otaRoomId: string;
    maxGuests?: number;
    defaultRatePlan?: string;
  }): Promise<RoomMapping> {
    const response = await apiClient.post(`${BASE_URL}/room-mappings`, data);
    return response.data?.data || response.data;
  },

  /**
   * Update room mapping
   */
  async updateRoomMapping(id: string, data: Partial<RoomMapping>): Promise<RoomMapping> {
    const response = await apiClient.put(`${BASE_URL}/room-mappings/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Delete room mapping
   */
  async deleteRoomMapping(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/room-mappings/${id}`);
  },

  /**
   * Auto-map all PMS room types to OTA
   */
  async autoMapRoomMappings(otaCode: string): Promise<{
    mappingsCreated: number;
    suggestions: Array<{
      pmsRoomType: string;
      suggestedOTARoomType: string;
      confidence: number;
    }>;
  }> {
    const response = await apiClient.post(`${BASE_URL}/room-mappings/auto-map`, { otaCode });
    return response.data?.data || response.data;
  },

  /**
   * Get bulk view for room mappings (all PMS room types + existing mappings for an OTA in one response)
   */
  async getRoomMappingsBulkView(otaCode: string): Promise<{
    items: Array<{
      pmsRoomTypeId: number;
      pmsRoomType: string;
      pmsRoomCode?: string;
      basePrice: number;
      inventory: number;
      mappingId?: string;
      otaRoomType?: string;
      otaRoomId?: string;
    }>;
    knownOtaRoomTypes: Array<{ otaRoomType: string; otaRoomId: string }>;
    otaCode: string;
    total: number;
  }> {
    const response = await apiClient.get(`${BASE_URL}/room-mappings/bulk-view`, {
      params: { otaCode },
    });
    const data = response.data?.data ?? response.data;
    return {
      items: data?.items ?? [],
      knownOtaRoomTypes: data?.knownOtaRoomTypes ?? [],
      otaCode: data?.otaCode ?? otaCode,
      total: data?.total ?? 0,
    };
  },

  /**
   * Create or update multiple room mappings in one request
   */
  async bulkRoomMappings(payload: {
    otaCode: string;
    mappings: Array<{
      pmsRoomTypeId: number;
      otaRoomType: string;
      otaRoomId?: string;
    }>;
  }): Promise<{ otaCode: string; created: number; updated: number; errors: string[] }> {
    const response = await apiClient.post(`${BASE_URL}/room-mappings/bulk`, payload);
    const data = response.data?.data ?? response.data;
    return {
      otaCode: data?.otaCode ?? payload.otaCode,
      created: data?.created ?? 0,
      updated: data?.updated ?? 0,
      errors: data?.errors ?? [],
    };
  },

  /**
   * Validate room mapping
   */
  async validateRoomMapping(data: {
    pmsRoomTypeId: string;
    otaCode: string;
  }): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await apiClient.post(`${BASE_URL}/room-mappings/validate`, data);
    return response.data?.data || response.data;
  },

  // ==================== RATE SYNC ====================

  /**
   * Get rate calendar
   */
  async getRateCalendar(params: {
    startDate: string;
    endDate: string;
    roomTypeId?: string;
    otaCode?: string;
  }): Promise<{
    calendar: {
      [date: string]: {
        [roomType: string]: RateCalendarEntry;
      };
    };
  }> {
    const response = await apiClient.get(`${BASE_URL}/rates/calendar`, { params });
    return response.data?.data || response.data;
  },

  /**
   * Update rate for specific date and room type
   */
  async updateRate(date: string, roomType: string, data: {
    rates?: {
      BAR?: number;
      [ratePlan: string]: number;
    };
    otaRates?: {
      [otaCode: string]: number;
    };
    availability?: number;
    stopSell?: boolean;
    cta?: boolean;
    ctd?: boolean;
  }): Promise<RateCalendarEntry> {
    const response = await apiClient.put(`${BASE_URL}/rates/calendar/${date}/${roomType}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Push rates to OTAs
   */
  async pushRates(data: {
    otaCodes: string[] | ['ALL'];
    dateRange: {
      start: string;
      end: string;
    };
    roomTypeIds: string[] | ['ALL'];
  }): Promise<{
    syncId: string;
    status: 'pending';
  }> {
    const response = await apiClient.post(`${BASE_URL}/rates/push`, data);
    return response.data?.data || response.data;
  },

  /**
   * Pull rates from OTAs
   */
  async pullRates(data: {
    otaCodes: string[] | ['ALL'];
    dateRange: {
      start: string;
      end: string;
    };
    roomTypeIds: string[] | ['ALL'];
  }): Promise<{
    syncId: string;
    status: 'pending';
  }> {
    const response = await apiClient.post(`${BASE_URL}/rates/pull`, data);
    return response.data?.data || response.data;
  },

  /**
   * Get rate parity issues
   */
  async getRateParity(params?: {
    date?: string;
    threshold?: number;
  }): Promise<{
    issues: Array<{
      date: string;
      roomType: string;
      minRate: number;
      maxRate: number;
      difference: number;
      otas: string[];
    }>;
  }> {
    const response = await apiClient.get(`${BASE_URL}/rates/parity`, { params });
    return response.data?.data || response.data;
  },

  // ==================== RESTRICTIONS ====================

  /**
   * Get all restrictions
   */
  async getRestrictions(filters?: {
    status?: 'active' | 'inactive' | 'all';
    roomType?: string;
    otaCode?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ items: Restriction[]; total: number }> {
    const response = await apiClient.get(`${BASE_URL}/restrictions`, { params: filters });
    return response.data?.data || response.data || { items: [], total: 0 };
  },

  /**
   * Get specific restriction
   */
  async getRestriction(id: string): Promise<Restriction> {
    const response = await apiClient.get(`${BASE_URL}/restrictions/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create new restriction
   */
  async createRestriction(data: {
    roomType: string | 'ALL';
    otaCode: string | 'ALL';
    dateRange: {
      start: string;
      end: string;
    };
    restriction: {
      minStay: number;
      maxStay: number | null;
      cta: boolean;
      ctd: boolean;
      stopSell: boolean;
    };
    reason?: string;
  }): Promise<Restriction> {
    const response = await apiClient.post(`${BASE_URL}/restrictions`, data);
    return response.data?.data || response.data;
  },

  /**
   * Update restriction
   */
  async updateRestriction(id: string, data: Partial<Restriction>): Promise<Restriction> {
    const response = await apiClient.put(`${BASE_URL}/restrictions/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Delete restriction
   */
  async deleteRestriction(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/restrictions/${id}`);
  },

  /**
   * Toggle restriction active status
   */
  async toggleRestriction(id: string): Promise<{ isActive: boolean }> {
    const response = await apiClient.put(`${BASE_URL}/restrictions/${id}/toggle`);
    return response.data?.data || response.data;
  },

  // ==================== PROMOTIONS ====================

  /**
   * Get all promotions
   */
  async getPromotions(filters?: {
    status?: 'active' | 'scheduled' | 'expired' | 'inactive' | 'all';
    otaCode?: string;
  }): Promise<{ items: ChannelPromotion[]; total: number }> {
    const response = await apiClient.get(`${BASE_URL}/promotions`, { params: filters });
    return response.data?.data || response.data || { items: [], total: 0 };
  },

  /**
   * Get specific promotion
   */
  async getPromotion(id: string): Promise<ChannelPromotion> {
    const response = await apiClient.get(`${BASE_URL}/promotions/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create new promotion
   */
  async createPromotion(data: {
    name: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validTo: string;
    otaCodes: string[] | ['ALL'];
    roomTypes: string[] | ['ALL'];
    minStay: number;
    bookingWindow?: {
      start: string;
      end: string;
    };
  }): Promise<ChannelPromotion> {
    const response = await apiClient.post(`${BASE_URL}/promotions`, data);
    return response.data?.data || response.data;
  },

  /**
   * Update promotion
   */
  async updatePromotion(id: string, data: Partial<ChannelPromotion>): Promise<ChannelPromotion> {
    const response = await apiClient.put(`${BASE_URL}/promotions/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Delete promotion
   */
  async deletePromotion(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/promotions/${id}`);
  },

  /**
   * Toggle promotion active status
   */
  async togglePromotion(id: string): Promise<{ isActive: boolean }> {
    const response = await apiClient.put(`${BASE_URL}/promotions/${id}/toggle`);
    return response.data?.data || response.data;
  },

  /**
   * Apply promotion to specific OTAs
   */
  async applyPromotion(id: string, data: {
    otaCodes: string[];
  }): Promise<void> {
    await apiClient.post(`${BASE_URL}/promotions/${id}/apply`, data);
  },

  // ==================== SYNC LOGS ====================

  /**
   * Get sync logs
   */
  async getSyncLogs(filters?: {
    otaCode?: string;
    action?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: SyncLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(`${BASE_URL}/sync-logs`, { params: filters });
    return response.data?.data || response.data || {
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    };
  },

  /**
   * Get specific sync log
   */
  async getSyncLog(id: string): Promise<SyncLog> {
    const response = await apiClient.get(`${BASE_URL}/sync-logs/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Clear all sync logs
   */
  async clearSyncLogs(): Promise<void> {
    await apiClient.delete(`${BASE_URL}/sync-logs`);
  },

  /**
   * Export sync logs to CSV, Excel, or PDF
   */
  async exportSyncLogs(filters?: {
    otaCode?: string;
    action?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    format?: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> {
    const response = await apiClient.get(`${BASE_URL}/sync-logs/export`, {
      params: { ...filters, format: filters?.format || 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  // ==================== STATS ====================

  /**
   * Get channel manager statistics
   */
  async getChannelStats(): Promise<ChannelStats> {
    const response = await apiClient.get(`${BASE_URL}/stats`);
    return response.data?.data || response.data;
  },

  /**
   * Get AI insights and recommendations
   */
  async getAIInsights(): Promise<{
    insights: AIInsight[];
  }> {
    const response = await apiClient.get(`${BASE_URL}/stats/insights`);
    return response.data?.data || response.data;
  },
};
