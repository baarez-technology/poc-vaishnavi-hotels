/**
 * AssignGuestModal Component
 * Assign guest to room - Glimmora Design System v5.0
 * Side Drawer pattern using ui2/Drawer
 */

import { useState, useEffect } from 'react';
import { Bed, UsersRound, DollarSign } from 'lucide-react';
import { Drawer } from '../../ui2/Drawer';
import { Button } from '../../ui2/Button';
import { guestsService } from '../../../api/services/guests.service';
import { useToast } from '../../../contexts/ToastContext';

export default function AssignGuestModal({ room, isOpen, onClose, onAssign }) {
  const [selectedGuest, setSelectedGuest] = useState('');
  const [availableGuests, setAvailableGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedGuest('');
      fetchGuests();
    }
  }, [isOpen]);

  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      const guests = await guestsService.list({ pageSize: 100 });
      setAvailableGuests(guests || []);
    } catch (error) {
      console.error('[AssignGuestModal] Failed to fetch guests:', error);
      toast.error('Failed to load guests');
    } finally {
      setIsLoading(false);
    }
  };

  if (!room) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedGuest) {
      toast.warning('Please select a guest');
      return;
    }

    const guest = availableGuests.find(g => String(g.id) === String(selectedGuest));
    if (guest) {
      onAssign(room.id, {
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        email: guest.email,
        phone: guest.phone
      });
      onClose();
      setSelectedGuest('');
    }
  };

  const inputStyles = "w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all";

  const renderFooter = () => (
    <div className="flex items-center justify-end gap-3">
      <Button type="button" variant="ghost" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">
        Cancel
      </Button>
      <Button type="submit" variant="primary" form="assign-guest-form" className="px-5 py-2 text-[13px] font-semibold">
        Assign Guest
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Guest"
      subtitle={`Room ${room.roomNumber} • ${room.type}`}
      maxWidth="max-w-2xl"
      footer={renderFooter()}
    >
      <form id="assign-guest-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Selection */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Guest Selection
          </h4>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
              Select Guest
            </label>
            <select
              value={selectedGuest}
              onChange={(e) => setSelectedGuest(e.target.value)}
              className={inputStyles}
              required
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading guests...' : 'Select a guest'}</option>
              {availableGuests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.first_name} {guest.last_name} {guest.email ? `(${guest.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Details */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Room Details
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <Bed className="w-4 h-4 text-neutral-400" />
                <span className="text-[11px] font-medium text-neutral-500">Bed Type</span>
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">{room.bedType}</p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <UsersRound className="w-4 h-4 text-neutral-400" />
                <span className="text-[11px] font-medium text-neutral-500">Capacity</span>
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">{room.capacity} guests</p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-neutral-400" />
                <span className="text-[11px] font-medium text-neutral-500">Price</span>
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">${room.price}/night</p>
            </div>
          </div>
        </div>

        {/* Warning if room is not available */}
        {room.status !== 'available' && (
          <div className="p-4 bg-gold-50 rounded-lg border border-gold-100">
            <p className="text-[11px] font-semibold text-gold-700 mb-1">Warning</p>
            <p className="text-[13px] text-gold-600">
              This room is currently marked as "{room.status}". Assigning a guest will change the status to "occupied".
            </p>
          </div>
        )}
      </form>
    </Drawer>
  );
}
