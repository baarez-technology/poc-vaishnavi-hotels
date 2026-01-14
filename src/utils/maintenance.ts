/**
 * Maintenance Utility Functions
 * Work orders, preventive maintenance, technician assignment, inventory
 */

// Work Order Categories
export const WO_CATEGORIES = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' }
];

// Priority configurations
export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    bgColor: 'bg-red-600',
    textColor: 'text-white'
  },
  medium: {
    label: 'Medium',
    bgColor: 'bg-[#CDB261]/20',
    textColor: 'text-[#CDB261]'
  },
  low: {
    label: 'Low',
    bgColor: 'bg-neutral-200',
    textColor: 'text-neutral-700'
  }
};

// Status configurations
export const STATUS_CONFIG = {
  open: {
    label: 'Open',
    bgColor: 'bg-[#CDB261]/20',
    textColor: 'text-[#CDB261]'
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-[#5C9BA4]/15',
    textColor: 'text-[#5C9BA4]'
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-[#4E5840]/15',
    textColor: 'text-[#4E5840]'
  },
  on_hold: {
    label: 'On Hold',
    bgColor: 'bg-neutral-200',
    textColor: 'text-neutral-700'
  }
};

// PM Frequency options
export const PM_FREQUENCY = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

// Inventory categories
export const INVENTORY_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'linens', label: 'Linens & Bedding' },
  { value: 'amenities', label: 'Guest Amenities' },
  { value: 'other', label: 'Other' }
];

/**
 * Generate unique Work Order ID
 */
export function generateWOId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `WO-${timestamp}-${random}`;
}

/**
 * Generate unique PM ID
 */
export function generatePMId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PM-${timestamp}-${random}`;
}

/**
 * Generate unique Inventory ID
 */
export function generateInventoryId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `INV-${timestamp}`;
}

/**
 * Add activity log entry
 */
export function addActivityLog(existingLog = [], action, user = 'System') {
  const timestamp = new Date().toISOString();
  const newEntry = {
    id: Date.now(),
    timestamp,
    action,
    user
  };
  return [...existingLog, newEntry];
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

/**
 * Calculate resolution time in hours
 */
export function calculateResolutionTime(createdAt, completedAt) {
  if (!createdAt || !completedAt) return null;
  const start = new Date(createdAt);
  const end = new Date(completedAt);
  const diff = (end - start) / (1000 * 60 * 60); // hours
  // Ensure we don't return negative values (data integrity issue)
  return Math.max(0, Math.round(diff * 10) / 10);
}

/**
 * Calculate KPIs from work orders
 */
export function calculateMaintenanceKPIs(workOrders, technicians, rooms) {
  const total = workOrders.length;
  const open = workOrders.filter(wo => wo.status === 'open').length;
  const inProgress = workOrders.filter(wo => wo.status === 'in_progress').length;
  const completed = workOrders.filter(wo => wo.status === 'completed').length;
  const highPriority = workOrders.filter(wo => wo.priority === 'high' && wo.status !== 'completed').length;

  // Calculate average resolution time
  const completedWOs = workOrders.filter(wo => wo.status === 'completed' && wo.completedAt);
  let avgResolutionTime = 0;
  if (completedWOs.length > 0) {
    const totalTime = completedWOs.reduce((sum, wo) => {
      // Use reported_at (when the work order was created/reported) instead of createdAt
      const resTime = calculateResolutionTime(wo.reportedAt || wo.createdAt, wo.completedAt);
      return sum + (resTime || 0);
    }, 0);
    avgResolutionTime = Math.round(totalTime / completedWOs.length);
  }

  // Technicians on duty
  const techsOnDuty = technicians ? technicians.filter(t => t.status === 'active' || t.status === 'on_duty').length : 0;

  // Rooms OOO
  const roomsOOO = rooms ? rooms.filter(r => r.status === 'out_of_service').length : 0;

  return {
    total,
    open,
    inProgress,
    completed,
    highPriority,
    avgResolutionTime,
    techsOnDuty,
    roomsOOO
  };
}

/**
 * Filter work orders
 */
export function filterWorkOrders(workOrders, filters) {
  let result = [...workOrders];

  if (filters.priority && filters.priority !== 'all') {
    result = result.filter(wo => wo.priority === filters.priority);
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter(wo => wo.status === filters.status);
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter(wo => wo.category === filters.category);
  }

  if (filters.technician && filters.technician !== 'all') {
    result = result.filter(wo => wo.assignedTo === filters.technician);
  }

  if (filters.roomType && filters.roomType !== 'all') {
    result = result.filter(wo => wo.roomType === filters.roomType);
  }

  if (filters.oooOnly) {
    result = result.filter(wo => wo.isOOO);
  }

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    result = result.filter(wo => new Date(wo.createdAt) >= fromDate);
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    result = result.filter(wo => new Date(wo.createdAt) <= toDate);
  }

  return result;
}

/**
 * Search work orders
 */
export function searchWorkOrders(workOrders, query) {
  if (!query || query.trim() === '') return workOrders;

  const searchTerm = query.toLowerCase().trim();
  return workOrders.filter(wo => {
    const woId = (wo.id || '').toLowerCase();
    const room = (wo.roomNumber || '').toLowerCase();
    const issue = (wo.issue || '').toLowerCase();
    const description = (wo.description || '').toLowerCase();
    const technician = (wo.technicianName || '').toLowerCase();

    return woId.includes(searchTerm) ||
           room.includes(searchTerm) ||
           issue.includes(searchTerm) ||
           description.includes(searchTerm) ||
           technician.includes(searchTerm);
  });
}

/**
 * Sort work orders
 */
export function sortWorkOrders(workOrders, sortField, sortDirection = 'asc') {
  return [...workOrders].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'id':
        aVal = a.id || '';
        bVal = b.id || '';
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        aVal = priorityOrder[a.priority] || 2;
        bVal = priorityOrder[b.priority] || 2;
        break;
      case 'status':
        const statusOrder = { open: 0, in_progress: 1, on_hold: 2, completed: 3 };
        aVal = statusOrder[a.status] || 3;
        bVal = statusOrder[b.status] || 3;
        break;
      case 'room':
        aVal = a.roomNumber || '';
        bVal = b.roomNumber || '';
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
        break;
      default:
        aVal = a[sortField] || '';
        bVal = b[sortField] || '';
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Export work orders to CSV
 */
export function exportMaintenanceToCSV(workOrders, filename = 'maintenance_export.csv') {
  if (!workOrders || workOrders.length === 0) {
    return { success: false, message: 'No data to export' };
  }

  const headers = [
    'WO ID',
    'Room',
    'Issue',
    'Priority',
    'Category',
    'Status',
    'Technician',
    'Created On',
    'Updated On',
    'Completed On'
  ];

  const rows = workOrders.map(wo => [
    wo.id || '',
    wo.roomNumber || 'N/A',
    wo.issue || '',
    wo.priority ? wo.priority.charAt(0).toUpperCase() + wo.priority.slice(1) : '',
    WO_CATEGORIES.find(c => c.value === wo.category)?.label || wo.category || '',
    STATUS_CONFIG[wo.status]?.label || wo.status || '',
    wo.technicianName || 'Unassigned',
    formatDateTime(wo.createdAt),
    formatDateTime(wo.updatedAt),
    wo.completedAt ? formatDateTime(wo.completedAt) : '-'
  ]);

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

  return { success: true, message: `Exported ${workOrders.length} work orders to CSV` };
}

/**
 * Create new work order object
 */
export function createWorkOrder(data) {
  const now = new Date().toISOString();
  return {
    id: generateWOId(),
    roomNumber: data.roomNumber || null,
    roomId: data.roomId || null,
    roomType: data.roomType || null,
    category: data.category || 'general',
    priority: data.priority || 'medium',
    issue: data.issue || '',
    description: data.description || '',
    status: 'open',
    assignedTo: data.assignedTo || null,
    technicianName: data.technicianName || null,
    isOOO: data.isOOO || false,
    attachments: data.attachments || [],
    activityLog: addActivityLog([], 'Work order created'),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    estimatedCompletion: data.estimatedCompletion || null,
    notes: data.notes || ''
  };
}

/**
 * Create preventive maintenance task
 */
export function createPreventiveTask(data) {
  const now = new Date().toISOString();
  return {
    id: generatePMId(),
    equipment: data.equipment || '',
    roomNumber: data.roomNumber || null,
    roomId: data.roomId || null,
    category: data.category || 'general',
    frequency: data.frequency || 'monthly',
    nextDueDate: data.nextDueDate || null,
    lastCompleted: null,
    assignedTo: data.assignedTo || null,
    technicianName: data.technicianName || null,
    notes: data.notes || '',
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Calculate next due date based on frequency
 */
export function calculateNextDueDate(lastDate, frequency) {
  const date = lastDate ? new Date(lastDate) : new Date();

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Get calendar events from work orders and PM tasks
 * Work orders are displayed based on:
 * 1. scheduledDate if available
 * 2. estimatedCompletion if available
 * 3. createdAt as fallback
 * Active work orders (open/in_progress) without future dates are shown on their creation date
 */
export function getCalendarEvents(workOrders, pmTasks, startDate, endDate) {
  const events = [];

  // Add work orders
  workOrders.forEach(wo => {
    // Determine the best date to display the work order
    let displayDate;

    if (wo.scheduledDate) {
      // Use scheduled date if available
      displayDate = wo.scheduledDate;
    } else if (wo.estimatedCompletion) {
      // Use estimated completion date if available
      displayDate = wo.estimatedCompletion;
    } else {
      // Fall back to created date
      displayDate = new Date(wo.createdAt).toISOString().split('T')[0];
    }

    events.push({
      id: wo.id,
      date: displayDate,
      type: 'workorder',
      status: wo.status,
      title: wo.issue,
      room: wo.roomNumber,
      priority: wo.priority,
      createdAt: wo.createdAt // Include for reference
    });
  });

  // Add PM tasks
  pmTasks.forEach(pm => {
    if (pm.nextDueDate) {
      events.push({
        id: pm.id,
        date: pm.nextDueDate,
        type: 'preventive',
        title: pm.equipment,
        room: pm.roomNumber,
        frequency: pm.frequency
      });
    }
  });

  return events;
}

/**
 * Get work orders statistics for calendar view
 * Returns count of work orders by status that are outside the visible date range
 */
export function getWorkOrdersOutsideRange(workOrders, visibleStartDate, visibleEndDate) {
  const start = new Date(visibleStartDate);
  const end = new Date(visibleEndDate);

  const outsideRange = {
    total: 0,
    open: 0,
    inProgress: 0,
    onHold: 0
  };

  workOrders.forEach(wo => {
    // Only count active (non-completed) work orders
    if (wo.status === 'completed') return;

    // Determine display date (same logic as getCalendarEvents)
    let displayDate;
    if (wo.scheduledDate) {
      displayDate = new Date(wo.scheduledDate);
    } else if (wo.estimatedCompletion) {
      displayDate = new Date(wo.estimatedCompletion);
    } else {
      displayDate = new Date(wo.createdAt);
    }

    // Check if outside visible range
    if (displayDate < start || displayDate > end) {
      outsideRange.total++;
      if (wo.status === 'open') outsideRange.open++;
      else if (wo.status === 'in_progress') outsideRange.inProgress++;
      else if (wo.status === 'on_hold') outsideRange.onHold++;
    }
  });

  return outsideRange;
}
