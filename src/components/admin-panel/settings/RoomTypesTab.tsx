import { useState, useEffect } from 'react';
import { BedDouble, Plus, Pencil, Trash2, Users, IndianRupee, Check, X } from 'lucide-react';
import { AMENITIES } from '@/utils/admin/settings';
import AddRoomTypeModal from './AddRoomTypeModal';
import EditRoomTypeModal from './EditRoomTypeModal';

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
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Room Types</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your room categories and pricing
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#A57865] text-white rounded-lg font-medium hover:bg-[#8E6554] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Room Type
        </button>
      </div>

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roomTypes.map((room) => (
          <div
            key={room.id}
            className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E5E5E5]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#A57865]/10 flex items-center justify-center">
                    <BedDouble className="w-6 h-6 text-[#A57865]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{room.name}</h3>
                    <p className="text-sm text-neutral-500 line-clamp-1">{room.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRoom(room)}
                    className="p-2 rounded-lg hover:bg-[#FAF7F4] text-neutral-500 hover:text-[#A57865] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(room.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <IndianRupee className="w-4 h-4" />
                    <span className="font-semibold text-neutral-900">{formatPrice(room.price)}</span>
                    <span className="text-sm text-neutral-400">/night</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Up to {room.maxOccupancy} guests</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-4">
                <p className="text-xs font-medium text-neutral-500 mb-2">AMENITIES</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.slice(0, 5).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-[#FAF7F4] text-neutral-600 text-xs rounded-md"
                    >
                      {getAmenityLabel(amenity)}
                    </span>
                  ))}
                  {room.amenities.length > 5 && (
                    <span className="px-2 py-1 bg-[#A57865]/10 text-[#A57865] text-xs rounded-md">
                      +{room.amenities.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Inclusions */}
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2">INCLUSIONS</p>
                <div className="flex flex-wrap gap-2">
                  {room.inclusions.slice(0, 4).map((inclusion, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-[#4E5840]/10 text-[#4E5840] text-xs rounded-md"
                    >
                      {inclusion}
                    </span>
                  ))}
                  {room.inclusions.length > 4 && (
                    <span className="px-2 py-1 bg-[#4E5840]/20 text-[#4E5840] text-xs rounded-md">
                      +{room.inclusions.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirm === room.id && (
              <div className="px-6 py-4 bg-red-50 border-t border-red-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-700">Delete this room type?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {roomTypes.length === 0 && (
        <div className="text-center py-12 bg-white border border-[#E5E5E5] rounded-xl">
          <BedDouble className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Room Types</h3>
          <p className="text-neutral-500 mb-4">Get started by adding your first room type</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#A57865] text-white rounded-lg font-medium hover:bg-[#8E6554] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Room Type
          </button>
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
