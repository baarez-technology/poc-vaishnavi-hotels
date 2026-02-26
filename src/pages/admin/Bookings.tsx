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
import PaymentManagementModal from '../../components/bookings/PaymentManagementModal';
import { useBookings } from '../../hooks/admin/useBookings';
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
    getArrivalsToday,
    getDeparturesToday,
    fetchBookings,
  } = useBookings();

  // Tab state
  const [activeTab, setActiveTab] = useState('all');

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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // Highlight booking from notification navigation
  const [highlightBookingId, setHighlightBookingId] = useState<string | null>(null);

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

  // Handle manage payment from action button
  const handleManagePaymentFromAction = (booking) => {
    setSelectedBooking(booking);
    setIsPaymentModalOpen(true);
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

  // Handle status change
  const handleStatusChange = (bookingId, newStatus) => {
    updateStatus(bookingId, newStatus);
    setSelectedBooking((prev) => {
      if (prev && prev.id === bookingId) {
        return { ...prev, status: newStatus };
      }
      return prev;
    });
    triggerToast('Status updated successfully');
  };

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

  // Close payment modal
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  // Handle payment save
  const handlePaymentSave = async (paymentData) => {
    if (!selectedBooking) return;
    setIsSavingPayment(true);

    // Update booking with payment data - uses optimistic updates
    const result = await updateBooking(selectedBooking.id, {
      paymentStatus: paymentData.paymentStatus,
      paymentMethod: paymentData.paymentMethod,
      amountPaid: paymentData.amountPaid,
      paymentNotes: paymentData.paymentNotes,
    });

    // Always update selectedBooking with the payment data (optimistic update)
    setSelectedBooking({
      ...selectedBooking,
      paymentStatus: paymentData.paymentStatus,
      paymentMethod: paymentData.paymentMethod,
      amountPaid: paymentData.amountPaid,
      paymentNotes: paymentData.paymentNotes,
    });

    setIsSavingPayment(false);
    closePaymentModal();
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

  // Handle room assignment
  const handleRoomAssign = async (room) => {
    if (!selectedBooking || !room) return;
    setIsAssigning(true);
    try {
      const success = await assignRoom(selectedBooking.id, room.id, room.roomNumber, selectedBooking.checkIn);
      if (success) {
        setSelectedBooking({
          ...selectedBooking,
          room: room.roomNumber,
          roomType: room.type,
          roomId: room.id,
          status: 'CONFIRMED',
        });
        triggerToast(`Room ${room.roomNumber} assigned successfully`);
        closeAssignRoomModal();
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

  // Highlight booking from notification click — navigate to correct page
  useEffect(() => {
    const bookingId = (location.state as any)?.bookingId;
    if (!bookingId || !sortedData.length) return;

    setHighlightBookingId(String(bookingId));

    // Find which page the booking is on
    const index = sortedData.findIndex(
      (b: any) => String(b.id) === String(bookingId) || String(b.bookingNumber) === String(bookingId)
    );
    if (index >= 0) {
      const targetPage = Math.floor(index / rowsPerPage) + 1;
      if (targetPage !== currentPage) {
        goToPage(targetPage);
      }
    }

    // Clear navigation state so refresh doesn't re-trigger
    nav(location.pathname, { replace: true, state: {} });

    // Auto-clear highlight after 3s
    const timer = setTimeout(() => setHighlightBookingId(null), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, sortedData.length]);

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
          bookings={currentPageData}
          sortConfig={sortConfig}
          onSort={handleSort}
          highlightId={highlightBookingId}
          onViewBooking={handleViewBooking}
          onEditBooking={handleEditFromAction}
          onAssignRoom={handleAssignRoomFromAction}
          onCancelBooking={handleCancelFromAction}
          onManagePayment={handleManagePaymentFromAction}
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

      {/* Payment Management Modal */}
      <PaymentManagementModal
        booking={selectedBooking}
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        onSave={handlePaymentSave}
        isSaving={isSavingPayment}
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
