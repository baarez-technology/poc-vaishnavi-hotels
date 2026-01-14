/**
 * Housekeeping Utility Functions
 * Auto-assign algorithm, cleaning time calculations, KPI calculations, CSV export
 */

// Cleaning time estimates by room type (in minutes)
export const CLEANING_TIME_ESTIMATES = {
  Standard: 20,
  Premium: 25,
  Deluxe: 30,
  Suite: 45
};

// Priority modifiers (additional minutes)
export const PRIORITY_TIME_MODIFIER = {
  high: 10,
  medium: 5,
  low: 0
};

// Status configurations
export const HK_STATUS_CONFIG = {
  dirty: {
    label: 'Dirty',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-[#CDB261]/20',
    textColor: 'text-[#CDB261]',
    borderColor: 'border-[#CDB261]/30'
  },
  clean: {
    label: 'Clean',
    bgColor: 'bg-[#5C9BA4]/15',
    textColor: 'text-[#5C9BA4]',
    borderColor: 'border-[#5C9BA4]/30'
  },
  inspected: {
    label: 'Inspected',
    bgColor: 'bg-[#4E5840]/15',
    textColor: 'text-[#4E5840]',
    borderColor: 'border-[#4E5840]/30'
  },
  out_of_service: {
    label: 'Out of Service',
    bgColor: 'bg-neutral-200',
    textColor: 'text-neutral-700',
    borderColor: 'border-neutral-300'
  }
};

export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    bgColor: 'bg-red-600',
    textColor: 'text-white'
  },
  medium: {
    label: 'Medium',
    bgColor: 'bg-[#CDB261]',
    textColor: 'text-neutral-900'
  },
  low: {
    label: 'Low',
    bgColor: 'bg-neutral-200',
    textColor: 'text-neutral-900'
  }
};

/**
 * Calculate estimated cleaning time for a room
 */
export function calculateCleaningTime(room, staffEfficiency = 100) {
  const baseTime = CLEANING_TIME_ESTIMATES[room.type] || 25;
  const priorityModifier = PRIORITY_TIME_MODIFIER[room.priority] || 0;

  // Apply staff efficiency modifier (±10%)
  const efficiencyModifier = 1 - ((staffEfficiency - 100) / 1000);

  const totalTime = Math.round((baseTime + priorityModifier) * efficiencyModifier);
  return totalTime;
}

/**
 * Calculate estimated finish time
 */
export function calculateEstimatedFinish(startTime, roomType, priority, staffEfficiency = 100) {
  const cleaningTime = calculateCleaningTime({ type: roomType, priority }, staffEfficiency);
  const start = new Date(startTime);
  return new Date(start.getTime() + cleaningTime * 60 * 1000);
}

/**
 * Format time duration
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculate KPIs from rooms data
 */
export function calculateHKKPIs(rooms, staff) {
  const dirty = rooms.filter(r => r.status === 'dirty').length;
  const inProgress = rooms.filter(r => r.status === 'in_progress').length;
  const clean = rooms.filter(r => r.status === 'clean').length;
  const inspected = rooms.filter(r => r.status === 'inspected').length;
  const urgent = rooms.filter(r => r.priority === 'high' && r.status !== 'clean' && r.status !== 'inspected').length;
  const pendingInspection = rooms.filter(r => r.status === 'clean').length;

  // Calculate avg cleaning time from completed rooms
  const completedRooms = rooms.filter(r => r.cleaningStartedAt && r.cleaningCompletedAt);
  let avgCleaningTime = 0;
  if (completedRooms.length > 0) {
    const totalTime = completedRooms.reduce((sum, room) => {
      const start = new Date(room.cleaningStartedAt);
      const end = new Date(room.cleaningCompletedAt);
      return sum + (end - start) / (1000 * 60);
    }, 0);
    avgCleaningTime = Math.round(totalTime / completedRooms.length);
  } else {
    avgCleaningTime = 25; // Default estimate
  }

  // Staff on shift
  const staffOnShift = staff ? staff.filter(s => s.shift === 'morning' || s.shift === 'evening').length : 0;

  return {
    dirty,
    inProgress,
    clean,
    inspected,
    avgCleaningTime,
    staffOnShift,
    urgent,
    pendingInspection
  };
}

/**
 * Auto-assign algorithm
 * Rules:
 * 1. Sort staff by availability + lowest workload
 * 2. Assign urgent → medium → low priority
 * 3. Cap max 10 rooms per staff
 * 4. Balance load evenly
 */
export function autoAssignRooms(rooms, staff) {
  const assignments = [];
  const MAX_ROOMS_PER_STAFF = 10;

  // Get unassigned dirty rooms sorted by priority
  const unassignedRooms = rooms
    .filter(r => !r.assignedTo && (r.status === 'dirty' || r.status === 'in_progress'))
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

  if (unassignedRooms.length === 0) {
    return { assignments: [], summary: 'No unassigned rooms to assign.' };
  }

  // Create a map of staff with current workload
  const staffWorkload = staff.map(s => ({
    ...s,
    currentLoad: s.tasksAssigned || 0,
    newAssignments: []
  })).sort((a, b) => a.currentLoad - b.currentLoad);

  // Assign rooms
  for (const room of unassignedRooms) {
    // Find available staff with lowest workload and capacity
    const availableStaff = staffWorkload
      .filter(s => (s.currentLoad + s.newAssignments.length) < MAX_ROOMS_PER_STAFF)
      .sort((a, b) => (a.currentLoad + a.newAssignments.length) - (b.currentLoad + b.newAssignments.length));

    if (availableStaff.length === 0) {
      break; // No more capacity
    }

    // Prefer staff assigned to same floor if possible
    let selectedStaff = availableStaff.find(s => s.floors && s.floors.includes(room.floor));
    if (!selectedStaff) {
      selectedStaff = availableStaff[0];
    }

    selectedStaff.newAssignments.push(room.id);
    assignments.push({
      roomId: room.id,
      roomNumber: room.roomNumber,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      priority: room.priority
    });
  }

  // Generate summary
  const assignedCount = assignments.length;
  const staffUsed = new Set(assignments.map(a => a.staffId)).size;
  const urgentAssigned = assignments.filter(a => a.priority === 'high').length;

  const summary = `Assigned ${assignedCount} rooms to ${staffUsed} staff members. ${urgentAssigned} urgent rooms prioritized.`;

  return { assignments, summary };
}

/**
 * Export housekeeping data to CSV
 */
export function exportHKToCSV(rooms, staff, filename = 'housekeeping_export.csv') {
  if (!rooms || rooms.length === 0) {
    return { success: false, message: 'No data to export' };
  }

  const headers = [
    'Room',
    'Type',
    'Floor',
    'HK Status',
    'Assigned Staff',
    'Priority',
    'Start Time',
    'Estimated Finish',
    'Total Time (min)',
    'Notes'
  ];

  const getStaffName = (staffId) => {
    const staffMember = staff?.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'Unassigned';
  };

  const rows = rooms.map(room => {
    const estimatedTime = calculateCleaningTime(room);
    const startTime = room.cleaningStartedAt
      ? new Date(room.cleaningStartedAt).toLocaleString()
      : '-';
    const estimatedFinish = room.cleaningStartedAt
      ? calculateEstimatedFinish(room.cleaningStartedAt, room.type, room.priority).toLocaleString()
      : '-';

    return [
      room.roomNumber || room.number,
      room.type || room.roomType,
      room.floor,
      HK_STATUS_CONFIG[room.status]?.label || room.status,
      room.assignedStaffName || getStaffName(room.assignedTo),
      room.priority ? room.priority.charAt(0).toUpperCase() + room.priority.slice(1) : 'Low',
      startTime,
      estimatedFinish,
      estimatedTime,
      room.notes || ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace('.csv', '')}_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, message: `Exported ${rooms.length} rooms to CSV` };
}

/**
 * Export housekeeping data to PDF
 * Creates a printable PDF report with room status summary
 */
export function exportHKToPDF(rooms, staff, filename = 'housekeeping_report') {
  if (!rooms || rooms.length === 0) {
    return { success: false, message: 'No data to export' };
  }

  const getStaffName = (staffId) => {
    const staffMember = staff?.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'Unassigned';
  };

  // Calculate summary statistics
  const summary = {
    total: rooms.length,
    dirty: rooms.filter(r => r.status === 'dirty').length,
    clean: rooms.filter(r => r.status === 'clean').length,
    inProgress: rooms.filter(r => r.status === 'in_progress').length,
    inspected: rooms.filter(r => r.status === 'inspected').length,
    outOfService: rooms.filter(r => r.status === 'out_of_service').length,
  };

  // Create HTML content for PDF
  const timestamp = new Date().toLocaleString();
  const dateStr = new Date().toISOString().split('T')[0];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Housekeeping Report - ${dateStr}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #333; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #A57865; }
        .header h1 { font-size: 24px; color: #A57865; margin-bottom: 5px; }
        .header p { color: #666; font-size: 12px; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; padding: 15px; background: #f9f7f7; border-radius: 8px; }
        .summary-item { text-align: center; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #A57865; }
        .summary-item .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #A57865; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #fafafa; }
        .status { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; display: inline-block; }
        .status-dirty { background: #fee2e2; color: #dc2626; }
        .status-clean { background: #d1fae5; color: #059669; }
        .status-in_progress { background: #fef3c7; color: #d97706; }
        .status-inspected { background: #dbeafe; color: #2563eb; }
        .status-out_of_service { background: #e5e7eb; color: #6b7280; }
        .priority-high { color: #dc2626; font-weight: bold; }
        .priority-medium { color: #d97706; }
        .priority-low { color: #6b7280; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; padding-top: 15px; border-top: 1px solid #eee; }
        @media print { body { padding: 10px; } .summary { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Housekeeping Status Report</h1>
        <p>Generated: ${timestamp}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="value">${summary.total}</div>
          <div class="label">Total Rooms</div>
        </div>
        <div class="summary-item">
          <div class="value" style="color: #dc2626;">${summary.dirty}</div>
          <div class="label">Dirty</div>
        </div>
        <div class="summary-item">
          <div class="value" style="color: #d97706;">${summary.inProgress}</div>
          <div class="label">In Progress</div>
        </div>
        <div class="summary-item">
          <div class="value" style="color: #059669;">${summary.clean}</div>
          <div class="label">Clean</div>
        </div>
        <div class="summary-item">
          <div class="value" style="color: #2563eb;">${summary.inspected}</div>
          <div class="label">Inspected</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Room</th>
            <th>Floor</th>
            <th>Type</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Priority</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rooms.map(room => `
            <tr>
              <td><strong>${room.roomNumber || room.number}</strong></td>
              <td>Floor ${room.floor}</td>
              <td>${room.type || room.roomType || 'Standard'}</td>
              <td><span class="status status-${room.status}">${HK_STATUS_CONFIG[room.status]?.label || room.status}</span></td>
              <td>${room.assignedStaffName || getStaffName(room.assignedTo)}</td>
              <td class="priority-${room.priority || 'low'}">${room.priority ? room.priority.charAt(0).toUpperCase() + room.priority.slice(1) : 'Low'}</td>
              <td>${room.notes ? (room.notes.length > 30 ? room.notes.substring(0, 30) + '...' : room.notes) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Glimmora Hotel Management System - Housekeeping Report</p>
        <p>Page 1 of 1 | Confidential</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog with the HTML content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);

    return { success: true, message: `PDF report generated for ${rooms.length} rooms` };
  } else {
    return { success: false, message: 'Please allow popups to generate PDF report' };
  }
}

/**
 * Add note with timestamp
 */
export function addNoteWithTimestamp(existingNotes, newNote) {
  const timestamp = new Date().toLocaleString();
  const formattedNote = `[${timestamp}] ${newNote}`;

  if (existingNotes) {
    return `${existingNotes}\n${formattedNote}`;
  }
  return formattedNote;
}

/**
 * Parse notes into array of objects
 */
export function parseNotes(notesString) {
  if (!notesString) return [];

  return notesString.split('\n').map(note => {
    const match = note.match(/^\[(.+?)\] (.+)$/);
    if (match) {
      return { timestamp: match[1], content: match[2] };
    }
    return { timestamp: null, content: note };
  });
}

/**
 * Get staff performance metrics
 */
export function getStaffPerformanceMetrics(staff, rooms) {
  return staff.map(s => {
    // Handle ID type mismatch - compare as strings for consistency
    const assignedRooms = rooms.filter(r => {
      if (!r.assignedTo && !r.assignedStaff) return false;
      const roomStaffId = r.assignedStaff?.id ?? r.assignedTo;
      return roomStaffId === s.id || String(roomStaffId) === String(s.id);
    });
    const completedRooms = assignedRooms.filter(r => r.status === 'clean' || r.status === 'inspected');

    // Calculate average cleaning time
    let avgTime = 0;
    const roomsWithTime = assignedRooms.filter(r => r.cleaningStartedAt && r.cleaningCompletedAt);
    if (roomsWithTime.length > 0) {
      const totalTime = roomsWithTime.reduce((sum, room) => {
        const start = new Date(room.cleaningStartedAt);
        const end = new Date(room.cleaningCompletedAt);
        return sum + (end - start) / (1000 * 60);
      }, 0);
      avgTime = Math.round(totalTime / roomsWithTime.length);
    }

    // Calculate delays (rooms taking longer than estimate)
    const delays = roomsWithTime.filter(room => {
      const estimate = calculateCleaningTime(room);
      const start = new Date(room.cleaningStartedAt);
      const end = new Date(room.cleaningCompletedAt);
      const actual = (end - start) / (1000 * 60);
      return actual > estimate * 1.2; // 20% buffer
    }).length;

    return {
      ...s,
      tasksToday: assignedRooms.length,
      roomsCleaned: completedRooms.length,
      avgCleaningTime: avgTime || 25,
      delays,
      rating: s.efficiency >= 90 ? 5 : s.efficiency >= 80 ? 4 : s.efficiency >= 70 ? 3 : 2
    };
  });
}

/**
 * Generate sparkline data for staff performance
 */
export function generateSparklineData(baseValue, days = 7) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const variance = (Math.random() - 0.5) * 20;
    data.push(Math.max(0, Math.min(100, baseValue + variance)));
  }
  return data;
}
