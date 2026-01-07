import { useState } from 'react';
import { Calendar, ChevronDown, Zap, Eye, TrendingUp, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '../ui2/DropdownMenu';

const DATE_RANGES = [
  { id: 'today', name: 'Today' },
  { id: '7days', name: 'Next 7 Days' },
  { id: '14days', name: 'Next 14 Days' },
  { id: '30days', name: 'Next 30 Days' }
];

const ROOM_CATEGORIES = [
  { id: 'all', name: 'All Rooms' },
  { id: 'standard', name: 'Standard Room' },
  { id: 'deluxe', name: 'Deluxe Room' },
  { id: 'suite', name: 'Executive Suite' },
  { id: 'presidential', name: 'Presidential Suite' },
  { id: 'villa', name: 'Garden Villa' }
];

const CHANNELS = [
  { id: 'all', name: 'All Channels' },
  { id: 'direct', name: 'Direct' },
  { id: 'ota', name: 'OTA' },
  { id: 'corporate', name: 'Corporate' },
  { id: 'travel_agent', name: 'Travel Agent' }
];

// Custom Select Dropdown Component
function SelectDropdown({ value, options, onChange, icon: Icon, className = '' }) {
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <DropdownMenu
      align="start"
      trigger={
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-medium text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 transition-colors ${className}`}
        >
          {Icon && <Icon className="w-4 h-4 text-terra-500" />}
          <span>{selectedOption?.name}</span>
          <ChevronDown className="w-4 h-4 text-neutral-400 ml-1" />
        </button>
      }
    >
      {options.map((option) => (
        <DropdownMenuItem
          key={option.id}
          onSelect={() => onChange(option.id)}
          className={value === option.id ? 'bg-terra-50 text-terra-700' : ''}
        >
          <span className="flex items-center gap-2 w-full">
            <span className="flex-1">{option.name}</span>
            {value === option.id && <Check className="w-3.5 h-3.5 text-terra-600" />}
          </span>
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}

export default function ControlsBar({ settings, onSettingsChange }) {
  const [dateRange, setDateRange] = useState('7days');
  const [roomCategory, setRoomCategory] = useState('all');
  const [channel, setChannel] = useState('all');

  const handleToggle = (key) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Left - Filters */}
      <div className="flex items-center gap-3">
        {/* Date Range */}
        <SelectDropdown
          value={dateRange}
          options={DATE_RANGES}
          onChange={setDateRange}
          icon={Calendar}
        />

        {/* Room Category */}
        <SelectDropdown
          value={roomCategory}
          options={ROOM_CATEGORIES}
          onChange={setRoomCategory}
        />

        {/* Channel */}
        <SelectDropdown
          value={channel}
          options={CHANNELS}
          onChange={setChannel}
        />
      </div>

      {/* Right - AI Toggles */}
      <div className="flex items-center gap-4">
        {/* Auto-rate */}
        <label className="flex items-center gap-2.5 cursor-pointer group px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${
            settings?.autoRate ? 'bg-sage-100' : 'bg-neutral-100'
          }`}>
            <Zap className={`w-3 h-3 ${settings?.autoRate ? 'text-sage-600' : 'text-neutral-400'}`} />
          </div>
          <span className="text-[13px] font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">Auto-rate</span>
          <button
            onClick={() => handleToggle('autoRate')}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              settings?.autoRate ? 'bg-sage-500' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                settings?.autoRate ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </label>

        {/* Competitor Scan */}
        <label className="flex items-center gap-2.5 cursor-pointer group px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${
            settings?.competitorScan ? 'bg-ocean-100' : 'bg-neutral-100'
          }`}>
            <Eye className={`w-3 h-3 ${settings?.competitorScan ? 'text-ocean-600' : 'text-neutral-400'}`} />
          </div>
          <span className="text-[13px] font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">Competitor Scan</span>
          <button
            onClick={() => handleToggle('competitorScan')}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              settings?.competitorScan ? 'bg-ocean-500' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                settings?.competitorScan ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </label>

        {/* Demand Pricing */}
        <label className="flex items-center gap-2.5 cursor-pointer group px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${
            settings?.demandPricing ? 'bg-terra-100' : 'bg-neutral-100'
          }`}>
            <TrendingUp className={`w-3 h-3 ${settings?.demandPricing ? 'text-terra-600' : 'text-neutral-400'}`} />
          </div>
          <span className="text-[13px] font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">Demand Pricing</span>
          <button
            onClick={() => handleToggle('demandPricing')}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              settings?.demandPricing ? 'bg-terra-500' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                settings?.demandPricing ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
