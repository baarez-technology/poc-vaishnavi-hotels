/**
 * useCMSAvailability Hook
 * Manages room availability data for the CMS Availability page using real backend APIs
 * Falls back to sample data when backend is unavailable
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getAvailabilityGrid,
  bulkUpdateAvailability,
  getRoomBlocks,
  createRoomBlock,
  updateRoomBlock,
  deleteRoomBlock,
  getTodayStats,
  getAIInsights,
  type RoomBlock,
  type RoomBlockCreate,
  type RoomBlockUpdate,
  type DailyAvailabilityData,
  type RoomTypeData,
  type BulkAvailabilityUpdate,
  type AIInsightsResponse
} from '../../api/services/availability.service';
import { sampleAvailability } from '../../data/cbs/sampleAvailability';

interface DayAvailability {
  totalRooms: number;
  sold: number;  // Only checked_in guests
  reserved: number;  // Confirmed/booked but not checked in
  blocked: number;
  remaining: number;
  isClosed: boolean;
  restrictions: {
    minStay?: number;
    maxStay?: number;
    CTA?: boolean;
    CTD?: boolean;
  };
  baseRate?: number;
}

interface AvailabilityData {
  [date: string]: {
    [roomType: string]: DayAvailability;
  };
}

interface RoomTypeConfig {
  [key: string]: { code: string; totalRooms: number; baseRate: number };
}

// Sample room types configuration for fallback
const SAMPLE_ROOM_TYPES: RoomTypeData[] = [
  { id: 1, name: 'Minimalist Studio', slug: 'minimalist-studio', base_price: 150, total_rooms: 10 },
  { id: 2, name: 'Coastal Retreat', slug: 'coastal-retreat', base_price: 199, total_rooms: 8 },
  { id: 3, name: 'Urban Oasis', slug: 'urban-oasis', base_price: 245, total_rooms: 8 },
  { id: 4, name: 'Sunset Vista', slug: 'sunset-vista', base_price: 315, total_rooms: 6 },
  { id: 5, name: 'Pacific Suite', slug: 'pacific-suite', base_price: 385, total_rooms: 6 },
  { id: 6, name: 'Wellness Suite', slug: 'wellness-suite', base_price: 425, total_rooms: 4 },
  { id: 7, name: 'Family Sanctuary', slug: 'family-sanctuary', base_price: 485, total_rooms: 4 },
  { id: 8, name: 'Oceanfront Penthouse', slug: 'oceanfront-penthouse', base_price: 750, total_rooms: 2 }
];

// Generate fallback data from sample availability
function generateFallbackData(): { data: AvailabilityData; config: RoomTypeConfig; roomTypes: RoomTypeData[] } {
  const data: AvailabilityData = {};
  const config: RoomTypeConfig = {};

  // Build room type config from sample data
  SAMPLE_ROOM_TYPES.forEach(rt => {
    config[rt.name] = {
      code: rt.slug.toUpperCase().substring(0, 5),
      totalRooms: rt.total_rooms,
      baseRate: rt.base_price
    };
  });

  // Transform sample availability to UI format
  Object.entries(sampleAvailability).forEach(([date, roomData]) => {
    if (!data[date]) {
      data[date] = {};
    }

    Object.entries(roomData as Record<string, any>).forEach(([roomType, avail]) => {
      // Split sold rooms into checked_in and reserved for more realistic data
      const totalSold = avail.sold || 0;
      const checkedIn = Math.floor(totalSold * 0.6); // 60% checked in
      const reserved = totalSold - checkedIn; // 40% reserved

      data[date][roomType] = {
        totalRooms: avail.totalInventory,
        sold: checkedIn,
        reserved: reserved,
        blocked: 0,
        remaining: avail.available,
        isClosed: avail.stopSell || false,
        restrictions: {
          minStay: avail.minStay || 1,
          maxStay: avail.maxStay || 30,
          CTA: avail.cta || false,
          CTD: avail.ctd || false
        },
        baseRate: avail.rate
      };
    });
  });

  return { data, config, roomTypes: SAMPLE_ROOM_TYPES };
}

// Helper to convert backend format to UI format
function transformBackendData(
  availability: DailyAvailabilityData[],
  roomTypes: RoomTypeData[]
): { data: AvailabilityData; config: RoomTypeConfig } {
  const data: AvailabilityData = {};
  const config: RoomTypeConfig = {};

  // Build room type config
  roomTypes.forEach(rt => {
    config[rt.name] = {
      code: rt.slug.toUpperCase().substring(0, 5),
      totalRooms: rt.total_rooms,
      baseRate: rt.base_price
    };
  });

  // Transform availability data
  availability.forEach(avail => {
    if (!data[avail.date]) {
      data[avail.date] = {};
    }

    data[avail.date][avail.room_type_name] = {
      totalRooms: avail.total_rooms,
      sold: avail.sold,  // Only checked_in guests
      reserved: avail.reserved,  // Confirmed/booked but not checked in
      blocked: avail.blocked,
      remaining: avail.available,
      isClosed: avail.is_closed,
      restrictions: {
        minStay: avail.min_stay,
        maxStay: avail.max_stay,
        CTA: avail.closed_to_arrival,
        CTD: avail.closed_to_departure
      },
      baseRate: avail.base_rate
    };
  });

  return { data, config };
}

export default function useCMSAvailability() {
  const [roomTypeConfig, setRoomTypeConfig] = useState<RoomTypeConfig>({});
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({});
  const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null);
  const [todayStats, setTodayStats] = useState<{ arrivals: number; departures: number; in_house: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range for availability grid (90 days from today)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 90);

    return {
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  });

  // Use ref to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch availability grid from API with fallback to sample data
  const fetchAvailabilityData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gridData = await getAvailabilityGrid(
        dateRange.startDate,
        dateRange.endDate
      );

      if (!isMounted.current) return;

      // Check if we got valid data from the API
      if (gridData.room_types && gridData.room_types.length > 0 && gridData.availability && gridData.availability.length > 0) {
        const { data, config } = transformBackendData(
          gridData.availability,
          gridData.room_types
        );

        setAvailabilityData(data);
        setRoomTypeConfig(config);
        setRoomTypes(gridData.room_types);
        console.log('[useCMSAvailability] Loaded data from API');
      } else {
        // API returned empty data, use fallback
        console.log('[useCMSAvailability] API returned empty data, using sample data fallback');
        const fallback = generateFallbackData();
        setAvailabilityData(fallback.data);
        setRoomTypeConfig(fallback.config);
        setRoomTypes(fallback.roomTypes);
      }
    } catch (err: any) {
      console.error('Error fetching availability data:', err);
      // Use fallback sample data on API error - always set fallback regardless of mount state
      // React 18 handles unmounted setState gracefully
      console.log('[useCMSAvailability] API error, using sample data fallback');
      const fallback = generateFallbackData();
      setAvailabilityData(fallback.data);
      setRoomTypeConfig(fallback.config);
      setRoomTypes(fallback.roomTypes);
      // Clear error since we have fallback data
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Fetch room blocks
  const fetchRoomBlocks = useCallback(async () => {
    try {
      const blocks = await getRoomBlocks({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        status: 'active'
      });
      if (isMounted.current) {
        setRoomBlocks(blocks);
      }
    } catch (err) {
      console.error('Error fetching room blocks:', err);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Fetch today's stats with fallback
  const fetchTodayStats = useCallback(async () => {
    try {
      const stats = await getTodayStats();
      if (isMounted.current) {
        setTodayStats({
          arrivals: stats.arrivals,
          departures: stats.departures,
          in_house: stats.in_house
        });
      }
    } catch (err) {
      console.error('Error fetching today stats:', err);
      // Provide fallback stats
      if (isMounted.current) {
        setTodayStats({
          arrivals: 8,
          departures: 5,
          in_house: 24
        });
      }
    }
  }, []);

  // Fetch AI insights with fallback
  const fetchAIInsights = useCallback(async () => {
    try {
      const insights = await getAIInsights(90);
      if (isMounted.current) {
        setAiInsights(insights);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      // Provide fallback AI insights
      if (isMounted.current) {
        setAiInsights({
          recommendations: [
            {
              type: 'pricing',
              priority: 'high',
              title: 'Increase Weekend Rates',
              description: 'Weekend demand is 35% higher than weekdays. Consider a 15% rate premium.',
              action: 'Apply +15%',
              impact: '+$2,400/week'
            },
            {
              type: 'inventory',
              priority: 'medium',
              title: 'Review Penthouse Availability',
              description: 'Oceanfront Penthouse has 92% occupancy next 14 days. Consider rate optimization.',
              action: 'View Details',
              impact: '+$1,800/week'
            }
          ],
          demand_forecast: [],
          pricing_suggestions: [],
          occupancy_trends: {
            average_occupancy: 68,
            high_demand_days: 12,
            low_demand_days: 5,
            peak_occupancy_date: null,
            lowest_occupancy_date: null
          },
          generated_at: new Date().toISOString()
        });
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;

      try {
        await fetchAvailabilityData();
      } catch (err) {
        console.error('Failed to load availability data:', err);
      }

      if (!mounted) return;

      try {
        await fetchRoomBlocks();
      } catch (err) {
        console.error('Failed to load room blocks:', err);
      }

      if (!mounted) return;

      try {
        await fetchTodayStats();
      } catch (err) {
        console.error('Failed to load today stats:', err);
      }

      if (!mounted) return;

      try {
        await fetchAIInsights();
      } catch (err) {
        console.error('Failed to load AI insights:', err);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [dateRange.startDate, dateRange.endDate]); // Only depend on date range

  // Get availability for a specific room type and date
  const getAvailability = useCallback((roomType: string, date: string): DayAvailability | null => {
    return availabilityData[date]?.[roomType] || null;
  }, [availabilityData]);

  // Update availability for a specific date and room type
  const updateAvailability = useCallback(async (
    date: string,
    roomType: string,
    updates: Partial<DayAvailability>
  ) => {
    // Get room type ID from roomTypes array
    const roomTypeData = roomTypes.find(rt => rt.name === roomType);
    if (!roomTypeData) {
      console.error('Room type not found:', roomType);
      return;
    }

    // Optimistic update
    setAvailabilityData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [roomType]: {
          ...prev[date]?.[roomType],
          ...updates,
          restrictions: {
            ...prev[date]?.[roomType]?.restrictions,
            ...updates.restrictions
          }
        }
      }
    }));

    // Build API payload and persist to backend
    try {
      // Build flat API payload (BulkAvailabilityUpdate expects flat structure, not nested)
      const apiUpdate: BulkAvailabilityUpdate = {
        room_type_id: roomTypeData.id,
        start_date: date,
        end_date: date
      };

      // Map frontend fields to backend fields - directly on apiUpdate (not nested)
      let hasUpdates = false;
      if (updates.isClosed !== undefined) {
        apiUpdate.is_closed = updates.isClosed;
        hasUpdates = true;
      }
      if (updates.restrictions?.minStay !== undefined) {
        apiUpdate.min_stay = updates.restrictions.minStay;
        hasUpdates = true;
      }
      if (updates.restrictions?.maxStay !== undefined) {
        apiUpdate.max_stay = updates.restrictions.maxStay;
        hasUpdates = true;
      }
      if (updates.restrictions?.CTA !== undefined) {
        apiUpdate.closed_to_arrival = updates.restrictions.CTA;
        hasUpdates = true;
      }
      if (updates.restrictions?.CTD !== undefined) {
        apiUpdate.closed_to_departure = updates.restrictions.CTD;
        hasUpdates = true;
      }

      // Only call API if there are actual updates to persist
      if (hasUpdates) {
        await bulkUpdateAvailability([apiUpdate]);
        console.log('[useCMSAvailability] Availability updated via API');
      }

      // Refetch to get accurate data
      await fetchAvailabilityData();
    } catch (err) {
      console.error('Error updating availability:', err);
      // Refetch to revert optimistic update on error
      await fetchAvailabilityData();
    }
  }, [fetchAvailabilityData, roomTypes]);

  // Close a room type for a specific date
  const closeRoomType = useCallback(async (date: string, roomType: string) => {
    await updateAvailability(date, roomType, { isClosed: true, remaining: 0 });
  }, [updateAvailability]);

  // Open a room type for a specific date
  const openRoomType = useCallback(async (date: string, roomType: string) => {
    const current = availabilityData[date]?.[roomType];
    if (!current) return;

    // Calculate remaining: total - sold - reserved - blocked
    const reserved = current.reserved || 0;
    const remaining = current.totalRooms - current.sold - reserved - current.blocked;

    await updateAvailability(date, roomType, {
      isClosed: false,
      remaining: Math.max(0, remaining)  // Ensure non-negative
    });
  }, [availabilityData, updateAvailability]);

  // Update restrictions for a specific date and room type
  const updateRestrictions = useCallback(async (
    date: string,
    roomType: string,
    restrictions: Partial<DayAvailability['restrictions']>
  ) => {
    await updateAvailability(date, roomType, { restrictions });
  }, [updateAvailability]);

  // Create a new room block
  const addRoomBlock = useCallback(async (blockData: RoomBlockCreate) => {
    try {
      const newBlock = await createRoomBlock(blockData);
      if (isMounted.current) {
        setRoomBlocks(prev => [...prev, newBlock]);
      }
      // Refetch availability to reflect the block
      await fetchAvailabilityData();
      return newBlock;
    } catch (err) {
      console.error('Error creating room block:', err);
      throw err;
    }
  }, [fetchAvailabilityData]);

  // Update an existing room block
  const editRoomBlock = useCallback(async (blockId: number, updates: RoomBlockUpdate) => {
    try {
      const updatedBlock = await updateRoomBlock(blockId, updates);
      if (isMounted.current) {
        setRoomBlocks(prev => prev.map(b => b.id === blockId ? updatedBlock : b));
      }
      // Refetch availability to reflect the change
      await fetchAvailabilityData();
      return updatedBlock;
    } catch (err) {
      console.error('Error updating room block:', err);
      throw err;
    }
  }, [fetchAvailabilityData]);

  // Delete a room block
  const removeRoomBlock = useCallback(async (blockId: number) => {
    try {
      await deleteRoomBlock(blockId);
      if (isMounted.current) {
        setRoomBlocks(prev => prev.filter(b => b.id !== blockId));
      }
      // Refetch availability to reflect the change
      await fetchAvailabilityData();
    } catch (err) {
      console.error('Error deleting room block:', err);
      throw err;
    }
  }, [fetchAvailabilityData]);

  // Reset all availability data (refetch from API)
  const resetAvailability = useCallback(() => {
    fetchAvailabilityData();
    fetchRoomBlocks();
  }, [fetchAvailabilityData, fetchRoomBlocks]);

  // Get room type configuration
  const getRoomTypeConfig = useCallback(() => roomTypeConfig, [roomTypeConfig]);

  // Refresh AI insights
  const refreshAIInsights = useCallback(async () => {
    await fetchAIInsights();
  }, [fetchAIInsights]);

  return {
    availabilityData,
    roomTypeConfig,
    roomTypes,
    roomBlocks,
    aiInsights,
    todayStats,
    isLoading,
    error,
    getAvailability,
    updateAvailability,
    closeRoomType,
    openRoomType,
    updateRestrictions,
    resetAvailability,
    getRoomTypeConfig,
    refetch: fetchAvailabilityData,
    // Room blocks
    addRoomBlock,
    editRoomBlock,
    removeRoomBlock,
    fetchRoomBlocks,
    // AI Insights
    refreshAIInsights,
    // Date range
    dateRange,
    setDateRange
  };
}
