/**
 * AddRoomModal Component
 * Add new room form - Glimmora Design System v5.0
 * Matches Channel Manager drawer pattern
 */

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Drawer } from '../../ui2/Drawer';
import { Button } from '../../ui2/Button';

export default function AddRoomModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'Standard',
    floor: '1',
    bedType: 'Queen',
    capacity: '2',
    price: '',
    amenities: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomTypes = ['Standard', 'Premium', 'Deluxe', 'Suite'];
  const bedTypes = ['Single', 'Double', 'Queen', 'King', 'Twin'];
  const availableAmenities = ['WiFi', 'TV', 'Air Conditioning', 'Mini Fridge', 'Safe', 'Coffee Maker', 'Balcony', 'Ocean View'];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        roomNumber: '',
        type: 'Standard',
        floor: '1',
        bedType: 'Queen',
        capacity: '2',
        price: '',
        amenities: []
      });
      setError(null);
    }
  }, [isOpen]);

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
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newRoom = {
        roomNumber: formData.roomNumber,
        type: formData.type,
        floor: parseInt(formData.floor),
        bedType: formData.bedType,
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price),
        amenities: formData.amenities,
        status: 'available',
        cleaning: 'clean',
        guests: null
      };

      await onAdd(newRoom);
      onClose();
    } catch (err: any) {
      console.error('Failed to create room:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all";

  const renderFooter = () => (
    <div className="flex items-center justify-end gap-3">
      <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 text-[13px] font-semibold">
        Cancel
      </Button>
      <Button type="submit" variant="primary" form="add-room-form" disabled={isSubmitting} className="px-5 py-2 text-[13px] font-semibold">
        {isSubmitting ? 'Creating...' : 'Add Room'}
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Room"
      subtitle="Add a new room to your inventory"
      maxWidth="max-w-2xl"
      footer={renderFooter()}
    >
      <form id="add-room-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[13px]">
            {error}
          </div>
        )}

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
      </form>
    </Drawer>
  );
}
