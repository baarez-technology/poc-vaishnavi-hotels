import { useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceService } from '@/api/services/attendance.service';
import type { AttendanceSummary, AttendanceEntry } from '@/api/services/attendance.service';
import { staffService } from '@/api/services/staff.service';

/**
 * Transform API staff into attendance entries for the table.
 * Uses real staff data + clock status to build attendance rows.
 */
function buildAttendanceFromStaff(staffList: any[], selectedDate: string): AttendanceEntry[] {
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  return staffList.map((s) => {
    const staffName = s.name || s.full_name || 'Unknown';
    const clockedIn = s.clocked_in || false;

    // Determine status
    let status: AttendanceEntry['status'] = 'absent';
    if (s.status === 'sick') status = 'sick';
    else if (s.status === 'leave') status = 'on_leave';
    else if (clockedIn) status = 'present';
    else if (isToday) status = 'absent';

    // Mock clock times based on shift for display purposes
    const shiftTimes: Record<string, { start: string; end: string }> = {
      morning: { start: '08:00', end: '16:00' },
      evening: { start: '16:00', end: '00:00' },
      night: { start: '00:00', end: '08:00' },
    };
    const shift = s.shift || 'morning';
    const times = shiftTimes[shift] || shiftTimes.morning;

    return {
      id: s.id,
      staff_id: s.id,
      staff_name: staffName,
      staff_role: s.role || 'Staff',
      department: s.department || 'general',
      shift_type: shift as AttendanceEntry['shift_type'],
      date: selectedDate,
      clock_in: clockedIn ? times.start : null,
      clock_out: clockedIn ? null : (status === 'present' ? times.end : null),
      status,
      total_hours: clockedIn ? null : (status === 'present' ? 8 : 0),
    };
  });
}

/**
 * Build summary counts from attendance entries
 */
function buildSummary(entries: AttendanceEntry[]): AttendanceSummary {
  let present = 0, absent = 0, late = 0, earlyLeave = 0, overtime = 0;
  for (const e of entries) {
    if (e.status === 'present') present++;
    else if (e.status === 'absent') absent++;
    else if (e.status === 'late') { late++; present++; } // late is still present
    else if (e.status === 'early_leave') { earlyLeave++; present++; }
    else if (e.status === 'overtime') { overtime++; present++; }
    else if (e.status === 'on_leave' || e.status === 'sick') absent++;
  }
  return {
    present,
    absent,
    late,
    early_leave: earlyLeave,
    overtime,
    total_scheduled: entries.length,
  };
}

export function useAttendance() {
  // Data state
  const [allEntries, setAllEntries] = useState<AttendanceEntry[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    present: 0, absent: 0, late: 0, early_leave: 0, overtime: 0, total_scheduled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try the dedicated attendance endpoint first
      try {
        const [apiEntries, apiSummary] = await Promise.all([
          attendanceService.list({ date: selectedDate }),
          attendanceService.getSummary(selectedDate),
        ]);
        if (Array.isArray(apiEntries) && apiEntries.length > 0) {
          setAllEntries(apiEntries);
          setSummary(apiSummary);
          setIsLoading(false);
          return;
        }
      } catch {
        // Attendance API not available yet, fall back to staff list
      }

      // Fallback: build attendance from staff list
      const staffList = await staffService.list();
      if (Array.isArray(staffList) && staffList.length > 0) {
        const entries = buildAttendanceFromStaff(staffList, selectedDate);
        setAllEntries(entries);
        setSummary(buildSummary(entries));
      } else {
        setAllEntries([]);
        setSummary({ present: 0, absent: 0, late: 0, early_leave: 0, overtime: 0, total_scheduled: 0 });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data');
      setAllEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let result = allEntries;

    if (departmentFilter !== 'all') {
      result = result.filter((e) => e.department === departmentFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }
    if (shiftFilter !== 'all') {
      result = result.filter((e) => e.shift_type === shiftFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.staff_name.toLowerCase().includes(q) ||
          e.staff_role.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allEntries, departmentFilter, statusFilter, shiftFilter, searchQuery]);

  // Available departments from data
  const departments = useMemo(() => {
    const set = new Set(allEntries.map((e) => e.department));
    return Array.from(set).sort();
  }, [allEntries]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setDepartmentFilter('all');
    setStatusFilter('all');
    setShiftFilter('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters = departmentFilter !== 'all' || statusFilter !== 'all' || shiftFilter !== 'all' || searchQuery.trim() !== '';

  return {
    // Data
    entries: filteredEntries,
    allEntries,
    summary,
    isLoading,
    error,
    // Filters
    selectedDate,
    setSelectedDate,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    shiftFilter,
    setShiftFilter,
    searchQuery,
    setSearchQuery,
    departments,
    clearFilters,
    hasActiveFilters,
    // Actions
    refresh: fetchAttendance,
  };
}
