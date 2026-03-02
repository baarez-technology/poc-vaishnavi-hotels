/**
 * PosClosurePage — POS outlet closure confirmation before night audit.
 * Card grid showing each outlet with confirm action.
 */

import { useState, useEffect, useCallback } from 'react';
import { Store, CheckCircle, Clock, Plus, RefreshCw } from 'lucide-react';
import { posClosureService, type PosClosureStatus } from '@/api/services/pos-closure.service';
import toast from 'react-hot-toast';

interface OutletStatus {
  outlet_id: number;
  outlet_code: string;
  outlet_name: string;
  audit_date: string;
  close_status: string;
  closing_revenue: number | null;
  open_checks: number | null;
  confirmed_by: number | null;
  confirmed_at: string | null;
}

export default function PosClosurePage() {
  const [status, setStatus] = useState<PosClosureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditDate, setAuditDate] = useState('');
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Per-outlet form state
  const [outletForms, setOutletForms] = useState<Record<number, { revenue: string; openChecks: string; notes: string }>>({});

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await posClosureService.getStatus(auditDate || undefined);
      setStatus(data);
    } catch {
      toast.error('Failed to load POS status');
    }
    setLoading(false);
  }, [auditDate]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await posClosureService.seedDefaults();
      toast.success('Default outlets created');
      fetchStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to seed');
    }
    setSeeding(false);
  };

  const handleConfirm = async (outletId: number) => {
    const form = outletForms[outletId] || { revenue: '', openChecks: '', notes: '' };
    setConfirmingId(outletId);
    try {
      await posClosureService.confirmOutlet(
        outletId,
        {
          closing_revenue: form.revenue ? parseFloat(form.revenue) : undefined,
          open_checks: form.openChecks ? parseInt(form.openChecks) : undefined,
          discrepancy_notes: form.notes || undefined,
        },
        auditDate || undefined
      );
      toast.success('Outlet confirmed');
      fetchStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to confirm');
    }
    setConfirmingId(null);
  };

  const updateForm = (outletId: number, field: string, value: string) => {
    setOutletForms(prev => ({
      ...prev,
      [outletId]: { ...(prev[outletId] || { revenue: '', openChecks: '', notes: '' }), [field]: value },
    }));
  };

  const outlets: OutletStatus[] = status?.outlets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <Store size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">POS Closure</h1>
            <p className="text-[12px] text-neutral-500">Confirm outlet closures before night audit</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={auditDate}
            onChange={e => setAuditDate(e.target.value)}
            className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-terra-500/30"
          />
          <button onClick={fetchStatus} className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50">
            <RefreshCw size={16} className="text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Summary */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Total Outlets</p>
            <p className="text-[22px] font-bold text-neutral-900 mt-1">{status.total_outlets}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Confirmed</p>
            <p className="text-[22px] font-bold text-emerald-600 mt-1">{status.confirmed}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Pending</p>
            <p className="text-[22px] font-bold text-amber-600 mt-1">{status.pending}</p>
          </div>
        </div>
      )}

      {/* All confirmed banner */}
      {status?.all_confirmed && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[13px] text-emerald-700 font-medium">
          <CheckCircle size={18} />
          All outlets confirmed — ready for night audit
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" />
        </div>
      )}

      {/* No outlets — seed button */}
      {!loading && outlets.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <Store size={40} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-[14px] text-neutral-600 mb-4">No POS outlets configured</p>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {seeding ? 'Seeding...' : 'Seed Default Outlets'}
          </button>
        </div>
      )}

      {/* Outlet Cards */}
      {!loading && outlets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map(outlet => {
            const isConfirmed = outlet.close_status === 'confirmed';
            const form = outletForms[outlet.outlet_id] || { revenue: '', openChecks: '', notes: '' };

            return (
              <div
                key={outlet.outlet_id}
                className={`bg-white rounded-xl border-2 p-5 transition-colors ${
                  isConfirmed ? 'border-emerald-300' : 'border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-neutral-900">{outlet.outlet_name}</h3>
                    <p className="text-[11px] text-neutral-500">{outlet.outlet_code}</p>
                  </div>
                  {isConfirmed ? (
                    <CheckCircle size={22} className="text-emerald-500" />
                  ) : (
                    <Clock size={22} className="text-amber-500" />
                  )}
                </div>

                {isConfirmed ? (
                  <div className="space-y-2 text-[12px]">
                    {outlet.closing_revenue != null && (
                      <p><span className="text-neutral-500">Revenue:</span> <span className="font-medium">{outlet.closing_revenue.toFixed(2)}</span></p>
                    )}
                    {outlet.open_checks != null && (
                      <p><span className="text-neutral-500">Open Checks:</span> <span className="font-medium">{outlet.open_checks}</span></p>
                    )}
                    {outlet.confirmed_at && (
                      <p className="text-neutral-400 text-[11px]">Confirmed: {new Date(outlet.confirmed_at).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500 mb-1">Closing Revenue</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.revenue}
                        onChange={e => updateForm(outlet.outlet_id, 'revenue', e.target.value)}
                        className="w-full px-3 py-1.5 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500 mb-1">Open Checks</label>
                      <input
                        type="number"
                        min={0}
                        value={form.openChecks}
                        onChange={e => updateForm(outlet.outlet_id, 'openChecks', e.target.value)}
                        className="w-full px-3 py-1.5 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500 mb-1">Discrepancy Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={e => updateForm(outlet.outlet_id, 'notes', e.target.value)}
                        className="w-full px-3 py-1.5 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30 min-h-[40px]"
                        placeholder="Optional notes..."
                      />
                    </div>
                    <button
                      onClick={() => handleConfirm(outlet.outlet_id)}
                      disabled={confirmingId === outlet.outlet_id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-terra-600 rounded-lg hover:bg-terra-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle size={15} />
                      {confirmingId === outlet.outlet_id ? 'Confirming...' : 'Confirm Closure'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
