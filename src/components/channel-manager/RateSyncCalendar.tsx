/**
 * RateSyncCalendar Component
 * 14-day horizontal calendar for rate and availability sync - Glimmora Design System v5.0
 * Consistent with AvailabilityCalendar design patterns
 */

import { useState, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, DollarSign, Calendar,
  AlertCircle, Ban, ChevronDown, CheckCircle, XCircle, Clock, Bed
} from 'lucide-react';
import { useChannelManager } from '../../context/ChannelManagerContext';
import { DropdownMenu, DropdownMenuItem } from '../ui2/DropdownMenu';
import { IconButton } from '../ui2/Button';
import { Tooltip } from '../ui2/Tooltip';

export default function RateSyncCalendar({ selectedRoomType = null }) {
  const { rateCalendar, otas, updateRateForOTA, updateAvailabilityForOTA, toggleStopSell } = useChannelManager();
  const [viewStartDate, setViewStartDate] = useState(new Date());
  const [internalRoomType, setInternalRoomType] = useState('Minimalist Studio');
  const [selectedOTA, setSelectedOTA] = useState('ALL');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const scrollContainerRef = useRef(null);

  // Use prop if provided, otherwise use internal state
  const activeRoomType = selectedRoomType || internalRoomType;

  const roomTypes = ['Minimalist Studio', 'Coastal Retreat', 'Urban Oasis', 'Sunset Vista', 'Pacific Suite', 'Wellness Suite', 'Family Sanctuary', 'Oceanfront Penthouse'];
  const connectedOTAs = otas.filter(o => o.status === 'connected');

  // Generate 14 visible days
  const visibleDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(viewStartDate);
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    return days;
  }, [viewStartDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setViewStartDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setViewStartDate(newDate);
  };

  const handleEditStart = (date, roomType, otaCode, field, currentValue) => {
    setEditingCell({ date, roomType, otaCode, field });
    setEditValue(currentValue.toString());
  };

  const handleEditSave = () => {
    if (!editingCell) return;

    const { date, roomType, otaCode, field } = editingCell;
    const numValue = parseInt(editValue);

    if (field === 'rate' && !isNaN(numValue)) {
      updateRateForOTA(date, roomType, otaCode, numValue);
    } else if (field === 'availability' && !isNaN(numValue)) {
      updateAvailabilityForOTA(date, roomType, numValue);
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getCellData = (date, roomType) => {
    const dayData = rateCalendar[date]?.[roomType];
    if (!dayData) return null;
    return dayData;
  };

  const getOTARate = (date, roomType, otaCode) => {
    const dayData = getCellData(date, roomType);
    if (!dayData) return null;
    if (otaCode === 'ALL') return dayData.rates?.BAR;
    return dayData.otaRates?.[otaCode] || dayData.rates?.OTA;
  };

  const checkRateParity = (date, roomType) => {
    const dayData = getCellData(date, roomType);
    if (!dayData?.otaRates) return true;

    const rates = Object.values(dayData.otaRates);
    const baseRate = dayData.rates?.BAR;
    return rates.every(r => Math.abs(r - baseRate) < baseRate * 0.1);
  };

  const getOTALabel = () => {
    if (selectedOTA === 'ALL') return 'All OTAs (BAR)';
    const ota = connectedOTAs.find(o => o.code === selectedOTA);
    return ota?.name || selectedOTA;
  };

  // Availability color logic - Glimmora Design System v5.0
  const getAvailabilityColor = (available, total) => {
    const ratio = available / total;
    if (ratio === 0) return 'bg-rose-500 text-white border border-rose-600 shadow-sm';
    if (ratio <= 0.25) return 'bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold';
    if (ratio <= 0.5) return 'bg-gold-50 text-gold-700 border border-gold-200/60 font-semibold';
    return 'bg-sage-50 text-sage-700 border border-sage-200/60 font-semibold';
  };

  return (
    <div className="bg-white rounded-[10px] overflow-hidden">
      {/* Calendar Header - matches AvailabilityCalendar */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Rate Calendar</h3>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Click any cell to edit rates & restrictions</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filters */}
          {!selectedRoomType && (
            <DropdownMenu
              align="end"
              trigger={
                <button className="h-9 px-3 pr-2 rounded-lg text-[12px] bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all flex items-center gap-2">
                  <Bed className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{activeRoomType}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              }
            >
              {roomTypes.map(room => (
                <DropdownMenuItem key={room} onSelect={() => setInternalRoomType(room)}>
                  {room}
                </DropdownMenuItem>
              ))}
            </DropdownMenu>
          )}

          <DropdownMenu
            align="end"
            trigger={
              <button className="h-9 px-3 pr-2 rounded-lg text-[12px] bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all flex items-center gap-2">
                <span>{getOTALabel()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            }
          >
            <DropdownMenuItem onSelect={() => setSelectedOTA('ALL')}>
              All OTAs (BAR)
            </DropdownMenuItem>
            {connectedOTAs.map(ota => (
              <DropdownMenuItem key={ota.code} onSelect={() => setSelectedOTA(ota.code)}>
                {ota.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenu>

          {/* Navigation */}
          <div className="flex items-center gap-2 pl-3 border-l border-neutral-200">
            <IconButton
              onClick={handlePrevWeek}
              icon={ChevronLeft}
              variant="outline"
              size="md"
              label="Previous week"
            />
            <IconButton
              onClick={handleNextWeek}
              icon={ChevronRight}
              variant="outline"
              size="md"
              label="Next week"
            />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex">
        {/* Metric Labels Column */}
        <div className="flex-shrink-0 border-r border-neutral-200/40 bg-white">
          {/* Corner cell with Calendar icon */}
          <div className="h-16 bg-neutral-50 border-b border-neutral-200/40 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-neutral-400" />
          </div>

          {/* Metric row labels */}
          {['Rate', 'Availability', 'Min Stay', 'Restrictions'].map((metric, idx) => (
            <div
              key={metric}
              className={`h-11 px-5 flex items-center border-b border-neutral-200/40 ${
                idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
              }`}
            >
              <span className="text-xs whitespace-nowrap font-semibold uppercase tracking-[0.05em] text-neutral-500">
                {metric}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable Date Columns */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="inline-flex min-w-full">
            {visibleDays.map(day => {
              const cellData = getCellData(day.date, activeRoomType);
              const rate = getOTARate(day.date, activeRoomType, selectedOTA);
              const availability = cellData?.availability || 0;
              const total = cellData?.totalInventory || 10;
              const minStay = cellData?.minStay || 1;
              const isStopSell = cellData?.stopSell || false;
              const isCTA = cellData?.cta || false;
              const isCTD = cellData?.ctd || false;
              const hasRestrictions = isStopSell || isCTA || isCTD;
              const hasParity = checkRateParity(day.date, activeRoomType);

              const isEditingRate = editingCell?.date === day.date &&
                                    editingCell?.roomType === activeRoomType &&
                                    editingCell?.field === 'rate';
              const isEditingAvail = editingCell?.date === day.date &&
                                     editingCell?.roomType === activeRoomType &&
                                     editingCell?.field === 'availability';

              return (
                <div key={day.date} className="flex-shrink-0 w-20 border-r border-neutral-200/40 last:border-r-0">
                  {/* Date Header */}
                  <div className={`h-16 flex flex-col items-center justify-center transition-all duration-200 border-b border-neutral-200/40 ${
                    day.isToday
                      ? 'bg-gradient-to-br from-terra-500 to-terra-600 text-white shadow-md shadow-terra-500/20'
                      : day.isWeekend
                        ? 'bg-gradient-to-br from-gold-50 to-gold-100/50 border-l-2 border-gold-200'
                        : 'bg-white'
                  }`}>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                      day.isToday ? 'text-white/90' : day.isWeekend ? 'text-gold-700' : 'text-neutral-500'
                    }`}>
                      {day.dayName}
                    </span>
                    <span className={`text-xl font-bold tracking-tight ${
                      day.isToday ? 'text-white' : day.isWeekend ? 'text-gold-800' : 'text-neutral-900'
                    }`}>
                      {day.dayNum}
                    </span>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${
                      day.isToday ? 'text-white/80' : day.isWeekend ? 'text-gold-600/80' : 'text-neutral-400'
                    }`}>
                      {day.month}
                    </span>
                  </div>

                  {/* Rate Cell */}
                  <div className={`h-11 flex items-center justify-center border-b border-neutral-200/40 transition-colors duration-200 ${
                    day.isToday ? 'bg-terra-50/30' : day.isWeekend ? 'bg-gold-50/20' : 'bg-white'
                  } hover:bg-white group cursor-pointer relative`}>
                    {isEditingRate ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-14 h-7 px-1 text-[12px] text-center rounded-lg bg-white border border-terra-400 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-terra-500/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        onBlur={handleEditSave}
                      />
                    ) : (
                      <button
                        onClick={() => handleEditStart(day.date, activeRoomType, selectedOTA, 'rate', rate || 0)}
                        className={`w-full h-full flex items-center justify-center transition-all ${
                          !hasParity ? 'ring-1 ring-inset ring-gold-400' : ''
                        }`}
                      >
                        <span className="text-sm font-semibold tracking-tight text-neutral-900 group-hover:text-terra-600 transition-colors">
                          ${rate || 0}
                        </span>
                        {!hasParity && (
                          <AlertCircle className="w-3.5 h-3.5 absolute top-1 right-1 text-gold-500" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Availability Cell */}
                  <div className={`h-11 flex items-center justify-center border-b border-neutral-200/40 transition-colors duration-200 ${
                    day.isToday ? 'bg-terra-50/30' : day.isWeekend ? 'bg-gold-50/20' : 'bg-neutral-50/30'
                  } hover:bg-white group cursor-pointer`}>
                    {isEditingAvail ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-14 h-7 px-1 text-[12px] text-center rounded-lg bg-white border border-terra-400 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-terra-500/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        onBlur={handleEditSave}
                      />
                    ) : (
                      <button
                        onClick={() => handleEditStart(day.date, activeRoomType, selectedOTA, 'availability', availability)}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <span className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-200 ${getAvailabilityColor(availability, total)}`}>
                          {availability}/{total}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Min Stay Cell */}
                  <div className={`h-11 flex items-center justify-center border-b border-neutral-200/40 transition-colors duration-200 ${
                    day.isToday ? 'bg-terra-50/30' : day.isWeekend ? 'bg-gold-50/20' : 'bg-white'
                  } hover:bg-white`}>
                    <span className="text-xs font-semibold text-neutral-600">
                      {minStay} night{minStay !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Restrictions Cell */}
                  <div className={`h-11 flex items-center justify-center gap-1 border-b border-neutral-200/40 transition-colors duration-200 ${
                    day.isToday ? 'bg-terra-50/30' : day.isWeekend ? 'bg-gold-50/20' : 'bg-neutral-50/30'
                  } hover:bg-white`}>
                    {isStopSell && (
                      <Tooltip content="Stop Sell - No bookings allowed" side="top">
                        <button
                          onClick={() => toggleStopSell(day.date, activeRoomType, selectedOTA === 'ALL' ? null : selectedOTA)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200/60 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          S
                        </button>
                      </Tooltip>
                    )}
                    {isCTA && (
                      <Tooltip content="Closed to Arrival - No check-ins" side="top">
                        <span className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold bg-gold-100 text-gold-700 border border-gold-200/60 shadow-sm">
                          A
                        </span>
                      </Tooltip>
                    )}
                    {isCTD && (
                      <Tooltip content="Closed to Departure - No check-outs" side="top">
                        <span className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold bg-sage-100 text-sage-700 border border-sage-200/60 shadow-sm">
                          D
                        </span>
                      </Tooltip>
                    )}
                    {!hasRestrictions && (
                      <button
                        onClick={() => toggleStopSell(day.date, activeRoomType, selectedOTA === 'ALL' ? null : selectedOTA)}
                        className="text-xs text-neutral-300 hover:text-neutral-400 transition-colors duration-200"
                      >
                        —
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend - matches AvailabilityCalendar */}
      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Legend</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sage-50 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-sage-600" />
            </div>
            <span className="text-[11px] font-medium text-neutral-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gold-50 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-gold-600" />
            </div>
            <span className="text-[11px] font-medium text-neutral-600">Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-[11px] font-medium text-neutral-600">Sold Out</span>
          </div>
          <div className="h-4 w-px bg-neutral-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-rose-700">S</span>
            </div>
            <span className="text-[11px] font-medium text-neutral-600">Stop Sell</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gold-100 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-gold-700">A</span>
            </div>
            <span className="text-[11px] font-medium text-neutral-600">CTA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sage-100 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-sage-700">D</span>
            </div>
            <span className="text-[11px] font-medium text-neutral-600">CTD</span>
          </div>
          <div className="h-4 w-px bg-neutral-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gold-50 flex items-center justify-center border border-gold-200">
              <AlertCircle className="w-3.5 h-3.5 text-gold-600" />
            </div>
            <span className="text-[11px] font-medium text-neutral-600">Parity Issue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
