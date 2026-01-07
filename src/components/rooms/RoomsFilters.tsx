/**
 * RoomsFilters Component
 * Dropdown filters for rooms - Glimmora Design System v5.0
 * Matches CMS SearchFiltersBar pattern
 */

import { useState, useRef, useEffect } from 'react';
import { X, Building, Home, CheckCircle, Sparkles } from 'lucide-react';
import { getRoomTypes, getFloors } from '../../data/roomsData';

// Custom Filter Select Component matching CMS pattern
function FilterSelect({ value, onChange, options, placeholder, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = value === 'all' ? placeholder : selectedOption?.label;
  const isActive = value !== 'all';

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3.5 rounded-[8px] text-[13px] bg-white border transition-all duration-150 flex items-center gap-2 focus:outline-none min-w-[140px] ${
          isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : isActive
            ? 'border-terra-300 bg-terra-50'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-terra-500' : 'text-neutral-400'}`} />}
        <span className={isActive ? 'text-terra-700 font-medium' : 'text-neutral-600'}>
          {displayLabel}
        </span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-terra-500' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1.5 bg-white rounded-[8px] border border-neutral-200 shadow-lg overflow-hidden min-w-[160px] max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                  value === option.value ? 'bg-terra-50 text-terra-700' : 'text-neutral-700'
                }`}
              >
                {option.label}
                {value === option.value && (
                  <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function RoomsFilters({ filters, onFilterChange, onClearFilters, hasActiveFilters }) {
  const roomTypes = getRoomTypes();
  const floors = getFloors();

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...roomTypes.map(type => ({ value: type, label: type }))
  ];

  const floorOptions = [
    { value: 'all', label: 'All Floors' },
    ...floors.map(floor => ({ value: floor, label: `Floor ${floor}` }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'dirty', label: 'Dirty' },
    { value: 'out_of_service', label: 'Out of Service' }
  ];

  const cleaningOptions = [
    { value: 'all', label: 'All Cleaning' },
    { value: 'clean', label: 'Clean' },
    { value: 'dirty', label: 'Dirty' }
  ];

  return (
    <div className="flex items-center gap-3">
      {/* Room Type Filter */}
      <FilterSelect
        value={filters.type}
        onChange={(value) => onFilterChange('type', value)}
        options={typeOptions}
        placeholder="All Types"
        icon={Home}
      />

      {/* Floor Filter */}
      <FilterSelect
        value={filters.floor}
        onChange={(value) => onFilterChange('floor', value)}
        options={floorOptions}
        placeholder="All Floors"
        icon={Building}
      />

      {/* Status Filter */}
      <FilterSelect
        value={filters.status}
        onChange={(value) => onFilterChange('status', value)}
        options={statusOptions}
        placeholder="All Statuses"
        icon={CheckCircle}
      />

      {/* Cleaning Filter */}
      <FilterSelect
        value={filters.cleaning}
        onChange={(value) => onFilterChange('cleaning', value)}
        options={cleaningOptions}
        placeholder="All Cleaning"
        icon={Sparkles}
      />

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="h-9 px-3 flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-[8px] transition-colors"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
      )}
    </div>
  );
}
