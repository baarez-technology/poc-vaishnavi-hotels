import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { MouseEvent } from 'react';
import { Crown, Eye, Pencil, MoreHorizontal, Bed, XCircle, CalendarX, ChevronUp, ChevronDown, ChevronsUpDown, CreditCard } from 'lucide-react';
import { statusConfig, sourceConfig, paymentStatusConfig } from '../../data/bookingsData';
import { IconButton } from '../ui2/Button';
import { StatusBadge } from '../ui2/Badge';
import { useCurrency } from '@/hooks/useCurrency';
import { PreCheckInBadge } from '../shared/PreCheckInBadge';
import { usePrecheckinStatus } from '@/hooks/admin/usePrecheckinStatus';

type BookingLike = any;
type SortConfigLike = { field?: string; direction?: 'asc' | 'desc' } | any;

export default function BookingsTable({
  bookings,
  sortConfig,
  onSort,
  onViewBooking,
  onEditBooking,
  onAssignRoom,
  onCancelBooking,
  onManagePayment
}: {
  bookings: BookingLike[];
  sortConfig: SortConfigLike;
  onSort: (field: string) => void;
  onViewBooking?: (booking: BookingLike) => void;
  onEditBooking?: (booking: BookingLike) => void;
  onAssignRoom?: (booking: BookingLike) => void;
  onCancelBooking?: (booking: BookingLike) => void;
  onManagePayment?: (booking: BookingLike) => void;
}) {
  const { formatCurrency } = useCurrency();
  const { getStatus } = usePrecheckinStatus();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Check if click is on any of the trigger buttons
        const isButtonClick = Object.values(buttonRefs.current).some(
          btn => btn && btn.contains(event.target)
        );
        if (!isButtonClick) {
          setOpenDropdownId(null);
          setDropdownPosition(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position on scroll/resize
  useEffect(() => {
    if (!openDropdownId) return;

    const updatePosition = () => {
      const button = buttonRefs.current[openDropdownId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.right - 144 // 144px = dropdown width (w-36 = 9rem = 144px)
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openDropdownId]);

  const handleViewClick = (e: any, booking: BookingLike) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    setDropdownPosition(null);
    if (onViewBooking) {
      onViewBooking(booking);
    }
  };

  const handleEditClick = (e: any, booking: BookingLike) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    setDropdownPosition(null);
    if (onEditBooking) {
      onEditBooking(booking);
    }
  };

  const handleMoreClick = (e: any, bookingId: any) => {
    e.stopPropagation();
    if (openDropdownId === bookingId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[bookingId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.right - 144
        });
      }
      setOpenDropdownId(bookingId);
    }
  };

  const handleAssignRoom = (e: any, booking: BookingLike) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (onAssignRoom) {
      onAssignRoom(booking);
    }
  };

  const handleCancel = (e: any, booking: BookingLike) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (onCancelBooking) {
      onCancelBooking(booking);
    }
  };

  const handleManagePayment = (e: any, booking: BookingLike) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (onManagePayment) {
      onManagePayment(booking);
    }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    const sorted = sortConfig?.field === field ? sortConfig?.direction : null;
    const Icon = sorted === 'asc' ? ChevronUp : sorted === 'desc' ? ChevronDown : ChevronsUpDown;
    return <Icon className={`w-3.5 h-3.5 ${sorted ? 'text-terra-500' : 'text-neutral-300'}`} />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1320px] border-collapse">
        <colgroup>
          <col style={{ width: '200px' }} />
          <col style={{ width: '150px' }} />
          <col style={{ width: '140px' }} />
          <col style={{ width: '90px' }} />
          <col style={{ width: '190px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '50px' }} />
        </colgroup>
        <thead>
          <tr className="bg-neutral-50/30 border-b border-neutral-100">
            <th
              onClick={() => onSort('guest')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Guest Name <SortIndicator field="guest" />
              </span>
            </th>
            <th
              onClick={() => onSort('id')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Booking ID <SortIndicator field="id" />
              </span>
            </th>
            <th
              onClick={() => onSort('checkIn')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Check-in <SortIndicator field="checkIn" />
              </span>
            </th>
            <th
              onClick={() => onSort('nights')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Nights <SortIndicator field="nights" />
              </span>
            </th>
            <th className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest whitespace-nowrap">
              Room
            </th>
            <th
              onClick={() => onSort('status')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Status <SortIndicator field="status" />
              </span>
            </th>
            <th
              onClick={() => onSort('source')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Source <SortIndicator field="source" />
              </span>
            </th>
            <th
              onClick={() => onSort('paymentStatus')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Payment <SortIndicator field="paymentStatus" />
              </span>
            </th>
            <th className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest whitespace-nowrap">
              Pre Check-In
            </th>
            <th
              onClick={() => onSort('amount')}
              className="text-left px-6 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-neutral-600 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                Amount <SortIndicator field="amount" />
              </span>
            </th>
            <th className="px-2 py-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest whitespace-nowrap sticky right-0 bg-neutral-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-neutral-100">
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-terra-50 flex items-center justify-center mb-4">
                    <CalendarX className="w-5 h-5 text-terra-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-neutral-800 mb-1">
                    No bookings found
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Try adjusting your filters or search query
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            bookings.map((booking: BookingLike) => {
            // Normalize status to match config keys (e.g., 'Checked In' -> 'CHECKED-IN')
            const normalizedStatus = booking.status?.toUpperCase?.()?.replace(/[\s_]/g, '-') || 'CONFIRMED';
            const status = (statusConfig as any)[normalizedStatus] || (statusConfig as any)[booking.status] || {
              color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
              label: booking.status || 'Unknown'
            };
            // Normalize source with fallback - preserve original source if not in config
            const source = booking.source && (sourceConfig as any)[booking.source]
              ? (sourceConfig as any)[booking.source]
              : (booking.source ? {
                  color: 'bg-[#7B68EE]/10 text-[#7B68EE]',
                  icon: '💻'
                } : {
                  color: 'bg-neutral-100 text-neutral-700',
                  icon: '📋'
                });

            return (
                <tr key={booking.id} className="group bg-white hover:bg-neutral-50/30 transition-colors duration-100">
                  {/* Guest Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 group-hover:text-terra-600 transition-colors">
                        {booking.guest}
                      </span>
                      {booking.vip && <Crown className="w-4 h-4 text-gold-500 flex-shrink-0" />}
                    </div>
                  </td>

                  {/* Booking ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs text-neutral-500 font-mono">{booking.id}</span>
                  </td>

                  {/* Check-in Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-neutral-700 font-medium">{formatDate(booking.checkIn)}</span>
                  </td>

                  {/* Nights */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-neutral-600">{booking.nights}n</span>
                  </td>

                  {/* Room */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-neutral-900 text-sm">Room {booking.room}</span>
                    <span className="text-neutral-400 text-xs ml-1.5">• {booking.roomType}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={status.label} className="" />
                  </td>

                  {/* Source */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${source.color}`}>
                      <span className="mr-1">{source.icon}</span>
                      {booking.source}
                    </span>
                  </td>

                  {/* Payment Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const paymentStatus = booking.paymentStatus || booking.payment_status || 'pending';
                      const payment = (paymentStatusConfig as any)[paymentStatus] || (paymentStatusConfig as any)['pending'];
                      return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${payment.color}`}>
                          <span className="mr-1.5">{payment.icon}</span>
                          {payment.label}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Pre Check-In */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PreCheckInBadge status={getStatus(Number(booking.id))} />
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-neutral-900">{formatCurrency(booking.amount)}</span>
                  </td>

                  {/* Actions - Sticky column (small) */}
                  <td className="px-2 py-4 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-neutral-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                    <div className="relative inline-block">
                      <button
                        ref={(el) => { buttonRefs.current[booking.id] = el; }}
                        onClick={(e) => handleMoreClick(e, booking.id)}
                        className={`p-1.5 rounded-md hover:bg-neutral-100 transition-colors ${openDropdownId === booking.id ? 'bg-neutral-100' : ''}`}
                      >
                        <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                      </button>

                      {/* Dropdown Menu - Rendered via Portal */}
                      {openDropdownId === booking.id && dropdownPosition && createPortal(
                        <div
                          ref={dropdownRef}
                          style={{
                            position: 'fixed',
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            zIndex: 9999
                          }}
                          className="w-36 bg-white rounded-lg shadow-lg shadow-neutral-900/10 border border-neutral-200 py-1 animate-in fade-in-0 zoom-in-95 duration-100"
                        >
                          <button
                            onClick={(e) => handleViewClick(e, booking)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-neutral-50"
                          >
                            <Eye className="w-3.5 h-3.5 text-neutral-500" />
                            View
                          </button>
                          <button
                            onClick={(e) => handleEditClick(e, booking)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-neutral-50"
                          >
                            <Pencil className="w-3.5 h-3.5 text-neutral-500" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleManagePayment(e, booking)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-neutral-50"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                            Payment
                          </button>
                          <button
                            onClick={(e) => handleAssignRoom(e, booking)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-neutral-50"
                          >
                            <Bed className="w-3.5 h-3.5 text-neutral-500" />
                            Assign Room
                          </button>
                          <div className="border-t border-neutral-100 my-1" />
                          <button
                            onClick={(e) => handleCancel(e, booking)}
                            disabled={booking.status === 'CANCELLED'}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>,
                        document.body
                      )}
                    </div>
                  </td>
                </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
