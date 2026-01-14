/**
 * NewRatePlanDrawer Component
 * Create new rate plans with full configuration - Glimmora Design System v5.0
 * Side drawer with refined editorial luxury aesthetic
 */

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { cn } from '../../lib/utils';

// Custom Select Component
function CustomSelect({ value, onChange, options, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 rounded-lg text-sm bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150 text-left"
      >
        <span className={selectedOption ? 'text-neutral-900' : 'text-neutral-400'}>
          {selectedOption?.label || placeholder}
        </span>
      </button>
      <ChevronDown className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none transition-transform", isOpen && "rotate-180")} />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2.5 text-sm text-left flex items-center justify-between hover:bg-neutral-50 transition-colors",
                value === option.value && "bg-terra-50 text-terra-700"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="w-4 h-4 text-terra-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MEAL_PLANS = [
  { value: 'Room Only', label: 'Room Only' },
  { value: 'Breakfast', label: 'Breakfast Included' },
  { value: 'Half Board', label: 'Half Board' },
  { value: 'Full Board', label: 'Full Board' },
];

const PRICING_METHODS = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'percent', label: 'Percent Adjustment' },
  { value: 'derived', label: 'Derived from BAR' },
];

// Room types matching database
const DEFAULT_ROOM_TYPES = [
  { id: 'minimalist-studio', name: 'Minimalist Studio' },
  { id: 'coastal-retreat', name: 'Coastal Retreat' },
  { id: 'urban-oasis', name: 'Urban Oasis' },
  { id: 'sunset-vista', name: 'Sunset Vista' },
  { id: 'pacific-suite', name: 'Pacific Suite' },
  { id: 'wellness-suite', name: 'Wellness Suite' },
  { id: 'family-sanctuary', name: 'Family Sanctuary' },
  { id: 'oceanfront-penthouse', name: 'Oceanfront Penthouse' },
];

export default function NewRatePlanModal({ isOpen, onClose, onSubmit, roomTypes = DEFAULT_ROOM_TYPES }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mealPlan: 'Room Only',
    pricing: {
      method: 'flat',
      base: 0,
      adjustmentValue: 0,
      adjustmentType: 'percentage',
    },
    restrictions: {
      minLos: 1,
      maxLos: 30,
      cta: false,
      ctd: false,
      sameDay: true,
      cancellationPolicy: '',
    },
    linkedRooms: [],
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePricingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value },
    }));
  };

  const handleRestrictionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      restrictions: { ...prev.restrictions, [field]: value },
    }));
  };

  const handleRoomToggle = (roomId) => {
    setFormData(prev => ({
      ...prev,
      linkedRooms: prev.linkedRooms.includes(roomId)
        ? prev.linkedRooms.filter(id => id !== roomId)
        : [...prev.linkedRooms, roomId],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rate plan name is required';
    }

    if (Number(formData.restrictions.minLos) < 1) {
      newErrors.minLos = 'Minimum LOS must be at least 1';
    }

    if (Number(formData.restrictions.maxLos) < Number(formData.restrictions.minLos)) {
      newErrors.maxLos = 'Maximum LOS must be greater than minimum';
    }

    if (formData.linkedRooms.length === 0) {
      newErrors.linkedRooms = 'Select at least one room type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      mealPlan: formData.mealPlan,
      pricing: {
        method: formData.pricing.method,
        base: parseFloat(formData.pricing.base) || 0,
        adjustmentValue: parseFloat(formData.pricing.adjustmentValue) || 0,
        adjustmentType: formData.pricing.adjustmentType,
      },
      restrictions: {
        minLos: parseInt(formData.restrictions.minLos) || 1,
        maxLos: parseInt(formData.restrictions.maxLos) || 30,
        cta: formData.restrictions.cta,
        ctd: formData.restrictions.ctd,
        sameDay: formData.restrictions.sameDay,
        cancellationPolicy: formData.restrictions.cancellationPolicy.trim(),
      },
      linkedRooms: formData.linkedRooms,
      status: formData.status,
    };

    onSubmit(payload);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      mealPlan: 'Room Only',
      pricing: {
        method: 'flat',
        base: 0,
        adjustmentValue: 0,
        adjustmentType: 'percentage',
      },
      restrictions: {
        minLos: 1,
        maxLos: 30,
        cta: false,
        ctd: false,
        sameDay: true,
        cancellationPolicy: '',
      },
      linkedRooms: [],
      status: 'active',
    });
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Reusable styles
  const inputClass = "w-full h-10 px-3 rounded-lg text-sm bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150";

  const labelClass = "block text-[13px] font-medium text-neutral-700 mb-1.5";

  // Section Header component
  const SectionHeader = ({ title }) => (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
      {title}
    </h3>
  );

  // Toggle Switch component
  const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
        checked ? 'bg-terra-500' : 'bg-neutral-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
        checked ? 'left-6' : 'left-1'
      }`} />
    </button>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Rate Plan"
      subtitle="Configure pricing, restrictions, and room assignments"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Rate Plan
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section>
          <SectionHeader title="Basic Information" />

          <div className="space-y-4">
            {/* Rate Plan Name */}
            <div>
              <label className={labelClass}>
                Rate Plan Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Non Refundable, Early Bird"
                className={`${inputClass} ${errors.name ? 'border-rose-300 focus:border-rose-400' : ''}`}
              />
              {errors.name && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this rate plan..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150 resize-none"
              />
            </div>

            {/* Meal Plan & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Meal Plan</label>
                <CustomSelect
                  value={formData.mealPlan}
                  onChange={(value) => handleInputChange('mealPlan', value)}
                  options={MEAL_PLANS}
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <div className="flex h-10 rounded-lg border border-neutral-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleInputChange('status', 'active')}
                    className={`flex-1 text-[13px] font-medium transition-all duration-150 ${
                      formData.status === 'active'
                        ? 'bg-sage-100 text-sage-700'
                        : 'bg-white text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('status', 'inactive')}
                    className={`flex-1 text-[13px] font-medium transition-all duration-150 border-l border-neutral-200 ${
                      formData.status === 'inactive'
                        ? 'bg-neutral-100 text-neutral-700'
                        : 'bg-white text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Settings */}
        <section>
          <SectionHeader title="Pricing" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Pricing Method</label>
                <CustomSelect
                  value={formData.pricing.method}
                  onChange={(value) => handlePricingChange('method', value)}
                  options={PRICING_METHODS}
                />
              </div>

              {formData.pricing.method === 'flat' && (
                <div>
                  <label className={labelClass}>Base Price ($)</label>
                  <input
                    type="number"
                    value={formData.pricing.base}
                    onChange={(e) => handlePricingChange('base', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={inputClass}
                  />
                </div>
              )}

              {(formData.pricing.method === 'percent' || formData.pricing.method === 'derived') && (
                <div>
                  <label className={labelClass}>Adjustment (%)</label>
                  <input
                    type="number"
                    value={formData.pricing.adjustmentValue}
                    onChange={(e) => handlePricingChange('adjustmentValue', e.target.value)}
                    placeholder="-10"
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {(formData.pricing.method === 'percent' || formData.pricing.method === 'derived') && (
              <p className="text-[11px] text-neutral-400">
                Use negative values for discounts (e.g., -10 for 10% off)
              </p>
            )}
          </div>
        </section>

        {/* Restrictions */}
        <section>
          <SectionHeader title="Restrictions" />

          <div className="space-y-4">
            {/* Length of Stay */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Min Stay (nights)</label>
                <input
                  type="number"
                  value={formData.restrictions.minLos}
                  onChange={(e) => handleRestrictionChange('minLos', e.target.value)}
                  min="1"
                  className={`${inputClass} ${errors.minLos ? 'border-rose-300' : ''}`}
                />
                {errors.minLos && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.minLos}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Max Stay (nights)</label>
                <input
                  type="number"
                  value={formData.restrictions.maxLos}
                  onChange={(e) => handleRestrictionChange('maxLos', e.target.value)}
                  min="1"
                  className={`${inputClass} ${errors.maxLos ? 'border-rose-300' : ''}`}
                />
                {errors.maxLos && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.maxLos}</p>
                )}
              </div>
            </div>

            {/* Toggle Restrictions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] font-medium text-neutral-800">Closed to Arrival</p>
                  <p className="text-[11px] text-neutral-400">Block arrivals on specific dates</p>
                </div>
                <ToggleSwitch
                  checked={formData.restrictions.cta}
                  onChange={(val) => handleRestrictionChange('cta', val)}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-neutral-100">
                <div>
                  <p className="text-[13px] font-medium text-neutral-800">Closed to Departure</p>
                  <p className="text-[11px] text-neutral-400">Block departures on specific dates</p>
                </div>
                <ToggleSwitch
                  checked={formData.restrictions.ctd}
                  onChange={(val) => handleRestrictionChange('ctd', val)}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-neutral-100">
                <div>
                  <p className="text-[13px] font-medium text-neutral-800">Same-Day Booking</p>
                  <p className="text-[11px] text-neutral-400">Allow bookings for today</p>
                </div>
                <ToggleSwitch
                  checked={formData.restrictions.sameDay}
                  onChange={(val) => handleRestrictionChange('sameDay', val)}
                />
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="pt-2">
              <label className={labelClass}>Cancellation Policy</label>
              <textarea
                value={formData.restrictions.cancellationPolicy}
                onChange={(e) => handleRestrictionChange('cancellationPolicy', e.target.value)}
                placeholder="Describe the cancellation terms..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Room Types */}
        <section>
          <SectionHeader title="Room Types" />

          <p className="text-[12px] text-neutral-500 mb-3">
            Select which room types this rate plan applies to
          </p>

          {errors.linkedRooms && (
            <p className="mb-3 text-[11px] text-rose-500">{errors.linkedRooms}</p>
          )}

          <div className="space-y-2">
            {roomTypes.map(room => {
              const isSelected = formData.linkedRooms.includes(room.id);
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomToggle(room.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left ${
                    isSelected
                      ? 'bg-terra-50 border border-terra-200'
                      : 'bg-neutral-50 border border-transparent hover:border-neutral-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                    isSelected
                      ? 'bg-terra-500'
                      : 'border border-neutral-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[13px] font-medium ${isSelected ? 'text-terra-700' : 'text-neutral-600'}`}>
                    {room.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </form>
    </Drawer>
  );
}
