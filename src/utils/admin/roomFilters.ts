/**
 * Room filtering utilities
 */

/**
 * Filter by tab (all, available, occupied, dirty, out_of_service, out_of_order)
 * Note: out_of_service (OOS) and out_of_order (OOO) are distinct:
 * - OOS: Minor issues, room can be sold in emergency
 * - OOO: Major issues (plumbing, electrical, renovation), room CANNOT be sold
 */
export function filterByTab(rooms, tab) {
  switch (tab) {
    case 'all':
      return rooms;
    case 'available':
      return rooms.filter(r => r.status === 'available');
    case 'occupied':
      return rooms.filter(r => r.status === 'occupied');
    case 'dirty':
      return rooms.filter(r => r.status === 'dirty');
    case 'out_of_service':
      return rooms.filter(r => r.status === 'out_of_service');
    case 'out_of_order':
      return rooms.filter(r => r.status === 'out_of_order');
    default:
      return rooms;
  }
}

/**
 * Apply advanced filters to room list
 */
export function filterRooms(rooms, filters) {
  let filtered = [...rooms];

  // Room type filter
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(r => r.type === filters.type);
  }

  // Floor filter
  if (filters.floor && filters.floor !== 'all') {
    filtered = filtered.filter(r => r.floor === parseInt(filters.floor));
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(r => r.status === filters.status);
  }

  // Cleaning filter
  if (filters.cleaning && filters.cleaning !== 'all') {
    filtered = filtered.filter(r => r.cleaning === filters.cleaning);
  }

  return filtered;
}

/**
 * Search rooms by room number, type, or guest name
 */
export function searchRooms(rooms, query) {
  if (!query || query.trim() === '') return rooms;

  const lowerQuery = query.toLowerCase().trim();

  return rooms.filter(room => {
    const roomNumberMatch = room.roomNumber.toLowerCase().includes(lowerQuery);
    const typeMatch = room.type.toLowerCase().includes(lowerQuery);
    const guestMatch = room.guests && room.guests.name.toLowerCase().includes(lowerQuery);
    const bedTypeMatch = room.bedType.toLowerCase().includes(lowerQuery);

    return roomNumberMatch || typeMatch || guestMatch || bedTypeMatch;
  });
}
