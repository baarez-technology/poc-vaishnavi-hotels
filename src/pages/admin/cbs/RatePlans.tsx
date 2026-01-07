/**
 * CMS Rate Plans Page
 * Manage rate plans with inline editing - Glimmora Design System v5.0
 * Enhanced with refined editorial luxury aesthetic
 */

import { useState, useMemo } from 'react';
import { useCBS } from '../../../context/CBSContext';
import { useToast } from '../../../contexts/ToastContext';
import RatePlanCard from '../../../components/cbs/RatePlanCard';
import NewRatePlanModal from '../../../components/cms/NewRatePlanModal';
import { ConfirmModal } from '../../../components/ui2/Modal';
import { Button } from '../../../components/ui2/Button';
import { DropdownMenu, DropdownMenuItem } from '../../../components/ui2/DropdownMenu';
import { Pagination, PaginationInfo } from '../../../components/core/Pagination';
import {
  Search, Tag, Plus, CheckCircle, XCircle,
  Download, ChevronUp, ChevronDown
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function CBSRatePlans() {
  const { ratePlans, createRatePlan, updateRatePlan, toggleRatePlanStatus } = useCBS();
  const { success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'primary'
  });

  const filteredRatePlans = useMemo(() => {
    let result = [...ratePlans];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(rp =>
        rp.name.toLowerCase().includes(query) ||
        rp.fullName.toLowerCase().includes(query) ||
        rp.description.toLowerCase().includes(query)
      );
    }

    if (filterStatus === 'active') {
      result = result.filter(rp => rp.isActive);
    } else if (filterStatus === 'inactive') {
      result = result.filter(rp => !rp.isActive);
    }

    return result;
  }, [ratePlans, searchQuery, filterStatus]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredRatePlans.length / ITEMS_PER_PAGE);
  const paginatedRatePlans = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRatePlans.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRatePlans, currentPage]);

  const handleUpdate = (ratePlanId, updates) => {
    const previousData = ratePlans.find(rp => rp.id === ratePlanId);
    const previousValues = {
      minStay: previousData.minStay,
      maxStay: previousData.maxStay,
      ctaEnabled: previousData.ctaEnabled,
      ctdEnabled: previousData.ctdEnabled
    };

    updateRatePlan(ratePlanId, updates);
    success('Rate plan updated successfully', {
      onUndo: () => updateRatePlan(ratePlanId, previousValues)
    });
    setEditingPlanId(null);
  };

  const handleToggleStatus = (ratePlanId) => {
    const plan = ratePlans.find(rp => rp.id === ratePlanId);

    if (plan.isActive) {
      setConfirmDialog({
        isOpen: true,
        title: `Deactivate ${plan.name}?`,
        message: 'This will prevent new bookings using this rate plan. Existing bookings will not be affected.',
        variant: 'warning',
        onConfirm: () => performToggleStatus(ratePlanId)
      });
    } else {
      performToggleStatus(ratePlanId);
    }
  };

  const performToggleStatus = (ratePlanId) => {
    const plan = ratePlans.find(rp => rp.id === ratePlanId);
    const wasActive = plan.isActive;

    toggleRatePlanStatus(ratePlanId);
    success(`${plan.name} ${wasActive ? 'deactivated' : 'activated'}`, {
      onUndo: () => toggleRatePlanStatus(ratePlanId)
    });

    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'primary' });
  };

  const handleCreateRatePlan = (newPlanData) => {
    const newPlan = createRatePlan(newPlanData);
    success(`Rate plan "${newPlan.name}" created successfully`);
    setShowNewModal(false);
  };

  const stats = useMemo(() => ({
    total: ratePlans.length,
    active: ratePlans.filter(rp => rp.isActive).length,
    inactive: ratePlans.filter(rp => !rp.isActive).length
  }), [ratePlans]);

  // KPI cards with accent colors
  const kpiCards = [
    {
      icon: Tag,
      title: 'Total Rate Plans',
      value: stats.total,
      subtitle: `${stats.active} active`,
      accent: 'terra'
    },
    {
      icon: CheckCircle,
      title: 'Active Plans',
      value: stats.active,
      subtitle: 'Generating revenue',
      change: stats.active > 0 ? 'Live' : null,
      changeType: 'positive',
      accent: 'sage'
    },
    {
      icon: XCircle,
      title: 'Inactive Plans',
      value: stats.inactive,
      subtitle: 'Review for activation',
      accent: 'neutral'
    }
  ];

  const accentColors = {
    terra: { bg: 'bg-terra-50', border: 'border-terra-100', icon: 'bg-terra-100 text-terra-600' },
    sage: { bg: 'bg-sage-50', border: 'border-sage-100', icon: 'bg-sage-100 text-sage-600' },
    neutral: { bg: 'bg-neutral-50', border: 'border-neutral-200', icon: 'bg-neutral-100 text-neutral-500' }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-6 space-y-6">

        {/* Page Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Rate Plans
            </h1>
            <p className="text-[13px] text-neutral-500 mt-1">
              Manage pricing strategies, restrictions, and distribution channels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" icon={Download}>
              Export
            </Button>
            <Button onClick={() => setShowNewModal(true)} variant="primary" icon={Plus}>
              New Rate Plan
            </Button>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiCards.map((kpi, index) => {
            const colors = accentColors[kpi.accent];
            const isPositive = kpi.changeType === 'positive';
            return (
              <div
                key={index}
                className="rounded-[10px] bg-white p-6"
              >
                {/* Header with Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                    {kpi.title}
                  </p>
                </div>

                {/* Value */}
                <p className="text-[28px] font-semibold tracking-tight text-neutral-900 mb-2">
                  {kpi.value}
                </p>

                {/* Comparison */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-neutral-400 font-medium">{kpi.subtitle}</p>
                  {kpi.change && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      isPositive ? 'text-sage-600' : 'text-neutral-500'
                    }`}>
                      {isPositive && <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />}
                      {kpi.change}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* AI Insights */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <button
            onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
            className="w-full px-6 py-5 flex items-center justify-between transition-colors hover:bg-neutral-50/50"
          >
            <div className="flex items-center gap-3">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    AI Pricing Insights
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-gold-100 text-gold-700">
                    Smart
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                  Personalized recommendations
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-colors">
              {isInsightsExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>

          <div className={`transition-all duration-300 ease-out overflow-hidden ${
            isInsightsExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-6 pb-6 pt-2 space-y-3 border-t border-neutral-100">
              {stats.active > 0 ? (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-sage-50/50">
                  <div className="w-2 h-2 rounded-full bg-sage-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-sage-700">Revenue Active</p>
                    <p className="text-[11px] mt-0.5 text-neutral-500 font-medium">
                      {stats.active} rate plan{stats.active !== 1 ? 's are' : ' is'} currently accepting bookings
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50/50">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-rose-600">Action Required</p>
                    <p className="text-[11px] mt-0.5 text-neutral-500 font-medium">
                      No active rate plans - activate at least one to start accepting bookings
                    </p>
                  </div>
                </div>
              )}
              {stats.inactive > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gold-50/50">
                  <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-gold-700">Optimization Opportunity</p>
                    <p className="text-[11px] mt-0.5 text-neutral-500 font-medium">
                      {stats.inactive} inactive plan{stats.inactive !== 1 ? 's' : ''} available for seasonal campaigns
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search rate plans by name, description..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg text-sm bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu
            align="end"
            trigger={
              <button className="h-10 w-[140px] px-4 pr-3 rounded-lg text-sm bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150 flex items-center justify-between">
                <span>{filterStatus === 'all' ? 'All Status' : filterStatus === 'active' ? 'Active' : 'Inactive'}</span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
            }
          >
            <DropdownMenuItem onSelect={() => handleFilterChange(setFilterStatus, 'all')}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleFilterChange(setFilterStatus, 'active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleFilterChange(setFilterStatus, 'inactive')}>
              Inactive
            </DropdownMenuItem>
          </DropdownMenu>
        </section>

        {/* Rate Plans List */}
        {filteredRatePlans.length === 0 ? (
          <section className="rounded-[10px] p-12 text-center bg-white">
            <div className="w-16 h-16 rounded-lg mx-auto mb-5 flex items-center justify-center bg-neutral-50">
              <Tag className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-neutral-900">
              No rate plans found
            </h3>
            <p className="text-[13px] mb-6 max-w-md mx-auto text-neutral-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Get started by creating your first rate plan to begin accepting bookings'
              }
            </p>
            <div className="flex items-center justify-center gap-3">
              {(searchQuery || filterStatus !== 'all') && (
                <Button
                  onClick={() => { setSearchQuery(''); setFilterStatus('all'); setCurrentPage(1); }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
              <Button onClick={() => setShowNewModal(true)} variant="primary" icon={Plus}>
                Create Rate Plan
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="space-y-4">
              {paginatedRatePlans.map((ratePlan, index) => (
                <RatePlanCard
                  key={ratePlan.id}
                  ratePlan={ratePlan}
                  onUpdate={handleUpdate}
                  onToggleStatus={handleToggleStatus}
                  index={index}
                  isEditing={editingPlanId === ratePlan.id}
                  onEditStart={() => setEditingPlanId(ratePlan.id)}
                  onEditEnd={() => setEditingPlanId(null)}
                  disableEdit={editingPlanId !== null && editingPlanId !== ratePlan.id}
                />
              ))}
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
              <section className="flex items-center justify-between pt-4">
                <PaginationInfo
                  currentPage={currentPage}
                  pageSize={ITEMS_PER_PAGE}
                  totalItems={filteredRatePlans.length}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </section>
            )}
          </>
        )}
      </div>

      {/* New Rate Plan Modal */}
      <NewRatePlanModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateRatePlan}
      />

      {/* Confirm Dialog */}
      <ConfirmModal
        open={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'primary' })}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'primary' });
        }}
        title={confirmDialog.title}
        description={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}
