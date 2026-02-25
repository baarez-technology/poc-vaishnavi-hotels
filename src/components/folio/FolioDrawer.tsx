/**
 * FolioDrawer - Main folio/billing container
 * Replaces PaymentManagementModal with full hotel cashiering system
 */

import { useState, useEffect, useCallback } from 'react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { useCurrency } from '@/hooks/useCurrency';
import { folioService } from '@/api/services/folio.service';
import type { Folio } from '@/types/folio.types';
import FolioHeader from './FolioHeader';
import FolioSummaryCard from './FolioSummaryCard';
import ChargesTab from './tabs/ChargesTab';
import PaymentsTab from './tabs/PaymentsTab';
import StatementTab from './tabs/StatementTab';
import RoutingTab from './tabs/RoutingTab';

type TabKey = 'charges' | 'payments' | 'statement' | 'routing';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'charges', label: 'Charges' },
  { key: 'payments', label: 'Payments' },
  { key: 'statement', label: 'Statement' },
  { key: 'routing', label: 'Routing' },
];

interface FolioDrawerProps {
  isOpen: boolean;
  booking: any;
  onClose: () => void;
}

export default function FolioDrawer({ isOpen, booking, onClose }: FolioDrawerProps) {
  const { formatCurrency } = useCurrency();
  const [folios, setFolios] = useState<Folio[]>([]);
  const [activeFolioId, setActiveFolioId] = useState<number | null>(null);
  const [activeFolio, setActiveFolio] = useState<Folio | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('charges');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingId = booking?.id || booking?.bookingNumber;

  // Load folios list
  const loadFolios = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await folioService.listFolios(bookingId);
      const list: Folio[] = res.folios || [];
      setFolios(list);
      // Auto-select first folio if none selected
      if (list.length > 0 && (!activeFolioId || !list.find(f => f.id === activeFolioId))) {
        setActiveFolioId(list[0].id);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load folios');
    }
    setLoading(false);
  }, [bookingId, activeFolioId]);

  // Load active folio detail
  const loadActiveFolio = useCallback(async () => {
    if (!bookingId || !activeFolioId) { setActiveFolio(null); return; }
    try {
      const res = await folioService.getFolio(bookingId, activeFolioId);
      setActiveFolio(res.folio || null);
    } catch { setActiveFolio(null); }
  }, [bookingId, activeFolioId]);

  // Load on open
  useEffect(() => {
    if (isOpen && bookingId) {
      loadFolios();
    }
  }, [isOpen, bookingId]);

  // Load active folio when selection changes
  useEffect(() => {
    if (activeFolioId) loadActiveFolio();
  }, [activeFolioId, loadActiveFolio]);

  // Refresh helper
  const refresh = async () => {
    await loadFolios();
    await loadActiveFolio();
  };

  // Auto-create folio if none exists
  const handleAutoCreate = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      await folioService.autoCreateFolio(bookingId);
      await loadFolios();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create folio');
    }
    setLoading(false);
  };

  // Add folio window
  const handleAddFolio = async () => {
    if (!bookingId) return;
    try {
      const res = await folioService.createFolio(bookingId, { folio_type: 'incidental' });
      await loadFolios();
      if (res.folio?.id) setActiveFolioId(res.folio.id);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to create folio');
    }
  };

  // ── Charge actions ────────────────────────────────────────────
  const handlePostCharge = async (data: any) => {
    if (!activeFolioId) return;
    await folioService.postCharge(bookingId, activeFolioId, data);
    await refresh();
  };

  const handleAdjustCharge = async (itemId: number, data: any) => {
    if (!activeFolioId) return;
    await folioService.adjustCharge(bookingId, activeFolioId, itemId, data);
    await refresh();
  };

  const handleVoidCharge = async (itemId: number) => {
    if (!activeFolioId) return;
    await folioService.voidCharge(bookingId, activeFolioId, itemId);
    await refresh();
  };

  const handleSplitCharge = async (itemId: number, splits: any[]) => {
    if (!activeFolioId) return;
    await folioService.splitCharge(bookingId, activeFolioId, itemId, splits);
    await refresh();
  };

  const handleTransferCharge = async (itemIds: number[], targetFolioId: number) => {
    await folioService.transferCharges(bookingId, { line_item_ids: itemIds, target_folio_id: targetFolioId });
    await refresh();
  };

  // ── Payment actions ───────────────────────────────────────────
  const handlePostPayment = async (data: any) => {
    if (!activeFolioId) return;
    await folioService.postPayment(bookingId, activeFolioId, data);
    await refresh();
  };

  const handlePostRefund = async (data: any) => {
    if (!activeFolioId) return;
    await folioService.postRefund(bookingId, activeFolioId, data);
    await refresh();
  };

  // ── Settle ────────────────────────────────────────────────────
  const handleSettle = async () => {
    if (!activeFolioId || !activeFolio) return;
    if (activeFolio.balance > 0) {
      alert(`Cannot settle — outstanding balance of ${formatCurrency(activeFolio.balance)}. Post a payment first.`);
      return;
    }
    if (!window.confirm('Settle and close this folio?')) return;
    try {
      await folioService.settleFolio(bookingId, activeFolioId);
      await refresh();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to settle folio');
    }
  };

  if (!booking) return null;

  // No folios — show initialize prompt
  const hasNoFolios = !loading && folios.length === 0;

  const drawerHeader = (
    <FolioHeader
      booking={booking}
      folios={folios}
      activeFolioId={activeFolioId}
      onSelectFolio={setActiveFolioId}
      onAddFolio={handleAddFolio}
    />
  );

  const drawerFooter = activeFolio && activeFolio.status === 'open' ? (
    <div className="flex items-center justify-between w-full">
      <div className="text-[13px]">
        <span className="text-neutral-500">Balance: </span>
        <span className={`font-bold ${activeFolio.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {formatCurrency(activeFolio.balance)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button
          variant="primary"
          onClick={handleSettle}
          disabled={activeFolio.balance > 0}
        >
          Settle Folio
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-end w-full">
      <Button variant="outline" onClick={onClose}>Close</Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      header={folios.length > 0 ? drawerHeader : undefined}
      title={folios.length === 0 ? 'Billing & Folio' : undefined}
      subtitle={folios.length === 0 ? `${booking?.guest} · Booking #${bookingId}` : undefined}
      maxWidth="max-w-4xl"
      footer={hasNoFolios ? undefined : drawerFooter}
      noPadding
    >
      {/* Loading */}
      {loading && folios.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-terra-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-neutral-400">Loading folio...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* No folio — Initialize */}
      {hasNoFolios && !error && (
        <div className="flex items-center justify-center py-20 px-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-neutral-900 mb-1">No Folio Found</h3>
            <p className="text-[13px] text-neutral-500 mb-6">
              Initialize a folio to start tracking charges and payments for this booking.
            </p>
            <Button variant="primary" onClick={handleAutoCreate}>
              Initialize Folio
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      {folios.length > 0 && (
        <div className="px-6 py-5 space-y-5">
          {/* Summary card */}
          <FolioSummaryCard folio={activeFolio} />

          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-neutral-200">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-[12px] font-medium transition-all duration-150 border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-terra-600 text-terra-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'charges' && (
            <ChargesTab
              folio={activeFolio}
              bookingId={bookingId}
              folios={folios}
              onRefresh={refresh}
              onPostCharge={handlePostCharge}
              onAdjustCharge={handleAdjustCharge}
              onVoidCharge={handleVoidCharge}
              onSplitCharge={handleSplitCharge}
              onTransferCharge={handleTransferCharge}
            />
          )}
          {activeTab === 'payments' && (
            <PaymentsTab
              folio={activeFolio}
              bookingId={bookingId}
              onRefresh={refresh}
              onPostPayment={handlePostPayment}
              onPostRefund={handlePostRefund}
            />
          )}
          {activeTab === 'statement' && (
            <StatementTab
              folio={activeFolio}
              bookingId={bookingId}
            />
          )}
          {activeTab === 'routing' && (
            <RoutingTab
              bookingId={bookingId}
              folios={folios}
            />
          )}
        </div>
      )}
    </Drawer>
  );
}
