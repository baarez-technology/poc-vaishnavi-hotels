/**
 * BulkAssignDrawer Component
 * Side drawer for bulk assigning rooms - Glimmora Design System v5.0
 * Pattern matching Staff/Channel Manager drawers
 */

import { useState, useEffect } from 'react';
import { Users, Check, MapPin, ChevronDown, AlertTriangle } from 'lucide-react';
import { Drawer } from '../../ui2/Drawer';
import { Button } from '../../ui2/Button';

// Custom Select for Drawer
function DrawerSelect({ label, value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
        {label}
      </h4>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-10 px-4 rounded-lg text-[13px] bg-white border transition-all flex items-center justify-between ${
            isOpen
              ? 'border-terra-400 ring-2 ring-terra-500/10'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <span className={selectedOption ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <div className="absolute z-[70] w-full mt-1.5 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                    value === option.value ? 'bg-terra-50 text-terra-700' : 'text-neutral-700'
                  }`}
                >
                  {option.label}
                  {value === option.value && <Check className="w-4 h-4 text-terra-500" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BulkAssignModal({
  rooms,
  isOpen,
  onClose,
  onBulkAssign,
  housekeepers
}) {
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [selectedHousekeeper, setSelectedHousekeeper] = useState('');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateRooms, setDuplicateRooms] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedRooms([]);
      setSelectedHousekeeper('');
      setShowDuplicateWarning(false);
      setDuplicateRooms([]);
    }
  }, [isOpen]);

  const handleToggleRoom = (roomId: number) => {
    setSelectedRooms(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRooms(selectedRooms.length === rooms.length ? [] : rooms.map((room: any) => room.id));
  };

  // Check for rooms already assigned to the selected housekeeper
  const checkForDuplicates = (): { hasDuplicates: boolean; duplicates: string[]; newRooms: number[] } => {
    if (!selectedHousekeeper || selectedRooms.length === 0) {
      return { hasDuplicates: false, duplicates: [], newRooms: selectedRooms };
    }

    const duplicates: string[] = [];
    const newRooms: number[] = [];

    selectedRooms.forEach(roomId => {
      const room = rooms.find((r: any) => r.id === roomId);
      if (room) {
        // Check if room is already assigned to the selected housekeeper
        if (room.assignedTo?.toString() === selectedHousekeeper?.toString()) {
          duplicates.push(room.roomNumber || room.number || `Room ${roomId}`);
        } else {
          newRooms.push(roomId);
        }
      }
    });

    return { hasDuplicates: duplicates.length > 0, duplicates, newRooms };
  };

  const handleAssign = () => {
    if (selectedRooms.length > 0 && selectedHousekeeper && onBulkAssign) {
      // Check for duplicates (unless user already confirmed)
      if (!showDuplicateWarning) {
        const { hasDuplicates, duplicates } = checkForDuplicates();

        if (hasDuplicates) {
          setDuplicateRooms(duplicates);
          setShowDuplicateWarning(true);
          return;
        }
      }

      // Proceed with assignment
      onBulkAssign(selectedRooms, selectedHousekeeper);
      onClose();
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false);
    setDuplicateRooms([]);
  };

  const handleAssignNewOnly = () => {
    // Only assign rooms that aren't already assigned to this housekeeper
    const { newRooms } = checkForDuplicates();
    if (newRooms.length > 0 && onBulkAssign) {
      onBulkAssign(newRooms, selectedHousekeeper);
    }
    onClose();
  };

  const getStatusBadge = (status) => {
    const styles = {
      clean: 'bg-sage-50 text-sage-700 border-sage-200',
      dirty: 'bg-gold-50 text-gold-700 border-gold-200',
      in_progress: 'bg-terra-50 text-terra-600 border-terra-200',
      out_of_service: 'bg-rose-50 text-rose-600 border-rose-200'
    };
    const labels = { clean: 'Ready', dirty: 'Dirty', in_progress: 'Cleaning', out_of_service: 'Blocked' };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Custom header
  const renderHeader = () => (
    <div className="flex-1 min-w-0">
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Bulk Assign</h2>
      <p className="text-[13px] text-neutral-500 mt-1">Select rooms and assign to a housekeeper</p>
    </div>
  );

  // Footer
  const renderFooter = () => (
    <div className="space-y-3">
      {/* Duplicate Warning */}
      {showDuplicateWarning && duplicateRooms.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-800 text-[13px] mb-1">
                Duplicate Assignment Detected
              </h4>
              <p className="text-[12px] text-amber-700 mb-2">
                The following rooms are already assigned to this housekeeper:
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {duplicateRooms.map((roomNum, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-medium"
                  >
                    {roomNum}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCancelDuplicate}
                  className="px-3 py-1.5 text-[11px] font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                {checkForDuplicates().newRooms.length > 0 && (
                  <button
                    onClick={handleAssignNewOnly}
                    className="px-3 py-1.5 text-[11px] font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    Assign New Only ({checkForDuplicates().newRooms.length})
                  </button>
                )}
                <button
                  onClick={handleAssign}
                  className="px-3 py-1.5 text-[11px] font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Assign Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary - only show when no duplicate warning */}
      {selectedRooms.length > 0 && selectedHousekeeper && !showDuplicateWarning && (
        <div className="p-3 rounded-lg bg-sage-50 border border-sage-100">
          <div className="flex items-center gap-2 text-[13px]">
            <Check className="w-4 h-4 text-sage-600" />
            <span className="text-neutral-900">
              <span className="font-semibold">{selectedRooms.length}</span> {selectedRooms.length === 1 ? 'room' : 'rooms'} will be assigned to{' '}
              <span className="font-semibold">{housekeepers.find((hk: any) => hk.id === selectedHousekeeper)?.name}</span>
            </span>
          </div>
        </div>
      )}

      {/* Action buttons - hide when showing duplicate warning (it has its own buttons) */}
      {!showDuplicateWarning && (
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline-neutral" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleAssign}
            disabled={selectedRooms.length === 0 || !selectedHousekeeper}
          >
            Assign ({selectedRooms.length})
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      header={renderHeader()}
      footer={renderFooter()}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Select Housekeeper */}
        <DrawerSelect
          label="Select Housekeeper"
          value={selectedHousekeeper}
          onChange={setSelectedHousekeeper}
          placeholder="Choose a housekeeper..."
          options={housekeepers.map(hk => ({
            value: hk.id,
            label: `${hk.name}${hk.efficiency ? ` (${hk.efficiency}% efficiency)` : ''}`
          }))}
        />

        {/* Room Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900">
              Select Rooms ({selectedRooms.length}/{rooms.length})
            </h4>
            <button
              onClick={handleSelectAll}
              className="text-[12px] text-terra-600 hover:text-terra-700 font-semibold transition-colors"
            >
              {selectedRooms.length === rooms.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {rooms.map(room => {
              const isSelected = selectedRooms.includes(room.id);
              return (
                <div
                  key={room.id}
                  onClick={() => handleToggleRoom(room.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-terra-50 border-2 border-terra-300'
                      : 'bg-neutral-50 border border-neutral-100 hover:border-neutral-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-terra-500' : 'border-2 border-neutral-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-terra-100 flex items-center justify-center text-terra-600 font-bold text-[13px] flex-shrink-0">
                    {room.roomNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-neutral-900 text-[13px]">Room {room.roomNumber}</p>
                      {getStatusBadge(room.status)}
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 font-medium">
                      <span>{room.type}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Floor {room.floor}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {rooms.length === 0 && (
            <div className="p-8 rounded-lg bg-neutral-50 border border-neutral-100 text-center">
              <div className="w-12 h-12 bg-white border border-neutral-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">No rooms available</p>
              <p className="text-[11px] text-neutral-500 mt-1">All rooms have been assigned</p>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
