import { useState, useMemo, useEffect, useCallback } from 'react';
import { filterByTab, filterRooms, searchRooms } from '@/utils/admin/roomFilters';
import { roomsService } from '@/api/services/rooms.service';

/**
 * Transform API room to admin panel format
 */
function transformApiRoom(apiRoom: any): any {
  // Extract room number from API response
  const roomNumber = apiRoom.number || apiRoom.name?.split(' ').pop() || String(apiRoom.id);

  // Extract room type from category or name
  const roomType = apiRoom.category
    ? apiRoom.category.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : apiRoom.room_type || apiRoom.name?.replace(/\s+\d+$/, '') || 'Standard Room';

  return {
    id: apiRoom.id,
    roomNumber: roomNumber,
    type: roomType,
    floor: apiRoom.floor || 1,
    status: mapRoomStatus(apiRoom.status),
    cleaning: apiRoom.status === 'available' || apiRoom.status === 'clean' || apiRoom.status === 'inspected' ? 'clean' : 'dirty',
    bedType: apiRoom.bedType || apiRoom.bed_type || 'King',
    viewType: apiRoom.view || apiRoom.view_type || apiRoom.viewType || 'Standard',
    capacity: apiRoom.maxGuests || apiRoom.capacity || 2,
    maxOccupancy: apiRoom.maxGuests || apiRoom.max_occupancy || apiRoom.maxOccupancy || 2,
    price: apiRoom.price || 150,
    amenities: Array.isArray(apiRoom.amenities) ? apiRoom.amenities : [],
    guests: null,
    blockedReason: null,
    blockedUntil: null,
    lastCleaned: apiRoom.last_cleaned,
  };
}

/**
 * Map backend status to admin panel status
 */
function mapRoomStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'clean': 'available',
    'inspected': 'available',
    'available': 'available',
    'occupied': 'occupied',
    'dirty': 'dirty',
    'cleaning': 'dirty',
    'in_progress': 'dirty',
    'maintenance': 'out_of_service',
    'out_of_service': 'out_of_service',
    'out_of_order': 'out_of_service',
  };
  return statusMap[status?.toLowerCase()] || 'available';
}

/**
 * Master hook for room state management
 * Implements complete data pipeline and all room operations
 * Fetches data from backend API
 */
export function useRooms() {
  // Raw data state - start empty and fetch from API
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rooms from API on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[useRooms] Fetching rooms from API...');
        const apiRooms = await roomsService.getRooms({ pageSize: 100 });
        console.log('[useRooms] API response:', apiRooms);
        if (Array.isArray(apiRooms) && apiRooms.length > 0) {
          const transformedRooms = apiRooms.map(transformApiRoom);
          console.log('[useRooms] Transformed rooms:', transformedRooms.length);
          setRooms(transformedRooms);
        } else {
          console.log('[useRooms] No rooms returned or empty array');
          setError('No rooms found. Please check your authentication.');
        }
      } catch (err: any) {
        console.error('[useRooms] Failed to fetch rooms from API:', err);
        console.error('[useRooms] Error details:', err.response?.status, err.response?.data);
        setError(`Failed to load rooms: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState('all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    type: 'all',
    floor: 'all',
    status: 'all',
    cleaning: 'all'
  });

  // Filter management functions
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      floor: 'all',
      status: 'all',
      cleaning: 'all'
    });
  };

  const hasActiveFilters = () => {
    return filters.type !== 'all'
      || filters.floor !== 'all'
      || filters.status !== 'all'
      || filters.cleaning !== 'all';
  };

  // Room update function
  const updateRoom = async (id: number | string, updates: any) => {
    try {
      // Call API to update room
      await roomsService.updateRoom(id, updates);
    } catch (err) {
      console.error('[useRooms] Failed to update room via API:', err);
    }
    // Update local state regardless
    setRooms(prev => prev.map(r => r.id === id || String(r.id) === String(id) ? { ...r, ...updates } : r));
  };

  // Update room status
  const updateStatus = async (roomId: number | string, newStatus: string) => {
    // Map frontend status to backend status
    const backendStatusMap: Record<string, string> = {
      'available': 'available',
      'occupied': 'occupied',
      'dirty': 'dirty',
      'out_of_service': 'maintenance',
    };
    const backendStatus = backendStatusMap[newStatus] || newStatus;

    try {
      await roomsService.updateRoomStatus(roomId, backendStatus);
      console.log('[useRooms] Room status updated via API');
    } catch (err) {
      console.error('[useRooms] Failed to update room status via API:', err);
    }
    // Update local state
    setRooms(prev => prev.map(r =>
      r.id === roomId || String(r.id) === String(roomId) ? { ...r, status: newStatus } : r
    ));
  };

  // Set cleaning state (mark clean or dirty)
  const setCleaningState = async (roomId: number | string, cleaningState: string) => {
    try {
      if (cleaningState === 'clean') {
        await roomsService.markClean(roomId);
      } else {
        await roomsService.markDirty(roomId);
      }
      console.log('[useRooms] Cleaning state updated via API');
    } catch (err) {
      console.error('[useRooms] Failed to update cleaning state via API:', err);
    }
    // Update local state
    setRooms(prev => prev.map(r => {
      if (r.id === roomId || String(r.id) === String(roomId)) {
        // If marking clean and room was dirty, set status to available
        if (cleaningState === 'clean' && r.status === 'dirty') {
          return { ...r, cleaning: cleaningState, status: 'available' };
        }
        // If marking dirty and room was available, set status to dirty
        if (cleaningState === 'dirty' && r.status === 'available') {
          return { ...r, cleaning: cleaningState, status: 'dirty' };
        }
        // Otherwise just update cleaning state
        return { ...r, cleaning: cleaningState };
      }
      return r;
    }));
  };

  // Assign guest to room
  const assignGuestToRoom = async (roomId: number | string, guest: any) => {
    try {
      // Update room status to occupied via API
      await roomsService.updateRoomStatus(roomId, 'occupied');
      console.log('[useRooms] Guest assigned via API');
    } catch (err) {
      console.error('[useRooms] Failed to assign guest via API:', err);
    }
    // Update local state
    setRooms(prev => prev.map(r => {
      if (r.id === roomId || String(r.id) === String(roomId)) {
        // Only assign if room is available and not out of service
        if (r.status === 'available' && r.status !== 'out_of_service') {
          return {
            ...r,
            status: 'occupied',
            guests: guest
          };
        }
      }
      return r;
    }));
  };

  // Unassign guest from room
  const unassignGuest = async (roomId: number | string) => {
    try {
      // Update room status to dirty (checkout = room needs cleaning)
      await roomsService.updateRoomStatus(roomId, 'dirty');
      console.log('[useRooms] Guest unassigned via API');
    } catch (err) {
      console.error('[useRooms] Failed to unassign guest via API:', err);
    }
    // Update local state
    setRooms(prev => prev.map(r => {
      if ((r.id === roomId || String(r.id) === String(roomId)) && r.status === 'occupied') {
        return {
          ...r,
          status: 'dirty',
          cleaning: 'dirty',
          guests: null
        };
      }
      return r;
    }));
  };

  // Block room
  const blockRoom = async (roomId: number | string, reason: string, until?: string) => {
    try {
      await roomsService.blockRoom(roomId, reason);
      console.log('[useRooms] Room blocked via API');
    } catch (err) {
      console.error('[useRooms] Failed to block room via API:', err);
    }
    // Update local state
    setRooms(prev => prev.map(r => {
      if (r.id === roomId || String(r.id) === String(roomId)) {
        return {
          ...r,
          status: 'out_of_service',
          guests: null,
          blockedReason: reason,
          blockedUntil: until || null
        };
      }
      return r;
    }));
  };

  // Unblock room
  const unblockRoom = async (roomId: number | string) => {
    try {
      await roomsService.unblockRoom(roomId);
      console.log('[useRooms] Room unblocked via API');
    } catch (err) {
      console.error('[useRooms] Failed to unblock room via API:', err);
    }
    // Update local state
    setRooms(prev => prev.map(r => {
      if ((r.id === roomId || String(r.id) === String(roomId)) && r.status === 'out_of_service') {
        return {
          ...r,
          status: 'available',
          blockedReason: null,
          blockedUntil: null
        };
      }
      return r;
    }));
  };

  // Add new room via API
  const addRoom = async (roomData: any) => {
    try {
      // Map frontend fields to API fields
      const apiData = {
        number: roomData.roomNumber,
        room_type: roomData.type,
        floor: roomData.floor,
        status: roomData.status || 'available',
        capacity: roomData.capacity,
        max_occupancy: roomData.maxOccupancy || roomData.capacity,
        bed_type: roomData.bedType,
        view_type: roomData.viewType,
        amenities: Array.isArray(roomData.amenities) ? roomData.amenities.join(', ') : roomData.amenities,
      };

      const createdRoom = await roomsService.createRoom(apiData);
      console.log('[useRooms] Room created via API:', createdRoom);

      // Transform and add to local state
      const transformedRoom = transformApiRoom(createdRoom);
      setRooms(prev => [transformedRoom, ...prev]);

      return createdRoom;
    } catch (err: any) {
      console.error('[useRooms] Failed to create room via API:', err);
      throw err;
    }
  };

  // Delete room via API
  const deleteRoom = async (roomId: number | string) => {
    try {
      await roomsService.deleteRoom(roomId);
      console.log('[useRooms] Room deleted via API');
    } catch (err) {
      console.error('[useRooms] Failed to delete room via API:', err);
    }
    // Update local state
    setRooms(prev => prev.filter(r => r.id !== roomId && String(r.id) !== String(roomId)));
  };

  // Data processing pipeline
  const processedRooms = useMemo(() => {
    let result = filterByTab(rooms, activeTab);
    result = filterRooms(result, filters);
    result = searchRooms(result, searchQuery);
    return result;
  }, [rooms, activeTab, filters, searchQuery]);

  return {
    rooms: processedRooms,
    rawRooms: rooms,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    updateRoom,
    updateStatus,
    setCleaningState,
    assignGuestToRoom,
    unassignGuest,
    blockRoom,
    unblockRoom,
    addRoom,
    deleteRoom
  };
}
