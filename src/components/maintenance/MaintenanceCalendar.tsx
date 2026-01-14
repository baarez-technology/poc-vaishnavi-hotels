import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Wrench,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import { getCalendarEvents, getWorkOrdersOutsideRange, PRIORITY_CONFIG, PM_FREQUENCY } from '../../utils/maintenance';

export default function MaintenanceCalendar({ workOrders, pmTasks, onEventClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week'

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // Get visible date range for the calendar
  const visibleDateRange = useMemo(() => {
    if (calendarDays.length === 0) return { start: null, end: null };
    return {
      start: calendarDays[0].toISOString().split('T')[0],
      end: calendarDays[calendarDays.length - 1].toISOString().split('T')[0]
    };
  }, [calendarDays]);

  // Get events for calendar
  const events = useMemo(() => {
    return getCalendarEvents(workOrders, pmTasks);
  }, [workOrders, pmTasks]);

  // Get work orders outside visible range
  const workOrdersOutsideRange = useMemo(() => {
    if (!visibleDateRange.start || !visibleDateRange.end) {
      return { total: 0, open: 0, inProgress: 0, onHold: 0 };
    }
    return getWorkOrdersOutsideRange(workOrders, visibleDateRange.start, visibleDateRange.end);
  }, [workOrders, visibleDateRange]);

  // Count visible work orders in current calendar view
  const visibleWorkOrderCount = useMemo(() => {
    if (!visibleDateRange.start || !visibleDateRange.end) return 0;
    const start = new Date(visibleDateRange.start);
    const end = new Date(visibleDateRange.end);

    return events.filter(e => {
      if (e.type !== 'workorder') return false;
      const eventDate = new Date(e.date);
      return eventDate >= start && eventDate <= end;
    }).length;
  }, [events, visibleDateRange]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  }, [events]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getEventColor = (event) => {
    if (event.type === 'workorder') {
      if (event.priority === 'high') return 'bg-rose-500';
      if (event.status === 'in_progress') return 'bg-[#5C9BA4]';
      if (event.status === 'completed') return 'bg-[#4E5840]';
      return 'bg-[#CDB261]';
    }
    return 'bg-[#A57865]'; // PM tasks
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-[#FAF8F6]">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#A57865]" />
          <h3 className="text-sm font-bold text-neutral-900">Maintenance Calendar</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <span className="text-sm font-semibold text-neutral-900 min-w-[140px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Work Orders Outside View Indicator */}
      {workOrdersOutsideRange.total > 0 && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">
                {workOrdersOutsideRange.total} active work order{workOrdersOutsideRange.total !== 1 ? 's' : ''} not shown in this view
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                {workOrdersOutsideRange.open > 0 && `${workOrdersOutsideRange.open} Open`}
                {workOrdersOutsideRange.open > 0 && workOrdersOutsideRange.inProgress > 0 && ' · '}
                {workOrdersOutsideRange.inProgress > 0 && `${workOrdersOutsideRange.inProgress} In Progress`}
                {(workOrdersOutsideRange.open > 0 || workOrdersOutsideRange.inProgress > 0) && workOrdersOutsideRange.onHold > 0 && ' · '}
                {workOrdersOutsideRange.onHold > 0 && `${workOrdersOutsideRange.onHold} On Hold`}
                {' — '}These work orders are scheduled for dates outside the current calendar view.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-neutral-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = eventsByDate[dateStr] || [];
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                className={`min-h-[80px] p-1 border rounded-lg ${
                  isTodayDate
                    ? 'border-[#A57865] bg-[#A57865]/5'
                    : isCurrentMonthDay
                      ? 'border-neutral-100 bg-white'
                      : 'border-neutral-50 bg-neutral-50/50'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${
                  isTodayDate
                    ? 'text-[#A57865]'
                    : isCurrentMonthDay
                      ? 'text-neutral-900'
                      : 'text-neutral-400'
                }`}>
                  {date.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <button
                      key={event.id || idx}
                      onClick={() => onEventClick(event)}
                      className={`w-full text-left px-1 py-0.5 rounded text-[10px] font-medium text-white truncate ${getEventColor(event)} hover:opacity-80 transition-opacity`}
                      title={event.title}
                    >
                      {event.type === 'workorder' ? (
                        <span className="flex items-center gap-0.5">
                          {event.priority === 'high' && <AlertTriangle className="w-2 h-2" />}
                          {event.room || 'WO'}: {event.title}
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Wrench className="w-2 h-2" />
                          {event.title}
                        </span>
                      )}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-neutral-500 font-medium px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#CDB261]" />
              <span className="text-xs text-neutral-600">Open WO</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#5C9BA4]" />
              <span className="text-xs text-neutral-600">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#4E5840]" />
              <span className="text-xs text-neutral-600">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-xs text-neutral-600">High Priority</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#A57865]" />
              <span className="text-xs text-neutral-600">Preventive Maintenance</span>
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            Showing <span className="font-medium text-neutral-700">{visibleWorkOrderCount}</span> of{' '}
            <span className="font-medium text-neutral-700">{workOrders.length}</span> work orders in this view
          </div>
        </div>
      </div>
    </div>
  );
}
