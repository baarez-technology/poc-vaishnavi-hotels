import { useState } from 'react';
import { Calendar, Filter, Settings, RefreshCw, ChevronDown } from 'lucide-react';

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

const FORECAST_INTERVALS = [
  { id: 'daily', name: 'Daily' },
  { id: '6h', name: '6 Hours' },
  { id: '1h', name: '1 Hour' }
];

export default function ControlsBar({ settings, onSettingsChange }) {
  const [dateRange, setDateRange] = useState('7days');
  const [roomCategory, setRoomCategory] = useState('all');
  const [channel, setChannel] = useState('all');
  const [forecastInterval, setForecastInterval] = useState('daily');

  const handleToggle = (key) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left Section - Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F4] rounded-lg border border-neutral-200">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer pr-6"
              >
                <option value="today">Today</option>
                <option value="7days">Next 7 Days</option>
                <option value="14days">Next 14 Days</option>
                <option value="30days">Next 30 Days</option>
              </select>
            </div>
          </div>

          {/* Room Category */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F4] rounded-lg border border-neutral-200">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={roomCategory}
                onChange={(e) => setRoomCategory(e.target.value)}
                className="bg-transparent text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer pr-6"
              >
                {ROOM_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Channel */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F4] rounded-lg border border-neutral-200">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="bg-transparent text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer pr-6"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Forecast Interval */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F4] rounded-lg border border-neutral-200">
              <RefreshCw className="w-4 h-4 text-neutral-500" />
              <select
                value={forecastInterval}
                onChange={(e) => setForecastInterval(e.target.value)}
                className="bg-transparent text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer pr-6"
              >
                {FORECAST_INTERVALS.map((interval) => (
                  <option key={interval.id} value={interval.id}>{interval.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Section - Toggles */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Auto-rate optimization */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings?.autoRate || false}
                onChange={() => handleToggle('autoRate')}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${settings?.autoRate ? 'bg-[#4E5840]' : 'bg-neutral-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${settings?.autoRate ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-xs font-medium text-neutral-700">Auto-rate</span>
          </label>

          {/* Competitor scan */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings?.competitorScan || false}
                onChange={() => handleToggle('competitorScan')}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${settings?.competitorScan ? 'bg-[#4E5840]' : 'bg-neutral-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${settings?.competitorScan ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-xs font-medium text-neutral-700">Competitor Scan</span>
          </label>

          {/* Demand-based pricing */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings?.demandPricing || false}
                onChange={() => handleToggle('demandPricing')}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${settings?.demandPricing ? 'bg-[#4E5840]' : 'bg-neutral-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${settings?.demandPricing ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-xs font-medium text-neutral-700">Demand Pricing</span>
          </label>

          {/* Settings Button */}
          <button className="p-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Settings Summary */}
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-neutral-500">Active:</span>
        {settings?.autoRate && (
          <span className="px-2 py-0.5 bg-[#4E5840]/10 text-[#4E5840] text-xs font-medium rounded-full">
            Auto-rate ON
          </span>
        )}
        {settings?.competitorScan && (
          <span className="px-2 py-0.5 bg-[#5C9BA4]/10 text-[#5C9BA4] text-xs font-medium rounded-full">
            Competitor Scan ON
          </span>
        )}
        {settings?.demandPricing && (
          <span className="px-2 py-0.5 bg-[#A57865]/10 text-[#A57865] text-xs font-medium rounded-full">
            Demand Pricing ON
          </span>
        )}
        {!settings?.autoRate && !settings?.competitorScan && !settings?.demandPricing && (
          <span className="text-xs text-neutral-400">No AI features enabled</span>
        )}
      </div>
    </div>
  );
}
