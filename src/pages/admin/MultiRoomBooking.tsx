/**
 * MultiRoomBooking — Create multi-room group bookings and view/manage linked rooms.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble, Plus, Search, X, Trash2, Users,
} from 'lucide-react';
import { multiRoomService, type MultiRoomBooking as MultiRoomGroup, type RoomRequest } from '@/api/services/multi-room.service';
import { guestsService } from '@/api/services/guests.service';
import { roomTypesService } from '@/api/services/roomTypes.service';
import { useToast } from '@/contexts/ToastContext';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter,
  ConfirmModal,
} from '@/components/ui2/Modal';
import { Button } from '@/components/ui2/Button';
import { Badge } from '@/components/ui2/Badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableActions,
} from '@/components/ui2/Table';

/* ── Status variant helper ───────────────────────────────────────────────── */
function bookingStatusVariant(status: string): 'success' | 'info' | 'neutral' | 'danger' | 'warning' {
  switch (status) {
    case 'confirmed': return 'success';
    case 'checked_in': return 'info';
    case 'checked_out': return 'neutral';
    case 'cancelled': return 'danger';
    case 'no_show': return 'warning';
    default: return 'success';
  }
}

// ── Room Row for create form ───────────────────────────────────────────────
interface RoomRow {
  room_type_id: string;
  adults: string;
  children: string;
  special_requests: string;
}

const emptyRoom = (): RoomRow => ({ room_type_id: '', adults: '1', children: '0', special_requests: '' });

export default function MultiRoomBooking() {
  // Create form state
  const [guestSearch, setGuestSearch] = useState('');
  const [guestResults, setGuestResults] = useState<any[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [rooms, setRooms] = useState<RoomRow[]>([emptyRoom()]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [creating, setCreating] = useState(false);

  // View group state
  const [searchParentId, setSearchParentId] = useState('');
  const [group, setGroup] = useState<MultiRoomGroup | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(false);

  // Room types
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  // Add room to existing group
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addRoomForm, setAddRoomForm] = useState<RoomRow>(emptyRoom());
  const [addingRoom, setAddingRoom] = useState(false);

  // Cancel room confirm
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);

  const { success, error } = useToast();
  const { formatSimple } = useCurrency();

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400';
  const labelCls = 'block text-[12px] font-semibold text-neutral-600 mb-1.5';

  useEffect(() => {
    roomTypesService.getRoomTypes().then(data => {
      setRoomTypes(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  // Guest search
  useEffect(() => {
    if (guestSearch.length < 2) { setGuestResults([]); return; }
    const timer = setTimeout(() => {
      guestsService.list({ search: guestSearch, pageSize: 10 }).then(setGuestResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [guestSearch]);

  const addRoom = () => setRooms(prev => [...prev, emptyRoom()]);
  const removeRoom = (idx: number) => setRooms(prev => prev.filter((_, i) => i !== idx));
  const updateRoom = (idx: number, field: string, value: string) => {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleCreate = async () => {
    if (!selectedGuest) { error('Select a guest'); return; }
    if (!arrival || !departure) { error('Set arrival and departure dates'); return; }
    const validRooms = rooms.filter(r => r.room_type_id);
    if (validRooms.length === 0) { error('Add at least one room'); return; }

    setCreating(true);
    try {
      const result = await multiRoomService.create({
        guest_id: selectedGuest.id,
        arrival_date: arrival,
        departure_date: departure,
        rooms: validRooms.map(r => ({
          room_type_id: parseInt(r.room_type_id),
          adults: parseInt(r.adults) || 1,
          children: parseInt(r.children) || 0,
          special_requests: r.special_requests || undefined,
        })),
        payment_method: paymentMethod,
      });
      success(`Group booking created — Parent #${result.parent_booking_id || result.group_booking_id}`);
      // Reset form
      setSelectedGuest(null);
      setGuestSearch('');
      setArrival('');
      setDeparture('');
      setRooms([emptyRoom()]);
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to create booking');
    }
    setCreating(false);
  };

  const handleSearchGroup = useCallback(async () => {
    const id = parseInt(searchParentId);
    if (!id) { error('Enter a valid parent booking ID'); return; }
    setLoadingGroup(true);
    try {
      const data = await multiRoomService.getLinkedBookings(id);
      setGroup(data);
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Group not found');
      setGroup(null);
    }
    setLoadingGroup(false);
  }, [searchParentId]);

  const handleAddRoom = async () => {
    if (!group || !addRoomForm.room_type_id) return;
    setAddingRoom(true);
    try {
      await multiRoomService.addRoom(group.parent_booking_id, {
        room_type_id: parseInt(addRoomForm.room_type_id),
        adults: parseInt(addRoomForm.adults) || 1,
        children: parseInt(addRoomForm.children) || 0,
        special_requests: addRoomForm.special_requests || undefined,
      });
      success('Room added to group');
      setAddRoomOpen(false);
      setAddRoomForm(emptyRoom());
      handleSearchGroup();
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to add room');
    }
    setAddingRoom(false);
  };

  const handleCancelRoom = async () => {
    if (!cancelTarget) return;
    try {
      await multiRoomService.cancelRoom(cancelTarget);
      success('Room cancelled');
      handleSearchGroup();
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to cancel room');
    }
    setCancelTarget(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Multi-Room Booking</h1>
          <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">Create group bookings and manage linked rooms</p>
        </div>

        {/* ── CREATE SECTION ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[10px] border border-neutral-100 p-6">
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-5">Create Multi-Room Booking</h2>

          <div className="space-y-5">
            {/* Guest Selector */}
            <div>
              <label className={labelCls}>Guest *</label>
              {selectedGuest ? (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-terra-50 border border-terra-200 rounded-xl">
                  <span className="text-sm font-medium text-terra-800 flex-1">
                    {selectedGuest.first_name} {selectedGuest.last_name} ({selectedGuest.email})
                  </span>
                  <button onClick={() => { setSelectedGuest(null); setGuestSearch(''); }} className="p-0.5 rounded hover:bg-terra-100">
                    <X size={14} className="text-terra-600" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    placeholder="Search guest by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400"
                    value={guestSearch}
                    onChange={e => setGuestSearch(e.target.value)}
                  />
                  {guestResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
                      {guestResults.map((g: any) => (
                        <button
                          key={g.id}
                          onClick={() => { setSelectedGuest(g); setGuestSearch(''); setGuestResults([]); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 text-sm transition-colors"
                        >
                          <span className="font-medium">{g.first_name} {g.last_name}</span>
                          <span className="text-neutral-400 ml-2">{g.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Arrival Date *</label>
                <input type="date" className={inputCls} value={arrival} onChange={e => setArrival(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Departure Date *</label>
                <input type="date" className={inputCls} value={departure} onChange={e => setDeparture(e.target.value)} />
              </div>
            </div>

            {/* Room Rows */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls}>Rooms</label>
                <button onClick={addRoom} className="flex items-center gap-1 text-[12px] text-terra-600 hover:text-terra-700 font-medium">
                  <Plus size={14} /> Add Room
                </button>
              </div>
              <div className="space-y-3">
                {rooms.map((room, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] text-neutral-500 mb-0.5">Room Type *</label>
                        <select className={inputCls} value={room.room_type_id}
                          onChange={e => updateRoom(idx, 'room_type_id', e.target.value)}>
                          <option value="">Select...</option>
                          {roomTypes.map((rt: any) => (
                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 mb-0.5">Adults</label>
                        <input type="number" min={1} className={inputCls} value={room.adults}
                          onChange={e => updateRoom(idx, 'adults', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 mb-0.5">Children</label>
                        <input type="number" min={0} className={inputCls} value={room.children}
                          onChange={e => updateRoom(idx, 'children', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 mb-0.5">Special Requests</label>
                        <input className={inputCls} value={room.special_requests}
                          onChange={e => updateRoom(idx, 'special_requests', e.target.value)} placeholder="Optional" />
                      </div>
                    </div>
                    {rooms.length > 1 && (
                      <button onClick={() => removeRoom(idx)} className="p-1.5 rounded-lg hover:bg-red-50 mt-4">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className={labelCls}>Payment Method</label>
              <select className={inputCls + ' max-w-xs'} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="btc">Bill to Company</option>
              </select>
            </div>

            {/* Submit */}
            <Button variant="primary" icon={BedDouble} onClick={handleCreate} disabled={creating} loading={creating}>
              {creating ? 'Creating...' : 'Create Group Booking'}
            </Button>
          </div>
        </div>

        {/* ── VIEW GROUP SECTION ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-[10px] border border-neutral-100 p-6">
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-5">View Group Booking</h2>

          <div className="flex items-center gap-3 mb-5">
            <input
              type="number"
              placeholder="Parent Booking ID..."
              value={searchParentId}
              onChange={e => setSearchParentId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchGroup()}
              className="px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-400 w-48"
            />
            <Button variant="primary" onClick={handleSearchGroup} disabled={loadingGroup} loading={loadingGroup}>
              Search
            </Button>
          </div>

          {group && (
            <div className="space-y-4">
              {/* Group summary */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Guest', value: group.guest_name || '—', size: 'text-[13px]' },
                  { label: 'Rooms', value: group.number_of_rooms, size: 'text-[18px]' },
                  { label: 'Stay', value: `${group.arrival_date} → ${group.departure_date}`, size: 'text-[12px]' },
                  { label: 'Total Price', value: formatSimple(group.total_price), size: 'text-[18px]' },
                ].map(card => (
                  <div key={card.label} className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-neutral-500">{card.label}</p>
                    <p className={`${card.size} font-bold text-neutral-900 mt-0.5`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Add room button */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" icon={Plus} onClick={() => setAddRoomOpen(true)}>
                  Add Room
                </Button>
              </div>

              {/* Bookings table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Room #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Adults</TableHead>
                      <TableHead>Children</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="w-[1%]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.bookings.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-neutral-900">{b.booking_number}</TableCell>
                        <TableCell>
                          {b.is_parent ? <Badge variant="primary">Parent</Badge> : '—'}
                        </TableCell>
                        <TableCell>{b.room_type || '—'}</TableCell>
                        <TableCell>{b.room_number || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge variant={bookingStatusVariant(b.status)}>{b.status.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>{b.adults}</TableCell>
                        <TableCell>{b.children}</TableCell>
                        <TableCell className="font-medium">{formatSimple(b.total_price)}</TableCell>
                        <TableCell>
                          {b.status === 'confirmed' && !b.is_parent && (
                            <Button
                              variant="outline-danger"
                              size="xs"
                              onClick={() => setCancelTarget(b.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {!group && !loadingGroup && (
            <p className="text-[13px] text-neutral-400">Enter a parent booking ID to view the group</p>
          )}
        </div>

        {/* Add Room Modal */}
        <Modal isOpen={addRoomOpen} onClose={() => setAddRoomOpen(false)} size="md">
          <ModalHeader>
            <ModalTitle>Add Room to Group</ModalTitle>
            <ModalDescription>Add another room to this group booking</ModalDescription>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Room Type *</label>
                <select className={inputCls} value={addRoomForm.room_type_id}
                  onChange={e => setAddRoomForm(f => ({ ...f, room_type_id: e.target.value }))}>
                  <option value="">Select...</option>
                  {roomTypes.map((rt: any) => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Adults</label>
                  <input type="number" min={1} className={inputCls} value={addRoomForm.adults}
                    onChange={e => setAddRoomForm(f => ({ ...f, adults: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Children</label>
                  <input type="number" min={0} className={inputCls} value={addRoomForm.children}
                    onChange={e => setAddRoomForm(f => ({ ...f, children: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Special Requests</label>
                <textarea className={`${inputCls} min-h-[50px]`} value={addRoomForm.special_requests}
                  onChange={e => setAddRoomForm(f => ({ ...f, special_requests: e.target.value }))} />
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setAddRoomOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleAddRoom}
              disabled={addingRoom || !addRoomForm.room_type_id}
              loading={addingRoom}
            >
              {addingRoom ? 'Adding...' : 'Add Room'}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Cancel room confirm */}
        <ConfirmModal
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelRoom}
          variant="danger"
          title="Cancel Room?"
          description="This room will be cancelled from the group booking."
          confirmLabel="Cancel Room"
        />
      </div>
    </div>
  );
}
