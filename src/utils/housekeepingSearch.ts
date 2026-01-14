/**
 * Housekeeping Search Utility
 * Fuzzy, case-insensitive search across multiple fields
 */

export function searchRooms(rooms, query) {
  if (!query || query.trim() === '') return rooms;

  const searchTerm = query.toLowerCase().trim();

  // Check if searching for floor pattern (e.g., "floor 1", "floor 2", "f1", "f2")
  const floorMatch = searchTerm.match(/^(?:floor\s*)?(\d+)$/i) || searchTerm.match(/^f(\d+)$/i);
  const searchingForFloor = floorMatch ? parseInt(floorMatch[1], 10) : null;

  return rooms.filter((room) => {
    // If searching specifically for floor number
    if (searchingForFloor !== null) {
      if (room.floor === searchingForFloor) return true;
    }

    // Search room number
    const roomNumber = (room.roomNumber || room.number)?.toString().toLowerCase() || '';
    if (roomNumber.includes(searchTerm)) return true;

    // Search floor (also check "floor X" format)
    const floor = room.floor?.toString() || '';
    if (floor === searchTerm) return true;
    if (`floor ${floor}`.includes(searchTerm)) return true;

    // Search room type
    const type = (room.type || room.roomType)?.toLowerCase() || '';
    if (type.includes(searchTerm)) return true;

    // Search status
    const status = room.status?.toLowerCase() || '';
    if (status.includes(searchTerm)) return true;

    // Search cleaning status
    const cleaningStatus = room.cleaningStatus?.toLowerCase() || '';
    if (cleaningStatus.includes(searchTerm)) return true;

    // Search notes
    const notes = room.notes?.toLowerCase() || '';
    if (notes.includes(searchTerm)) return true;

    // Search assigned staff name (comes from API)
    if (room.assignedStaffName) {
      const staffName = room.assignedStaffName.toLowerCase();
      if (staffName.includes(searchTerm)) return true;
    }

    // Search assignedStaff.name for StaffView compatibility
    if (room.assignedStaff?.name) {
      const staffName = room.assignedStaff.name.toLowerCase();
      if (staffName.includes(searchTerm)) return true;
    }

    return false;
  });
}
