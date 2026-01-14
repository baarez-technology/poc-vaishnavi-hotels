/**
 * Inventory Service
 * Handles all inventory management API calls including rooms, rates, availability, and OTA sync.
 */

import { apiClient } from '../client';

// ============================================
// TYPES
// ============================================

export interface RoomTypeData {
  id: number;
  name: string;
  slug: string;
  category?: string;
  description: string;
  base_price: number;
  max_guests: number;
  total_rooms: number;
  amenities?: string[];
  images?: string[];
  is_active: boolean;
}

export interface RatePlanData {
  id: number;
  code: string;
  name: string;
  description?: string;
  plan_type: string;
  base_price: number;
  currency: string;
  is_active: boolean;
}

export interface PromotionData {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  usage_count: number;
  usage_limit?: number;
  is_active: boolean;
}

export interface OTAChannelData {
  id: number;
  code: string;
  name: string;
  logo_url?: string;
  is_connected: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  last_sync_status?: string;
  commission_percent: number;
}

export interface SyncStatus {
  pending_syncs: number;
  last_sync_at?: string;
  last_sync_status?: string;
}

export interface InventoryState {
  room_types: RoomTypeData[];
  rate_plans: RatePlanData[];
  promotions: PromotionData[];
  ota_channels: OTAChannelData[];
  sync_status: SyncStatus;
}

export interface AvailabilityGridCell {
  date: string;
  room_type_id: number;
  room_type_name: string;
  total: number;
  sold: number;
  blocked: number;
  available: number;
  rate?: number;
  min_stay: number;
  max_stay?: number;
  closed_to_arrival: boolean;
  closed_to_departure: boolean;
  is_closed: boolean;
}

export interface AvailabilityGridResponse {
  start_date: string;
  end_date: string;
  grid: AvailabilityGridCell[];
}

export interface RateGridCell {
  date: string;
  room_type_id: number;
  room_type_name: string;
  rate_plan_id: number;
  rate_plan_code: string;
  base_rate: number;
  override_rate?: number;
  effective_rate: number;
}

export interface RateGridResponse {
  start_date: string;
  end_date: string;
  grid: RateGridCell[];
}

export interface DailyRateUpdate {
  room_type_id: number;
  rate_plan_id: number;
  date: string;
  rate: number;
  reason?: string;
}

export interface BulkRateUpdate {
  room_type_id: number;
  rate_plan_id: number;
  start_date: string;
  end_date: string;
  rate: number;
  reason?: string;
}

export interface AvailabilityUpdate {
  room_type_id: number;
  target_date: string;
  is_closed?: boolean;
  min_stay?: number;
  max_stay?: number;
  closed_to_arrival?: boolean;
  closed_to_departure?: boolean;
}

export interface OTAChannelCreate {
  code: string;
  name: string;
  logo_url?: string;
  api_endpoint?: string;
  api_key?: string;
  commission_percent?: number;
}

export interface SyncLogEntry {
  id: number;
  ota_channel_id: number;
  sync_type: string;
  sync_direction: string;
  started_at: string;
  completed_at?: string;
  status: string;
  records_synced: number;
  records_failed: number;
  error_message?: string;
}

export interface SyncQueueItem {
  id: number;
  ota_channel_id?: number;
  room_type_id?: number;
  sync_type: string;
  date: string;
  change_type: string;
  status: string;
  priority: number;
  queued_at: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get complete inventory state
 */
export const getInventoryState = async (): Promise<InventoryState> => {
  const response = await apiClient.get('/api/v1/inventory/state');
  return response.data;
};

/**
 * Get availability grid for date range
 */
export const getAvailabilityGrid = async (
  startDate: string,
  endDate: string,
  roomTypeId?: number
): Promise<AvailabilityGridResponse> => {
  const params: any = {
    start_date: startDate,
    end_date: endDate
  };

  if (roomTypeId) {
    params.room_type_id = roomTypeId;
  }

  const response = await apiClient.get('/api/v1/inventory/availability-grid', { params });
  return response.data;
};

/**
 * Update availability restrictions for a specific date
 */
export const updateAvailability = async (
  updates: AvailabilityUpdate
): Promise<{ success: boolean; message: string }> => {
  const params = {
    room_type_id: updates.room_type_id,
    target_date: updates.target_date,
    is_closed: updates.is_closed,
    min_stay: updates.min_stay,
    max_stay: updates.max_stay,
    closed_to_arrival: updates.closed_to_arrival,
    closed_to_departure: updates.closed_to_departure
  };

  const response = await apiClient.post('/api/v1/inventory/availability-grid/update', null, { params });
  return response.data;
};

/**
 * Get rate grid for date range
 */
export const getRateGrid = async (
  startDate: string,
  endDate: string,
  roomTypeId?: number,
  ratePlanId?: number
): Promise<RateGridResponse> => {
  const params: any = {
    start_date: startDate,
    end_date: endDate
  };

  if (roomTypeId) {
    params.room_type_id = roomTypeId;
  }
  if (ratePlanId) {
    params.rate_plan_id = ratePlanId;
  }

  const response = await apiClient.get('/api/v1/inventory/rate-grid', { params });
  return response.data;
};

/**
 * Update single rate
 */
export const updateRate = async (
  payload: DailyRateUpdate
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/api/v1/inventory/rate-grid/update', payload);
  return response.data;
};

/**
 * Bulk update rates for a date range
 */
export const bulkUpdateRates = async (
  payload: BulkRateUpdate
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/api/v1/inventory/rate-grid/bulk-update', payload);
  return response.data;
};

/**
 * Get all OTA channels
 */
export const getOTAChannels = async (): Promise<OTAChannelData[]> => {
  const response = await apiClient.get('/api/v1/inventory/ota-channels');
  return response.data;
};

/**
 * Create a new OTA channel
 */
export const createOTAChannel = async (
  payload: OTAChannelCreate
): Promise<OTAChannelData> => {
  const response = await apiClient.post('/api/v1/inventory/ota-channels', payload);
  return response.data;
};

/**
 * Trigger OTA sync
 */
export const triggerOTASync = async (
  channelId: number,
  syncType: string = 'full',
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; message: string; sync_log_id: number }> => {
  const params: any = { sync_type: syncType };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.post(`/api/v1/inventory/ota-channels/${channelId}/sync`, null, { params });
  return response.data;
};

/**
 * Get sync logs
 */
export const getSyncLogs = async (
  otaChannelId?: number,
  limit: number = 50
): Promise<SyncLogEntry[]> => {
  const params: any = { limit };
  if (otaChannelId) params.ota_channel_id = otaChannelId;

  const response = await apiClient.get('/api/v1/inventory/sync-logs', { params });
  return response.data;
};

/**
 * Get sync queue
 */
export const getSyncQueue = async (
  status: string = 'pending',
  limit: number = 100
): Promise<SyncQueueItem[]> => {
  const response = await apiClient.get('/api/v1/inventory/sync-queue', {
    params: { status, limit }
  });
  return response.data;
};

export default {
  getInventoryState,
  getAvailabilityGrid,
  updateAvailability,
  getRateGrid,
  updateRate,
  bulkUpdateRates,
  getOTAChannels,
  createOTAChannel,
  triggerOTASync,
  getSyncLogs,
  getSyncQueue
};
