import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  createWorkOrder,
  createPreventiveTask,
  addActivityLog,
  calculateNextDueDate,
  generateInventoryId
} from '@/utils/admin/maintenance';
import { housekeepingService } from '@/api/services/housekeeping.service';
import { staffService } from '@/api/services/staff.service';
import { maintenanceService } from '@/api/services/maintenance.service';

/**
 * Transform API maintenance request to work order format
 */
function transformApiMaintenanceToWorkOrder(apiMaint: any) {
  return {
    id: apiMaint.work_order_id || `WO-${apiMaint.id}`,
    roomNumber: apiMaint.location?.replace('Room ', '') || apiMaint.room_id?.toString() || 'N/A',
    roomId: apiMaint.room_id,
    roomType: apiMaint.room_type || 'Standard',
    category: apiMaint.category || 'general',
    priority: apiMaint.priority || 'medium',
    status: apiMaint.status || 'open',
    issue: apiMaint.issue || 'Maintenance Required',
    description: apiMaint.description || '',
    assignedTo: apiMaint.assigned_to,
    technicianName: apiMaint.assigned_to_name || null,
    estimatedCost: apiMaint.estimated_cost,
    actualCost: apiMaint.actual_cost,
    estimatedDuration: apiMaint.estimated_duration || 60,
    actualDuration: apiMaint.actual_duration,
    isOOO: apiMaint.is_out_of_order || false,
    notes: apiMaint.notes || '',
    createdAt: apiMaint.reported_at || new Date().toISOString(),
    updatedAt: apiMaint.updated_at || new Date().toISOString(),
    completedAt: apiMaint.completed_at,
    activityLog: []
  };
}

/**
 * Transform API staff to technician format
 */
function transformApiStaffToTechnician(apiStaff: any) {
  return {
    id: apiStaff.id?.toString() || `TECH-${Date.now()}`,
    name: apiStaff.name || apiStaff.full_name || 'Unknown',
    specialty: apiStaff.specialty || 'General',
    status: apiStaff.clocked_in ? 'on_duty' : (apiStaff.status || 'off_duty'),
    phone: apiStaff.phone || '',
    avatar: apiStaff.avatar || (apiStaff.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()) || 'T',
    assignedTasks: 0,
    rating: apiStaff.performance_rating || 0,
  };
}

/**
 * Master Maintenance Hook - Manages all maintenance operations
 * Includes: Work Orders, Preventive Maintenance, Technicians, Inventory, Room OOO
 * Fetches data from API
 */
export function useMaintenance() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [pmTasks, setPMTasks] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch maintenance data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch work orders from maintenance service (consistent with update endpoint)
        const workOrdersData = await maintenanceService.getWorkOrders();
        if (Array.isArray(workOrdersData)) {
          const transformedWO = workOrdersData.map((wo: any) => ({
            id: wo.id, // Use numeric ID directly for API calls
            displayId: wo.work_order_number || `WO-${wo.id}`,
            roomNumber: wo.room_number || wo.location?.replace('Room ', '') || 'N/A',
            roomId: wo.room_id,
            roomType: 'Standard',
            category: wo.issue_type || 'general',
            priority: wo.priority || 'medium',
            status: wo.status || 'pending',
            issue: wo.title || 'Maintenance Required',
            description: wo.description || '',
            assignedTo: wo.assigned_to,
            technicianName: wo.assigned_to_name || null,
            estimatedCost: wo.estimated_cost,
            actualCost: wo.actual_cost,
            estimatedDuration: wo.estimated_hours ? wo.estimated_hours * 60 : 60,
            actualDuration: wo.actual_hours ? wo.actual_hours * 60 : null,
            isOOO: false,
            notes: wo.notes || wo.resolution_notes || '',
            scheduledDate: wo.scheduled_date || null,
            estimatedCompletion: wo.scheduled_date || null,
            createdAt: wo.reported_at || new Date().toISOString(),
            updatedAt: wo.updated_at || new Date().toISOString(),
            completedAt: wo.completed_at,
            activityLog: []
          }));
          setWorkOrders(transformedWO);
        }

        // Fetch maintenance staff (technicians) - try multiple approaches
        // First try by department, then by role if needed
        let staffData = await staffService.list({ department: 'maintenance' });

        // If no results, also try fetching by various maintenance roles
        if (!Array.isArray(staffData) || staffData.length === 0) {
          // Fetch all staff and filter client-side for maintenance roles
          const allStaff = await staffService.list();
          if (Array.isArray(allStaff)) {
            const maintenanceRoles = ['maintenance', 'technician', 'electrician', 'plumber', 'hvac_technician', 'hvac'];
            staffData = allStaff.filter((s: any) =>
              maintenanceRoles.includes(s.role?.toLowerCase()) ||
              s.department?.toLowerCase() === 'maintenance'
            );
          }
        }

        if (Array.isArray(staffData) && staffData.length > 0) {
          const transformedTech = staffData.map(transformApiStaffToTechnician);
          setTechnicians(transformedTech);
        } else {
          // Set empty array if no technicians found
          setTechnicians([]);
        }

        // Fetch preventive maintenance schedules from API
        try {
          const pmData = await maintenanceService.getPreventiveSchedules({ active_only: false });
          if (pmData && Array.isArray(pmData.schedules)) {
            const transformedPM = pmData.schedules.map((pm: any) => ({
              id: pm.id,
              name: pm.name,
              equipment: pm.name, // For UI compatibility
              description: pm.description || '',
              location: pm.location,
              roomNumber: pm.location?.startsWith('Room ') ? pm.location.replace('Room ', '') : '',
              category: pm.maintenance_type || 'general',
              frequency: pm.frequency || 'monthly',
              estimatedDuration: pm.estimated_duration || 60,
              assignedTo: pm.assigned_to,
              technicianName: pm.assigned_to_name || null,
              checklist: pm.checklist || [],
              priority: pm.priority || 'medium',
              isActive: pm.active !== false,
              lastCompleted: pm.last_performed || null,
              nextDueDate: pm.next_due || null,
              isOverdue: pm.is_overdue || false,
              createdAt: pm.created_at || new Date().toISOString()
            }));
            setPMTasks(transformedPM);
          }
        } catch (pmErr) {
          console.warn('Failed to fetch PM schedules:', pmErr);
          // PM schedules are optional, don't fail the whole fetch
        }

        // Fetch maintenance inventory from API
        try {
          const inventoryData = await maintenanceService.getInventoryItems();
          if (Array.isArray(inventoryData)) {
            const transformedInv = inventoryData.map((item: any) => ({
              id: item.id,
              name: item.name,
              category: item.category || 'general',
              stockLevel: item.stock_level || 0,
              minStock: item.min_stock || 10,
              unitCost: item.unit_cost || 0,
              location: item.location || '',
              partNumber: item.part_number,
              supplierId: item.supplier_id,
              reorderQuantity: item.reorder_quantity,
              lastRestocked: item.last_restocked || null,
              notes: item.notes,
              isActive: item.is_active !== false,
              createdAt: item.created_at,
              updatedAt: item.updated_at
            }));
            setInventory(transformedInv);
          }
        } catch (invErr) {
          console.warn('Failed to fetch maintenance inventory:', invErr);
          // Inventory is optional, don't fail the whole fetch
        }

      } catch (err) {
        console.error('Failed to fetch maintenance data from API:', err);
        setError('Failed to load maintenance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================================
  // WORK ORDER CRUD OPERATIONS
  // =========================================

  /**
   * Add new work order - calls backend API
   */
  const addWorkOrder = useCallback(async (data: any) => {
    try {
      // Convert assignedTo to number for backend (handles string IDs from dropdown)
      let assignedToId: number | null = null;
      if (data.assignedTo) {
        const parsed = parseInt(data.assignedTo.toString(), 10);
        if (!isNaN(parsed)) {
          assignedToId = parsed;
        }
      }

      // Call backend API to create work order
      const apiResponse = await maintenanceService.createWorkOrder({
        title: data.issue || data.title || 'Maintenance Required',
        description: data.description || '',
        location: data.roomNumber ? `Room ${data.roomNumber}` : data.location || 'Unknown',
        room_id: data.roomId,
        room_number: data.roomNumber,
        issue_type: data.category || 'general',
        priority: data.priority || 'medium',
        notes: data.notes,
        scheduled_date: data.estimatedCompletion || null,
        assigned_to: assignedToId
      });

      // Transform API response to local format
      const newWO = {
        id: apiResponse.id,
        displayId: apiResponse.work_order_number || `WO-${apiResponse.id}`,
        roomNumber: apiResponse.room_number || data.roomNumber || 'N/A',
        roomId: apiResponse.room_id,
        roomType: data.roomType || 'Standard',
        category: apiResponse.issue_type || 'general',
        priority: apiResponse.priority || 'medium',
        status: apiResponse.status || 'pending',
        issue: apiResponse.title,
        description: apiResponse.description || '',
        assignedTo: apiResponse.assigned_to || data.assignedTo || null,
        technicianName: apiResponse.assigned_to_name || data.technicianName || null,
        estimatedCost: null,
        actualCost: null,
        estimatedDuration: 60,
        actualDuration: null,
        isOOO: data.isOOO || false,
        notes: apiResponse.notes || '',
        scheduledDate: apiResponse.scheduled_date || data.estimatedCompletion || null,
        estimatedCompletion: apiResponse.scheduled_date || data.estimatedCompletion || null,
        createdAt: apiResponse.reported_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        activityLog: []
      };

      // Update local state
      setWorkOrders(prev => [newWO, ...prev]);
      toast.success(`Work Order ${newWO.displayId} created successfully`);
      return newWO;
    } catch (err: any) {
      console.error('Error creating work order:', err);
      // Handle FastAPI validation errors which can be arrays
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to create work order';
      if (detail) {
        if (Array.isArray(detail)) {
          // FastAPI validation errors return array of {loc, msg, type}
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object' && detail.msg) {
          errorMessage = detail.msg;
        }
      }
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Update existing work order - calls backend API
   */
  const updateWorkOrder = useCallback(async (woId: number, updates: any, actionLog = null) => {
    try {
      // Prepare API payload
      const apiPayload: any = {};
      if (updates.issue || updates.title) apiPayload.title = updates.issue || updates.title;
      if (updates.description !== undefined) apiPayload.description = updates.description;
      if (updates.status) apiPayload.status = updates.status;
      if (updates.priority) apiPayload.priority = updates.priority;
      if (updates.assignedTo !== undefined) apiPayload.assigned_to = updates.assignedTo;
      if (updates.notes) apiPayload.notes = updates.notes;
      if (updates.resolutionNotes) apiPayload.resolution_notes = updates.resolutionNotes;
      if (updates.estimatedCompletion !== undefined) apiPayload.scheduled_date = updates.estimatedCompletion || null;

      // Call backend API
      await maintenanceService.updateWorkOrder(woId, apiPayload);

      // Update local state
      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === woId) {
          const now = new Date().toISOString();
          let updatedLog = wo.activityLog;

          if (actionLog) {
            updatedLog = addActivityLog(wo.activityLog, actionLog);
          }

          // Sync scheduledDate and estimatedCompletion fields
          const dateValue = updates.estimatedCompletion !== undefined
            ? updates.estimatedCompletion
            : wo.estimatedCompletion;

          return {
            ...wo,
            ...updates,
            scheduledDate: dateValue,
            estimatedCompletion: dateValue,
            activityLog: updatedLog,
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Work order updated');
    } catch (err: any) {
      console.error('Error updating work order:', err);
      // Handle FastAPI validation errors which can be arrays
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to update work order';
      if (detail) {
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object' && detail.msg) {
          errorMessage = detail.msg;
        }
      }
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Delete work order
   */
  const deleteWorkOrder = useCallback((woId) => {
    setWorkOrders(prev => {
      const wo = prev.find(w => w.id === woId);

      // Decrement technician assigned tasks if assigned
      if (wo?.assignedTo) {
        setTechnicians(prevTech => prevTech.map(t => {
          if (t.id === wo.assignedTo) {
            return { ...t, assignedTasks: Math.max(0, t.assignedTasks - 1) };
          }
          return t;
        }));
      }

      return prev.filter(w => w.id !== woId);
    });
  }, []);

  // =========================================
  // WORK ORDER STATUS MANAGEMENT
  // =========================================

  /**
   * Start work on a work order - calls backend API
   */
  const startWorkOrder = useCallback(async (woId: number, user = 'System') => {
    try {
      await maintenanceService.updateWorkOrder(woId, { status: 'in_progress' });

      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === woId) {
          const now = new Date().toISOString();
          return {
            ...wo,
            status: 'in_progress',
            activityLog: addActivityLog(wo.activityLog, 'Status changed to In Progress', user),
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Work order started');
    } catch (err: any) {
      console.error('Error starting work order:', err);
      toast.error(err.response?.data?.detail || 'Failed to start work order');
    }
  }, []);

  /**
   * Complete work order - calls backend API
   */
  const completeWorkOrder = useCallback(async (woId: number, resolutionNotes?: string, user = 'System') => {
    try {
      await maintenanceService.completeWorkOrder(woId, resolutionNotes);

      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === woId) {
          const now = new Date().toISOString();
          return {
            ...wo,
            status: 'completed',
            completedAt: now,
            resolutionNotes: resolutionNotes || wo.resolutionNotes,
            activityLog: addActivityLog(wo.activityLog, 'Work order completed', user),
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Work order completed');
    } catch (err: any) {
      console.error('Error completing work order:', err);
      toast.error(err.response?.data?.detail || 'Failed to complete work order');
    }
  }, []);

  /**
   * Put work order on hold - calls backend API
   */
  const holdWorkOrder = useCallback(async (woId: number, reason = '', user = 'System') => {
    try {
      await maintenanceService.updateWorkOrder(woId, {
        status: 'on_hold',
        notes: reason || undefined
      });

      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === woId) {
          const now = new Date().toISOString();
          const action = reason ? `Status changed to On Hold - ${reason}` : 'Status changed to On Hold';
          return {
            ...wo,
            status: 'on_hold',
            activityLog: addActivityLog(wo.activityLog, action, user),
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Work order put on hold');
    } catch (err: any) {
      console.error('Error holding work order:', err);
      toast.error(err.response?.data?.detail || 'Failed to hold work order');
    }
  }, []);

  /**
   * Reopen work order - calls backend API
   */
  const reopenWorkOrder = useCallback(async (woId: number, user = 'System') => {
    try {
      await maintenanceService.updateWorkOrder(woId, { status: 'pending' });

      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === woId) {
          const now = new Date().toISOString();
          return {
            ...wo,
            status: 'pending',
            completedAt: null,
            activityLog: addActivityLog(wo.activityLog, 'Work order reopened', user),
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Work order reopened');
    } catch (err: any) {
      console.error('Error reopening work order:', err);
      toast.error(err.response?.data?.detail || 'Failed to reopen work order');
    }
  }, []);

  // =========================================
  // TECHNICIAN ASSIGNMENT
  // =========================================

  /**
   * Assign technician to work order
   */
  const assignTechnician = useCallback(async (woId: string | number, techId: string | number, user = 'System') => {
    try {
      // Ensure numeric IDs
      const numericWoId = typeof woId === 'number' ? woId : parseInt(woId.toString().replace('WO-', ''));
      const numericTechId = typeof techId === 'number' ? techId : parseInt(techId.toString());

      if (isNaN(numericWoId) || isNaN(numericTechId)) {
        throw new Error('Invalid work order or technician ID');
      }

      // Call backend API to update assignment
      await maintenanceService.updateWorkOrder(numericWoId, {
        assigned_to: numericTechId
      });

      // Update local state after successful API call
      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === numericWoId) {
          const previousTechId = wo.assignedTo;
          const tech = technicians.find(t =>
            t.id === numericTechId ||
            t.id === numericTechId.toString() ||
            t.id === techId
          );
          const techName = tech?.name || null;

          // Update technician task counts
          setTechnicians(prevTech => prevTech.map(t => {
            const tId = typeof t.id === 'number' ? t.id : parseInt(t.id);
            if (tId === previousTechId) {
              return { ...t, assignedTasks: Math.max(0, t.assignedTasks - 1) };
            }
            if (tId === numericTechId) {
              return { ...t, assignedTasks: t.assignedTasks + 1 };
            }
            return t;
          }));

          const now = new Date().toISOString();
          const action = techName ? `Assigned to ${techName}` : 'Technician unassigned';

          return {
            ...wo,
            assignedTo: numericTechId,
            technicianName: techName,
            activityLog: addActivityLog(wo.activityLog, action, user),
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Technician assigned successfully');
    } catch (err: any) {
      console.error('Error assigning technician:', err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to assign technician');
    }
  }, [technicians]);

  /**
   * Unassign technician from work order - calls backend API
   */
  const unassignTechnician = useCallback(async (woId: number, user = 'System') => {
    try {
      // Call backend API to clear assignment (pass null or 0)
      await maintenanceService.updateWorkOrder(woId, { assigned_to: 0 });

      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === woId && wo.assignedTo) {
          const previousTechId = wo.assignedTo;

          // Decrement technician task count
          setTechnicians(prevTech => prevTech.map(t => {
            if (t.id === previousTechId || t.id === previousTechId.toString()) {
              return { ...t, assignedTasks: Math.max(0, t.assignedTasks - 1) };
            }
            return t;
          }));

          const now = new Date().toISOString();

          return {
            ...wo,
            assignedTo: null,
            technicianName: null,
            activityLog: addActivityLog(wo.activityLog, 'Technician unassigned', user),
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Technician unassigned');
    } catch (err: any) {
      console.error('Error unassigning technician:', err);
      toast.error(err.response?.data?.detail || 'Failed to unassign technician');
    }
  }, []);

  // =========================================
  // ROOM OOO WORKFLOW
  // =========================================

  /**
   * Mark room as OOO and create work order - calls backend API
   * Returns the created work order
   */
  const markRoomOOO = useCallback(async (roomData: any, issueData: any, user = 'System') => {
    try {
      // Convert assignedTo to number for backend
      let assignedToId: number | null = null;
      if (issueData.assignedTo) {
        const parsed = parseInt(issueData.assignedTo.toString(), 10);
        if (!isNaN(parsed)) {
          assignedToId = parsed;
        }
      }

      // Create work order via API with technician assignment
      const apiResponse = await maintenanceService.createWorkOrder({
        title: issueData.issue || 'Room Out of Order',
        description: issueData.description || '',
        location: `Room ${roomData.roomNumber}`,
        room_id: roomData.roomId,
        room_number: roomData.roomNumber,
        issue_type: issueData.category || 'general',
        priority: issueData.priority || 'high',
        notes: issueData.notes,
        assigned_to: assignedToId
      });

      const newWO = {
        id: apiResponse.id,
        displayId: apiResponse.work_order_number || `WO-${apiResponse.id}`,
        roomNumber: roomData.roomNumber,
        roomId: roomData.roomId,
        roomType: roomData.roomType || 'Standard',
        category: apiResponse.issue_type || 'general',
        priority: apiResponse.priority || 'high',
        status: apiResponse.status || 'pending',
        issue: apiResponse.title,
        description: apiResponse.description || '',
        assignedTo: apiResponse.assigned_to || assignedToId,
        technicianName: apiResponse.assigned_to_name || issueData.technicianName || null,
        isOOO: true,
        notes: apiResponse.notes || '',
        createdAt: apiResponse.reported_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        activityLog: [{ action: 'Room marked as Out of Order', by: user, at: new Date().toISOString() }]
      };

      // Update technician task count if assigned
      if (assignedToId) {
        setTechnicians(prev => prev.map(t => {
          const tId = typeof t.id === 'number' ? t.id : parseInt(t.id);
          if (tId === assignedToId) {
            return { ...t, assignedTasks: t.assignedTasks + 1 };
          }
          return t;
        }));
      }

      setWorkOrders(prev => [newWO, ...prev]);
      toast.success('Room marked as Out of Order');
      return newWO;
    } catch (err: any) {
      console.error('Error marking room OOO:', err);
      toast.error(err.response?.data?.detail || 'Failed to mark room as out of order');
      throw err;
    }
  }, []);

  /**
   * Clear room OOO status - calls backend API
   * Closes all related work orders and marks room as available
   */
  const clearRoomOOO = useCallback(async (roomNumber: string, user = 'System') => {
    try {
      // Find OOO work orders for this room
      const oooWorkOrders = workOrders.filter(
        wo => wo.roomNumber === roomNumber && wo.isOOO && wo.status !== 'completed'
      );

      // Complete each work order via API
      for (const wo of oooWorkOrders) {
        await maintenanceService.completeWorkOrder(wo.id, 'Room OOO cleared');
      }

      // Update local state
      setWorkOrders(prev => prev.map(wo => {
        if (wo.roomNumber === roomNumber && wo.isOOO && wo.status !== 'completed') {
          const now = new Date().toISOString();
          return {
            ...wo,
            isOOO: false,
            status: 'completed',
            completedAt: now,
            activityLog: addActivityLog(wo.activityLog, 'Room OOO cleared - work order completed', user),
            updatedAt: now
          };
        }
        return wo;
      }));

      toast.success('Room OOO status cleared');
      return roomNumber;
    } catch (err: any) {
      console.error('Error clearing room OOO:', err);
      toast.error(err.response?.data?.detail || 'Failed to clear room OOO status');
      throw err;
    }
  }, [workOrders]);

  /**
   * Get all OOO rooms
   */
  const getOOORooms = useCallback(() => {
    return workOrders
      .filter(wo => wo.isOOO && wo.status !== 'completed')
      .map(wo => ({
        roomNumber: wo.roomNumber,
        roomId: wo.roomId,
        workOrderId: wo.id,
        issue: wo.issue,
        priority: wo.priority,
        assignedTo: wo.technicianName
      }));
  }, [workOrders]);

  // =========================================
  // PREVENTIVE MAINTENANCE
  // =========================================

  /**
   * Add new PM task - calls backend API
   */
  const addPMTask = useCallback(async (data: any) => {
    try {
      // Derive location from room number or use default
      let location = data.location;
      if (!location) {
        if (data.roomNumber) {
          location = `Room ${data.roomNumber}`;
        } else {
          location = 'Main Building';
        }
      }

      // Call backend API to create PM schedule
      const apiResponse = await maintenanceService.createPreventiveSchedule({
        name: data.name || data.equipment || data.title,
        description: data.description || data.notes || '',
        location: location,
        maintenance_type: data.category || 'general',
        frequency: data.frequency || 'monthly',
        estimated_duration: data.estimatedDuration || 60,
        assigned_to: data.assignedTo || undefined,
        checklist: data.checklist || [],
        priority: data.priority || 'medium',
        active: data.isActive !== false
      });

      // Transform API response to local format
      const newPM = {
        id: apiResponse.id,
        name: apiResponse.name,
        equipment: apiResponse.name, // For UI compatibility
        description: apiResponse.description || '',
        location: apiResponse.location,
        roomNumber: apiResponse.location?.replace('Room ', '') || '',
        category: apiResponse.maintenance_type || 'general',
        frequency: apiResponse.frequency || 'monthly',
        estimatedDuration: apiResponse.estimated_duration || 60,
        assignedTo: apiResponse.assigned_to,
        technicianName: apiResponse.assigned_to_name || data.technicianName || null,
        checklist: apiResponse.checklist || [],
        priority: apiResponse.priority || 'medium',
        isActive: apiResponse.active !== false,
        lastCompleted: apiResponse.last_performed || null,
        nextDueDate: apiResponse.next_due || data.nextDueDate || null,
        isOverdue: false,
        createdAt: apiResponse.created_at || new Date().toISOString()
      };

      // Update local state
      setPMTasks(prev => [newPM, ...prev]);
      toast.success(`PM Task created successfully`);
      return newPM;
    } catch (err: any) {
      console.error('Error creating PM task:', err);
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to create PM task';
      if (detail) {
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Update PM task - calls backend API
   */
  const updatePMTask = useCallback(async (pmId: number, updates: any) => {
    try {
      // Prepare API payload
      const apiPayload: any = {};
      if (updates.name) apiPayload.name = updates.name;
      if (updates.description !== undefined) apiPayload.description = updates.description;
      if (updates.location) apiPayload.location = updates.location;
      if (updates.category) apiPayload.maintenance_type = updates.category;
      if (updates.frequency) apiPayload.frequency = updates.frequency;
      if (updates.estimatedDuration !== undefined) apiPayload.estimated_duration = updates.estimatedDuration;
      if (updates.assignedTo !== undefined) apiPayload.assigned_to = updates.assignedTo;
      if (updates.checklist) apiPayload.checklist = updates.checklist;
      if (updates.priority) apiPayload.priority = updates.priority;
      if (updates.isActive !== undefined) apiPayload.active = updates.isActive;

      // Call backend API
      await maintenanceService.updatePreventiveSchedule(pmId, apiPayload);

      // Update local state
      setPMTasks(prev => prev.map(pm => {
        if (pm.id === pmId) {
          return {
            ...pm,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return pm;
      }));

      toast.success('PM Task updated');
    } catch (err: any) {
      console.error('Error updating PM task:', err);
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to update PM task';
      if (detail) {
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Delete PM task - calls backend API (deactivates)
   */
  const deletePMTask = useCallback(async (pmId: number) => {
    try {
      // Call backend API to deactivate (delete) the schedule
      await maintenanceService.deletePreventiveSchedule(pmId);

      // Remove from local state
      setPMTasks(prev => prev.filter(pm => pm.id !== pmId));
      toast.success('PM Task deleted');
    } catch (err: any) {
      console.error('Error deleting PM task:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete PM task');
    }
  }, []);

  /**
   * Complete PM task and schedule next - generates work order via API
   */
  const completePMTask = useCallback(async (pmId: number) => {
    try {
      // Generate work order from schedule via API (this also updates last_performed and next_due)
      await maintenanceService.generateWorkOrderFromSchedule(pmId);

      // Update local state with new dates
      const now = new Date().toISOString().split('T')[0];
      setPMTasks(prev => prev.map(pm => {
        if (pm.id === pmId) {
          const nextDue = calculateNextDueDate(now, pm.frequency);
          return {
            ...pm,
            lastCompleted: now,
            nextDueDate: nextDue,
            isOverdue: false,
            updatedAt: new Date().toISOString()
          };
        }
        return pm;
      }));

      toast.success('PM Task completed, work order generated');
    } catch (err: any) {
      console.error('Error completing PM task:', err);
      toast.error(err.response?.data?.detail || 'Failed to complete PM task');
    }
  }, []);

  /**
   * Toggle PM task active status - calls backend API
   */
  const togglePMActive = useCallback(async (pmId: number) => {
    try {
      // Find current PM task to get current active status
      const currentPM = pmTasks.find(pm => pm.id === pmId);
      if (!currentPM) return;

      const newActiveStatus = !currentPM.isActive;

      // Call backend API to update active status
      await maintenanceService.updatePreventiveSchedule(pmId, { active: newActiveStatus });

      // Update local state
      setPMTasks(prev => prev.map(pm => {
        if (pm.id === pmId) {
          return {
            ...pm,
            isActive: newActiveStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return pm;
      }));

      toast.success(newActiveStatus ? 'PM Task activated' : 'PM Task deactivated');
    } catch (err: any) {
      console.error('Error toggling PM task:', err);
      toast.error(err.response?.data?.detail || 'Failed to toggle PM task status');
    }
  }, [pmTasks]);

  /**
   * Get overdue PM tasks
   */
  const getOverduePMTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return pmTasks.filter(pm => pm.isActive && pm.nextDueDate && pm.nextDueDate < today);
  }, [pmTasks]);

  /**
   * Get upcoming PM tasks (next 7 days)
   */
  const getUpcomingPMTasks = useCallback((days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    return pmTasks.filter(pm =>
      pm.isActive &&
      pm.nextDueDate &&
      pm.nextDueDate >= todayStr &&
      pm.nextDueDate <= futureStr
    );
  }, [pmTasks]);

  // =========================================
  // INVENTORY MANAGEMENT
  // =========================================

  /**
   * Add inventory item - calls backend API
   */
  const addInventoryItem = useCallback(async (data: any) => {
    try {
      // Call backend API to create inventory item
      const apiResponse = await maintenanceService.createInventoryItem({
        name: data.name,
        category: data.category || 'general',
        stock_level: data.stockLevel || 0,
        min_stock: data.minStock || 10,
        unit_cost: data.unitCost || 0,
        location: data.location || '',
        part_number: data.partNumber,
        supplier_id: data.supplierId,
        reorder_quantity: data.reorderQuantity,
        notes: data.notes
      });

      // Transform API response to local format
      const newItem = {
        id: apiResponse.id,
        name: apiResponse.name,
        category: apiResponse.category || 'general',
        stockLevel: apiResponse.stock_level || 0,
        minStock: apiResponse.min_stock || 10,
        unitCost: apiResponse.unit_cost || 0,
        location: apiResponse.location || '',
        partNumber: apiResponse.part_number,
        supplierId: apiResponse.supplier_id,
        reorderQuantity: apiResponse.reorder_quantity,
        lastRestocked: apiResponse.last_restocked,
        notes: apiResponse.notes,
        isActive: apiResponse.is_active !== false,
        createdAt: apiResponse.created_at,
        updatedAt: apiResponse.updated_at
      };

      // Update local state
      setInventory(prev => [newItem, ...prev]);
      toast.success('Inventory item added successfully');
      return newItem;
    } catch (err: any) {
      console.error('Error creating inventory item:', err);
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to add inventory item';
      if (detail) {
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Update inventory item - calls backend API
   */
  const updateInventoryItem = useCallback(async (itemId: number, updates: any) => {
    try {
      // Prepare API payload (convert camelCase to snake_case)
      const apiPayload: any = {};
      if (updates.name !== undefined) apiPayload.name = updates.name;
      if (updates.category !== undefined) apiPayload.category = updates.category;
      if (updates.stockLevel !== undefined) apiPayload.stock_level = updates.stockLevel;
      if (updates.minStock !== undefined) apiPayload.min_stock = updates.minStock;
      if (updates.unitCost !== undefined) apiPayload.unit_cost = updates.unitCost;
      if (updates.location !== undefined) apiPayload.location = updates.location;
      if (updates.partNumber !== undefined) apiPayload.part_number = updates.partNumber;
      if (updates.supplierId !== undefined) apiPayload.supplier_id = updates.supplierId;
      if (updates.reorderQuantity !== undefined) apiPayload.reorder_quantity = updates.reorderQuantity;
      if (updates.notes !== undefined) apiPayload.notes = updates.notes;
      if (updates.isActive !== undefined) apiPayload.is_active = updates.isActive;

      // Call backend API
      const apiResponse = await maintenanceService.updateInventoryItem(itemId, apiPayload);

      // Update local state
      setInventory(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            name: apiResponse.name,
            category: apiResponse.category,
            stockLevel: apiResponse.stock_level,
            minStock: apiResponse.min_stock,
            unitCost: apiResponse.unit_cost,
            location: apiResponse.location || '',
            partNumber: apiResponse.part_number,
            supplierId: apiResponse.supplier_id,
            reorderQuantity: apiResponse.reorder_quantity,
            lastRestocked: apiResponse.last_restocked,
            notes: apiResponse.notes,
            isActive: apiResponse.is_active,
            updatedAt: apiResponse.updated_at
          };
        }
        return item;
      }));

      toast.success('Inventory item updated');
    } catch (err: any) {
      console.error('Error updating inventory item:', err);
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to update inventory item';
      if (detail) {
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Delete inventory item - calls backend API (deactivates)
   */
  const deleteInventoryItem = useCallback(async (itemId: number) => {
    try {
      // Call backend API to delete (deactivate) the item
      await maintenanceService.deleteInventoryItem(itemId);

      // Remove from local state
      setInventory(prev => prev.filter(item => item.id !== itemId));
      toast.success('Inventory item deleted');
    } catch (err: any) {
      console.error('Error deleting inventory item:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete inventory item');
    }
  }, []);

  /**
   * Update stock level - calls backend API
   */
  const updateStock = useCallback(async (itemId: number, quantity: number, isAddition = true) => {
    try {
      // Call backend API to adjust stock
      const apiResponse = await maintenanceService.adjustInventoryStock(itemId, {
        quantity,
        is_addition: isAddition
      });

      // Update local state with response
      setInventory(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            stockLevel: apiResponse.stock_level,
            lastRestocked: isAddition ? apiResponse.last_restocked : item.lastRestocked,
            updatedAt: apiResponse.updated_at
          };
        }
        return item;
      }));

      toast.success(isAddition ? 'Stock added' : 'Stock removed');
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      toast.error(err.response?.data?.detail || 'Failed to adjust stock');
    }
  }, []);

  /**
   * Get low stock items
   */
  const getLowStockItems = useCallback(() => {
    return inventory.filter(item => item.stockLevel <= item.minStock);
  }, [inventory]);

  // =========================================
  // TECHNICIAN MANAGEMENT
  // =========================================

  /**
   * Update technician status
   */
  const updateTechnicianStatus = useCallback((techId, status) => {
    setTechnicians(prev => prev.map(t => {
      if (t.id === techId) {
        return { ...t, status };
      }
      return t;
    }));
  }, []);

  /**
   * Get available technicians
   */
  const getAvailableTechnicians = useCallback(() => {
    return technicians.filter(t => t.status === 'active' || t.status === 'on_duty');
  }, [technicians]);

  /**
   * Get technician workload
   */
  const getTechnicianWorkload = useCallback((techId) => {
    return workOrders.filter(wo =>
      wo.assignedTo === techId &&
      wo.status !== 'completed'
    );
  }, [workOrders]);

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================

  /**
   * Get work orders by room
   */
  const getWorkOrdersByRoom = useCallback((roomNumber) => {
    return workOrders.filter(wo => wo.roomNumber === roomNumber);
  }, [workOrders]);

  /**
   * Get active work orders by room
   */
  const getActiveWorkOrdersByRoom = useCallback((roomNumber) => {
    return workOrders.filter(wo =>
      wo.roomNumber === roomNumber &&
      wo.status !== 'completed'
    );
  }, [workOrders]);

  /**
   * Get work order by ID
   */
  const getWorkOrderById = useCallback((woId) => {
    return workOrders.find(wo => wo.id === woId);
  }, [workOrders]);

  /**
   * Refresh data from API
   */
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Refresh work orders
      const workOrdersData = await maintenanceService.getWorkOrders();
      if (Array.isArray(workOrdersData)) {
        const transformedWO = workOrdersData.map((wo: any) => ({
          id: wo.id,
          displayId: wo.work_order_number || `WO-${wo.id}`,
          roomNumber: wo.room_number || wo.location?.replace('Room ', '') || 'N/A',
          roomId: wo.room_id,
          roomType: 'Standard',
          category: wo.issue_type || 'general',
          priority: wo.priority || 'medium',
          status: wo.status || 'pending',
          issue: wo.title || 'Maintenance Required',
          description: wo.description || '',
          assignedTo: wo.assigned_to,
          technicianName: wo.assigned_to_name || null,
          estimatedCost: wo.estimated_cost,
          actualCost: wo.actual_cost,
          estimatedDuration: wo.estimated_hours ? wo.estimated_hours * 60 : 60,
          actualDuration: wo.actual_hours ? wo.actual_hours * 60 : null,
          isOOO: false,
          notes: wo.notes || wo.resolution_notes || '',
          createdAt: wo.reported_at || new Date().toISOString(),
          updatedAt: wo.updated_at || new Date().toISOString(),
          completedAt: wo.completed_at,
          activityLog: []
        }));
        setWorkOrders(transformedWO);
      }

      // Refresh PM tasks
      try {
        const pmData = await maintenanceService.getPreventiveSchedules({ active_only: false });
        if (pmData && Array.isArray(pmData.schedules)) {
          const transformedPM = pmData.schedules.map((pm: any) => ({
            id: pm.id,
            name: pm.name,
            equipment: pm.name, // For UI compatibility
            description: pm.description || '',
            location: pm.location,
            roomNumber: pm.location?.startsWith('Room ') ? pm.location.replace('Room ', '') : '',
            category: pm.maintenance_type || 'general',
            frequency: pm.frequency || 'monthly',
            estimatedDuration: pm.estimated_duration || 60,
            assignedTo: pm.assigned_to,
            technicianName: pm.assigned_to_name || null,
            checklist: pm.checklist || [],
            priority: pm.priority || 'medium',
            isActive: pm.active !== false,
            lastCompleted: pm.last_performed || null,
            nextDueDate: pm.next_due || null,
            isOverdue: pm.is_overdue || false,
            createdAt: pm.created_at || new Date().toISOString()
          }));
          setPMTasks(transformedPM);
        }
      } catch (pmErr) {
        console.warn('Failed to refresh PM schedules:', pmErr);
      }

      // Refresh inventory
      try {
        const inventoryData = await maintenanceService.getInventoryItems();
        if (Array.isArray(inventoryData)) {
          const transformedInv = inventoryData.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category || 'general',
            stockLevel: item.stock_level || 0,
            minStock: item.min_stock || 10,
            unitCost: item.unit_cost || 0,
            location: item.location || '',
            partNumber: item.part_number,
            supplierId: item.supplier_id,
            reorderQuantity: item.reorder_quantity,
            lastRestocked: item.last_restocked || null,
            notes: item.notes,
            isActive: item.is_active !== false,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          }));
          setInventory(transformedInv);
        }
      } catch (invErr) {
        console.warn('Failed to refresh inventory:', invErr);
      }
    } catch (err) {
      console.error('Failed to refresh maintenance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Data
    workOrders,
    pmTasks,
    technicians,
    inventory,
    isLoading,
    error,

    // Work Order CRUD
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,

    // Work Order Status
    startWorkOrder,
    completeWorkOrder,
    holdWorkOrder,
    reopenWorkOrder,

    // Technician Assignment
    assignTechnician,
    unassignTechnician,

    // Room OOO Workflow
    markRoomOOO,
    clearRoomOOO,
    getOOORooms,

    // Preventive Maintenance
    addPMTask,
    updatePMTask,
    deletePMTask,
    completePMTask,
    togglePMActive,
    getOverduePMTasks,
    getUpcomingPMTasks,

    // Inventory
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    updateStock,
    getLowStockItems,

    // Technicians
    updateTechnicianStatus,
    getAvailableTechnicians,
    getTechnicianWorkload,

    // Utility
    getWorkOrdersByRoom,
    getActiveWorkOrdersByRoom,
    getWorkOrderById,
    refreshData
  };
}
