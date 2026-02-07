import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Crown, Mail, Phone, Bed, Globe,
  Sparkles, Edit, XCircle, CheckCircle, Users,
  Calendar, ChevronDown, Check
} from 'lucide-react';
import { statusConfig, sourceConfig } from '../../data/bookingsData';
import { useCurrency } from '@/hooks/useCurrency';

export default function BookingDrawer({
  booking,
  isOpen,
  onClose,
  onStatusChange,
  onEditBooking,
  onAssignRoom,
  onCancelBooking,
}) {
  const { formatCurrency } = useCurrency();
  const [showStatusSuccess, setShowStatusSuccess] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (statusDropdownOpen) {
          setStatusDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const mainContent = document.querySelector('main');
    const mainScrollTop = mainContent ? mainContent.scrollTop : 0;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    let preventScrollHandler;
    if (mainContent) {
      mainContent.style.overflow = 'hidden';
      preventScrollHandler = (e) => {
        let target = e.target;
        let isInModalOrDrawer = false;

        while (target && target !== document.documentElement) {
          if (target.classList && target.classList.length > 0) {
            const classList = Array.from(target.classList);
            const hasModalDrawerClass = classList.some(cls =>
              cls.includes('z-50') || cls.includes('modal') || cls.includes('drawer')
            );
            const hasScrollableClass = classList.some(cls =>
              cls.includes('overflow-y-auto') || cls.includes('overflow-y-scroll')
            );
            const computedStyle = window.getComputedStyle(target);
            const isFixed = computedStyle.position === 'fixed' && target.classList.contains('z-50');

            if (hasModalDrawerClass || hasScrollableClass || isFixed) {
              isInModalOrDrawer = true;
              break;
            }
          }
          target = target.parentElement;
        }

        if (!isInModalOrDrawer) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      document.addEventListener('wheel', preventScrollHandler, { passive: false, capture: true });
      document.addEventListener('touchmove', preventScrollHandler, { passive: false, capture: true });
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      if (mainContent && preventScrollHandler) {
        mainContent.style.overflow = '';
        document.removeEventListener('wheel', preventScrollHandler, { capture: true });
        document.removeEventListener('touchmove', preventScrollHandler, { capture: true });
        if (mainContent.scrollTop !== mainScrollTop) {
          mainContent.scrollTop = mainScrollTop;
        }
      }
      window.scrollTo(scrollX, scrollY);
    };
  }, [isOpen, onClose, statusDropdownOpen]);

  if (!booking) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const source = sourceConfig[booking.source];

  const statusOptions = [
    { value: 'CONFIRMED', label: 'Confirmed', color: 'text-emerald-600', bg: 'bg-emerald-500' },
    { value: 'PENDING', label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500' },
    { value: 'CHECKED-IN', label: 'Checked In', color: 'text-blue-600', bg: 'bg-blue-500' },
    { value: 'CHECKED-OUT', label: 'Checked Out', color: 'text-neutral-600', bg: 'bg-neutral-500' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'text-rose-600', bg: 'bg-rose-500' },
  ];

  const getStatusConfig = (statusKey) => {
    const config = {
      'CONFIRMED': { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Confirmed' },
      'PENDING': { bg: 'bg-amber-500', text: 'text-amber-700', label: 'Pending' },
      'CHECKED-IN': { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Checked In' },
      'CHECKED-OUT': { bg: 'bg-neutral-400', text: 'text-neutral-600', label: 'Checked Out' },
      'CANCELLED': { bg: 'bg-rose-500', text: 'text-rose-600', label: 'Cancelled' },
    };
    return config[statusKey] || config['PENDING'];
  };

  const statusConf = getStatusConfig(booking.status);

  const handleStatusChange = (newStatus) => {
    onStatusChange(booking.id, newStatus);
    setStatusDropdownOpen(false);
    setShowStatusSuccess(true);
    setTimeout(() => setShowStatusSuccess(false), 2000);
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Drawer - slides from right */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] md:w-[480px] lg:w-[520px] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          className="bg-white shadow-2xl w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-neutral-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-terra-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {booking.guest.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">{booking.guest}</h2>
                    {booking.vip && <Crown className="w-4 h-4 text-gold-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs sm:text-[13px] text-neutral-400 truncate">{booking.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Status Badge with Dropdown */}
            <div className="mt-4 relative" ref={dropdownRef}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${statusConf.bg}`}></span>
                <span className={`text-sm font-medium ${statusConf.text}`}>{statusConf.label}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {statusDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-[10px] shadow-lg border border-neutral-200 py-1 z-[60]">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-neutral-50 transition-colors ${
                        booking.status === option.value ? 'bg-neutral-50' : ''
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${option.bg}`}></span>
                      <span className={`font-medium ${option.color}`}>{option.label}</span>
                      {booking.status === option.value && (
                        <Check className="w-4 h-4 text-terra-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showStatusSuccess && (
                <span className="ml-3 text-[13px] text-sage-600 inline-flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Updated
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-5 pt-5">
              {/* Stay Details */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-neutral-50 rounded-[10px]">
                <div className="text-center">
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-1">Check-in</p>
                  <p className="text-xs sm:text-[13px] font-semibold text-neutral-900">{formatDate(booking.checkIn)}</p>
                </div>
                <div className="text-center border-x border-neutral-200">
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-1">Duration</p>
                  <p className="text-xs sm:text-[13px] font-semibold text-neutral-900">{booking.nights} nights</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-1">Check-out</p>
                  <p className="text-xs sm:text-[13px] font-semibold text-neutral-900">{formatDate(booking.checkOut)}</p>
                </div>
              </div>

              {/* Room & Guests */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-neutral-50 rounded-[10px]">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <Bed className="w-4 h-4" />
                    <span className="text-[10px] sm:text-[11px] font-medium">Room</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-neutral-900">{booking.room || 'Not assigned'}</p>
                  <p className="text-xs sm:text-[13px] text-neutral-500">{booking.roomType}</p>
                </div>
                <div className="p-3 sm:p-4 bg-neutral-50 rounded-[10px]">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-[10px] sm:text-[11px] font-medium">Guests</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-neutral-900">{booking.guests}</p>
                  <p className="text-xs sm:text-[13px] text-neutral-500">{booking.guests === 1 ? 'Guest' : 'Guests'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 sm:space-y-3">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Contact</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-[10px]">
                    <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="text-xs sm:text-[13px] text-neutral-700 truncate">{booking.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-[10px]">
                    <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="text-xs sm:text-[13px] text-neutral-700">{booking.phone}</span>
                  </div>
                </div>
              </div>

              {/* Source */}
              <div className="flex items-center gap-2 sm:gap-3 p-3 bg-neutral-50 rounded-[10px]">
                <Globe className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-xs sm:text-[13px] text-neutral-500">Booked via</span>
                <span className={`text-xs sm:text-[13px] font-medium ${source?.color || 'text-neutral-700'}`}>
                  {booking.source}
                </span>
              </div>

              {/* Special Requests */}
              {booking.specialRequests && booking.specialRequests !== 'None' && (
                <div className="p-3 sm:p-4 bg-gold-50 rounded-[10px]">
                  <p className="text-[10px] font-semibold text-gold-700 uppercase tracking-widest mb-2">Special Requests</p>
                  <p className="text-xs sm:text-[13px] text-gold-900">{booking.specialRequests}</p>
                </div>
              )}

              {/* Upsells */}
              {booking.upsells && booking.upsells.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Sparkles className="w-4 h-4 text-ocean-500" />
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Add-ons</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {booking.upsells.map((upsell, index) => (
                      <span
                        key={index}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-ocean-50 text-ocean-600 rounded-full text-xs sm:text-[13px] font-medium"
                      >
                        {upsell}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Amount */}
              <div className="p-3 sm:p-4 bg-terra-50 rounded-[10px] border border-terra-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-1">Total Amount</p>
                    <p className="text-xl sm:text-2xl font-bold text-terra-600">{formatCurrency(booking.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-1">Per Night</p>
                    <p className="text-xs sm:text-[13px] font-semibold text-neutral-700">
                      {formatCurrency(Math.round(booking.amount / booking.nights))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-neutral-100 p-3 sm:p-4 bg-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onCancelBooking && onCancelBooking()}
                disabled={booking?.status === 'CANCELLED'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 text-neutral-600 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={onAssignRoom}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium transition-colors"
              >
                <Bed className="w-4 h-4" />
                Assign
              </button>
              <button
                onClick={onEditBooking}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-terra-500 hover:bg-terra-600 text-white rounded-lg text-[13px] font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
