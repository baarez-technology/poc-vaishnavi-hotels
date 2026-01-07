import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Bed, User, AlertTriangle } from 'lucide-react';
import { Button } from '../ui2/Button';

/**
 * Room Calendar View - 14-day availability grid
 * Shows rooms on Y-axis and dates on X-axis
 * Glimmora Design System v5.0
 */
export default function RoomCalendar({ rooms, bookings = [], onRoomClick, onDateClick }) {
  const [startDate, setStartDate] = useState(new Date());

  // Generate 14 days starting from startDate
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      result.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return result;
  }, [startDate]);

  // Get room status for each day
  const getRoomDayStatus = (room, day) => {
    // Check if room is out of service
    if (room.status === 'out_of_service') {
      return { status: 'blocked', label: 'Out of Service', color: 'bg-neutral-300' };
    }

    // Check if room has a booking on this day
    const booking = bookings.find(b => {
      if (b.room !== room.roomNumber) return false;
      if (b.status === 'CANCELLED') return false;

      const checkIn = new Date(b.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(b.checkOut);
      checkOut.setHours(0, 0, 0, 0);
      const currentDay = day.date;

      return currentDay >= checkIn && currentDay < checkOut;
    });

    if (booking) {
      // Check if it's check-in day
      const checkIn = new Date(booking.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(booking.checkOut);
      checkOut.setHours(0, 0, 0, 0);

      const isCheckIn = day.date.getTime() === checkIn.getTime();
      const isCheckOut = day.date.getTime() === checkOut.getTime();

      return {
        status: 'booked',
        label: booking.guest || 'Guest',
        bookingId: booking.id,
        color: 'bg-terra-500',
        isCheckIn,
        isCheckOut,
        booking
      };
    }

    // Room is available
    return { status: 'available', label: 'Available', color: 'bg-sage-500/20' };
  };

  // Navigate dates
  const handlePrevWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() - 7);
    setStartDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + 7);
    setStartDate(newDate);
  };

  const handleToday = () => {
    setStartDate(new Date());
  };

  // Sort rooms by floor and room number
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return parseInt(a.roomNumber) - parseInt(b.roomNumber);
    });
  }, [rooms]);

  // Room type colors
  const getTypeColor = (type) => {
    const colors = {
      'Standard': 'text-neutral-500',
      'Premium': 'text-terra-600',
      'Deluxe': 'text-terra-700',
      'Suite': 'text-gold-700'
    };
    return colors[type] || 'text-neutral-500';
  };

  return (
    <div className="bg-white rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Room Availability</h3>
            <p className="text-[13px] text-neutral-500 mt-0.5">14-day calendar view</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Today
            </Button>
            <div className="flex items-center bg-neutral-50 rounded-lg border border-neutral-200">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-neutral-100 rounded-l-lg transition-colors border-r border-neutral-200"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-600" />
              </button>
              <span className="text-[13px] font-medium text-neutral-700 px-4 min-w-[140px] text-center">
                {days[0]?.month} {days[0]?.dayNum} - {days[13]?.month} {days[13]?.dayNum}
              </span>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-neutral-100 rounded-r-lg transition-colors border-l border-neutral-200"
              >
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sage-500"></div>
            <span className="text-[11px] font-medium text-neutral-500">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-terra-500"></div>
            <span className="text-[11px] font-medium text-neutral-500">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300"></div>
            <span className="text-[11px] font-medium text-neutral-500">Out of Service</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 px-6 py-4 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-widest border-r border-neutral-100 w-48">
                Room
              </th>
              {days.map((day, idx) => (
                <th
                  key={idx}
                  className={`px-1 py-3 text-center min-w-[65px] ${
                    day.isToday ? 'bg-terra-50' : ''
                  }`}
                >
                  <div className={`text-[10px] uppercase tracking-widest font-semibold ${day.isToday ? 'text-terra-600' : 'text-neutral-400'}`}>
                    {day.dayName}
                  </div>
                  <div className={`text-lg font-semibold mt-0.5 ${day.isToday ? 'text-terra-600' : 'text-neutral-900'}`}>
                    {day.dayNum}
                  </div>
                  <div className={`text-[10px] font-medium ${day.isToday ? 'text-terra-500' : 'text-neutral-400'}`}>{day.month}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRooms.map((room, rowIdx) => (
              <tr key={room.id} className="border-t border-neutral-100">
                {/* Room Info */}
                <td
                  className="sticky left-0 z-10 px-6 py-3 bg-white border-r border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => onRoomClick && onRoomClick(room)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Bed className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900">{room.roomNumber}</p>
                      <p className={`text-[11px] font-medium ${getTypeColor(room.type)}`}>{room.type}</p>
                    </div>
                  </div>
                </td>

                {/* Day Cells */}
                {days.map((day, idx) => {
                  const dayStatus = getRoomDayStatus(room, day);

                  return (
                    <td
                      key={idx}
                      className={`px-1.5 py-2 ${day.isToday ? 'bg-terra-50' : ''}`}
                      onClick={() => onDateClick && onDateClick(room, day, dayStatus)}
                    >
                      <div
                        className={`h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                          dayStatus.status === 'booked'
                            ? 'bg-terra-500 text-white hover:bg-terra-600'
                            : dayStatus.status === 'blocked'
                            ? 'bg-neutral-200 text-neutral-400 hover:bg-neutral-300'
                            : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                        }`}
                        title={dayStatus.label}
                      >
                        {dayStatus.status === 'booked' && (
                          <User className="w-4 h-4" />
                        )}
                        {dayStatus.status === 'blocked' && (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sortedRooms.length === 0 && (
        <div className="p-16 text-center">
          <div className="w-14 h-14 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Bed className="w-7 h-7 text-neutral-400" />
          </div>
          <p className="text-[15px] font-semibold text-neutral-900">No rooms to display</p>
          <p className="text-[13px] text-neutral-500 mt-1">Add rooms to see the calendar view</p>
        </div>
      )}
    </div>
  );
}
