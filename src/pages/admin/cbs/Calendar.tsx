/**
 * CBS Calendar Page
 * 30-day availability calendar with inline editing - Glimmora Design System v5.0
 * Enhanced with refined editorial luxury aesthetic
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCBS } from '../../../context/CBSContext';
import { useToast } from '../../../contexts/ToastContext';
import AvailabilityCalendar from '../../../components/cbs/AvailabilityCalendar';
import { ConfirmModal } from '../../../components/ui2/Modal';
import { Button } from '../../../components/ui2/Button';
import { cn } from '../../../lib/utils';
import {
  Calendar, Download, TrendingUp, Percent, Home, CalendarX, Lock,
  AlertTriangle, Ban, Sparkles, LogIn, LogOut, ChevronRight,
  ChevronDown, ChevronUp, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function CBSCalendar() {
  const navigate = useNavigate();
  const { availability, updateAvailability, getCalendarData, bookings } = useCBS();
  const { success } = useToast();
  const calendarRef = useRef(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'primary'
  });

  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);

  const dates = useMemo(() => getCalendarData(30), [getCalendarData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calendarRef.current?.scrollToToday();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateAvailability = (date, roomType, updates) => {
    const previousData = availability[date]?.[roomType];
    updateAvailability(date, roomType, updates);
    success('Availability updated successfully', {
      onUndo: () => {
        updateAvailability(date, roomType, previousData);
      }
    });
  };

  const stats = useMemo(() => {
    const roomTypes = ['Standard', 'Premium', 'Deluxe', 'Suite'];
    let totalAvailable = 0;
    let totalInventory = 0;
    let soldOutDays = 0;
    let restrictedDays = 0;

    dates.forEach(dateInfo => {
      roomTypes.forEach(roomType => {
        const cell = availability[dateInfo.date]?.[roomType];
        if (cell) {
          totalAvailable += cell.available;
          totalInventory += cell.totalInventory;
          if (cell.available === 0) soldOutDays++;
          if (cell.stopSell || cell.cta || cell.ctd) restrictedDays++;
        }
      });
    });

    const occupancyRate = totalInventory > 0
      ? Math.round(((totalInventory - totalAvailable) / totalInventory) * 100)
      : 0;

    return { totalAvailable, totalInventory, occupancyRate, soldOutDays, restrictedDays };
  }, [availability, dates]);

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const arrivals = bookings.filter(b => b.checkIn === today && b.status !== 'CANCELLED').length;
    const departures = bookings.filter(b => b.checkOut === today && b.status !== 'CANCELLED').length;
    return { arrivals, departures };
  }, [bookings]);

  // KPI cards configuration
  const kpiCards = [
    {
      icon: Percent,
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      change: '+12%',
      changeType: 'positive',
      subtitle: 'vs last month',
      accent: 'terra'
    },
    {
      icon: Home,
      title: 'Available Rooms',
      value: stats.totalAvailable,
      subtitle: `of ${stats.totalInventory} inventory`,
      accent: 'ocean'
    },
    {
      icon: CalendarX,
      title: 'Sold Out Days',
      value: stats.soldOutDays,
      change: stats.soldOutDays > 10 ? 'High demand' : stats.soldOutDays > 5 ? 'Moderate' : 'Low',
      changeType: stats.soldOutDays > 10 ? 'negative' : 'neutral',
      accent: 'gold'
    },
    {
      icon: Lock,
      title: 'Active Restrictions',
      value: stats.restrictedDays,
      change: stats.restrictedDays > 20 ? 'Review needed' : 'Normal',
      changeType: stats.restrictedDays > 20 ? 'negative' : 'neutral',
      accent: 'sage'
    }
  ];

  // Quick actions configuration
  const quickActions = [
    {
      icon: Ban,
      title: 'Close Weekends',
      description: 'Block weekend arrivals',
      accent: 'terra',
      onClick: () => setConfirmDialog({
        isOpen: true,
        title: 'Close Weekends to Arrival',
        message: 'This will prevent check-ins on all Saturdays and Sundays for the next 30 days.',
        variant: 'warning',
        onConfirm: () => success('Weekend CTA applied')
      })
    },
    {
      icon: TrendingUp,
      title: 'Weekend +15%',
      description: 'Apply premium pricing',
      accent: 'ocean',
      onClick: () => setConfirmDialog({
        isOpen: true,
        title: 'Apply Weekend Rate',
        message: 'This will increase rates by 15% for all weekends in the next 30 days.',
        variant: 'primary',
        onConfirm: () => success('Weekend premium applied')
      })
    },
    {
      icon: Calendar,
      title: 'Min 2-Night',
      description: 'Set length restriction',
      accent: 'gold',
      onClick: () => setConfirmDialog({
        isOpen: true,
        title: 'Set Minimum Stay',
        message: 'This will require a minimum 2-night stay for all room types.',
        variant: 'primary',
        onConfirm: () => success('Minimum stay applied')
      })
    },
    {
      icon: AlertTriangle,
      title: 'Stop Sell All',
      description: 'Block all bookings',
      accent: 'rose',
      onClick: () => setConfirmDialog({
        isOpen: true,
        title: 'Stop Sell All Rooms',
        message: 'This will prevent ALL new bookings. This is a drastic action.',
        variant: 'danger',
        onConfirm: () => success('Stop sell applied')
      })
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-10 py-6">

        {/* Page Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Availability
            </h1>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Manage rates, inventory, and restrictions across all room types
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={Download}
              onClick={() => success('Exporting...')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={() => setConfirmDialog({
                isOpen: true,
                title: 'Bulk Update',
                message: 'Open the bulk update wizard to modify multiple dates at once.',
                variant: 'primary',
                onConfirm: () => success('Bulk update wizard opened')
              })}
            >
              Bulk Update
            </Button>
          </div>
        </header>

        {/* KPI Cards - Matching Dashboard Design */}
        <section className="grid grid-cols-12 gap-6 mb-6">
          {kpiCards.map((kpi, index) => {
            const isPositive = kpi.changeType === 'positive';
            return (
              <div
                key={index}
                className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-[10px] bg-white p-6"
              >
                {/* Header with Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    kpi.accent === 'terra' && 'bg-terra-50',
                    kpi.accent === 'sage' && 'bg-sage-50',
                    kpi.accent === 'gold' && 'bg-gold-50',
                    kpi.accent === 'ocean' && 'bg-ocean-50'
                  )}>
                    <kpi.icon className={cn(
                      "w-4 h-4",
                      kpi.accent === 'terra' && 'text-terra-600',
                      kpi.accent === 'sage' && 'text-sage-600',
                      kpi.accent === 'gold' && 'text-gold-600',
                      kpi.accent === 'ocean' && 'text-ocean-600'
                    )} />
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
                  <p className="text-[11px] text-neutral-400 font-medium">
                    {kpi.subtitle || 'vs Last Month'}
                  </p>
                  {kpi.change && (
                    <div className={cn(
                      'flex items-center gap-1 text-[11px] font-semibold',
                      isPositive
                        ? 'text-sage-600'
                        : kpi.changeType === 'negative'
                          ? 'text-rose-600'
                          : 'text-neutral-500'
                    )}>
                      {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {kpi.changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5" />}
                      {kpi.change}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Today's Activity - Horizontal Stats Strip */}
        <section className="grid grid-cols-12 gap-6 mb-6">
          {/* Arrivals */}
          <div className="col-span-3 rounded-[10px] bg-white p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-sage-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900 tracking-tight">
                {todayStats.arrivals}
              </p>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                Arrivals Today
              </p>
            </div>
          </div>

          {/* Departures */}
          <div className="col-span-3 rounded-[10px] bg-white p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-ocean-100 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-ocean-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900 tracking-tight">
                {todayStats.departures}
              </p>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                Departures Today
              </p>
            </div>
          </div>

          {/* Occupancy */}
          <div className="col-span-3 rounded-[10px] bg-white p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-terra-100 flex items-center justify-center">
              <Home className="w-6 h-6 text-terra-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900 tracking-tight">
                {stats.occupancyRate}%
              </p>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                Occupancy Rate
              </p>
            </div>
          </div>

          {/* Available */}
          <div className="col-span-3 rounded-[10px] bg-white p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center">
              <CalendarX className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900 tracking-tight">
                {stats.totalAvailable}
              </p>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                Rooms Available
              </p>
            </div>
          </div>
        </section>

        {/* AI Insights */}
        <section className="rounded-[10px] bg-white overflow-hidden mb-6">
          <button
            onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-800">
                  AI Revenue Insights
                </h3>
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider bg-gold-50 text-gold-600">
                  Smart
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                Personalized recommendations
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-50">
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
            <div className="px-6 pb-6 pt-2 space-y-2.5 border-t border-neutral-100">
              {stats.occupancyRate > 80 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-sage-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-sage-700">High Demand Alert</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Consider increasing rates by 10-15% for optimal revenue capture
                    </p>
                  </div>
                </div>
              )}
              {stats.soldOutDays > 10 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gold-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gold-700">Sold Out Analysis</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Multiple sold-out dates ahead - review overbooking strategy
                    </p>
                  </div>
                </div>
              )}
              {stats.occupancyRate < 50 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-rose-600">Low Occupancy Warning</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Consider promotional rates or flash sales to boost bookings
                    </p>
                  </div>
                </div>
              )}
              {stats.occupancyRate >= 50 && stats.occupancyRate <= 80 && stats.soldOutDays <= 10 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-terra-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-terra-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-terra-600">Healthy Performance</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Booking pace is on track - maintain current pricing strategy
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-800">Quick Actions</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Bulk operations for efficient inventory management
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="group flex items-center gap-4 p-4 rounded-[10px] bg-white"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    action.accent === 'terra' && 'bg-terra-50',
                    action.accent === 'ocean' && 'bg-ocean-50',
                    action.accent === 'gold' && 'bg-gold-50',
                    action.accent === 'rose' && 'bg-rose-50'
                  )}>
                    <action.icon className={cn(
                      "w-5 h-5",
                      action.accent === 'terra' && 'text-terra-600',
                      action.accent === 'ocean' && 'text-ocean-600',
                      action.accent === 'gold' && 'text-gold-600',
                      action.accent === 'rose' && 'text-rose-600'
                    )} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-semibold text-neutral-800 mb-0.5">
                      {action.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Calendar Grid */}
        <section>
          <AvailabilityCalendar
            ref={calendarRef}
            availability={availability}
            dates={dates}
            onUpdateAvailability={handleUpdateAvailability}
          />
        </section>
      </main>

      {/* Confirm Dialog */}
      <ConfirmModal
        open={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
        title={confirmDialog.title}
        description={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Apply"
        cancelText="Cancel"
      />
    </div>
  );
}
