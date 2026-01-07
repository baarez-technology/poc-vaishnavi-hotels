import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function EditStaffModal({ staff, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: 'frontdesk',
    status: 'active',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (isOpen && staff) {
      document.body.style.overflow = 'hidden';
      setFormData({
        name: staff.name || '',
        role: staff.role || '',
        department: staff.department || 'frontdesk',
        status: staff.status || 'active',
        phone: staff.phone || '',
        email: staff.email || ''
      });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(staff.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-neutral-900">Edit Staff Details</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Update information for {staff.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-150"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Role *
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              placeholder="e.g., Receptionist"
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="name@glimmora.com"
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
            >
              <option value="frontdesk">Front Desk</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="management">Management</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
            >
              <option value="active">Active</option>
              <option value="off-duty">Off Duty</option>
              <option value="sick">Sick</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 text-sm font-semibold text-white bg-[#8E6554] rounded-lg hover:bg-[#A57865] hover:shadow transition-all duration-200 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
