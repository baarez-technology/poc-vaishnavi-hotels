/**
 * Min Stay Configuration Drawer
 * Allows admins to set different minimum stay values per room type
 * Following Glimmora Design System v5.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { SelectDropdown } from '../ui2/Input';
import DatePicker from '../ui2/DatePicker';
import { cn } from '../../lib/utils';

interface RoomTypeConfig {
  name: string;
  currentMinStay: number;
  newMinStay: number;
}

interface MinStayConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomTypes: string[];
  availability: Record<string, Record<string, any>>;
  onApply: (config: {
    startDate: string;
    endDate: string;
    roomConfigs: Array<{ roomType: string; minStay: number }>;
  }) => void;
}

// Generate night options for dropdown
const nightOptions = [1, 2, 3, 4, 5, 6, 7].map(n => ({
  value: String(n),
  label: `${n} night${n > 1 ? 's' : ''}`
}));

export function MinStayConfigModal({
  isOpen,
  onClose,
  roomTypes,
  availability,
  onApply
}: MinStayConfigDrawerProps) {
  // Default date range: today + 30 days
  const today = new Date();
  const defaultEndDate = new Date(today);
  defaultEndDate.setDate(defaultEndDate.getDate() + 29);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDate(today));
  const [endDate, setEndDate] = useState(formatDate(defaultEndDate));
  const [applyAllValue, setApplyAllValue] = useState('2');

  // Initialize room configs with current min stay values
  const [roomConfigs, setRoomConfigs] = useState<RoomTypeConfig[]>([]);

  // Re-sync room configs when drawer opens or roomTypes change
  useEffect(() => {
    if (isOpen && roomTypes.length > 0) {
      const todayStr = formatDate(today);
      setRoomConfigs(roomTypes.map(name => {
        const currentMinStay = availability[todayStr]?.[name]?.minStay
          || availability[todayStr]?.[name]?.restrictions?.minStay
          || 1;
        return {
          name,
          currentMinStay,
          newMinStay: currentMinStay // Default to current value
        };
      }));
    }
  }, [isOpen, roomTypes]);

  // Calculate days in range
  const daysInRange = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  // Count rooms with changes
  const roomsWithChanges = useMemo(() => {
    return roomConfigs.filter(rc => rc.newMinStay !== rc.currentMinStay).length;
  }, [roomConfigs]);

  const handleApplyAll = () => {
    setRoomConfigs(prev => prev.map(rc => ({
      ...rc,
      newMinStay: parseInt(applyAllValue)
    })));
  };

  const handleRoomConfigChange = (index: number, newMinStay: string) => {
    setRoomConfigs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], newMinStay: parseInt(newMinStay) };
      return updated;
    });
  };

  const handleSubmit = () => {
    onApply({
      startDate,
      endDate,
      roomConfigs: roomConfigs.map(rc => ({
        roomType: rc.name,
        minStay: rc.newMinStay
      }))
    });
  };

  const renderFooter = () => (
    <div className="flex items-center justify-end w-full gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        className="px-5 py-2 text-[13px] font-semibold"
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleSubmit}
        className="px-5 py-2 text-[13px] font-semibold"
      >
        Apply Changes
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Set Minimum Stay Restrictions"
      subtitle="Configure minimum stay per room type"
      maxWidth="max-w-2xl"
      footer={renderFooter()}
    >
      <div className="space-y-6">
        {/* Date Range Section */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Date Range
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Start Date
              </label>
              <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Select start date"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                End Date
              </label>
              <DatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="Select end date"
                minDate={startDate}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            {daysInRange} days selected
          </p>
        </div>

        {/* Quick Apply Section */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Quick Apply
          </h4>
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-neutral-600">Set all rooms to</span>
              <div className="w-32">
                <SelectDropdown
                  value={applyAllValue}
                  onChange={(val) => setApplyAllValue(val)}
                  options={nightOptions}
                  size="md"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyAll}
                className="text-[13px] font-medium"
              >
                Apply to All
              </Button>
            </div>
          </div>
        </div>

        {/* Room Types Section */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Per Room Type Configuration
          </h4>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
              <div className="col-span-5 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Room Type
              </div>
              <div className="col-span-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider text-center">
                Current
              </div>
              <div className="col-span-4 text-[11px] font-medium text-neutral-500 uppercase tracking-wider text-center">
                New Min Stay
              </div>
            </div>

            {/* Room Type Rows */}
            <div className="divide-y divide-neutral-100">
              {roomConfigs.map((config, index) => {
                const hasChange = config.newMinStay !== config.currentMinStay;

                return (
                  <div
                    key={config.name}
                    className={cn(
                      "grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors",
                      hasChange && "bg-terra-50/30"
                    )}
                  >
                    {/* Room Type Name */}
                    <div className="col-span-5 flex items-center gap-3">
                      <span className="text-[13px] font-medium text-neutral-900 truncate">
                        {config.name}
                      </span>
                      {hasChange && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-terra-500" />
                      )}
                    </div>

                    {/* Current Min Stay */}
                    <div className="col-span-3 text-center">
                      <span className="text-[13px] text-neutral-500">
                        {config.currentMinStay} night{config.currentMinStay > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* New Min Stay Dropdown */}
                    <div className="col-span-4 flex justify-center">
                      <div className="w-28">
                        <SelectDropdown
                          value={String(config.newMinStay)}
                          onChange={(val) => handleRoomConfigChange(index, val)}
                          options={nightOptions}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
          <p className="text-[13px] text-neutral-600">
            <span className="font-semibold text-neutral-900">Summary:</span>{' '}
            {roomsWithChanges > 0 ? (
              <>
                Updating <span className="font-semibold text-terra-600">{roomsWithChanges}</span> room type{roomsWithChanges > 1 ? 's' : ''}{' '}
                across <span className="font-semibold">{daysInRange}</span> days
                <span className="text-neutral-400 ml-1">({roomsWithChanges * daysInRange} total changes)</span>
              </>
            ) : (
              <span className="text-neutral-500">No changes from current values</span>
            )}
          </p>
        </div>
      </div>
    </Drawer>
  );
}

export default MinStayConfigModal;
