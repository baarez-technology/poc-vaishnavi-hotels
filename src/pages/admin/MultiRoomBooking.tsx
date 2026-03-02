/**
 * MultiRoomBooking — Create multi-room group bookings and view/manage linked rooms.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble, Plus, Search, X, Trash2, ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import { multiRoomService, type MultiRoomBooking as MultiRoomGroup, type RoomRequest } from '@/api/services/multi-room.service';
import { guestsService } from '@/api/services/guests.service';
import { roomTypesService } from '@/api/services/roomTypes.service';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    checked_in: 'bg-blue-50 text-blue-700 border-blue-200',
    checked_out: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    no_show: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || colors.confirmed}`}>
      {status.replace('_', ' ')}
    </span>
  );
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
    if (!selectedGuest) { toast.error('Select a guest'); return; }
    if (!arrival || !departure) { toast.error('Set arrival and departure dates'); return; }
    const validRooms = rooms.filter(r => r.room_type_id);
    if (validRooms.length === 0) { toast.error('Add at least one room'); return; }

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
      toast.success(`Group booking created — Parent #${result.parent_booking_id || result.group_booking_id}`);
      // Reset form
      setSelectedGuest(null);
      setGuestSearch('');
      setArrival('');
      setDeparture('');
      setRooms([emptyRoom()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create booking');
    }
    setCreating(false);
  };

  const handleSearchGroup = useCallback(async () => {
    const id = parseInt(searchParentId);
    if (!id) { toast.error('Enter a valid parent booking ID'); return; }
    setLoadingGroup(true);
    try {
      const data = await multiRoomService.getLinkedBookings(id);
      setGroup(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Group not found');
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
      toast.success('Room added to group');
      setAddRoomOpen(false);
      setAddRoomForm(emptyRoom());
      handleSearchGroup();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add room');
    }
    setAddingRoom(false);
  };

  const handleCancelRoom = async (bookingId: number) => {
    if (!window.confirm('Cancel this room from the group?')) return;
    try {
      await multiRoomService.cancelRoom(bookingId);
      toast.success('Room cancelled');
      handleSearchGroup();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to cancel room');
    }
  };

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30';
  const labelCls = 'block text-[12px] font-medium text-neutral-600 mb-1';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
          <Users size={20} className="text-terra-600" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-neutral-900">Multi-Room Booking</h1>
          <p className="text-[12px] text-neutral-500">Create group bookings and manage linked rooms</p>
        </div>
      </div>

      {/* ── CREATE SECTION ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-5">Create Multi-Room Booking</h2>

        <div className="space-y-5">
          {/* Guest Selector */}
          <div>
            <label className={labelCls}>Guest *</label>
            {selectedGuest ? (
              <div className="flex items-center gap-3 px-3 py-2 bg-terra-50 border border-terra-200 rounded-lg">
                <span className="text-[13px] font-medium text-terra-800 flex-1">
                  {selectedGuest.first_name} {selectedGuest.last_name} ({selectedGuest.email})
                </span>
                <button onClick={() => { setSelectedGuest(null); setGuestSearch(''); }} className="p-0.5 rounded hover:bg-terra-100">
                  <X size={14} className="text-terra-600" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  placeholder="Search guest by name or email..."
                  className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
                  value={guestSearch}
                  onChange={e => setGuestSearch(e.target.value)}
                />
                {guestResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                    {guestResults.map((g: any) => (
                      <button
                        key={g.id}
                        onClick={() => { setSelectedGuest(g); setGuestSearch(''); setGuestResults([]); }}
                        className="w-full px-4 py-2 text-left hover:bg-neutral-50 text-[13px]"
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
                <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
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
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50"
          >
            <BedDouble size={16} />
            {creating ? 'Creating...' : 'Create Group Booking'}
          </button>
        </div>
      </div>

      {/* ── VIEW GROUP SECTION ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-5">View Group Booking</h2>

        <div className="flex items-center gap-3 mb-5">
          <input
            type="number"
            placeholder="Parent Booking ID..."
            value={searchParentId}
            onChange={e => setSearchParentId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchGroup()}
            className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 w-48"
          />
          <button
            onClick={handleSearchGroup}
            disabled={loadingGroup}
            className="px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50"
          >
            {loadingGroup ? 'Loading...' : 'Search'}
          </button>
        </div>

        {group && (
          <div className="space-y-4">
            {/* Group summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-[11px] text-neutral-500">Guest</p>
                <p className="text-[13px] font-bold text-neutral-900">{group.guest_name || '—'}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-[11px] text-neutral-500">Rooms</p>
                <p className="text-[18px] font-bold text-neutral-900">{group.number_of_rooms}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-[11px] text-neutral-500">Stay</p>
                <p className="text-[12px] font-medium text-neutral-900">{group.arrival_date} → {group.departure_date}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-[11px] text-neutral-500">Total Price</p>
                <p className="text-[18px] font-bold text-neutral-900">{group.total_price.toFixed(2)}</p>
              </div>
            </div>

            {/* Add room button */}
            <div className="flex justify-end">
              <button
                onClick={() => setAddRoomOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-terra-700 bg-terra-50 border border-terra-200 rounded-lg hover:bg-terra-100"
              >
                <Plus size={14} /> Add Room
              </button>
            </div>

            {/* Bookings table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/50">
                    {['Booking #', 'Parent', 'Room Type', 'Room #', 'Status', 'Adults', 'Children', 'Price', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.bookings.map(b => (
                    <tr key={b.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                      <td className="px-4 py-3 text-[12px] font-medium text-neutral-900">{b.booking_number}</td>
                      <td className="px-4 py-3 text-[12px] text-neutral-600">
                        {b.is_parent ? <span className="px-1.5 py-0.5 text-[10px] bg-terra-50 text-terra-700 rounded font-medium">Parent</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-neutral-700">{b.room_type || '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-neutral-700">{b.room_number || 'Unassigned'}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-[12px] text-neutral-600">{b.adults}</td>
                      <td className="px-4 py-3 text-[12px] text-neutral-600">{b.children}</td>
                      <td className="px-4 py-3 text-[12px] font-medium text-neutral-900">{b.total_price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {b.status === 'confirmed' && !b.is_parent && (
                          <button
                            onClick={() => handleCancelRoom(b.id)}
                            className="px-2 py-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!group && !loadingGroup && (
          <p className="text-[13px] text-neutral-400">Enter a parent booking ID to view the group</p>
        )}
      </div>

      {/* Add Room Modal */}
      {addRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="text-[15px] font-semibold text-neutral-900">Add Room to Group</h2>
              <button onClick={() => setAddRoomOpen(false)} className="p-1 rounded-lg hover:bg-neutral-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
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
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setAddRoomOpen(false)} className="px-4 py-2 text-[13px] text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
                <button
                  onClick={handleAddRoom}
                  disabled={addingRoom || !addRoomForm.room_type_id}
                  className="px-4 py-2 text-[13px] text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50"
                >
                  {addingRoom ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
