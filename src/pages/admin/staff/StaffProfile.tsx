import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Phone, Mail, Calendar, Clock, Star, TrendingUp,
  CheckCircle, User, Briefcase, MapPin, Shield, Edit, UserX,
  ChevronDown, ChevronUp, Loader2, Award, Languages, UserCog,
  AlertCircle, DollarSign
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { staffService } from '../../../api/services/staff.service';
import { useToast } from '../../../hooks/useToast';
import EditStaffModal from '../../../components/staff/modals/EditStaffModal';
import DisableStaffModal from '../../../components/staff/modals/DisableStaffModal';
import Toast from '../../../components/common/Toast';

// Permission configuration
const PERMISSIONS = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'guests', label: 'Guests' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'staff', label: 'Staff' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'revenue_ai', label: 'Revenue AI' },
  { key: 'reputation_ai', label: 'Reputation AI' },
  { key: 'crm', label: 'CRM' },
  { key: 'settings', label: 'Settings' },
];

// Transform API staff to display format
function transformStaff(apiStaff: any) {
  const staffName = apiStaff.name || apiStaff.full_name || 'Unknown Staff';
  const avatarInitials = staffName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';

  return {
    id: apiStaff.id?.toString(),
    employeeId: apiStaff.employee_id || `EMP-${apiStaff.id}`,
    name: staffName,
    role: apiStaff.role || 'Staff',
    department: apiStaff.department || 'general',
    status: apiStaff.status || 'active',
    phone: apiStaff.phone || '',
    email: apiStaff.email || '',
    avatar: apiStaff.avatar || avatarInitials,
    shift: apiStaff.shift || 'morning',
    shiftStart: apiStaff.shift_start || null,
    shiftEnd: apiStaff.shift_end || null,
    specialty: apiStaff.specialty || '',
    supervisorName: apiStaff.supervisor_name || null,
    floorAssignment: apiStaff.floor_assignment || null,
    joinDate: apiStaff.hire_date || new Date().toISOString().split('T')[0],
    efficiency: apiStaff.performance_rating ? Math.round(apiStaff.performance_rating * 20) : 0,
    rating: apiStaff.performance_rating || 0,
    skills: apiStaff.skills || [],
    certifications: apiStaff.certifications || [],
    languagesSpoken: apiStaff.languages_spoken || [],
    hourlyRate: apiStaff.hourly_rate || null,
    emergencyContactName: apiStaff.emergency_contact_name || null,
    emergencyContactPhone: apiStaff.emergency_contact_phone || null,
    clockedIn: apiStaff.clocked_in || false,
    clockInTime: apiStaff.clock_in_time || null,
    attendanceStats: apiStaff.attendance_stats || null,
    performance: {
      tasksCompleted: 0,
      avgResponseTime: '0 min',
      customerRating: apiStaff.performance_rating || 0,
      punctuality: 100
    },
    schedule: apiStaff.schedule || [],
    permissions: apiStaff.permissions || ['bookings', 'guests'],
  };
}

export default function StaffProfile() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  // State for staff data
  const [staff, setStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for tasks (fetched from API)
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // State for performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [showAllAttendance, setShowAllAttendance] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Fetch staff on mount
  useEffect(() => {
    const fetchStaff = async () => {
      if (!staffId) {
        setError('No staff ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const apiStaff = await staffService.get(staffId);
        setStaff(transformStaff(apiStaff));
      } catch (err) {
        console.error('Failed to fetch staff:', err);
        setError('Failed to load staff member');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [staffId]);

  // Fetch tasks and performance when staff is loaded
  useEffect(() => {
    const fetchTasksAndPerformance = async () => {
      if (!staffId || !staff) return;

      try {
        setIsLoadingTasks(true);
        // Fetch tasks
        const tasks = await staffService.getTasks(staffId);
        const transformedTasks = tasks.map((task: any) => ({
          task: task.notes || task.task_type || 'Task',
          category: task.task_type || 'General',
          assignedBy: 'System',
          status: task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Pending',
          timeTaken: task.actual_duration ? `${task.actual_duration} min` : task.estimated_duration ? `~${task.estimated_duration} min` : '-',
          completedOn: task.completed_at ? new Date(task.completed_at).toISOString().split('T')[0] : task.created_at ? new Date(task.created_at).toISOString().split('T')[0] : '-',
        }));
        setTaskHistory(transformedTasks);

        // Fetch performance metrics
        const metrics = await staffService.getPerformance(staffId, 'month');
        setPerformanceMetrics(metrics);

        // Update staff performance with real data
        if (metrics) {
          setStaff((prev: any) => ({
            ...prev,
            performance: {
              ...prev.performance,
              tasksCompleted: metrics.tasks_completed || 0,
              avgResponseTime: metrics.avg_completion_time ? `${Math.round(metrics.avg_completion_time)} min` : '0 min',
              customerRating: metrics.quality_score || prev.performance.customerRating,
              punctuality: Math.round(metrics.efficiency_score || 100),
            },
            efficiency: Math.round(metrics.efficiency_score || prev.efficiency),
          }));
        }
      } catch (err) {
        console.error('Failed to fetch tasks/performance:', err);
        // Keep empty array if fetch fails
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasksAndPerformance();
  }, [staffId, staff?.id]);

  // Edit staff handler
  const editStaff = async (id: string, updates: any) => {
    try {
      await staffService.update(id, {
        full_name: updates.name,
        role: updates.role,
        department: updates.department,
        phone: updates.phone,
        status: updates.status,
        shift: updates.shift,
      });
      setStaff((prev: any) => ({ ...prev, ...updates }));
      return true;
    } catch (err) {
      console.error('Failed to update staff:', err);
      return false;
    }
  };

  // Disable staff handler
  const disableStaff = async (id: string) => {
    try {
      await staffService.update(id, { is_active: false, status: 'disabled' });
      return true;
    } catch (err) {
      console.error('Failed to disable staff:', err);
      return false;
    }
  };

  // Generate performance trend data (must be before conditional returns)
  const performanceTrend = useMemo(() => {
    if (!staff) return [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseScore = staff.efficiency || 85;
    return days.map((day) => ({
      day,
      score: Math.max(50, Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10)),
    }));
  }, [staff]);

  // Generate task completion trend
  const taskTrend = useMemo(() => {
    if (!staff) return [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseTasks = 8;
    return days.map((day) => ({
      day,
      completed: Math.max(0, baseTasks + Math.floor(Math.random() * 6) - 3),
    }));
  }, [staff]);

  // Generate punctuality data
  const punctualityData = useMemo(() => {
    if (!staff) return [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const basePunctuality = staff.performance?.punctuality || 90;
    return months.map((month) => ({
      month,
      onTime: Math.max(70, Math.min(100, basePunctuality + Math.floor(Math.random() * 10) - 5)),
    }));
  }, [staff]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#A57865] mx-auto mb-4 animate-spin" />
          <p className="text-neutral-600">Loading staff profile...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !staff) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700">Staff Not Found</h2>
          <p className="text-neutral-500 mt-2">{error || "The staff member you're looking for doesn't exist."}</p>
          <button
            onClick={() => navigate('/admin/staff')}
            className="mt-4 px-4 py-2 bg-[#A57865] text-white rounded-lg hover:bg-[#8E6554] transition-colors"
          >
            Back to Staff
          </button>
        </div>
      </div>
    );
  }

  // Attendance data
  const attendanceData = staff.schedule || [];
  const displayedAttendance = showAllAttendance ? attendanceData : attendanceData.slice(0, 5);

  // Task history (from API state)
  const displayedTasks = showAllTasks ? taskHistory : taskHistory.slice(0, 5);

  // Staff permissions
  const staffPermissions = staff.permissions || ['bookings', 'guests'];

  const getStatusStyle = (status) => {
    const styles = {
      active: 'bg-[#5C9BA4]/10 text-[#5C9BA4] border-[#5C9BA4]/30',
      'off-duty': 'bg-neutral-100 text-neutral-600 border-neutral-200',
      sick: 'bg-rose-50 text-rose-700 border-rose-200',
      leave: 'bg-[#CDB261]/10 text-[#9A8545] border-[#CDB261]/30',
      disabled: 'bg-rose-100 text-rose-700 border-rose-300',
    };
    const labels = {
      active: 'Active',
      'off-duty': 'Off Duty',
      sick: 'Sick',
      leave: 'On Leave',
      disabled: 'Disabled',
    };
    return { style: styles[status] || styles.active, label: labels[status] || status };
  };

  const statusInfo = getStatusStyle(staff.status);

  const handleEditStaff = (id, updates) => {
    editStaff(id, updates);
    showToast('Staff details updated');
  };

  const handleDisableStaff = (id) => {
    disableStaff(id);
    showToast('Staff member disabled');
    navigate('/admin/staff');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50">
      <div className="max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/staff')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Staff</span>
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[#A57865]/15 ring-2 ring-[#A57865]/30 flex items-center justify-center text-[#A57865] font-bold text-3xl">
                {staff.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-sans font-bold text-neutral-900">{staff.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-600">{staff.role}</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.style}`}>
                    {statusInfo.label}
                  </span>
                  <span className="px-3 py-1 bg-[#FAF8F6] border border-neutral-200 rounded-full text-xs font-medium text-neutral-700 capitalize">
                    {staff.department}
                  </span>
                  <span className="px-3 py-1 bg-[#5C9BA4]/10 border border-[#5C9BA4]/30 rounded-full text-xs font-medium text-[#5C9BA4] capitalize">
                    {staff.shift} Shift
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(staff.rating || 4.5) ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-neutral-500 mt-1">{staff.rating || 4.5} Rating</p>
              </div>
              <div className="h-12 w-px bg-neutral-200" />
              <div className="text-center">
                <p className="text-3xl font-bold text-[#5C9BA4]">{staff.efficiency || 88}%</p>
                <p className="text-sm text-neutral-500">Efficiency</p>
              </div>
              <div className="h-12 w-px bg-neutral-200" />
              <div className="text-center">
                <p className="text-3xl font-bold text-[#A57865]">{staff.performance?.tasksCompleted || 245}</p>
                <p className="text-sm text-neutral-500">Tasks Done</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-[#A57865] text-white rounded-lg hover:bg-[#8E6554] transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setIsDisableModalOpen(true)}
                className="px-4 py-2 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Disable
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#A57865]" />
                Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-neutral-900">{staff.name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Employee ID</p>
                  <p className="text-sm font-medium text-neutral-900">{staff.employeeId || `EMP-${staff.id}`}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Department</p>
                  <p className="text-sm font-medium text-neutral-900 capitalize">{staff.department}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#A57865]" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FAF8F6] rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#A57865]" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Phone</p>
                    <p className="text-sm font-medium text-neutral-900">{staff.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FAF8F6] rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-[#A57865]" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Email</p>
                    <p className="text-sm font-medium text-neutral-900">{staff.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#A57865]" />
                Employment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Role</p>
                  <p className="text-sm font-medium text-neutral-900">{staff.role}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Join Date</p>
                  <p className="text-sm font-medium text-neutral-900">{staff.joinDate}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Shift</p>
                  <p className="text-sm font-medium text-neutral-900 capitalize">{staff.shift}</p>
                </div>
                {staff.floorAssignment && staff.floorAssignment.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Floor Assignment</p>
                    <div className="flex flex-wrap gap-2">
                      {staff.floorAssignment.map((floor) => (
                        <span key={floor} className="px-2 py-1 bg-[#FAF8F6] rounded text-xs font-medium text-neutral-700">
                          Floor {floor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {staff.specialty && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Specialty</p>
                    <p className="text-sm font-medium text-neutral-900">{staff.specialty}</p>
                  </div>
                )}
                {staff.supervisorName && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Supervisor</p>
                    <p className="text-sm font-medium text-neutral-900">{staff.supervisorName}</p>
                  </div>
                )}
                {(staff.shiftStart || staff.shiftEnd) && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Shift Hours</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {staff.shiftStart || '--:--'} - {staff.shiftEnd || '--:--'}
                    </p>
                  </div>
                )}
                {staff.hourlyRate && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Hourly Rate</p>
                    <p className="text-sm font-medium text-neutral-900">${staff.hourlyRate}/hr</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Clock-In Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${staff.clockedIn ? 'bg-green-500' : 'bg-neutral-300'}`} />
                    <span className="text-sm font-medium text-neutral-900">
                      {staff.clockedIn ? 'Clocked In' : 'Clocked Out'}
                    </span>
                    {staff.clockedIn && staff.clockInTime && (
                      <span className="text-xs text-neutral-500">
                        since {new Date(staff.clockInTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills & Certifications */}
            {((staff.skills && staff.skills.length > 0) || (staff.certifications && staff.certifications.length > 0)) && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#A57865]" />
                  Skills & Certifications
                </h3>
                <div className="space-y-4">
                  {staff.skills && staff.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {staff.skills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-[#5C9BA4]/10 border border-[#5C9BA4]/30 rounded text-xs font-medium text-[#5C9BA4]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {staff.certifications && staff.certifications.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {staff.certifications.map((cert: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-[#CDB261]/10 border border-[#CDB261]/30 rounded text-xs font-medium text-[#9A8545]">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Languages */}
            {staff.languagesSpoken && staff.languagesSpoken.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-[#A57865]" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {staff.languagesSpoken.map((lang: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-[#FAF8F6] border border-neutral-200 rounded-full text-xs font-medium text-neutral-700">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {(staff.emergencyContactName || staff.emergencyContactPhone) && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Emergency Contact
                </h3>
                <div className="space-y-3">
                  {staff.emergencyContactName && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Contact Name</p>
                      <p className="text-sm font-medium text-neutral-900">{staff.emergencyContactName}</p>
                    </div>
                  )}
                  {staff.emergencyContactPhone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Phone</p>
                        <p className="text-sm font-medium text-neutral-900">{staff.emergencyContactPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Permissions */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#A57865]" />
                Permissions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={staffPermissions.includes(perm.key)}
                      readOnly
                      className="w-4 h-4 text-[#A57865] rounded border-neutral-300 focus:ring-[#A57865]"
                    />
                    <span className="text-sm text-neutral-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Score Trend */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#5C9BA4]" />
                  Performance Trend
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#5C9BA4"
                      fill="#5C9BA4"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Tasks Completed */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#A57865]" />
                  Tasks Completed
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={taskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#A57865"
                      strokeWidth={2}
                      dot={{ fill: '#A57865', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Punctuality Chart */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5C9BA4]" />
                Punctuality (Last 6 Months)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={punctualityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }}
                  />
                  <Bar dataKey="onTime" fill="#5C9BA4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Log */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#A57865]" />
                  Attendance Log
                </h3>
                {attendanceData.length > 5 && (
                  <button
                    onClick={() => setShowAllAttendance(!showAllAttendance)}
                    className="text-sm text-[#A57865] hover:text-[#8E6554] flex items-center gap-1"
                  >
                    {showAllAttendance ? 'Show Less' : 'Show All'}
                    {showAllAttendance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAF8F6]">
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {displayedAttendance.length > 0 ? displayedAttendance.map((record, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 text-sm text-neutral-900">{record.date}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700 capitalize">{record.shift}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-[#5C9BA4]/10 text-[#5C9BA4] rounded text-xs font-medium">
                            Present
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                          No attendance records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Task History */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#5C9BA4]" />
                  Task History
                  {isLoadingTasks && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
                </h3>
                {taskHistory.length > 5 && (
                  <button
                    onClick={() => setShowAllTasks(!showAllTasks)}
                    className="text-sm text-[#A57865] hover:text-[#8E6554] flex items-center gap-1"
                  >
                    {showAllTasks ? 'Show Less' : 'Show All'}
                    {showAllTasks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAF8F6]">
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Assigned By</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {isLoadingTasks ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                          Loading tasks...
                        </td>
                      </tr>
                    ) : displayedTasks.length > 0 ? (
                      displayedTasks.map((task, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm font-medium text-neutral-900">{task.task}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{task.category}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{task.assignedBy}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.status === 'Completed' ? 'bg-[#5C9BA4]/10 text-[#5C9BA4]' :
                              task.status === 'In Progress' ? 'bg-[#CDB261]/10 text-[#9A8545]' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{task.timeTaken}</td>
                          <td className="px-4 py-3 text-sm text-neutral-500">{task.completedOn}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                          No task history available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditStaffModal
        staff={staff}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditStaff}
      />

      <DisableStaffModal
        staff={staff}
        isOpen={isDisableModalOpen}
        onClose={() => setIsDisableModalOpen(false)}
        onDisable={handleDisableStaff}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
