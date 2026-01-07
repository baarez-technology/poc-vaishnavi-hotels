import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

export default function MarkLeaveModal({ staff, isOpen, onClose, onMarkLeave }) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'paid',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        startDate: today,
        endDate: '',
        type: 'paid',
        notes: ''
      });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onMarkLeave(staff.id, formData);
    onClose();
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-neutral-900">Mark Leave</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {staff.name} - {staff.role}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Leave Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
            >
              <option value="paid">Paid Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="sick">Sick Leave</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={today}
                required
                className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || today}
                required
                className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any additional notes about this leave..."
              className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200 resize-none"
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-medium text-amber-900 mb-1">Leave Information</p>
            <p className="text-xs text-amber-700">
              Staff status will be updated to "On Leave" and this leave will be recorded in their history.
            </p>
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
            className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 hover:shadow transition-all duration-200 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Mark Leave
          </button>
        </div>
      </div>
    </div>
  );
}
