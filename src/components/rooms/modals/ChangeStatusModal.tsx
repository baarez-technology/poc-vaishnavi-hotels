/**
 * ChangeStatusModal Component
 * Change room status - Glimmora Design System v5.0
 * Center Modal pattern using ui2/Modal
 */

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '../../ui2/Modal';
import { Button } from '../../ui2/Button';

export default function ChangeStatusModal({ room, isOpen, onClose, onSave }) {
  const [selectedStatus, setSelectedStatus] = useState('available');

  useEffect(() => {
    if (room) {
      setSelectedStatus(room.status);
    }
  }, [room]);

  if (!room) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(room.id, selectedStatus);
    onClose();
  };

  const statusOptions = [
    { value: 'available', label: 'Available', description: 'Room is ready for new guests', dot: 'bg-sage-500', activeBg: 'bg-sage-50', activeBorder: 'border-sage-200' },
    { value: 'occupied', label: 'Occupied', description: 'Room has current guests', dot: 'bg-terra-500', activeBg: 'bg-terra-50', activeBorder: 'border-terra-200' },
    { value: 'dirty', label: 'Dirty', description: 'Room needs cleaning', dot: 'bg-gold-500', activeBg: 'bg-gold-50', activeBorder: 'border-gold-200' },
    { value: 'out_of_service', label: 'Out of Service', description: 'Minor issues, can be sold in emergency', dot: 'bg-orange-500', activeBg: 'bg-orange-50', activeBorder: 'border-orange-200' },
    { value: 'out_of_order', label: 'Out of Order', description: 'Major issues (plumbing, electrical), cannot be sold', dot: 'bg-rose-500', activeBg: 'bg-rose-50', activeBorder: 'border-rose-200' }
  ];

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <ModalTitle>Update Room Status</ModalTitle>
        <ModalDescription>Room {room.roomNumber} • {room.type}</ModalDescription>
      </ModalHeader>

      <ModalContent>
        <form onSubmit={handleSubmit}>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
              Select New Status
            </h4>
            <div className="space-y-2">
              {statusOptions.map((option) => {
                const isSelected = selectedStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStatus(option.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isSelected
                        ? `${option.activeBorder} ${option.activeBg}`
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${option.dot}`}></span>
                      <div className="text-left">
                        <p className="text-[13px] font-semibold text-neutral-900">{option.label}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{option.description}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-terra-500' : 'border border-neutral-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </ModalContent>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} className="px-5 py-2 text-[13px] font-semibold">
          Save Changes
        </Button>
      </ModalFooter>
    </Modal>
  );
}
