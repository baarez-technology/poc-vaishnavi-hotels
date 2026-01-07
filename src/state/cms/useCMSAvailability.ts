/**
 * useCMSAvailability Hook
 * Manages room availability data for the CMS Availability page using real backend APIs
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

  // Fetch availability grid from API
  const fetchAvailabilityData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gridData = await getAvailabilityGrid(
        dateRange.startDate,
        dateRange.endDate
      );

      if (!isMounted.current) return;

      const { data, config } = transformBackendData(
        gridData.availability,
        gridData.room_types
      );

      setAvailabilityData(data);
      setRoomTypeConfig(config);
    } catch (err: any) {
      console.error('Error fetching availability data:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load availability data');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
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

  // Fetch today's stats
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
    }
  }, []);

  // Fetch AI insights
  const fetchAIInsights = useCallback(async () => {
    try {
      const insights = await getAIInsights(90);
      if (isMounted.current) {
        setAiInsights(insights);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
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

    // Refetch to get accurate data
    try {
      await fetchAvailabilityData();
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  }, [fetchAvailabilityData]);

  // Close a room type for a specific date
  const closeRoomType = useCallback(async (date: string, roomType: string) => {
    await updateAvailability(date, roomType, { isClosed: true, remaining: 0 });
  }, [updateAvailability]);

  // Open a room type for a specific date
  const openRoomType = useCallback(async (date: string, roomType: string) => {
    const current = availabilityData[date]?.[roomType];
    if (!current) return;

    await updateAvailability(date, roomType, {
      isClosed: false,
      remaining: current.totalRooms - current.sold - current.blocked
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
