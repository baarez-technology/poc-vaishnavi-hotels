import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { AMENITIES } from '../../utils/settings';
import AddRoomTypeModal from './AddRoomTypeModal';
import EditRoomTypeModal from './EditRoomTypeModal';
import { Button } from '../ui2/Button';

// Use localStorage for room types
const STORAGE_KEY = 'glimmora_room_types';

const defaultRoomTypes = [
  {
    id: 'rt-001',
    name: 'Standard Room',
    description: 'Comfortable room with essential amenities',
    price: 5500,
    maxOccupancy: 2,
    amenities: ['wifi', 'tv', 'ac', 'minibar'],
    inclusions: ['Breakfast', 'Wi-Fi', 'Newspaper']
  },
  {
    id: 'rt-002',
    name: 'Deluxe Room',
    description: 'Spacious room with city views',
    price: 8500,
    maxOccupancy: 3,
    amenities: ['wifi', 'tv', 'ac', 'minibar', 'safe', 'bathtub'],
    inclusions: ['Breakfast', 'Wi-Fi', 'Newspaper', 'Welcome Drink']
  },
  {
    id: 'rt-003',
    name: 'Premium Suite',
    description: 'Luxury suite with separate living area',
    price: 15000,
    maxOccupancy: 4,
    amenities: ['wifi', 'tv', 'ac', 'minibar', 'safe', 'bathtub', 'jacuzzi', 'balcony'],
    inclusions: ['Breakfast', 'Wi-Fi', 'Newspaper', 'Welcome Drink', 'Airport Transfer', 'Butler Service']
  },
  {
    id: 'rt-004',
    name: 'Presidential Suite',
    description: 'Ultimate luxury with panoramic views',
    price: 35000,
    maxOccupancy: 6,
    amenities: ['wifi', 'tv', 'ac', 'minibar', 'safe', 'bathtub', 'jacuzzi', 'balcony', 'kitchen', 'dining'],
    inclusions: ['All meals', 'Wi-Fi', 'Newspaper', 'Welcome Drink', 'Airport Transfer', 'Butler Service', 'Spa Access']
  }
];

export default function RoomTypesTab() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load room types from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRoomTypes(JSON.parse(stored));
    } else {
      setRoomTypes(defaultRoomTypes);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRoomTypes));
    }
  }, []);

  // Save room types to localStorage
  const saveRoomTypes = (newRoomTypes) => {
    setRoomTypes(newRoomTypes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoomTypes));
  };

  const handleAddRoom = (newRoom) => {
    const roomWithId = {
      ...newRoom,
      id: `rt-${Date.now()}`
    };
    saveRoomTypes([...roomTypes, roomWithId]);
    setShowAddModal(false);
  };

  const handleEditRoom = (updatedRoom) => {
    saveRoomTypes(
      roomTypes.map((rt) => (rt.id === updatedRoom.id ? updatedRoom : rt))
    );
    setEditingRoom(null);
  };

  const handleDeleteRoom = (id) => {
    saveRoomTypes(roomTypes.filter((rt) => rt.id !== id));
    setDeleteConfirm(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getAmenityLabel = (amenityId) => {
    return AMENITIES.find((a) => a.id === amenityId)?.label || amenityId;
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Room Types</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your room categories and pricing
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Room Type
        </Button>
      </div>

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roomTypes.map((room) => (
          <div
            key={room.id}
            className="bg-neutral-50/50 rounded-[10px] overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-neutral-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[13px] font-semibold text-neutral-800">{room.name}</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{room.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Pencil}
                    onClick={() => setEditingRoom(room)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setDeleteConfirm(room.id)}
                    className="hover:text-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 space-y-4">
              {/* Price and Occupancy */}
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-lg font-semibold text-neutral-900">{formatPrice(room.price)}</span>
                  <span className="text-xs text-neutral-500 ml-1">/night</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Up to {room.maxOccupancy} guests</span>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="block text-[13px] font-medium text-neutral-600 mb-1.5">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {room.amenities.slice(0, 5).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-md"
                    >
                      {getAmenityLabel(amenity)}
                    </span>
                  ))}
                  {room.amenities.length > 5 && (
                    <span className="px-2.5 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-md">
                      +{room.amenities.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Inclusions */}
              <div>
                <p className="block text-[13px] font-medium text-neutral-600 mb-1.5">Inclusions</p>
                <div className="flex flex-wrap gap-1.5">
                  {room.inclusions.slice(0, 4).map((inclusion, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-neutral-50 text-neutral-600 text-xs rounded-md border border-neutral-200"
                    >
                      {inclusion}
                    </span>
                  ))}
                  {room.inclusions.length > 4 && (
                    <span className="px-2.5 py-1 bg-neutral-50 text-neutral-500 text-xs rounded-md border border-neutral-200">
                      +{room.inclusions.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirm === room.id && (
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">Delete this room type?</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {roomTypes.length === 0 && (
        <div className="bg-neutral-50/50 rounded-[10px] overflow-hidden text-center py-16">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-medium text-neutral-900 mb-1">No Room Types</h3>
          <p className="text-sm text-neutral-500 mb-6">Get started by adding your first room type</p>
          <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Room Type
          </Button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddRoomTypeModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddRoom}
        />
      )}

      {editingRoom && (
        <EditRoomTypeModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSave={handleEditRoom}
        />
      )}
    </div>
  );
}
