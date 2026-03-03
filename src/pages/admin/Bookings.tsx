import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Tabs from '../../components/bookings/Tabs';
import SearchBar from '../../components/bookings/SearchBar';
import FiltersBar from '../../components/bookings/FiltersBar';
import BookingsTable from '../../components/bookings/BookingsTable';
import BookingDrawer from '../../components/bookings/BookingDrawer';
import AddBookingModal from '../../components/modals/AddBookingModal';
import Pagination from '../../components/bookings/Pagination';
import EditBookingModal from '../../components/bookings/EditBookingModal';
import AssignRoomModal from '../../components/modals/AssignRoomModal';
import CancelBookingModal from '../../components/bookings/CancelBookingModal';
import RequestCleaningModal from '../../components/modals/RequestCleaningModal';
import CheckInDrawer from '../../components/bookings/CheckInDrawer';
import CheckoutDialog from '../../components/bookings/CheckoutDialog';
import FolioDrawer from '../../components/folio/FolioDrawer';
import CheckoutEmotionModal from '../../components/cbs/CheckoutEmotionModal';
import GuestBillModal from '../../components/bookings/GuestBillModal';
import { useBookings } from '../../hooks/admin/useBookings';
import { guestsService } from '../../api/services/guests.service';
import { useSort } from '../../hooks/useSort';
import { usePagination } from '../../hooks/usePagination';
import { CANCELLATION_REASONS } from '../../utils/bookings';
import { Button } from '../../components/ui2/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { useBookingsSSE } from '../../hooks/useBookingsSSE';

// Local filter functions
function filterByStatus(bookings: any[], status: string) {
  if (status === 'all') return bookings;
  return bookings.filter(b => b.status === status);
}

function filterBySource(bookings: any[], source: string) {
  if (source === 'all') return bookings;
  return bookings.filter(b => b.source === source);
}

function filterByDateRange(bookings: any[], dateFrom: string, dateTo: string) {
  return bookings.filter(b => {
    if (dateFrom && b.checkIn < dateFrom) return false;
    if (dateTo && b.checkIn > dateTo) return false;
    return true;
  });
}

function searchBookings(bookings: any[], query: string) {
  if (!query) return bookings;
  const q = query.toLowerCase();
  return bookings.filter(b =>
    b.guest?.toLowerCase().includes(q) ||
    b.bookingNumber?.toLowerCase().includes(q) ||
    String(b.id).toLowerCase().includes(q) ||
    b.room?.toLowerCase().includes(q)
  );
}

// Quick Actions Component
function QuickActions({ onNewBooking }) {
  return (
    <Button variant="primary" icon={Plus} onClick={onNewBooking}>
      New Booking
    </Button>
  );
}

export default function Bookings() {
  const { isDark } = useTheme();
  const location = useLocation();
  const nav = useNavigate();

  // Use admin bookings hook for API integration
  const {
    bookings: bookingsData,
    isLoading,
    createBooking,
    updateBooking,
    updateStatus,
    assignRoom,
    cancelBooking,
    checkInGuest,
    cancelCheckIn,
    checkOutGuest,
    moveRoom,
    markNoShow,
    reinstate,
    getArrivalsToday,
    getDeparturesToday,
    fetchBookings,
    refreshBookings,
  } = useBookings();

  // Tab state — initialise from navigation state if provided (e.g. "arrivals" from Check-in Guest quick action)
  const [activeTab, setActiveTab] = useState<string>(() => {
    const state = location.state as { tab?: string } | null;
    return state?.tab || 'all';
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal states
  const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [isAssignRoomModalOpen, setIsAssignRoomModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Request Cleaning state
  const [cleaningBooking, setCleaningBooking] = useState<any>(null);

  // Check-in drawer state
  const [checkInBooking, setCheckInBooking] = useState<any>(null);
  const [isCheckInDrawerOpen, setIsCheckInDrawerOpen] = useState(false);


  // Toast state
  const [toast, setToast] = useState<{ message: string } | null>(null);


  // Checkout dialog state
  const [checkoutDialogBooking, setCheckoutDialogBooking] = useState<any>(null);

  // Folio drawer state (opened from checkout dialog or manage payment)
  const [folioDrawerBooking, setFolioDrawerBooking] = useState<any>(null);

  // Guest bill modal state
  const [billBooking, setBillBooking] = useState<any>(null);

  // Checkout emotion modal state
  const [checkoutBooking, setCheckoutBooking] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      source: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Handle booking click (view details)
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setIsDrawerOpen(true);
  };

  // Handle view from action button
  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setIsDrawerOpen(true);
  };

  // Handle edit from action button (direct to edit modal)
  const handleEditFromAction = (booking) => {
    setSelectedBooking(booking);
    setIsEditBookingModalOpen(true);
  };

  // Handle assign room from action button
  const handleAssignRoomFromAction = (booking) => {
    setSelectedBooking(booking);
    setIsAssignRoomModalOpen(true);
  };

  // Handle cancel from action button
  const handleCancelFromAction = (booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  // Handle request cleaning from action button
  const handleRequestCleaningFromAction = (booking) => {
    setCleaningBooking(booking);
  };

  // Handle manage payment from action button — opens FolioDrawer (Opera-style folio management)
  const handleManagePaymentFromAction = (booking) => {
    setFolioDrawerBooking(booking);
  };

  // Handle check-in from action button — opens drawer
  const handleCheckInFromAction = (booking) => {
    if (!booking?.id) return;
    setCheckInBooking(booking);
    setIsCheckInDrawerOpen(true);
  };

  // Called when check-in drawer completes
  const handleCheckInComplete = async (bookingId: string, data: any) => {
    const success = await checkInGuest(bookingId, data);
    if (success) {
      setSelectedBooking((prev) =>
        prev && prev.id === bookingId ? { ...prev, status: 'IN_HOUSE' } : prev
      );
      triggerToast(`${checkInBooking?.guest || 'Guest'} checked in successfully`);
    }
    return success;
  };

  // Handle check-out from action button — opens CheckoutDialog with folio balance gate
  const handleCheckOutFromAction = (booking: any) => {
    if (!booking?.id) return;
    setCheckoutDialogBooking(booking);
  };

  // Actual checkout execution (called by CheckoutDialog)
  const executeCheckout = async (force = false): Promise<boolean> => {
    const booking = checkoutDialogBooking;
    if (!booking?.id) return false;
    const success = await checkOutGuest(booking.id, force ? { force_checkout: true } : undefined);
    if (success) {
      setSelectedBooking((prev: any) =>
        prev && prev.id === booking.id ? { ...prev, status: 'COMPLETED' } : prev
      );
      triggerToast(force
        ? `${booking.guest} force-checked out with outstanding balance`
        : `${booking.guest} checked out successfully`
      );
    }
    return success;
  };

  // Handle cancel check-in from action button
  const handleCancelCheckInFromAction = async (booking) => {
    if (!booking?.id) return;
    const confirmed = window.confirm(
      `Cancel check-in for ${booking.guest}? This will revert the booking to confirmed status and free the room.`
    );
    if (!confirmed) return;

    const success = await cancelCheckIn(booking.id);
    if (success) {
      setSelectedBooking((prev) =>
        prev && prev.id === booking.id ? { ...prev, status: 'CONFIRMED' } : prev
      );
      triggerToast('Check-in cancelled successfully');
    }
  };

  // Handle mark no-show from action button
  const handleMarkNoShowFromAction = async (booking) => {
    if (!booking?.id) return;
    const confirmed = window.confirm(
      `Mark ${booking.guest} as No Show? This will free any assigned room and the booking cannot be checked in.`
    );
    if (!confirmed) return;

    const success = await markNoShow(booking.id);
    if (success) {
      setSelectedBooking((prev) =>
        prev && prev.id === booking.id ? { ...prev, status: 'NO_SHOW' } : prev
      );
      triggerToast(`${booking.guest} marked as No Show`);
    }
  };

  // Handle view guest bill
  const handleViewBillFromAction = (booking) => {
    if (!booking?.id) return;
    setBillBooking(booking);
  };

  // Handle reinstate from action button
  const handleReinstateFromAction = async (booking) => {
    if (!booking?.id) return;
    const confirmed = window.confirm(
      `Reinstate booking for ${booking.guest}? This will restore the booking to confirmed status.`
    );
    if (!confirmed) return;

    const success = await reinstate(booking.id);
    if (success) {
      setSelectedBooking((prev) =>
        prev && prev.id === booking.id ? { ...prev, status: 'CONFIRMED' } : prev
      );
      triggerToast(`${booking.guest} booking reinstated`);
    }
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedBooking(null), 300);
  };

  // Handle new booking
  const handleNewBooking = () => {
    setIsAddBookingModalOpen(true);
  };

  // Handle booking submission
  const handleBookingSubmit = async (bookingData) => {
    setIsCreating(true);
    try {
      await createBooking(bookingData);
      setIsAddBookingModalOpen(false);
      triggerToast('Booking created successfully');
    } catch (error) {
      triggerToast('Failed to create booking');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle status change — intercept CHECKED-OUT to show emotion modal
  const handleStatusChange = (bookingId: string, newStatus: string) => {
    if (newStatus === 'CHECKED-OUT') {
      // Find the booking to get guestId and guestName
      const booking = bookingsData.find((b: any) => String(b.id) === String(bookingId));
      setCheckoutBooking(booking || { id: bookingId, guest: 'Guest' });
      return;
    }

    updateStatus(bookingId, newStatus);
    setSelectedBooking((prev: any) => {
      if (prev && prev.id === bookingId) {
        return { ...prev, status: newStatus };
      }
      return prev;
    });
    triggerToast('Status updated successfully');
  };

  // Handle checkout with emotion from modal
  const handleCheckoutWithEmotion = useCallback(async (emotion?: string, _notes?: string) => {
    if (!checkoutBooking) return;

    setCheckoutLoading(true);
    try {
      // Save guest emotion if provided and guestId is available
      if (emotion && checkoutBooking.guestId) {
        try {
          await guestsService.update(checkoutBooking.guestId, { emotion });
        } catch (err) {
          console.error('Failed to update guest emotion:', err);
        }
      }

      // Perform the actual checkout
      updateStatus(checkoutBooking.id, 'CHECKED-OUT');
      setSelectedBooking((prev: any) => {
        if (prev && prev.id === checkoutBooking.id) {
          return { ...prev, status: 'CHECKED-OUT' };
        }
        return prev;
      });
      triggerToast('Guest checked out successfully');
    } finally {
      setCheckoutLoading(false);
      setCheckoutBooking(null);
    }
  }, [checkoutBooking, updateStatus]);

  // Toast helper
  const triggerToast = (message) => {
    setToast({ message });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Open edit booking modal
  const openEditBookingModal = () => {
    if (!selectedBooking) return;
    setIsEditBookingModalOpen(true);
  };

  // Close edit booking modal
  const closeEditBookingModal = () => {
    setIsEditBookingModalOpen(false);
  };

  // Open assign room modal
  const openAssignRoomModal = () => {
    if (!selectedBooking) return;
    setIsAssignRoomModalOpen(true);
  };

  // Close assign room modal
  const closeAssignRoomModal = () => {
    setIsAssignRoomModalOpen(false);
  };

  // Open cancel modal
  const openCancelModal = () => {
    if (!selectedBooking) return;
    setIsCancelModalOpen(true);
  };

  // Close cancel modal
  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
  };

  // Handle booking edit save
  const handleBookingEditSave = async (updatedFields) => {
    if (!selectedBooking) return;
    setIsEditing(true);
    try {
      const result = await updateBooking(selectedBooking.id, updatedFields);
      if (result) {
        setSelectedBooking({ ...selectedBooking, ...result });
        triggerToast('Booking updated successfully');
        closeEditBookingModal();
      }
    } catch (error) {
      triggerToast('Failed to update booking');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle room assignment (or room move for checked-in bookings)
  const handleRoomAssign = async (room) => {
    if (!selectedBooking || !room) return;
    setIsAssigning(true);

    const isCheckedIn = selectedBooking.status === 'IN_HOUSE' || selectedBooking.status === 'CHECKED-IN';

    try {
      if (isCheckedIn) {
        // Use room-change endpoint for checked-in guests (proper room move)
        const result = await moveRoom(selectedBooking.id, room.id, 'Room move via admin dashboard');
        if (result) {
          setSelectedBooking({
            ...selectedBooking,
            room: room.roomNumber,
            roomType: room.type,
            roomId: room.id,
          });
          triggerToast(`Room moved to ${room.roomNumber} successfully`);
          closeAssignRoomModal();
        }
      } else {
        // Standard room assignment for pre-check-in bookings
        const success = await assignRoom(selectedBooking.id, room.id, room.roomNumber, selectedBooking.checkIn);
        if (success) {
          setSelectedBooking({
            ...selectedBooking,
            room: room.roomNumber,
            roomType: room.type,
            roomId: room.id,
          });
          triggerToast(`Room ${room.roomNumber} assigned successfully`);
          closeAssignRoomModal();
        }
      }
    } catch (error) {
      triggerToast('Failed to assign room');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle cancel booking with reason
  const handleCancelBooking = async ({ bookingId, reason, notes }) => {
    setIsCancelling(true);
    try {
      const reasonLabel = CANCELLATION_REASONS.find(r => r.value === reason)?.label || reason;
      const success = await cancelBooking(bookingId, reasonLabel, notes);

      if (success) {
        // Update selected booking
        setSelectedBooking((prev) => {
          if (prev && prev.id === bookingId) {
            return {
              ...prev,
              status: 'CANCELLED',
              cancellationReason: reasonLabel,
              cancellationNotes: notes,
            };
          }
          return prev;
        });

        triggerToast('Booking cancelled successfully');
        closeCancelModal();
      }
    } catch (error) {
      triggerToast('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  // Data processing pipeline
  // Step 1: Apply tab filter
  const tabFilteredData = useMemo(() => {
    if (activeTab === 'arrivals') {
      return getArrivalsToday();
    } else if (activeTab === 'departures') {
      return getDeparturesToday();
    } else if (activeTab === 'inhouse') {
      // Filter for guests currently checked in (in-house)
      // API returns lowercase with hyphen: "checked-in"
      return bookingsData.filter(booking => {
        const status = booking.status?.toLowerCase();
        return status === 'checked-in' || status === 'in-house' || status === 'in_house';
      });
    }
    return [...bookingsData];
  }, [activeTab, bookingsData, getArrivalsToday, getDeparturesToday]);

  // Step 2: Apply filters
  const filteredData = useMemo(() => {
    let result = [...tabFilteredData];
    result = filterByStatus(result, filters.status);
    result = filterBySource(result, filters.source);
    result = filterByDateRange(result, filters.dateFrom, filters.dateTo);
    return result;
  }, [tabFilteredData, filters]);

  // Step 3: Apply search
  const searchedData = useMemo(() => {
    return searchBookings(filteredData, searchQuery);
  }, [filteredData, searchQuery]);

  // Step 4: Apply sorting - Sort by createdAt (newest first), then by checkIn as fallback
  const sortedBookingsByDate = useMemo(() => {
    return [...searchedData].sort((a, b) => {
      // First sort by createdAt (newest first)
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (bCreated !== aCreated) {
        return bCreated - aCreated; // Descending (newest first)
      }
      // If createdAt is same or missing, sort by checkIn
      const aCheckIn = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const bCheckIn = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return bCheckIn - aCheckIn; // Descending
    });
  }, [searchedData]);
  
  const { sortedData, sortConfig, handleSort } = useSort(sortedBookingsByDate, 'createdAt', 'desc');

  // SSE Integration for real-time booking updates
  useBookingsSSE({
    onBookingCreated: (bookingData) => {
      console.log('[Admin Bookings] 🎉 New booking received via SSE:', bookingData);
      // Refetch bookings to get the new record
      if (fetchBookings) {
        fetchBookings();
      }
    },
    refetchBookings: fetchBookings,
  });

  // Step 5: Apply pagination
  const {
    currentPageData,
    currentPage,
    totalPages,
    rowsPerPage,
    canGoPrev,
    canGoNext,
    startIndex,
    endIndex,
    totalItems,
    nextPage,
    prevPage,
      goToPage,
    setRowsPerPage,
  } = usePagination(sortedData, 10);

  // Auto-open booking drawer when navigating from a notification with bookingId
  useEffect(() => {
    const state = location.state as { bookingId?: string } | null;
    if (state?.bookingId && sortedData.length > 0) {
      const bookingId = String(state.bookingId);
      const booking = sortedData.find(
        (b: any) => String(b.id) === bookingId
          || String(b.bookingNumber) === bookingId
          || String(b.bookingNumber).replace(/^BK-/i, '') === bookingId
      );
      if (booking) {
        setSelectedBooking(booking);
        setIsDrawerOpen(true);
      }
      // Clear navigation state so refresh doesn't re-trigger
      nav(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, sortedData]);

  return (
    <div className={cn(
      "min-h-screen transition-colors",
      isDark ? "bg-neutral-900" : "bg-[#F9F7F7]"
    )}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Bookings</h1>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">
            Manage reservations, availability, and guest information.
          </p>
        </div>
        <QuickActions onNewBooking={handleNewBooking} />
      </header>

      {/* Main Bookings Card (CMS-consistent) */}
      <div className="bg-white rounded-[10px] overflow-hidden">
        {/* Tabs + Actions */}
        <div className="border-b border-neutral-100">
          <div className="px-3 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between overflow-x-auto">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-neutral-50/30 border-b border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-full sm:flex-1 sm:max-w-md">
              <SearchBar value={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery('')} />
            </div>
            <div className="hidden sm:block sm:flex-1" />
            <FiltersBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {/* Bookings Table */}
        <BookingsTable
          activeTab={activeTab}
          bookings={currentPageData}
          sortConfig={sortConfig}
          onSort={handleSort}
          onViewBooking={handleViewBooking}
          onEditBooking={handleEditFromAction}
          onAssignRoom={handleAssignRoomFromAction}
          onCancelBooking={handleCancelFromAction}
          onManagePayment={handleManagePaymentFromAction}
          onCheckIn={handleCheckInFromAction}
          onCheckOut={handleCheckOutFromAction}
          onCancelCheckIn={handleCancelCheckInFromAction}
          onMarkNoShow={handleMarkNoShowFromAction}
          onRequestCleaning={handleRequestCleaningFromAction}
          onReinstate={handleReinstateFromAction}
          onViewBill={handleViewBillFromAction}
        />

        {/* Pagination */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 bg-neutral-50/30">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrevPage={prevPage}
            onNextPage={nextPage}
            onGoToPage={goToPage}
          />
        </div>
      </div>

      {/* Booking Drawer */}
      <BookingDrawer
        booking={selectedBooking}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onStatusChange={handleStatusChange}
        onEditBooking={openEditBookingModal}
        onAssignRoom={openAssignRoomModal}
        onCancelBooking={openCancelModal}
        onCancelCheckIn={() => selectedBooking && handleCancelCheckInFromAction(selectedBooking)}
        onCheckIn={() => selectedBooking && handleCheckInFromAction(selectedBooking)}
        onCheckOut={() => selectedBooking && handleCheckOutFromAction(selectedBooking)}
        onMarkNoShow={() => selectedBooking && handleMarkNoShowFromAction(selectedBooking)}
        onRequestCleaning={() => selectedBooking && handleRequestCleaningFromAction(selectedBooking)}
        onOpenFolio={() => selectedBooking && setFolioDrawerBooking(selectedBooking)}
        onViewBill={() => selectedBooking && setBillBooking(selectedBooking)}
      />

      {/* Add Booking Modal */}
      <AddBookingModal
        isOpen={isAddBookingModalOpen}
        onClose={() => setIsAddBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
        isCreating={isCreating}
      />

      {/* Edit Booking Modal */}
      <EditBookingModal
        booking={selectedBooking}
        isOpen={isEditBookingModalOpen}
        onClose={closeEditBookingModal}
        onSave={handleBookingEditSave}
        isSaving={isEditing}
      />

      {/* Assign Room Modal */}
      <AssignRoomModal
        booking={selectedBooking}
        isOpen={isAssignRoomModalOpen}
        onClose={closeAssignRoomModal}
        onAssign={handleRoomAssign}
        isAssigning={isAssigning}
        bookings={bookingsData}
      />

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        booking={selectedBooking}
        isOpen={isCancelModalOpen}
        onClose={closeCancelModal}
        onConfirm={handleCancelBooking}
        isCancelling={isCancelling}
      />


      {/* Request Cleaning Modal */}
      <RequestCleaningModal
        isOpen={!!cleaningBooking}
        onClose={() => setCleaningBooking(null)}
        onSuccess={() => {
          triggerToast('Cleaning request submitted');
          setCleaningBooking(null);
        }}
        roomId={cleaningBooking?.roomId || 0}
        roomNumber={cleaningBooking?.room || ''}
        guestName={cleaningBooking?.guest}
      />

      {/* Check-In Drawer */}
      <CheckInDrawer
        isOpen={isCheckInDrawerOpen}
        onClose={() => {
          setIsCheckInDrawerOpen(false);
          setCheckInBooking(null);
        }}
        booking={checkInBooking}
        onCheckInComplete={handleCheckInComplete}
      />

      {/* Checkout Dialog — folio balance gate */}
      <CheckoutDialog
        isOpen={!!checkoutDialogBooking}
        booking={checkoutDialogBooking}
        onClose={() => setCheckoutDialogBooking(null)}
        onCheckout={executeCheckout}
        onOpenFolio={(booking: any) => setFolioDrawerBooking(booking)}
      />

      {/* Folio Drawer — opened from checkout dialog or manage payment */}
      <FolioDrawer
        isOpen={!!folioDrawerBooking}
        booking={folioDrawerBooking}
        onClose={() => setFolioDrawerBooking(null)}
        onPaymentUpdate={refreshBookings}
      />

      {/* Checkout Emotion Modal */}
      <CheckoutEmotionModal
        open={!!checkoutBooking}
        onClose={() => setCheckoutBooking(null)}
        onConfirm={handleCheckoutWithEmotion}
        guestName={checkoutBooking?.guest || checkoutBooking?.guestName || ''}
        loading={checkoutLoading}
      />

      {/* Guest Bill Modal */}
      <GuestBillModal
        isOpen={!!billBooking}
        bookingId={billBooking?.id}
        guestName={billBooking?.guest}
        onClose={() => setBillBooking(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[80]">
          <div className="px-4 py-3 rounded-[10px] bg-neutral-900 text-white shadow-xl flex items-center gap-2">
            <span className="text-xs sm:text-[13px] font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
