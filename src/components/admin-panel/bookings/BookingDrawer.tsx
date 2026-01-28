import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Mail, Phone, Calendar, Bed, DollarSign, Globe, Sparkles, Edit, XCircle, CheckCircle } from 'lucide-react';
import { statusConfig, sourceConfig } from '@/data/bookingsData';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '../../ui2/Button';

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
  // Prevent scrolling and handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Store current scroll positions (both window and main element)
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const mainContent = document.querySelector('main');
    const mainScrollTop = mainContent ? mainContent.scrollTop : 0;
    
    // Prevent body scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    
    // Prevent scrolling on the main content area (this is where actual scrolling happens)
    let preventScrollHandler;
    if (mainContent) {
      mainContent.style.overflow = 'hidden';
      // Prevent scroll events only on the main content, allow scrolling in modals/drawers
      preventScrollHandler = (e) => {
        // Check if the event target or its parents is within a modal/drawer
        let target = e.target;
        let isInModalOrDrawer = false;
        
        // Traverse up the DOM tree to check if we're inside a modal/drawer
        while (target && target !== document.documentElement) {
          // Check for modal/drawer containers (they have z-50 class or scrollable containers)
          if (target.classList && target.classList.length > 0) {
            const classList = Array.from(target.classList);
            // Check if any class contains modal/drawer indicators or is scrollable
            const hasModalDrawerClass = classList.some(cls => 
              cls.includes('z-50') || 
              cls.includes('modal') || 
              cls.includes('drawer')
            );
            const hasScrollableClass = classList.some(cls => 
              cls.includes('overflow-y-auto') || 
              cls.includes('overflow-y-scroll')
            );
            
            // Check if this is a fixed positioned element (likely a modal/drawer container)
            const computedStyle = window.getComputedStyle(target);
            const isFixed = computedStyle.position === 'fixed' && target.classList.contains('z-50');
            
            if (hasModalDrawerClass || hasScrollableClass || isFixed) {
              isInModalOrDrawer = true;
              break;
            }
          }
          target = target.parentElement;
        }
        
        // Only prevent scroll if we're NOT in a modal/drawer
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
      
      // Restore scrolling
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (mainContent && preventScrollHandler) {
        mainContent.style.overflow = '';
        document.removeEventListener('wheel', preventScrollHandler, { capture: true });
        document.removeEventListener('touchmove', preventScrollHandler, { capture: true });
        
        // Restore scroll positions
        if (mainContent.scrollTop !== mainScrollTop) {
          mainContent.scrollTop = mainScrollTop;
        }
      }
      
      // Restore scroll position
      window.scrollTo(scrollX, scrollY);
    };
  }, [isOpen, onClose]);

  if (!booking) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const source = sourceConfig[booking.source];

  const drawerContent = (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 bottom-0 right-0 h-screen w-full max-w-[650px] bg-white shadow-xl border-l border-neutral-200 z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-serif font-bold text-neutral-900">Booking Details</h2>
              {booking.vip && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#CDB261]/10 text-[#CDB261] rounded-md text-xs font-bold border border-[#CDB261]/30">
                  <Crown className="w-3.5 h-3.5" />
                  VIP
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600 mt-1">View and manage reservation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#A57865]"
          >
            <X className="w-5 h-5 text-neutral-600 hover:text-neutral-900 transition-colors" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 p-6 space-y-6">
          {/* Booking ID & Status */}
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Booking ID</p>
                  <p className="text-sm font-mono font-bold text-neutral-900">{booking.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Booked On</p>
                  <p className="text-xs text-neutral-700">{formatDate(booking.bookedOn)}</p>
                </div>
              </div>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-2">
                Booking Status
              </label>
              <select
                value={booking.status}
                onChange={(e) => {
                  onStatusChange(booking.id, e.target.value);
                  setShowStatusSuccess(true);
                  setTimeout(() => setShowStatusSuccess(false), 2000);
                }}
                className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm font-medium hover:border-neutral-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:ring-offset-2 focus:bg-white transition-all duration-200 cursor-pointer"
              >
                <option value="CONFIRMED">✓ Confirmed</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="IN_HOUSE">🔑 Checked In</option>
                <option value="COMPLETED">✅ Checked Out</option>
                <option value="CANCELLED">❌ Cancelled</option>
              </select>

              {/* Success Message */}
              {showStatusSuccess && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[#4E5840]">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Status updated successfully</span>
                </div>
              )}
            </div>
          </div>

          {/* Guest Information */}
          <div className="p-4 bg-[#FAF8F6] rounded-xl space-y-3 border border-neutral-200">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="text-sm font-bold text-neutral-900">Guest Information</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#A57865] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {booking.guest?.split(' ').map((n) => n[0]).join('') || 'G'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{booking.guest}</p>
                <p className="text-xs text-neutral-500">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span>{booking.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span>{booking.phone}</span>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="p-4 bg-[#FAF8F6] rounded-xl space-y-3 border border-neutral-200">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="text-sm font-bold text-neutral-900">Stay Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Check-in</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#A57865]" />
                  <p className="text-sm font-medium text-neutral-900">{formatDate(booking.checkIn)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Check-out</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#A57865]" />
                  <p className="text-sm font-medium text-neutral-900">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 mb-1">Duration</p>
              <p className="text-sm font-semibold text-neutral-900">
                {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
              </p>
            </div>
          </div>

          {/* Room Details */}
          <div className="p-4 bg-[#FAF8F6] rounded-xl space-y-3 border border-neutral-200">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="text-sm font-bold text-neutral-900">Room Details</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#A57865]/10 rounded-lg flex items-center justify-center">
                <Bed className="w-5 h-5 text-[#A57865]" />
              </div>
              <div>
                {booking.room ? (
                  <>
                    <p className="text-sm font-semibold text-neutral-900">Room {booking.room}</p>
                    <p className="text-xs text-neutral-600">{booking.roomType}</p>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Assignment
                    </span>
                    <p className="text-xs text-neutral-600 mt-1">{booking.roomType}</p>
                  </>
                )}
              </div>
            </div>

            {booking.specialRequests && booking.specialRequests !== 'None' && (
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Special Requests</p>
                <p className="text-sm text-neutral-700">{booking.specialRequests}</p>
              </div>
            )}
          </div>

          {/* Booking Source */}
          <div className="p-4 bg-[#FAF8F6] rounded-xl border border-neutral-200">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 mb-3">
              <div className="w-1 h-5 bg-[#A57865] rounded-full"></div>
              <h3 className="text-sm font-bold text-neutral-900">Booking Source</h3>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-neutral-400" />
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${source.color}`}>
                <span className="mr-1">{source.icon}</span>
                {booking.source}
              </span>
            </div>
          </div>

          {/* Upsells & Add-ons */}
          {booking.upsells && booking.upsells.length > 0 && (
            <div className="p-4 bg-[#5C9BA4]/10 rounded-xl border border-[#5C9BA4]/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#5C9BA4]" />
                <h3 className="text-sm font-semibold text-aurora-900">Upsells & Add-ons</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {booking.upsells.map((upsell, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 bg-white text-[#5C9BA4] rounded-lg text-xs font-medium border border-[#5C9BA4]/30"
                  >
                    {upsell}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="p-5 bg-gradient-to-br from-[#A57865]/10 to-[#A57865]/5 rounded-xl border-2 border-[#A57865]/30">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-[#A57865]" />
              <h3 className="text-sm font-bold text-neutral-900">Total Amount</h3>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-serif font-bold text-[#A57865]">
                {formatCurrency(booking.total || booking.amount || 0)}
              </p>
              <p className="text-sm text-neutral-600 font-medium">
                {formatCurrency((booking.total || booking.amount || 0) / (booking.nights || 1))}/night
              </p>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex-shrink-0 bg-white border-t border-neutral-200 px-6 py-4 space-y-3 shadow-lg">
          <Button variant="primary" onClick={onEditBooking} icon={Edit} fullWidth>
            Edit Booking
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={!booking.room ? 'warning' : 'outline-neutral'}
              onClick={onAssignRoom}
              icon={Bed}
            >
              {!booking.room ? 'Assign Room Now' : 'Reassign Room'}
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => onCancelBooking && onCancelBooking()}
              disabled={booking?.status === 'CANCELLED'}
              icon={XCircle}
            >
              {booking?.status === 'CANCELLED' ? 'Cancelled' : 'Cancel'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}
