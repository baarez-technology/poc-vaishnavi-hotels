import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, Briefcase, Calendar, MapPin, Hash, Lock, Eye, EyeOff, DollarSign } from 'lucide-react';
import { Button } from '../../../ui2/Button';

export default function AddStaffModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'housekeeping',
    department: 'housekeeping',
    joinDate: new Date().toISOString().split('T')[0],
    floorAssignment: [],
    status: 'active',
    employeeId: '',
    password: '',
    confirmPassword: '',
    shift: 'morning',
    hourlyRate: 15
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    // Store current scroll positions
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const mainContent = document.querySelector('main');

    // Prevent body scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Prevent scrolling on main content
    if (mainContent) {
      mainContent.style.overflow = 'hidden';
    }

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'housekeeping',
      department: 'housekeeping',
      joinDate: new Date().toISOString().split('T')[0],
      floorAssignment: [],
      status: 'active',
      employeeId: '',
      password: '',
      confirmPassword: '',
      shift: 'morning',
      hourlyRate: 15
    });
    setPasswordError('');
    setShowPassword(false);
    setShowConfirmPassword(false);

    document.addEventListener('keydown', handleEsc);

    return () => {
      // Restore body scrolling
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      // Restore main content scrolling
      if (mainContent) {
        mainContent.style.overflow = '';
      }

      // Restore scroll position
      window.scrollTo(scrollX, scrollY);

      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFloorToggle = (floor) => {
    setFormData(prev => ({
      ...prev,
      floorAssignment: prev.floorAssignment.includes(floor)
        ? prev.floorAssignment.filter(f => f !== floor)
        : [...prev.floorAssignment, floor]
    }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    // Auto-set department based on role
    const roleToDepMap = {
      'housekeeping': 'housekeeping',
      'housekeeper': 'housekeeping',
      'room_attendant': 'housekeeping',
      'laundry_attendant': 'housekeeping',
      'maintenance': 'maintenance',
      'technician': 'maintenance',
      'electrician': 'maintenance',
      'plumber': 'maintenance',
      'hvac_technician': 'maintenance',
      'runner': 'runner',
      'bellhop': 'runner',
      'valet': 'runner',
      'front_desk': 'frontdesk',
      'receptionist': 'frontdesk',
      'concierge': 'frontdesk',
      'night_auditor': 'frontdesk',
      'manager': 'management',
      'supervisor': 'management',
      'general_manager': 'management',
      'admin': 'management'
    };
    setFormData(prev => ({
      ...prev,
      role: role,
      department: roleToDepMap[role] || 'general'
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.password) {
      alert('Password is required');
      return;
    }

    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError('');
    onAdd(formData);
    onClose();
  };

  // Comprehensive role options grouped by department
  const roleGroups = [
    {
      label: 'Housekeeping',
      roles: [
        { value: 'housekeeping', label: 'Housekeeper' },
        { value: 'room_attendant', label: 'Room Attendant' },
        { value: 'laundry_attendant', label: 'Laundry Attendant' },
      ]
    },
    {
      label: 'Maintenance',
      roles: [
        { value: 'maintenance', label: 'Maintenance Staff' },
        { value: 'technician', label: 'Technician' },
        { value: 'electrician', label: 'Electrician' },
        { value: 'plumber', label: 'Plumber' },
        { value: 'hvac_technician', label: 'HVAC Technician' },
      ]
    },
    {
      label: 'Runner / Bellhop',
      roles: [
        { value: 'runner', label: 'Runner' },
        { value: 'bellhop', label: 'Bellhop' },
        { value: 'valet', label: 'Valet' },
      ]
    },
    {
      label: 'Front Desk',
      roles: [
        { value: 'front_desk', label: 'Front Desk Agent' },
        { value: 'receptionist', label: 'Receptionist' },
        { value: 'concierge', label: 'Concierge' },
        { value: 'night_auditor', label: 'Night Auditor' },
      ]
    },
    {
      label: 'Management',
      roles: [
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'manager', label: 'Manager' },
        { value: 'general_manager', label: 'General Manager' },
        { value: 'admin', label: 'Administrator' },
      ]
    }
  ];

  const shifts = [
    { value: 'morning', label: 'Morning (6AM - 2PM)' },
    { value: 'afternoon', label: 'Afternoon (2PM - 10PM)' },
    { value: 'night', label: 'Night (10PM - 6AM)' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const floors = [1, 2, 3, 4, 5, 6];

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-hidden animate-scaleIn flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-serif font-bold text-neutral-900">Add New Staff</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-all duration-150 active:scale-95"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
            <p className="text-sm text-neutral-600">Fill in the details to add a new staff member</p>
          </div>

          {/* Form Content */}
          <div className="overflow-y-auto flex-1 custom-scrollbar p-4 sm:p-6 pb-4 space-y-6">
          {/* Basic Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="text-base font-semibold text-neutral-900">Basic Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <User className="w-4 h-4 text-[#A57865]" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Hash className="w-4 h-4 text-[#A57865]" />
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="EMP001"
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Briefcase className="w-4 h-4 text-[#A57865]" />
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200 cursor-pointer"
                >
                  {roleGroups.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#5C9BA4] rounded-full"></div>
              <h3 className="text-base font-semibold text-neutral-900">Account Credentials</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Lock className="w-4 h-4 text-[#5C9BA4]" />
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C9BA4] focus:border-[#5C9BA4] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Lock className="w-4 h-4 text-[#5C9BA4]" />
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full px-4 py-2.5 pr-10 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C9BA4] focus:border-[#5C9BA4] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="col-span-2">
                  <p className="text-sm text-red-500">{passwordError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#4E5840] rounded-full"></div>
              <h3 className="text-base font-semibold text-neutral-900">Contact Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Mail className="w-4 h-4 text-[#4E5840]" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="staff@glimmora.com"
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4E5840] focus:border-[#4E5840] transition-all duration-200"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Phone className="w-4 h-4 text-[#4E5840]" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4E5840] focus:border-[#4E5840] transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#CDB261] rounded-full"></div>
              <h3 className="text-base font-semibold text-neutral-900">Employment Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Calendar className="w-4 h-4 text-[#CDB261]" />
                  Join Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#CDB261] focus:border-[#CDB261] transition-all duration-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <User className="w-4 h-4 text-[#CDB261]" />
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#CDB261] focus:border-[#CDB261] transition-all duration-200 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="off-duty">Off Duty</option>
                  <option value="sick">Sick</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <Calendar className="w-4 h-4 text-[#CDB261]" />
                  Default Shift
                </label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#CDB261] focus:border-[#CDB261] transition-all duration-200 cursor-pointer"
                >
                  {shifts.map(shift => (
                    <option key={shift.value} value={shift.value}>{shift.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4 text-[#CDB261]" />
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  placeholder="15.00"
                  className="w-full px-4 py-2.5 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#CDB261] focus:border-[#CDB261] transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Floor Assignment */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <MapPin className="w-4 h-4 text-[#A57865]" />
              <h3 className="text-base font-semibold text-neutral-900">Floor Assignment</h3>
            </div>
            <div className="bg-[#FAF8F6] rounded-xl p-4 border border-neutral-100">
              <p className="text-sm text-neutral-600 mb-3">Select floors this staff member will be assigned to</p>
              <div className="flex flex-wrap gap-2">
                {floors.map(floor => (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => handleFloorToggle(floor)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      formData.floorAssignment.includes(floor)
                        ? 'bg-[#A57865] text-white border-2 border-[#A57865]'
                        : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-[#A57865]/30'
                    }`}
                  >
                    Floor {floor}
                  </button>
                ))}
              </div>
            </div>
          </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-neutral-200 p-4 sm:p-6 bg-white flex-shrink-0">
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Add Staff Member
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
