import { useState, useEffect, useRef } from 'react';
import { AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import { AMENITIES } from '../../utils/settings';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { useCurrency } from '@/hooks/useCurrency';

export default function EditRoomTypeModal({ room, onClose, onSave }) {
  const { symbol } = useCurrency();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    maxOccupancy: 2,
    amenities: [],
    inclusions: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (room) {
      setForm({
        name: room.name,
        description: room.description || '',
        price: room.price.toString(),
        maxOccupancy: room.maxOccupancy,
        amenities: room.amenities || [],
        inclusions: room.inclusions?.join(', ') || '',
        image: null
      });
      // Set existing image preview if room has an image
      setImagePreview(room.image || room.imageUrl || null);
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select an image file' }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size should be less than 5MB' }));
        return;
      }
      setForm((prev) => ({ ...prev, image: file }));
      setErrors((prev) => ({ ...prev, image: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      inclusions: inclusionsList,
      image: form.image,
      // Keep existing image URL if no new image was uploaded
      imageUrl: form.image ? null : imagePreview
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

        {/* Room Image */}
        <div>
          <label className={labelClass}>Room Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
              <img
                src={imagePreview}
                alt="Room preview"
                className="w-full h-40 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-900/70 hover:bg-neutral-900/90 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {form.image && (
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-neutral-900/70 to-transparent">
                  <p className="text-xs text-white truncate">{form.image.name}</p>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 rounded-lg border-2 border-dashed border-neutral-200 hover:border-terra-300 bg-neutral-50 hover:bg-terra-50/30 transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-terra-100 flex items-center justify-center transition-colors">
                <ImageIcon className="w-6 h-6 text-neutral-400 group-hover:text-terra-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700 group-hover:text-terra-600 transition-colors">
                  Click to upload image
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </button>
          )}

          {errors.image && (
            <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.image}
            </p>
          )}
        </div>

        {/* Price & Occupancy */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Price per Night ({symbol}) <span className="text-rose-500">*</span>
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
