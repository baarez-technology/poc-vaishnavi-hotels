/**
 * AddStaffModal Component
 * Add new staff member - Glimmora Design System v5.0
 * Uses Drawer pattern for forms with Tailwind components
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { Drawer } from '../../ui2/Drawer';
import { Button } from '../../ui2/Button';
import DatePicker from '../../ui2/DatePicker';

// Custom Select Dropdown Component
function SelectDropdown({ value, onChange, options, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const calculatePosition = () => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width
    };
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setPosition(null);
    } else {
      setPosition(calculatePosition());
      setIsOpen(true);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setPosition(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setIsOpen(false);
        setPosition(null);
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      setPosition(calculatePosition());
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border text-left flex items-center justify-between transition-all ${
          isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className={selectedOption ? 'text-neutral-900' : 'text-neutral-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && position && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            zIndex: 9999
          }}
          className="bg-white rounded-lg border border-neutral-200 shadow-lg shadow-neutral-900/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2.5 text-left text-[13px] flex items-center justify-between transition-colors ${
                  value === option.value
                    ? 'bg-terra-50 text-terra-700 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-terra-500" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function AddStaffModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Receptionist',
    joinDate: new Date().toISOString().split('T')[0],
    floorAssignment: [],
    status: 'active',
    employeeId: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Receptionist',
        joinDate: new Date().toISOString().split('T')[0],
        floorAssignment: [],
        status: 'active',
        employeeId: ''
      });
    }
  }, [isOpen]);

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

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.employeeId) {
      return;
    }
    onAdd(formData);
    onClose();
  };

  const roleOptions = [
    { value: 'Receptionist', label: 'Receptionist' },
    { value: 'Housekeeper', label: 'Housekeeper' },
    { value: 'Concierge', label: 'Concierge' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Chef', label: 'Chef' },
    { value: 'Waiter', label: 'Waiter' },
    { value: 'Security', label: 'Security' },
    { value: 'Valet', label: 'Valet' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'off-duty', label: 'Off Duty' },
    { value: 'sick', label: 'Sick' },
    { value: 'leave', label: 'On Leave' }
  ];

  const floors = [1, 2, 3, 4, 5, 6];

  const inputStyles = "w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all";

  const renderFooter = () => (
    <div className="flex items-center justify-end gap-3">
      <Button
        variant="ghost"
        onClick={onClose}
        className="px-5 py-2 text-[13px] font-semibold"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        className="px-5 py-2 text-[13px] font-semibold"
      >
        Add Staff Member
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Staff"
      subtitle="Fill in the details to add a new staff member"
      maxWidth="max-w-2xl"
      footer={renderFooter()}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Basic Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="EMP001"
                  className={inputStyles}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Role <span className="text-rose-500">*</span>
                </label>
                <SelectDropdown
                  value={formData.role}
                  onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  options={roleOptions}
                  placeholder="Select role"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Contact Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="staff@glimmora.com"
                className={inputStyles}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className={inputStyles}
              />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Employment Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Join Date <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                value={formData.joinDate}
                onChange={(date) => setFormData(prev => ({ ...prev, joinDate: date }))}
                placeholder="Select date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <SelectDropdown
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                options={statusOptions}
                placeholder="Select status"
              />
            </div>
          </div>
        </div>

        {/* Floor Assignment */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Floor Assignment
          </h4>
          <div className="p-3 sm:p-4 rounded-lg bg-neutral-50 border border-neutral-100">
            <p className="text-[11px] text-neutral-500 mb-3">Select floors this staff member will be assigned to</p>
            <div className="flex flex-wrap gap-2">
              {floors.map(floor => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => handleFloorToggle(floor)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                    formData.floorAssignment.includes(floor)
                      ? 'bg-terra-500 text-white border border-terra-500'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  Floor {floor}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
