import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Download,
  Calendar,
  Package,
  ClipboardList,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useMaintenance } from '../../hooks/admin/useMaintenance';
import { useRooms } from '../../hooks/admin/useRooms';
import {
  filterWorkOrders,
  searchWorkOrders,
  sortWorkOrders,
  exportMaintenanceToCSV,
  PM_FREQUENCY
} from '../../utils/maintenance';
import { ConfirmModal } from '../../components/ui2/Modal';
import { Button, IconButton } from '../../components/ui2/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableActions, TableEmpty } from '../../components/ui2/Table';
import { Badge, StatusBadge } from '../../components/ui2/Badge';

// Components
import WOKPI from '../../components/maintenance/WOKPI';
import WOFilters from '../../components/maintenance/WOFilters';
import WOTable from '../../components/maintenance/WOTable';
import WODrawer from '../../components/maintenance/WODrawer';
import MaintenanceCalendar from '../../components/maintenance/MaintenanceCalendar';
import InventoryTable from '../../components/maintenance/InventoryTable';

// Modals
import CreateWOModal from '../../components/maintenance/modals/CreateWOModal';
import EditWOModal from '../../components/maintenance/modals/EditWOModal';
import PreventiveModal from '../../components/maintenance/modals/PreventiveModal';

export default function Maintenance() {
  const { showToast } = useToast();
  const {
    workOrders,
    pmTasks,
    technicians,
    inventory,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    startWorkOrder,
    completeWorkOrder,
    holdWorkOrder,
    reopenWorkOrder,
    assignTechnician,
    clearRoomOOO,
    addPMTask,
    updatePMTask,
    deletePMTask,
    completePMTask,
    togglePMActive,
    getOverduePMTasks,
    getUpcomingPMTasks,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    updateStock
  } = useMaintenance();

  const { rooms } = useRooms();

  // View state
  const [activeTab, setActiveTab] = useState('workorders'); // 'workorders', 'preventive', 'calendar', 'inventory'

  // Filters
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    category: 'all',
    technician: 'all',
    oooOnly: false,
    dateFrom: '',
    dateTo: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modals
  const [showCreateWOModal, setShowCreateWOModal] = useState(false);
  const [showEditWOModal, setShowEditWOModal] = useState(false);
  const [showPMModal, setShowPMModal] = useState(false);
  const [pmModalMode, setPMModalMode] = useState('create');

  // Drawer
  const [selectedWO, setSelectedWO] = useState(null);
  const [selectedPM, setSelectedPM] = useState(null);

  // Confirmation states
  const [deleteWOConfirm, setDeleteWOConfirm] = useState({ isOpen: false, woId: null });
  const [deletePMConfirm, setDeletePMConfirm] = useState({ isOpen: false, pmId: null });
  const [deleteInventoryConfirm, setDeleteInventoryConfirm] = useState({ isOpen: false, itemId: null });

  // PM dropdown menu state
  const [openPMMenuId, setOpenPMMenuId] = useState(null);
  const pmMenuRef = useRef(null);

  // Close PM menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pmMenuRef.current && !pmMenuRef.current.contains(e.target)) {
        setOpenPMMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Process work orders
  const processedWorkOrders = useMemo(() => {
    let result = [...workOrders];

    // Apply technician filter (special handling for unassigned)
    if (filters.technician === 'unassigned') {
      result = result.filter(wo => !wo.assignedTo);
    } else {
      result = filterWorkOrders(result, filters);
    }

    // Apply search
    result = searchWorkOrders(result, searchQuery);

    // Apply sort
    result = sortWorkOrders(result, sortField, sortDirection);

    return result;
  }, [workOrders, filters, searchQuery, sortField, sortDirection]);

  // PM Tasks processed
  const overduePM = useMemo(() => getOverduePMTasks(), [getOverduePMTasks]);
  const upcomingPM = useMemo(() => getUpcomingPMTasks(7), [getUpcomingPMTasks]);

  // Handlers
  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleClearFilters = () => {
    setFilters({
      priority: 'all',
      status: 'all',
      category: 'all',
      technician: 'all',
      oooOnly: false,
      dateFrom: '',
      dateTo: ''
    });
    setSearchQuery('');
  };

  const handleCreateWO = (data) => {
    const newWO = addWorkOrder(data);
    showToast(`Work Order ${newWO.id} created successfully`, 'success');
  };

  const handleUpdateWO = (woId, data) => {
    updateWorkOrder(woId, data, 'Work order updated');
    showToast('Work order updated successfully', 'success');
    setSelectedWO(null);
  };

  const handleDeleteWO = (woId) => {
    setDeleteWOConfirm({ isOpen: true, woId });
  };

  const confirmDeleteWO = () => {
    if (deleteWOConfirm.woId) {
      deleteWorkOrder(deleteWOConfirm.woId);
      showToast('Work order deleted', 'success');
      setSelectedWO(null);
    }
    setDeleteWOConfirm({ isOpen: false, woId: null });
  };

  const handleStartWO = (woId) => {
    startWorkOrder(woId, 'Manager');
    showToast('Work order started', 'info');
  };

  const handleCompleteWO = (woId) => {
    completeWorkOrder(woId, 'Manager');
    showToast('Work order completed', 'success');
    setSelectedWO(null);
  };

  const handleHoldWO = (woId) => {
    holdWorkOrder(woId, 'Awaiting parts/approval', 'Manager');
    showToast('Work order put on hold', 'info');
  };

  const handleReopenWO = (woId) => {
    reopenWorkOrder(woId, 'Manager');
    showToast('Work order reopened', 'info');
  };

  const handleAssignTech = (woId, techId) => {
    assignTechnician(woId, techId, 'Manager');
    showToast('Technician assigned', 'success');
  };

  const handleClearOOO = (roomNumber) => {
    clearRoomOOO(roomNumber, 'Manager');
    showToast(`Room ${roomNumber} OOO cleared`, 'success');
    setSelectedWO(null);
  };

  const handleExportCSV = () => {
    const result = exportMaintenanceToCSV(processedWorkOrders);
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  // PM Handlers
  const handleCreatePM = (data) => {
    const newPM = addPMTask(data);
    showToast(`PM Task ${newPM.id} created`, 'success');
  };

  const handleUpdatePM = (pmId, data) => {
    updatePMTask(pmId, data);
    showToast('PM Task updated', 'success');
    setSelectedPM(null);
  };

  const handleCompletePM = (pmId) => {
    completePMTask(pmId);
    showToast('PM Task completed, next scheduled', 'success');
  };

  const handleDeletePM = (pmId) => {
    setDeletePMConfirm({ isOpen: true, pmId });
  };

  const confirmDeletePM = () => {
    if (deletePMConfirm.pmId) {
      deletePMTask(deletePMConfirm.pmId);
      showToast('PM Task deleted', 'success');
    }
    setDeletePMConfirm({ isOpen: false, pmId: null });
  };

  // Calendar event handler
  const handleCalendarEventClick = (event) => {
    if (event.type === 'workorder') {
      const wo = workOrders.find(w => w.id === event.id);
      if (wo) setSelectedWO(wo);
    } else if (event.type === 'preventive') {
      const pm = pmTasks.find(p => p.id === event.id);
      if (pm) {
        setSelectedPM(pm);
        setPMModalMode('edit');
        setShowPMModal(true);
      }
    }
  };

  // Inventory handlers
  const handleAddInventoryItem = () => {
    const name = window.prompt('Enter item name:');
    if (name) {
      addInventoryItem({ name, category: 'general', stockLevel: 0, minStock: 10 });
      showToast('Item added', 'success');
    }
  };

  const handleEditInventoryItem = (item) => {
    const newName = window.prompt('Enter new name:', item.name);
    if (newName && newName !== item.name) {
      updateInventoryItem(item.id, { name: newName });
      showToast('Item updated', 'success');
    }
  };

  const handleDeleteInventoryItem = (itemId) => {
    setDeleteInventoryConfirm({ isOpen: true, itemId });
  };

  const confirmDeleteInventory = () => {
    if (deleteInventoryConfirm.itemId) {
      deleteInventoryItem(deleteInventoryConfirm.itemId);
      showToast('Item deleted', 'success');
    }
    setDeleteInventoryConfirm({ isOpen: false, itemId: null });
  };

  const handleUpdateStock = (itemId, quantity, isAddition) => {
    updateStock(itemId, quantity, isAddition);
    showToast(`Stock ${isAddition ? 'added' : 'removed'}`, 'success');
  };

  const tabs = [
    { id: 'workorders', label: 'Work Orders', icon: ClipboardList },
    { id: 'preventive', label: 'Preventive Maintenance', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'inventory', label: 'Inventory', icon: Package }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-6 space-y-6">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Maintenance
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Manage work orders, preventive maintenance, and inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              if (activeTab === 'preventive') {
                setPMModalMode('create');
                setSelectedPM(null);
                setShowPMModal(true);
              } else {
                setShowCreateWOModal(true);
              }
            }}
          >
            {activeTab === 'preventive' ? 'Add PM Task' : 'Create Work Order'}
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <WOKPI
        workOrders={workOrders}
        technicians={technicians}
        rooms={rooms}
        inventory={inventory}
      />

      {/* Alerts */}
      {(overduePM.length > 0 || workOrders.filter(wo => wo.priority === 'high' && wo.status !== 'completed').length > 0) && (
        <div className="bg-rose-50 border border-rose-100 rounded-[10px] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-rose-900">Attention Required</h3>
              <ul className="mt-1 text-[12px] text-rose-700 space-y-0.5">
                {overduePM.length > 0 && (
                  <li>{overduePM.length} overdue preventive maintenance task{overduePM.length > 1 ? 's' : ''}</li>
                )}
                {workOrders.filter(wo => wo.priority === 'high' && wo.status !== 'completed').length > 0 && (
                  <li>{workOrders.filter(wo => wo.priority === 'high' && wo.status !== 'completed').length} high priority work order{workOrders.filter(wo => wo.priority === 'high' && wo.status !== 'completed').length > 1 ? 's' : ''} pending</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Card (CMS-consistent) */}
      <div className="bg-white rounded-[10px] overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-neutral-100">
          <div className="px-6 pt-4">
            <div className="flex items-center gap-0.5">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-3 text-[13px] font-semibold transition-all duration-150 ${
                      isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-terra-500 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'workorders' && (
          <>
            {/* Filters */}
            <div className="px-6 py-4 bg-neutral-50/30 border-b border-neutral-100">
              <WOFilters
                filters={filters}
                setFilters={setFilters}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                technicians={technicians}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Table */}
            <WOTable
              workOrders={processedWorkOrders}
              technicians={technicians}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onRowClick={setSelectedWO}
              onStartWO={handleStartWO}
              onCompleteWO={handleCompleteWO}
              onHoldWO={handleHoldWO}
              onReopenWO={handleReopenWO}
              onDeleteWO={handleDeleteWO}
              onAssignTech={(wo) => {
                setSelectedWO(wo);
              }}
            />

            {/* Results count / Pagination area */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/30">
              <p className="text-sm text-neutral-500">
                Showing <span className="font-medium text-neutral-700">{processedWorkOrders.length}</span> of{' '}
                <span className="font-medium text-neutral-700">{workOrders.length}</span> work orders
              </p>
            </div>
          </>
        )}

        {activeTab === 'preventive' && (
          <div className="p-6 space-y-4">
            {/* Upcoming PM Tasks */}
            {upcomingPM.length > 0 && (
              <div className="bg-neutral-50/50 border border-neutral-100 rounded-lg p-5">
                <h3 className="font-semibold text-neutral-900 mb-3 text-[14px]">Upcoming Tasks (Next 7 Days)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcomingPM.map(pm => (
                    <div
                      key={pm.id}
                      onClick={() => {
                        setSelectedPM(pm);
                        setPMModalMode('edit');
                        setShowPMModal(true);
                      }}
                      className="bg-white rounded-lg p-4 border border-neutral-200 cursor-pointer hover:border-terra-300 hover:shadow-sm transition-all"
                    >
                      <p className="font-medium text-neutral-900 text-[13px]">{pm.equipment}</p>
                      <p className="text-[11px] text-neutral-500 mt-1">Due: {pm.nextDueDate}</p>
                      <p className="text-[11px] text-neutral-500">{pm.technicianName || 'Unassigned'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PM Tasks Table */}
            <div className="rounded-lg border border-neutral-100 overflow-hidden">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead width="100px">ID</TableHead>
                  <TableHead width="200px">Equipment</TableHead>
                  <TableHead width="120px">Frequency</TableHead>
                  <TableHead width="130px">Next Due</TableHead>
                  <TableHead width="130px">Last Done</TableHead>
                  <TableHead width="180px">Technician</TableHead>
                  <TableHead width="120px" align="center">Status</TableHead>
                  <TableHead width="140px" align="center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pmTasks.length === 0 ? (
                  <TableEmpty
                    icon={Calendar}
                    title="No preventive maintenance tasks"
                    description="Create one to get started"
                  />
                ) : (
                  pmTasks.map(pm => {
                    const isOverdue = pm.nextDueDate && pm.nextDueDate < new Date().toISOString().split('T')[0];
                    const freqLabel = PM_FREQUENCY.find(f => f.value === pm.frequency)?.label || pm.frequency;
                    return (
                      <TableRow key={pm.id} className={isOverdue ? 'bg-rose-50/30' : ''}>
                        <TableCell>
                          <span className="font-mono text-sm font-semibold text-neutral-900">{pm.id}</span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-neutral-900">{pm.equipment}</p>
                          {pm.roomNumber && (
                            <p className="text-xs text-neutral-500">Room {pm.roomNumber}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" size="sm">{freqLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${isOverdue ? 'text-rose-600 font-semibold' : 'text-neutral-700'}`}>
                            {pm.nextDueDate || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-neutral-500">{pm.lastCompleted || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {pm.technicianName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-terra-100 flex items-center justify-center text-terra-600 text-xs font-bold">
                                {(pm.technicianName || '').split(' ').filter(n => n).map(n => n[0]).join('') || 'T'}
                              </div>
                              <span className="text-sm font-medium text-neutral-700">{pm.technicianName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <StatusBadge status={pm.isActive ? 'active' : 'inactive'} size="sm" />
                        </TableCell>
                        <TableActions>
                          <div className="relative" ref={openPMMenuId === pm.id ? pmMenuRef : null}>
                            <IconButton
                              icon={MoreHorizontal}
                              size="sm"
                              variant="ghost"
                              label="Actions"
                              onClick={() => setOpenPMMenuId(openPMMenuId === pm.id ? null : pm.id)}
                            />

                            {openPMMenuId === pm.id && (
                              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1.5 z-20">
                                <button
                                  onClick={() => {
                                    setSelectedPM(pm);
                                    setPMModalMode('edit');
                                    setShowPMModal(true);
                                    setOpenPMMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                                >
                                  View / Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleCompletePM(pm.id);
                                    setOpenPMMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                                >
                                  Mark Complete
                                </button>
                                <div className="border-t border-neutral-100 my-1" />
                                <button
                                  onClick={() => {
                                    handleDeletePM(pm.id);
                                    setOpenPMMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </TableActions>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="p-6">
            <MaintenanceCalendar
              workOrders={workOrders}
              pmTasks={pmTasks}
              onEventClick={handleCalendarEventClick}
            />
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-6">
            <InventoryTable
              inventory={inventory}
              onUpdateStock={handleUpdateStock}
              onEditItem={handleEditInventoryItem}
              onDeleteItem={handleDeleteInventoryItem}
              onAddItem={handleAddInventoryItem}
            />
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedWO && (
        <WODrawer
          workOrder={selectedWO}
          technicians={technicians}
          onClose={() => setSelectedWO(null)}
          onEdit={(wo) => {
            setShowEditWOModal(true);
          }}
          onDelete={handleDeleteWO}
          onStartWO={handleStartWO}
          onCompleteWO={handleCompleteWO}
          onHoldWO={handleHoldWO}
          onReopenWO={handleReopenWO}
          onAssignTech={handleAssignTech}
          onClearOOO={handleClearOOO}
        />
      )}

      {/* Modals */}
      <CreateWOModal
        isOpen={showCreateWOModal}
        onClose={() => setShowCreateWOModal(false)}
        onSubmit={handleCreateWO}
        technicians={technicians}
        rooms={rooms}
      />

      <EditWOModal
        isOpen={showEditWOModal}
        onClose={() => setShowEditWOModal(false)}
        onSubmit={handleUpdateWO}
        workOrder={selectedWO}
        technicians={technicians}
        rooms={rooms}
      />

      <PreventiveModal
        isOpen={showPMModal}
        onClose={() => {
          setShowPMModal(false);
          setSelectedPM(null);
        }}
        onSubmit={pmModalMode === 'edit' ? handleUpdatePM : handleCreatePM}
        pmTask={selectedPM}
        technicians={technicians}
        rooms={rooms}
        mode={pmModalMode}
      />

      {/* Delete Work Order Confirmation */}
      <ConfirmModal
        open={deleteWOConfirm.isOpen}
        onClose={() => setDeleteWOConfirm({ isOpen: false, woId: null })}
        onConfirm={confirmDeleteWO}
        title="Delete Work Order"
        description="Are you sure you want to delete this work order? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete PM Task Confirmation */}
      <ConfirmModal
        open={deletePMConfirm.isOpen}
        onClose={() => setDeletePMConfirm({ isOpen: false, pmId: null })}
        onConfirm={confirmDeletePM}
        title="Delete PM Task"
        description="Are you sure you want to delete this preventive maintenance task? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Inventory Item Confirmation */}
      <ConfirmModal
        open={deleteInventoryConfirm.isOpen}
        onClose={() => setDeleteInventoryConfirm({ isOpen: false, itemId: null })}
        onConfirm={confirmDeleteInventory}
        title="Delete Inventory Item"
        description="Are you sure you want to delete this inventory item?"
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
      </div>
    </div>
  );
}
