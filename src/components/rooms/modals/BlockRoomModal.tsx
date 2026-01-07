/**
 * BlockRoomModal Component
 * Block room form - Glimmora Design System v5.0
 * Center Modal pattern using ui2/Modal
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '../../ui2/Modal';
import { Button } from '../../ui2/Button';
import { useToast } from '../../../contexts/ToastContext';

export default function BlockRoomModal({ room, isOpen, onClose, onBlock }) {
  const [formData, setFormData] = useState({
    reason: '',
    until: ''
  });
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setFormData({ reason: '', until: '' });
    }
  }, [isOpen]);

  if (!room) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast.warning('Please provide a reason for blocking the room');
      return;
    }

    onBlock(room.id, formData.reason, formData.until);
    onClose();
    setFormData({ reason: '', until: '' });
  };

  // Get today's date for min date input
  const today = new Date().toISOString().split('T')[0];

  const reasonOptions = [
    'Maintenance - Plumbing',
    'Maintenance - Electrical',
    'Maintenance - AC/Heating',
    'Maintenance - General',
    'Renovation - Bathroom',
    'Renovation - Bedroom',
    'Renovation - Complete',
    'Pest Control',
    'Safety Issue',
    'Other'
  ];

  const inputStyles = "w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all";

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <ModalTitle>Block Room</ModalTitle>
        <ModalDescription>Room {room.roomNumber} • {room.type}</ModalDescription>
      </ModalHeader>

      <ModalContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Block Details */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
              Block Details
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Reason
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className={inputStyles}
                  required
                >
                  <option value="">Select a reason</option>
                  {reasonOptions.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                  Blocked Until (Optional)
                </label>
                <input
                  type="date"
                  name="until"
                  value={formData.until}
                  onChange={handleChange}
                  min={today}
                  className={inputStyles}
                />
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  Leave blank if duration is unknown
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-rose-700 mb-2">Important</p>
                <p className="text-[13px] text-rose-600 mb-2">
                  Blocking this room will:
                </p>
                <ul className="text-[13px] text-rose-500 ml-4 list-disc space-y-1">
                  <li>Set status to "Out of Service"</li>
                  <li>Remove any assigned guests</li>
                  <li>Make room unavailable for bookings</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </ModalContent>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSubmit} className="px-5 py-2 text-[13px] font-semibold">
          Block Room
        </Button>
      </ModalFooter>
    </Modal>
  );
}
