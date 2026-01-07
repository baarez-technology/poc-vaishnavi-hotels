import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { AMENITIES } from '../../utils/settings';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';

export default function EditRoomTypeModal({ room, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    maxOccupancy: 2,
    amenities: [],
    inclusions: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (room) {
      setForm({
        name: room.name,
        description: room.description || '',
        price: room.price.toString(),
        maxOccupancy: room.maxOccupancy,
        amenities: room.amenities || [],
        inclusions: room.inclusions?.join(', ') || ''
      });
    }
  }, [room]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleAmenity = (amenityId) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Room type name is required';
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = 'Valid price is required';
    if (!form.maxOccupancy || form.maxOccupancy < 1) newErrors.maxOccupancy = 'Valid occupancy is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;

    const inclusionsList = form.inclusions
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i);

    onSave({
      ...room,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      maxOccupancy: parseInt(form.maxOccupancy),
      amenities: form.amenities,
      inclusions: inclusionsList
    });
  };

  const inputClass = (hasError = false) =>
    `w-full h-11 px-4 rounded-lg border text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors ${
      hasError
        ? 'border-rose-300 focus:border-rose-500'
        : 'border-neutral-200 hover:border-neutral-300 focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20'
    } focus:ring-0 focus:outline-none`;

  const labelClass = 'block text-[13px] font-medium text-neutral-600 mb-1.5';

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Edit Room Type"
      subtitle="Update room category details"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className={labelClass}>
            Room Type Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={inputClass(!!errors.name)}
            placeholder="e.g., Deluxe Suite"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20 focus:ring-0 focus:outline-none transition-colors resize-none"
            placeholder="Brief description of this room type"
          />
        </div>

        {/* Price & Occupancy */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Price per Night (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              min="0"
              className={inputClass(!!errors.price)}
              placeholder="8500"
            />
            {errors.price && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.price}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Max Occupancy <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={form.maxOccupancy}
              onChange={(e) => handleChange('maxOccupancy', e.target.value)}
              min="1"
              max="10"
              className={inputClass(!!errors.maxOccupancy)}
            />
            {errors.maxOccupancy && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.maxOccupancy}
              </p>
            )}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className={labelClass}>Amenities</label>
          <div className="grid grid-cols-3 gap-2">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleAmenity(amenity.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  form.amenities.includes(amenity.id)
                    ? 'bg-terra-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {amenity.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inclusions */}
        <div>
          <label className={labelClass}>Inclusions (comma-separated)</label>
          <input
            type="text"
            value={form.inclusions}
            onChange={(e) => handleChange('inclusions', e.target.value)}
            className={inputClass()}
            placeholder="Breakfast, Wi-Fi, Welcome Drink"
          />
          <p className="mt-1.5 text-xs text-neutral-400">
            Enter each inclusion separated by commas
          </p>
        </div>
      </form>
    </Drawer>
  );
}
