import { useState, useMemo, useEffect } from 'react';
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
import { useBookings } from '../../hooks/admin/useBookings';
import { useSort } from '../../hooks/useSort';
import { usePagination } from '../../hooks/usePagination';
import { CANCELLATION_REASONS } from '../../utils/bookings';
import { Button } from '../../components/ui2/Button';

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

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
    try {
      await createBooking(bookingData);
      setIsAddBookingModalOpen(false);
      triggerToast('Booking created successfully');
    } catch (error) {
      triggerToast('Failed to create booking');
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
      const success = await assignRoom(selectedBooking.id, room.id, room.roomNumber);
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

  // Step 4: Apply sorting
  const { sortedData, sortConfig, handleSort } = useSort(searchedData, 'checkIn', 'desc');

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-6 space-y-6">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Bookings</h1>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
            Manage reservations, availability, and guest information.
          </p>
        </div>
        <QuickActions onNewBooking={handleNewBooking} />
      </header>

      {/* Main Bookings Card (CMS-consistent) */}
      <div className="bg-white rounded-[10px] overflow-hidden">
        {/* Tabs + Actions */}
        <div className="border-b border-neutral-100">
          <div className="px-6 pt-4 flex items-center justify-between">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="px-6 py-4 bg-neutral-50/30 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-md">
              <SearchBar value={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery('')} />
            </div>
            <div className="flex-1" />
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
          onViewBooking={handleViewBooking}
          onEditBooking={handleEditFromAction}
          onAssignRoom={handleAssignRoomFromAction}
          onCancelBooking={handleCancelFromAction}
        />

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/30">
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div className="px-4 py-3 rounded-[10px] bg-neutral-900 text-white shadow-xl flex items-center gap-2">
            <span className="text-[13px] font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
