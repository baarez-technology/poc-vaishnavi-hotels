import { useState, useCallback, useEffect } from 'react';
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

        // Fetch linen inventory as general inventory
        const linenData = await housekeepingService.getLinenInventory();
        if (Array.isArray(linenData)) {
          const transformedInv = linenData.map((item: any, idx: number) => ({
            id: `INV-${item.id || idx}`,
            name: item.item_type || item.name,
            category: 'linen',
            stockLevel: item.quantity || 0,
            minStock: item.min_stock || 10,
            unitCost: 0,
            location: item.location || 'Storage',
            lastRestocked: item.last_updated?.split('T')[0] || new Date().toISOString().split('T')[0]
          }));
          setInventory(transformedInv);
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
        assigned_to: data.assignedTo || null
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
      toast.success('Work order created successfully');
      return newWO;
    } catch (err: any) {
      console.error('Error creating work order:', err);
      toast.error(err.response?.data?.detail || 'Failed to create work order');
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
      toast.error(err.response?.data?.detail || 'Failed to update work order');
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
      // Create work order via API
      const apiResponse = await maintenanceService.createWorkOrder({
        title: issueData.issue || 'Room Out of Order',
        description: issueData.description || '',
        location: `Room ${roomData.roomNumber}`,
        room_id: roomData.roomId,
        room_number: roomData.roomNumber,
        issue_type: issueData.category || 'general',
        priority: issueData.priority || 'high',
        notes: issueData.notes
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
        assignedTo: issueData.assignedTo || null,
        technicianName: issueData.technicianName || null,
        isOOO: true,
        notes: apiResponse.notes || '',
        createdAt: apiResponse.reported_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        activityLog: [{ action: 'Room marked as Out of Order', by: user, at: new Date().toISOString() }]
      };

      // If technician assigned, update via API
      if (issueData.assignedTo) {
        await maintenanceService.updateWorkOrder(apiResponse.id, { assigned_to: issueData.assignedTo });
        setTechnicians(prev => prev.map(t => {
          if (t.id === issueData.assignedTo || t.id === issueData.assignedTo.toString()) {
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
   * Add new PM task
   */
  const addPMTask = useCallback((data) => {
    const newPM = createPreventiveTask(data);
    setPMTasks(prev => [newPM, ...prev]);
    return newPM;
  }, []);

  /**
   * Update PM task
   */
  const updatePMTask = useCallback((pmId, updates) => {
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
  }, []);

  /**
   * Delete PM task
   */
  const deletePMTask = useCallback((pmId) => {
    setPMTasks(prev => prev.filter(pm => pm.id !== pmId));
  }, []);

  /**
   * Complete PM task and schedule next
   */
  const completePMTask = useCallback((pmId) => {
    setPMTasks(prev => prev.map(pm => {
      if (pm.id === pmId) {
        const now = new Date().toISOString().split('T')[0];
        const nextDue = calculateNextDueDate(now, pm.frequency);
        return {
          ...pm,
          lastCompleted: now,
          nextDueDate: nextDue,
          updatedAt: new Date().toISOString()
        };
      }
      return pm;
    }));
  }, []);

  /**
   * Toggle PM task active status
   */
  const togglePMActive = useCallback((pmId) => {
    setPMTasks(prev => prev.map(pm => {
      if (pm.id === pmId) {
        return {
          ...pm,
          isActive: !pm.isActive,
          updatedAt: new Date().toISOString()
        };
      }
      return pm;
    }));
  }, []);

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
   * Add inventory item
   */
  const addInventoryItem = useCallback((data) => {
    const newItem = {
      id: generateInventoryId(),
      name: data.name,
      category: data.category,
      stockLevel: data.stockLevel || 0,
      minStock: data.minStock || 0,
      unitCost: data.unitCost || 0,
      location: data.location || '',
      lastRestocked: data.lastRestocked || new Date().toISOString().split('T')[0]
    };
    setInventory(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  /**
   * Update inventory item
   */
  const updateInventoryItem = useCallback((itemId, updates) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    }));
  }, []);

  /**
   * Delete inventory item
   */
  const deleteInventoryItem = useCallback((itemId) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
  }, []);

  /**
   * Update stock level
   */
  const updateStock = useCallback((itemId, quantity, isAddition = true) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newLevel = isAddition
          ? item.stockLevel + quantity
          : Math.max(0, item.stockLevel - quantity);
        return {
          ...item,
          stockLevel: newLevel,
          lastRestocked: isAddition ? new Date().toISOString().split('T')[0] : item.lastRestocked
        };
      }
      return item;
    }));
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
