import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuests } from '../../hooks/admin/useGuests';
import { usePagination } from '../../hooks/usePagination';
import { useDrawer } from '../../hooks/useDrawer';
import { useModal } from '../../hooks/useModal';
import { useAdminSafe } from '../../contexts/AdminContext';
import { useToast } from '../../hooks/useToast';
import GuestsTabs from '../../components/guests/GuestsTabs';
import GuestsSearch from '../../components/guests/GuestsSearch';
import GuestsFilters from '../../components/guests/GuestsFilters';
import GuestsActions from '../../components/guests/GuestsActions';
import GuestsTable from '../../components/guests/GuestsTable';
import Pagination from '../../components/bookings/Pagination';
import GuestDrawer from '../../components/guests/GuestDrawer';
import AddGuestModal from '../../components/guests/AddGuestModal';
import EditGuestModal from '../../components/guests/EditGuestModal';
import MessageGuestModal from '../../components/admin-panel/guests/MessageGuestModal';
import DeleteGuestModal from '../../components/guests/DeleteGuestModal';
import { ConfirmModal } from '../../components/ui2/Modal';
import {
  exportGuestsToCSV,
  addNoteToGuest,
  removeNoteFromGuest,
  calculateLoyaltyTier,
} from '../../utils/guests';
import Toast from '../../components/common/Toast';

export default function Guests() {
  const navigate = useNavigate();
  const adminContext = useAdminSafe();

  // Master state management
  const {
    guests,
    rawGuests,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    sortField,
    sortDirection,
    handleSort,
    updateGuest,
    addGuest,
    deleteGuest,
  } = useGuests();

  // Pagination
  const pagination = usePagination(guests, 10);

  // Drawer for guest profile
  const drawer = useDrawer();

  // Modals
  const addModal = useModal();
  const editModal = useModal();
  const messageModal = useModal();
  const deleteModal = useModal();

  // Toast notifications
  const { toast, showToast, hideToast } = useToast();

  // Loading states
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blacklistConfirm, setBlacklistConfirm] = useState({ isOpen: false, guest: null });

  // Event Handlers
  const handleGuestClick = (guest) => {
    drawer.openDrawer(guest);
  };

  const handleEditGuest = (guest) => {
    drawer.closeDrawer();
    editModal.openModal(guest);
  };

  const handleMessageGuest = (guest) => {
    drawer.closeDrawer();
    messageModal.openModal(guest);
  };

  const handleBlacklistGuest = (guestOrId) => {
    const guest = typeof guestOrId === 'object' ? guestOrId : { id: guestOrId };
    setBlacklistConfirm({ isOpen: true, guest });
  };

  const confirmBlacklist = () => {
    if (blacklistConfirm.guest) {
      updateGuest(blacklistConfirm.guest.id, { status: 'Blacklisted' });
      drawer.closeDrawer();
    }
    setBlacklistConfirm({ isOpen: false, guest: null });
  };

  const handleDeleteGuest = (guest) => {
    drawer.closeDrawer();
    deleteModal.openModal(guest);
  };

  const handleConfirmDelete = async (guestId) => {
    setIsDeleting(true);
    try {
      if (deleteGuest) {
        await deleteGuest(guestId);
      }
      deleteModal.closeModal();
      showToast('Guest deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete guest:', error);
      showToast('Failed to delete guest. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveGuestEdit = async (guestId, updates) => {
    setIsSaving(true);
    try {
      await updateGuest(guestId, updates);
      editModal.closeModal();
      showToast('Guest updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update guest:', error);
      showToast('Failed to update guest. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = (guestId, messageData) => {
    console.log('Sending message to guest:', guestId, messageData);
    alert(`Message sent to ${messageModal.data.name}!`);
    messageModal.closeModal();
  };

  const handleAddGuest = () => {
    addModal.openModal();
  };

  const handleSaveNewGuest = async (guestData) => {
    setIsAdding(true);
    try {
      if (addGuest) {
        await addGuest(guestData);
      }
      addModal.closeModal();
      showToast('Guest added successfully', 'success');
    } catch (error) {
      console.error('Failed to add guest:', error);
      showToast('Failed to add guest. Please try again.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportGuests = () => {
    try {
      if (!guests || guests.length === 0) {
        showToast('No guests to export', 'error');
        return;
      }
      exportGuestsToCSV(guests, `guests_export_${new Date().toISOString().split('T')[0]}.csv`);
      showToast(`Exported ${guests.length} guests successfully`, 'success');
    } catch (error) {
      console.error('Failed to export guests:', error);
      showToast('Failed to export guests. Please try again.', 'error');
    }
  };

  const handleViewProfile = (guest) => {
    drawer.closeDrawer();
    navigate(`/admin/guests/${guest.id}`);
  };

  const handleAddNote = (guestId, noteText) => {
    const guest = rawGuests.find(g => g.id === guestId);
    if (guest) {
      const updatedGuest = addNoteToGuest(guest, noteText);
      updateGuest(guestId, { notes: updatedGuest.notes });
      // Refresh drawer data
      if (drawer.data?.id === guestId) {
        drawer.openDrawer({ ...drawer.data, notes: updatedGuest.notes });
      }
    }
  };

  const handleDeleteNote = (guestId, noteId) => {
    const guest = rawGuests.find(g => g.id === guestId);
    if (guest) {
      const updatedGuest = removeNoteFromGuest(guest, noteId);
      updateGuest(guestId, { notes: updatedGuest.notes });
      // Refresh drawer data
      if (drawer.data?.id === guestId) {
        drawer.openDrawer({ ...drawer.data, notes: updatedGuest.notes });
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-6 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Guests</h1>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Manage your guest database and communication.
            </p>
          </div>
          <GuestsActions onAddGuest={handleAddGuest} onExport={handleExportGuests} />
        </header>

        {/* Main Guests Card (CMS-consistent) */}
        <div className="bg-white rounded-[10px] overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-neutral-100">
            <div className="px-6 pt-4 flex items-center justify-between">
              <GuestsTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={{
                  all: rawGuests.length,
                  returning: rawGuests.filter(g => g.totalStays > 1).length,
                  vip: rawGuests.filter(g => g.status === 'vip').length,
                  blacklisted: rawGuests.filter(g => g.status === 'blacklisted').length,
                }}
              />
            </div>
          </div>

          {/* Search & Filters Row */}
          <div className="px-6 py-4 bg-neutral-50/30 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md">
                <GuestsSearch value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="flex-1" />
              <GuestsFilters
                filters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                countries={Array.from(new Set(rawGuests.map(g => g.country))).sort()}
              />
            </div>
          </div>

          {/* Guests Table */}
          <GuestsTable
            guests={pagination.currentPageData}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onGuestClick={handleGuestClick}
            onEditGuest={handleEditGuest}
            onMessageGuest={handleMessageGuest}
            onDeleteGuest={handleDeleteGuest}
          />

          {/* Pagination */}
          {guests.length > 0 && (
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/30">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                totalItems={pagination.totalItems}
                canGoPrev={pagination.canGoPrev}
                canGoNext={pagination.canGoNext}
                onPrevPage={pagination.prevPage}
                onNextPage={pagination.nextPage}
                onGoToPage={pagination.goToPage}
              />
            </div>
          )}
        </div>

      {/* Guest Drawer */}
      <GuestDrawer
        guest={drawer.data}
        isOpen={drawer.isOpen}
        onClose={drawer.closeDrawer}
        onEdit={() => handleEditGuest(drawer.data)}
        onMessage={() => handleMessageGuest(drawer.data)}
        onBlacklist={() => handleBlacklistGuest(drawer.data)}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onViewProfile={handleViewProfile}
      />

      {/* Add Guest Modal */}
      <AddGuestModal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        onSubmit={handleSaveNewGuest}
        isAdding={isAdding}
      />

      {/* Edit Guest Modal */}
      <EditGuestModal
        guest={editModal.data}
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        onSave={handleSaveGuestEdit}
        isSaving={isSaving}
      />

      {/* Delete Guest Modal */}
      <DeleteGuestModal
        guest={deleteModal.data}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Message Guest Modal */}
      <MessageGuestModal
        guest={messageModal.data}
        isOpen={messageModal.isOpen}
        onClose={messageModal.closeModal}
        onSend={handleSendMessage}
      />

        {/* Blacklist Confirmation Modal */}
        <ConfirmModal
          open={blacklistConfirm.isOpen}
          onClose={() => setBlacklistConfirm({ isOpen: false, guest: null })}
          onConfirm={confirmBlacklist}
          title="Blacklist Guest"
          description={`Are you sure you want to blacklist ${blacklistConfirm.guest?.name || 'this guest'}? This action can be undone later.`}
          variant="warning"
          confirmText="Blacklist"
          cancelText="Cancel"
        />

        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </div>
    </div>
  );
}
