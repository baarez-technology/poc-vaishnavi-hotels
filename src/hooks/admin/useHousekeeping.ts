import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { housekeepingService, HousekeepingTask } from '@/api/services/housekeeping.service';
import { staffService, Staff } from '@/api/services/staff.service';

// Interface for frontend room representation
export interface HousekeepingRoom {
  id: number;
  number: string;
  roomType: string;
  floor: number;
  status: 'clean' | 'dirty' | 'in_progress' | 'inspected' | 'out_of_service';
  cleaningStatus: 'not_started' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: number | null;
  assignedStaffName?: string;
  lastCleaned?: string;
  cleaningStartedAt?: string;
  cleaningCompletedAt?: string;
  timeSinceDirtyMinutes?: number;
  notes?: string;
  taskId?: number; // Associated housekeeping task ID
  checklist: ChecklistItem[];
  bedType?: string;
  viewType?: string;
  maxOccupancy?: number;
}

export interface ChecklistItem {
  id: number;
  task: string;
  completed: boolean;
}

export interface HousekeepingStaff {
  id: number;
  name: string;
  status: 'available' | 'busy' | 'on_break' | 'off_duty';
  shift: string;
  tasksAssigned: number;
  tasksCompleted: number;
  efficiency: number;
  currentRoom?: string;
  avatar?: string;
}

// Default checklist for rooms
const defaultChecklist: ChecklistItem[] = [
  { id: 1, task: 'Make beds', completed: false },
  { id: 2, task: 'Clean bathroom', completed: false },
  { id: 3, task: 'Vacuum floors', completed: false },
  { id: 4, task: 'Dust surfaces', completed: false },
  { id: 5, task: 'Restock amenities', completed: false },
  { id: 6, task: 'Empty trash', completed: false },
  { id: 7, task: 'Check minibar', completed: false },
  { id: 8, task: 'Replace towels', completed: false },
];

/**
 * Master Housekeeping Hook - Manages all housekeeping operations
 * Connected to backend APIs for real data
 */
export function useHousekeeping() {
  const [rooms, setRooms] = useState<HousekeepingRoom[]>([]);
  const [staff, setStaff] = useState<HousekeepingStaff[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch rooms and tasks from API
   */
  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch rooms and tasks in parallel
      const [roomsData, tasksData] = await Promise.all([
        housekeepingService.getRooms(),
        housekeepingService.getTasks()
      ]);

      // Store tasks for reference
      const tasksList = Array.isArray(tasksData) ? tasksData : [];
      setTasks(tasksList);

      // Create a map of room_id to task
      const tasksByRoomId = new Map<number, HousekeepingTask>();
      tasksList.forEach((task: HousekeepingTask) => {
        // Keep only the most recent/active task per room
        if (!tasksByRoomId.has(task.room_id) ||
            task.status === 'in_progress' ||
            (task.status === 'pending' && tasksByRoomId.get(task.room_id)?.status !== 'in_progress')) {
          tasksByRoomId.set(task.room_id, task);
        }
      });

      // Transform API rooms to frontend format
      const transformedRooms: HousekeepingRoom[] = (Array.isArray(roomsData) ? roomsData : []).map((room: any) => {
        const task = tasksByRoomId.get(room.id);

        // Determine cleaning status from task or room status
        let cleaningStatus: 'not_started' | 'in_progress' | 'done' = 'not_started';
        if (room.status === 'clean' || room.status === 'inspected') {
          cleaningStatus = 'done';
        } else if (task?.status === 'in_progress') {
          cleaningStatus = 'in_progress';
        }

        return {
          id: room.id,
          number: room.number,
          roomNumber: room.number, // Add for consistency with components
          type: room.room_type || 'Standard',
          roomType: room.room_type || 'Standard',
          floor: room.floor || 1,
          status: room.status || 'dirty',
          cleaningStatus,
          priority: task?.priority || 'medium',
          assignedTo: task?.assigned_to || null,
          assignedStaffName: task?.assigned_staff_name,
          // Build assignedStaff object for StaffView and RoomCard components
          assignedStaff: task?.assigned_to ? {
            id: task.assigned_to,
            name: task.assigned_staff_name || 'Unknown',
            avatar: task.assigned_staff_name?.charAt(0) || 'U'
          } : null,
          lastCleaned: room.last_cleaned,
          cleaningStartedAt: task?.started_at,
          cleaningCompletedAt: task?.completed_at,
          notes: task?.notes || '',
          taskId: task?.id,
          checklist: [...defaultChecklist], // Reset checklist for each room
          bedType: room.bed_type,
          viewType: room.view_type,
          maxOccupancy: room.max_occupancy,
        };
      });

      setRooms(transformedRooms);
    } catch (err: any) {
      console.error('Error fetching housekeeping rooms:', err);
      setError(err.message || 'Failed to fetch rooms');
      toast.error('Failed to load housekeeping data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch housekeeping staff from API
   */
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      let staffData = await staffService.list({ department: 'housekeeping' });

      // If no results, try fetching all and filter by housekeeping roles
      if (!Array.isArray(staffData) || staffData.length === 0) {
        const allStaff = await staffService.list();
        if (Array.isArray(allStaff)) {
          const housekeepingRoles = ['housekeeping', 'housekeeper', 'room_attendant', 'laundry_attendant'];
          staffData = allStaff.filter((s: any) =>
            housekeepingRoles.includes(s.role?.toLowerCase()) ||
            s.department?.toLowerCase() === 'housekeeping'
          );
        }
      }

      // Transform to frontend format with task counts
      const transformedStaff: HousekeepingStaff[] = (Array.isArray(staffData) ? staffData : []).map((s: Staff) => {
        // Count tasks assigned to this staff member
        const assignedTasks = tasks.filter(t => t.assigned_to === s.id);
        const completedTasks = assignedTasks.filter(t => t.status === 'completed');
        const inProgressTask = assignedTasks.find(t => t.status === 'in_progress');

        return {
          id: s.id,
          name: s.name,
          status: s.clocked_in ? (inProgressTask ? 'busy' : 'available') : 'off_duty',
          shift: s.shift || 'Morning',
          tasksAssigned: assignedTasks.length,
          tasksCompleted: completedTasks.length,
          efficiency: assignedTasks.length > 0
            ? Math.round((completedTasks.length / assignedTasks.length) * 100)
            : 100,
          currentRoom: inProgressTask?.room_number,
          avatar: s.avatar,
        };
      });

      setStaff(transformedStaff);
    } catch (err: any) {
      console.error('Error fetching housekeeping staff:', err);
      toast.error('Failed to load housekeeping staff');
      setStaff([]);
    } finally {
      setStaffLoading(false);
    }
  }, [tasks]);

  // Initial data fetch - fetch rooms first, then staff (staff needs tasks for counts)
  useEffect(() => {
    const initializeData = async () => {
      await fetchRooms();
      // Staff will be fetched by the tasks useEffect after rooms/tasks load
    };
    initializeData();
  }, []);

  // Fetch staff when tasks are loaded (or re-fetch when tasks change)
  // Also fetch staff on mount even if tasks are empty (for dropdown availability)
  useEffect(() => {
    fetchStaff();
  }, [tasks]);

  // Ensure staff is available - fallback fetch if staff is still empty after initial load
  useEffect(() => {
    const ensureStaffLoaded = async () => {
      if (!isLoading && staff.length === 0 && !staffLoading) {
        console.log('Staff list empty after rooms loaded, fetching staff...');
        await fetchStaff();
      }
    };
    ensureStaffLoaded();
  }, [isLoading, staff.length, staffLoading]);

  /**
   * STAFF ASSIGNMENT SYSTEM
   */
  const assignStaffToRoom = useCallback(async (roomId: number, staffId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('Room not found');
        return;
      }

      let taskId = room.taskId;

      // Create a task if one doesn't exist
      if (!taskId) {
        const newTask = await housekeepingService.createTask({
          room_id: roomId,
          task_type: 'cleaning',
          priority: room.priority || 'medium',
        });
        taskId = newTask.id;
      }

      // Assign staff to the task
      await housekeepingService.assignTask(taskId, {
        staff_id: staffId,
        priority: room.priority,
      });

      // Update local state
      const staffMember = staff.find(s => s.id === staffId);
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            assignedTo: staffId,
            assignedStaffName: staffMember?.name,
            assignedStaff: staffMember ? {
              id: staffId,
              name: staffMember.name,
              avatar: staffMember.avatar || staffMember.name?.charAt(0) || 'U'
            } : null,
            taskId,
          };
        }
        return r;
      }));

      // Update staff task counts
      setStaff(prev => prev.map(s => {
        if (s.id === staffId) {
          return { ...s, tasksAssigned: s.tasksAssigned + 1, status: 'busy' };
        }
        return s;
      }));

      toast.success(`Room ${room.number} assigned to ${staffMember?.name || 'staff'}`);
    } catch (err: any) {
      console.error('Error assigning staff:', err);
      toast.error(err.response?.data?.detail || 'Failed to assign staff');
    }
  }, [rooms, staff]);

  /**
   * BULK ASSIGNMENT
   */
  const bulkAssignRooms = useCallback(async (roomIds: number[], staffId: number) => {
    try {
      for (const roomId of roomIds) {
        await assignStaffToRoom(roomId, staffId);
      }
      toast.success(`${roomIds.length} rooms assigned`);
    } catch (err: any) {
      console.error('Error bulk assigning rooms:', err);
      toast.error('Failed to assign some rooms');
    }
  }, [assignStaffToRoom]);

  /**
   * CLEANING WORKFLOW ENGINE
   */
  const startCleaning = useCallback(async (roomId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('Room not found');
        return;
      }

      let taskId = room.taskId;

      // Create task if doesn't exist
      if (!taskId) {
        const newTask = await housekeepingService.createTask({
          room_id: roomId,
          task_type: 'cleaning',
          priority: room.priority || 'medium',
        });
        taskId = newTask.id;
      }

      // Start the task
      await housekeepingService.startTask(taskId);

      // Update room status
      await housekeepingService.updateRoomStatus(roomId, { status: 'in_progress' });

      // Update local state
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            cleaningStatus: 'in_progress',
            status: 'in_progress',
            cleaningStartedAt: new Date().toISOString(),
            taskId,
          };
        }
        return r;
      }));

      toast.success(`Started cleaning room ${room.number}`);
    } catch (err: any) {
      console.error('Error starting cleaning:', err);
      toast.error(err.response?.data?.detail || 'Failed to start cleaning');
    }
  }, [rooms]);

  const markRoomCleaned = useCallback(async (roomId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('Room not found');
        return;
      }

      // Complete the task if exists
      if (room.taskId) {
        await housekeepingService.completeTask(room.taskId);
      }

      // Update room status to clean
      await housekeepingService.updateRoomStatus(roomId, { status: 'clean' });

      // Update local state
      const completedAt = new Date().toISOString();
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            cleaningStatus: 'done',
            status: 'clean',
            cleaningCompletedAt: completedAt,
            lastCleaned: new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            timeSinceDirtyMinutes: 0,
          };
        }
        return r;
      }));

      // Update staff completed tasks
      if (room.assignedTo) {
        setStaff(prev => prev.map(s => {
          if (s.id === room.assignedTo) {
            const newCompleted = s.tasksCompleted + 1;
            return {
              ...s,
              tasksCompleted: newCompleted,
              efficiency: Math.round((newCompleted / s.tasksAssigned) * 100),
              status: 'available',
            };
          }
          return s;
        }));
      }

      toast.success(`Room ${room.number} marked as clean`);
    } catch (err: any) {
      console.error('Error marking room cleaned:', err);
      toast.error(err.response?.data?.detail || 'Failed to mark room as cleaned');
    }
  }, [rooms]);

  /**
   * ROOM STATUS ENGINE
   */
  const markRoomDirty = useCallback(async (roomId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('Room not found');
        return;
      }

      // Update room status via API
      await housekeepingService.updateRoomStatus(roomId, { status: 'dirty' });

      // Update local state
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: 'dirty',
            cleaningStatus: 'not_started',
            cleaningStartedAt: undefined,
            cleaningCompletedAt: undefined,
            timeSinceDirtyMinutes: 0,
            checklist: defaultChecklist.map(item => ({ ...item, completed: false })),
          };
        }
        return r;
      }));

      toast.success(`Room ${room.number} marked as dirty`);
    } catch (err: any) {
      console.error('Error marking room dirty:', err);
      toast.error(err.response?.data?.detail || 'Failed to mark room as dirty');
    }
  }, [rooms]);

  const updateRoomStatus = useCallback(async (roomId: number, newStatus: string) => {
    try {
      await housekeepingService.updateRoomStatus(roomId, { status: newStatus });

      setRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          return { ...room, status: newStatus as any };
        }
        return room;
      }));
    } catch (err: any) {
      console.error('Error updating room status:', err);
      toast.error(err.response?.data?.detail || 'Failed to update room status');
    }
  }, []);

  const blockRoom = useCallback(async (roomId: number, reason?: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('Room not found');
        return;
      }

      await housekeepingService.updateRoomStatus(roomId, {
        status: 'out_of_service',
        notes: reason || 'Room blocked for maintenance'
      });

      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: 'out_of_service',
            assignedTo: null,
            notes: reason || 'Room blocked for maintenance',
          };
        }
        return r;
      }));

      // Update staff task count if was assigned
      if (room.assignedTo) {
        setStaff(prev => prev.map(s => {
          if (s.id === room.assignedTo) {
            return { ...s, tasksAssigned: Math.max(0, s.tasksAssigned - 1) };
          }
          return s;
        }));
      }

      toast.success(`Room ${room.number} blocked`);
    } catch (err: any) {
      console.error('Error blocking room:', err);
      toast.error(err.response?.data?.detail || 'Failed to block room');
    }
  }, [rooms]);

  const unblockRoom = useCallback(async (roomId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('Room not found');
        return;
      }

      const newStatus = room.cleaningStatus === 'done' ? 'clean' : 'dirty';
      await housekeepingService.updateRoomStatus(roomId, { status: newStatus });

      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return { ...r, status: newStatus, notes: '' };
        }
        return r;
      }));

      toast.success(`Room ${room.number} unblocked`);
    } catch (err: any) {
      console.error('Error unblocking room:', err);
      toast.error(err.response?.data?.detail || 'Failed to unblock room');
    }
  }, [rooms]);

  /**
   * CHECKLIST MANAGEMENT (local only - checklists are not stored in backend)
   */
  const toggleChecklistItem = useCallback((roomId: number, taskId: number) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const updatedChecklist = room.checklist.map(item => {
          if (item.id === taskId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });

        // Check if all tasks are completed
        const allCompleted = updatedChecklist.every(item => item.completed);

        // Auto-mark room as clean if all tasks completed
        if (allCompleted && room.status !== 'clean') {
          // Trigger API call to mark room clean
          markRoomCleaned(roomId);
        }

        return { ...room, checklist: updatedChecklist };
      }
      return room;
    }));
  }, [markRoomCleaned]);

  const editChecklist = useCallback((roomId: number, newChecklist: ChecklistItem[]) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return { ...room, checklist: newChecklist };
      }
      return room;
    }));
  }, []);

  const addChecklistItem = useCallback((roomId: number, taskName: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const maxId = Math.max(...room.checklist.map(item => item.id), 0);
        const newItem: ChecklistItem = {
          id: maxId + 1,
          task: taskName,
          completed: false,
        };
        return { ...room, checklist: [...room.checklist, newItem] };
      }
      return room;
    }));
  }, []);

  const removeChecklistItem = useCallback((roomId: number, taskId: number) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          checklist: room.checklist.filter(item => item.id !== taskId),
        };
      }
      return room;
    }));
  }, []);

  /**
   * PRIORITY MANAGEMENT
   */
  const updatePriority = useCallback(async (roomId: number, priority: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (room?.taskId) {
        await housekeepingService.updateTask(room.taskId, { notes: `Priority: ${priority}` });
      }

      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return { ...r, priority: priority as any };
        }
        return r;
      }));
    } catch (err: any) {
      console.error('Error updating priority:', err);
      // Update locally even if API fails
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return { ...r, priority: priority as any };
        }
        return r;
      }));
    }
  }, [rooms]);

  /**
   * NOTES MANAGEMENT
   */
  const updateNotes = useCallback(async (roomId: number, notes: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (room?.taskId) {
        await housekeepingService.updateTask(room.taskId, { notes });
      }

      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return { ...r, notes };
        }
        return r;
      }));
    } catch (err: any) {
      console.error('Error updating notes:', err);
      // Update locally even if API fails
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return { ...r, notes };
        }
        return r;
      }));
    }
  }, [rooms]);

  /**
   * Add note with timestamp
   */
  const addNote = useCallback((roomId: number, newNote: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const timestamp = new Date().toLocaleString();
        const existingNotes = room.notes || '';
        const updatedNotes = existingNotes
          ? `${existingNotes}\n[${timestamp}] ${newNote}`
          : `[${timestamp}] ${newNote}`;
        return { ...room, notes: updatedNotes };
      }
      return room;
    }));
  }, []);

  /**
   * INSPECTION / VERIFY SYSTEM
   */
  const inspectRoom = useCallback(async (roomId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room || room.status !== 'clean') {
        toast.error('Room must be clean before inspection');
        return;
      }

      await housekeepingService.inspectRoom(roomId, { passed: true });

      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: 'inspected',
          };
        }
        return r;
      }));

      toast.success(`Room ${room.number} inspected and approved`);
    } catch (err: any) {
      console.error('Error inspecting room:', err);
      toast.error(err.response?.data?.detail || 'Failed to inspect room');
    }
  }, [rooms]);

  /**
   * AUTO-ASSIGN ALGORITHM - Uses backend multi-factor scoring
   * Factors: Workload (30%), Skills (25%), Availability (20%), Performance (15%), Proximity (10%)
   * Returns detailed assignment results for display
   */
  const runAutoAssign = useCallback(async () => {
    try {
      // Call the intelligent auto-assign API
      const result = await housekeepingService.autoAssignAllTasks();

      if (result.total_assigned > 0) {
        // Refresh data to get updated assignments
        await fetchRooms();

        // Build detailed assignments list
        const detailedAssignments = result.results
          .filter(r => r.success)
          .map(r => ({
            roomId: r.task_id,
            roomNumber: r.room_number || `Room ${r.task_id}`,
            staffId: r.assigned_to,
            staffName: r.assigned_to_name || 'Staff',
            score: r.score,
          }));

        // Group assignments by staff for summary
        const staffAssignments = detailedAssignments.reduce((acc, a) => {
          if (!acc[a.staffName]) {
            acc[a.staffName] = [];
          }
          acc[a.staffName].push(a.roomNumber);
          return acc;
        }, {} as Record<string, string[]>);

        // Build detailed summary message
        const staffSummary = Object.entries(staffAssignments)
          .map(([staffName, rooms]) => `${staffName}: ${rooms.join(', ')}`)
          .join('\n');

        const summary = `Auto-assigned ${result.total_assigned} task(s):\n${staffSummary}`;

        // Show detailed toast with assignment info
        toast.success(
          `${result.total_assigned} tasks assigned!\n\n${Object.entries(staffAssignments)
            .map(([name, rooms]) => `• ${name} → Rooms ${rooms.join(', ')}`)
            .join('\n')}`,
          { duration: 6000 }
        );

        return {
          success: true,
          totalAssigned: result.total_assigned,
          assignments: detailedAssignments,
          staffAssignments,
          summary,
          message: summary,
        };
      } else {
        // Fallback: Check if there are unassigned rooms that need tasks created first
        const unassignedRooms = rooms.filter(
          r => (r.status === 'dirty' || r.cleaningStatus === 'not_started') && !r.assignedTo && !r.taskId
        );

        if (unassignedRooms.length > 0) {
          // Create tasks for rooms that don't have one, then auto-assign
          const assignedDetails: Array<{ roomNumber: string; staffName: string }> = [];

          for (const room of unassignedRooms) {
            try {
              const newTask = await housekeepingService.createTask({
                room_id: room.id,
                task_type: 'cleaning',
                priority: room.priority || 'medium',
              });

              if (newTask.id) {
                const assignResult = await housekeepingService.autoAssignTask(newTask.id);
                if (assignResult.success) {
                  assignedDetails.push({
                    roomNumber: room.number || room.roomNumber || `Room ${room.id}`,
                    staffName: assignResult.assigned_to_name || 'Staff',
                  });
                }
              }
            } catch (err) {
              console.warn(`Failed to create/assign task for room ${room.number}:`, err);
            }
          }

          if (assignedDetails.length > 0) {
            await fetchRooms();

            // Group by staff
            const staffAssignments = assignedDetails.reduce((acc, a) => {
              if (!acc[a.staffName]) acc[a.staffName] = [];
              acc[a.staffName].push(a.roomNumber);
              return acc;
            }, {} as Record<string, string[]>);

            const summary = `Created and assigned ${assignedDetails.length} task(s)`;

            toast.success(
              `${assignedDetails.length} tasks created & assigned!\n\n${Object.entries(staffAssignments)
                .map(([name, rooms]) => `• ${name} → Rooms ${rooms.join(', ')}`)
                .join('\n')}`,
              { duration: 6000 }
            );

            return {
              success: true,
              totalAssigned: assignedDetails.length,
              assignments: assignedDetails,
              staffAssignments,
              summary,
              message: summary
            };
          }
        }

        toast.info('No unassigned tasks to process');
        return { success: false, assignments: [], summary: 'No tasks to assign', message: 'No tasks to assign' };
      }
    } catch (err: any) {
      console.error('Error in auto-assign:', err);

      // Fallback to simple round-robin if API fails
      const unassignedRooms = rooms.filter(
        r => (r.status === 'dirty' || r.cleaningStatus === 'not_started') && !r.assignedTo
      );
      const availableStaff = staff.filter(s => s.status === 'available');

      if (unassignedRooms.length === 0 || availableStaff.length === 0) {
        toast.error(unassignedRooms.length === 0 ? 'No rooms need assignment' : 'No available staff');
        return { success: false, assignments: [], message: 'No assignments possible' };
      }

      // Simple fallback with tracking
      const assignedDetails: Array<{ roomNumber: string; staffName: string }> = [];
      let staffIndex = 0;

      for (const room of unassignedRooms.slice(0, 10)) {
        const staffMember = availableStaff[staffIndex % availableStaff.length];
        try {
          await assignStaffToRoom(room.id, staffMember.id);
          assignedDetails.push({
            roomNumber: room.number || room.roomNumber || `Room ${room.id}`,
            staffName: staffMember.name,
          });
          staffIndex++;
        } catch (e) {
          console.warn(`Fallback assign failed for room ${room.number}`);
        }
      }

      if (assignedDetails.length > 0) {
        const staffAssignments = assignedDetails.reduce((acc, a) => {
          if (!acc[a.staffName]) acc[a.staffName] = [];
          acc[a.staffName].push(a.roomNumber);
          return acc;
        }, {} as Record<string, string[]>);

        toast.success(
          `${assignedDetails.length} rooms assigned (fallback mode):\n\n${Object.entries(staffAssignments)
            .map(([name, rooms]) => `• ${name} → Rooms ${rooms.join(', ')}`)
            .join('\n')}`,
          { duration: 6000 }
        );

        return {
          success: true,
          totalAssigned: assignedDetails.length,
          assignments: assignedDetails,
          staffAssignments,
          message: `Fallback assigned ${assignedDetails.length} rooms`
        };
      } else {
        toast.error('Failed to auto-assign rooms');
        return { success: false, assignments: [], message: 'Failed to assign' };
      }
    }
  }, [rooms, staff, assignStaffToRoom, fetchRooms]);

  /**
   * ADD CLEANING TASK
   */
  const addCleaningTask = useCallback(async (taskData: {
    roomId: number;
    staffId?: number;
    priority?: string;
    notes?: string;
    estimatedTime?: number;
  }) => {
    try {
      const { roomId, staffId, priority, notes, estimatedTime } = taskData;

      // Create task via API
      const newTask = await housekeepingService.createTask({
        room_id: roomId,
        task_type: 'cleaning',
        priority: priority || 'medium',
        notes,
        estimated_duration: estimatedTime,
      });

      // Assign staff if provided
      if (staffId && newTask.id) {
        await housekeepingService.assignTask(newTask.id, { staff_id: staffId });
      }

      // Update local state
      const staffMember = staffId ? staff.find(s => s.id === staffId) : null;
      setRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            assignedTo: staffId || null,
            assignedStaffName: staffMember?.name,
            priority: (priority as any) || room.priority,
            notes: notes || room.notes,
            taskId: newTask.id,
          };
        }
        return room;
      }));

      // Update staff task count
      if (staffId) {
        setStaff(prev => prev.map(s => {
          if (s.id === staffId) {
            return { ...s, tasksAssigned: s.tasksAssigned + 1 };
          }
          return s;
        }));
      }

      toast.success('Task created successfully');
    } catch (err: any) {
      console.error('Error adding cleaning task:', err);
      toast.error(err.response?.data?.detail || 'Failed to create task');
    }
  }, [staff]);

  /**
   * UNASSIGN STAFF FROM ROOM
   */
  const unassignStaff = useCallback(async (roomId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error('Room not found');
        return;
      }

      // Update task to remove assignment
      if (room.taskId) {
        await housekeepingService.updateTask(room.taskId, { assigned_to: undefined });
      }

      // Decrement staff task count
      if (room.assignedTo) {
        setStaff(prev => prev.map(s => {
          if (s.id === room.assignedTo) {
            return { ...s, tasksAssigned: Math.max(0, s.tasksAssigned - 1) };
          }
          return s;
        }));
      }

      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return { ...r, assignedTo: null, assignedStaffName: undefined, assignedStaff: null };
        }
        return r;
      }));

      toast.success(`Staff unassigned from room ${room.number}`);
    } catch (err: any) {
      console.error('Error unassigning staff:', err);
      toast.error(err.response?.data?.detail || 'Failed to unassign staff');
    }
  }, [rooms]);

  /**
   * REFRESH DATA
   */
  const refreshData = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    setRooms,
    staff,
    setStaff,
    isLoading,
    staffLoading,
    error,
    // Data fetching
    refreshData,
    refreshStaff: fetchStaff,
    // Staff assignment
    assignStaffToRoom,
    bulkAssignRooms,
    unassignStaff,
    // Cleaning workflow
    startCleaning,
    markRoomCleaned,
    markRoomDirty,
    // Status engine
    updateRoomStatus,
    blockRoom,
    unblockRoom,
    // Checklist management
    toggleChecklistItem,
    editChecklist,
    addChecklistItem,
    removeChecklistItem,
    // Priority and notes
    updatePriority,
    updateNotes,
    addNote,
    // Inspection
    inspectRoom,
    // Auto-assign
    runAutoAssign,
    // Add cleaning task
    addCleaningTask,
  };
}
