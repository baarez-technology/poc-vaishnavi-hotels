/**
 * EditRoomModal Component
 * Edit room form - Glimmora Design System v5.0
 * Matches Channel Manager drawer pattern
 */

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Drawer } from '../../ui2/Drawer';
import { Button } from '../../ui2/Button';

export default function EditRoomModal({ room, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'Standard',
    floor: '1',
    bedType: 'Queen',
    capacity: '2',
    price: '',
    amenities: [],
    description: '',
    viewType: 'Standard'
  });

  const roomTypes = ['Standard', 'Premium', 'Deluxe', 'Suite'];
  const bedTypes = ['Single', 'Double', 'Queen', 'King', 'Twin', 'King + Sofa Bed'];
  const availableAmenities = [
    'WiFi', 'TV', 'Air Conditioning', 'Mini Fridge', 'Safe', 'Coffee Maker',
    'Balcony', 'Ocean View', 'City View', 'Garden View', 'Jacuzzi', 'Work Desk'
  ];

  useEffect(() => {
    if (isOpen && room) {
      setFormData({
        roomNumber: room.roomNumber || '',
        type: room.type || 'Standard',
        floor: String(room.floor || 1),
        bedType: room.bedType || 'Queen',
        capacity: String(room.capacity || 2),
        price: String(room.price || ''),
        amenities: room.amenities || [],
        description: room.description || '',
        viewType: room.viewType || 'Standard'
      });
    }
  }, [isOpen, room]);

  if (!room) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.roomNumber || !formData.price) {
      return;
    }

    // Prepare API update payload with proper field mapping
    const apiUpdates = {
      // Note: room number typically shouldn't change, but include it for completeness
      number: formData.roomNumber,
      room_type: formData.type,
      floor: parseInt(formData.floor),
      bed_type: formData.bedType,
      capacity: parseInt(formData.capacity),
      max_occupancy: parseInt(formData.capacity),
      // Note: price is controlled by room type, not individual rooms in the API
      amenities: JSON.stringify(formData.amenities),
      description: formData.description || null,
      view_type: formData.viewType || null
    };

    // Also prepare local state update (for immediate UI feedback)
    const updatedRoom = {
      ...room,
      roomNumber: formData.roomNumber,
      type: formData.type,
      floor: parseInt(formData.floor),
      bedType: formData.bedType,
      capacity: parseInt(formData.capacity),
      price: parseFloat(formData.price),
      amenities: formData.amenities,
      description: formData.description
    };

    // Pass both the API updates and local updates
    // The parent component (useRooms) will handle the API call
    onSave(room.id, updatedRoom);
    onClose();
  };

  const inputStyles = "w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all";

  const renderFooter = () => (
    <div className="flex items-center justify-end gap-3">
      <Button type="button" variant="ghost" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">
        Cancel
      </Button>
      <Button type="submit" variant="primary" form="edit-room-form" className="px-5 py-2 text-[13px] font-semibold">
        Save Changes
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Room"
      subtitle={`Room ${room.roomNumber} • ${room.type}`}
      maxWidth="max-w-2xl"
      footer={renderFooter()}
    >
      <form id="edit-room-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Room Information */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Room Information
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Room Number
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g., 101"
                  required
                  className={inputStyles}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Room Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={inputStyles}
                >
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Floor
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className={inputStyles}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Bed Type
                </label>
                <select
                  name="bedType"
                  value={formData.bedType}
                  onChange={handleChange}
                  className={inputStyles}
                >
                  {bedTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity & Pricing */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Capacity & Pricing
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Max Guests
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="10"
                className={inputStyles}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Price per Night
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[13px]">$</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="120"
                  min="0"
                  step="0.01"
                  required
                  className={`${inputStyles} pl-7`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Description
          </h4>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder="Enter room description..."
            className="w-full px-3.5 py-2.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Amenities */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Amenities
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {availableAmenities.map(amenity => {
              const isSelected = formData.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-terra-200 bg-terra-50'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <span className={`text-[13px] font-medium ${isSelected ? 'text-terra-700' : 'text-neutral-700'}`}>
                    {amenity}
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-terra-500' : 'border border-neutral-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Status */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Current Status
          </h4>
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-neutral-500">Status:</span>
                <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                  room.status === 'available' ? 'text-sage-700' :
                  room.status === 'occupied' ? 'text-terra-700' :
                  room.status === 'dirty' ? 'text-gold-700' : 'text-rose-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    room.status === 'available' ? 'bg-sage-500' :
                    room.status === 'occupied' ? 'bg-terra-500' :
                    room.status === 'dirty' ? 'bg-gold-500' : 'bg-rose-500'
                  }`}></span>
                  {room.status === 'out_of_service' ? 'Out of Service' : room.status?.charAt(0).toUpperCase() + room.status?.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-neutral-500">Cleaning:</span>
                <span className={`text-[13px] font-semibold ${
                  room.cleaning === 'clean' ? 'text-sage-700' : 'text-gold-700'
                }`}>
                  {room.cleaning?.charAt(0).toUpperCase() + room.cleaning?.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
