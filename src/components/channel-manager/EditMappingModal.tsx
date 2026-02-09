/**
 * EditMappingModal Component
 * Drawer for editing room mappings between PMS and OTA room types - Glimmora Design System v5.0
 * Redesigned as a slide-in drawer for consistency
 */

import { useState, useEffect } from 'react';
import { Link2, Sparkles, Users } from 'lucide-react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';

export default function EditMappingModal({
  isOpen,
  onClose,
  onSave,
  room,
  ota,
  existingMapping,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [otaRoomType, setOtaRoomType] = useState('');
  const [syncRates, setSyncRates] = useState(true);
  const [syncAvailability, setSyncAvailability] = useState(true);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen && room) {
      setOtaRoomType(existingMapping?.otaRoomType || '');
      setSyncRates(existingMapping?.syncRates !== false);
      setSyncAvailability(existingMapping?.syncAvailability !== false);
      setIsLoading(false);
    }
  }, [isOpen, room, existingMapping]);

  if (!isOpen || !room) return null;

  // Suggested OTA room type names based on PMS room type
  const suggestions = [
    room.name,
    `${room.name} - ${ota?.name || 'OTA'}`,
    room.name.toLowerCase().includes('standard') ? 'Standard Double Room' : null,
    room.name.toLowerCase().includes('premium') ? 'Superior Room' : null,
    room.name.toLowerCase().includes('deluxe') ? 'Deluxe King Room' : null,
    room.name.toLowerCase().includes('suite') ? 'Executive Suite' : null
  ].filter(Boolean);

  const handleSave = async () => {
    if (!otaRoomType.trim()) {
      return; // Don't proceed if OTA room type is empty
    }
    
    setIsLoading(true);
    try {
      // Backend requires numeric pmsRoomTypeId only (no slug). Prefer roomTypeId, then numeric id.
      const numericId =
        (typeof room.roomTypeId === 'number' && Number.isInteger(room.roomTypeId))
          ? room.roomTypeId
          : (typeof room.id === 'number' && Number.isInteger(room.id))
            ? room.id
            : (/^\d+$/.test(String(room.roomTypeId ?? room.id ?? '')))
              ? parseInt(String(room.roomTypeId ?? room.id), 10)
              : undefined;
      await onSave({
        pmsRoomTypeId: numericId,
        pmsRoomType: room.id,
        pmsRoomName: room.name,
        otaRoomType: otaRoomType.trim(),
        syncRates,
        syncAvailability
      });
      // Only close if save was successful (no error thrown)
      onClose();
    } catch (err) {
      // Error handling is done in context/toast
      // Don't close modal on error so user can fix and retry
      console.error('Failed to save mapping:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = !!existingMapping;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Room Mapping' : 'Create Room Mapping'}
      subtitle={ota?.name || 'OTA'}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!otaRoomType.trim() || isLoading}
            loading={isLoading}
            className="px-5 py-2 text-[13px] font-semibold"
          >
            {isEditing ? 'Update Mapping' : 'Create Mapping'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* PMS Room Info */}
        <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-100">
          <p className="text-xs uppercase tracking-wide font-semibold mb-2 text-neutral-500">
            PMS Room Type
          </p>
          <p className="font-semibold text-lg text-neutral-900">
            {room.name}
          </p>
          <p className="text-sm flex items-center gap-1.5 mt-1 text-neutral-500">
            <Users className="w-4 h-4" />
            {room.baseOccupancy}-{room.maxOccupancy} guests
          </p>
        </div>

        {/* OTA Room Type Input */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-neutral-700">
            OTA Room Type Name
          </label>
          <input
            type="text"
            value={otaRoomType}
            onChange={(e) => setOtaRoomType(e.target.value)}
            placeholder="Enter the room type name as it appears on the OTA"
            autoFocus
            className="w-full h-9 px-3.5 rounded-lg text-sm bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
          />
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-xs font-medium mb-2 flex items-center gap-1.5 text-neutral-500">
            <Sparkles className="w-3.5 h-3.5" />
            Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOtaRoomType(suggestion)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${otaRoomType === suggestion
                  ? 'bg-terra-100 text-terra-700 border border-terra-300'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-transparent'
                  }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Sync Options */}
        <div className="p-5 rounded-xl space-y-4 bg-neutral-50 border border-neutral-100">
          <p className="text-xs uppercase tracking-wide font-semibold text-neutral-500">
            Sync Settings
          </p>

          {/* Rate Sync Toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-neutral-700">
              Sync Rates
            </span>
            <button
              type="button"
              onClick={() => setSyncRates(!syncRates)}
              className={`relative w-11 h-6 rounded-full transition-colors ${syncRates ? 'bg-terra-500' : 'bg-neutral-300'
                }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${syncRates ? 'translate-x-5' : 'translate-x-0'
                }`} />
            </button>
          </label>

          {/* Availability Sync Toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-neutral-700">
              Sync Availability
            </span>
            <button
              type="button"
              onClick={() => setSyncAvailability(!syncAvailability)}
              className={`relative w-11 h-6 rounded-full transition-colors ${syncAvailability ? 'bg-terra-500' : 'bg-neutral-300'
                }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${syncAvailability ? 'translate-x-5' : 'translate-x-0'
                }`} />
            </button>
          </label>
        </div>
      </div>
    </Drawer>
  );
}
