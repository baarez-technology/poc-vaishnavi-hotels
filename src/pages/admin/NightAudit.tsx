/**
 * NightAudit — Run night audit, view business date & pre-audit checklist
 */

import { useState, useEffect, useCallback } from 'react';
import { Moon, Calendar, Clock, AlertTriangle, CheckCircle2, Loader2, ArrowRight, Users, FileText, Settings } from 'lucide-react';
import { frontdeskService } from '@/api/services/frontdesk.service';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui2/Button';
import toast from 'react-hot-toast';

interface AuditResult {
  audit_date?: string;
  status?: string;
  new_business_date?: string;
  occupancy_rate?: number;
  in_house?: number;
  total_rooms?: number;
  ooo_rooms?: number;
  arrivals?: number;
  departures?: number;
  no_shows?: number;
  auto_checkouts?: number;
  room_charges_posted?: number;
  room_charge_revenue?: number;
  revenue?: {
    room?: number;
    fnb?: number;
    other?: number;
    tax?: number;
    total?: number;
    payments_received?: number;
  };
  statistics?: {
    adr?: number;
    revpar?: number;
  };
  rooms_set_dirty?: number;
  rooms_returned_from_ooo?: number;
  expired_auth_holds?: number;
  ar_postings_aged?: number;
  blockers_resolved?: Array<{
    type: string;
    count: number;
    auto_resolved?: boolean;
    message: string;
    bookings?: Array<{ id: number; guest_name: string; room?: string }>;
  }>;
  charge_errors?: string[];
  notes?: string;
  procedure_log?: Array<{
    step: string;
    status: string;
    detail: string;
    count: number;
    timestamp: string;
  }>;
  // Fallback for error display
  message?: string;
  warnings?: string[];
}

export default function NightAudit() {
  const [businessDate, setBusinessDate] = useState<string>('');
  const [config, setConfig] = useState<any>(null);
  const [pendingDepartures, setPendingDepartures] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showCutoffEdit, setShowCutoffEdit] = useState(false);
  const [editCutoff, setEditCutoff] = useState('03:00');
  const [savingCutoff, setSavingCutoff] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bdRes, configRes, depRes] = await Promise.all([
        frontdeskService.getBusinessDate().catch(() => null),
        frontdeskService.getHotelConfig().catch(() => null),
        frontdeskService.getDepartures().catch(() => []),
      ]);

      if (bdRes?.business_date) {
        setBusinessDate(bdRes.business_date);
      } else if (typeof bdRes === 'string') {
        setBusinessDate(bdRes);
      }

      setConfig(configRes);

      const deps = Array.isArray(depRes) ? depRes : (depRes?.data || []);
      setPendingDepartures(Array.isArray(deps) ? deps.length : 0);
    } catch (err) {
      console.error('Failed to load night audit data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getNextDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleRunAudit = async () => {
    setShowConfirm(false);
    setRunning(true);
    setResult(null);
    try {
      const res = await frontdeskService.runNightAudit();
      setResult(res);
      toast.success('Night audit completed successfully');
      // Refresh data
      await fetchData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Night audit failed';
      toast.error(detail);
      setResult({ message: detail, warnings: [detail] });
    } finally {
      setRunning(false);
    }
  };

  const handleSaveCutoff = async () => {
    setSavingCutoff(true);
    try {
      await apiClient.put('/api/v1/config', { night_audit_cutoff: editCutoff });
      setConfig((prev: any) => ({ ...prev, night_audit_cutoff: editCutoff }));
      setShowCutoffEdit(false);
      toast.success(`Audit cutoff updated to ${editCutoff}`);
    } catch {
      toast.error('Failed to update cutoff time');
    } finally {
      setSavingCutoff(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Night Audit</h1>
              <p className="text-[12px] text-neutral-500">Post room charges and advance the business date</p>
            </div>
          </div>
        </header>

        {/* Business Date Card */}
        <div className="bg-white rounded-xl border border-neutral-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Current Business Date</p>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="text-2xl font-bold text-neutral-900">
                  {formatDate(businessDate)}
                </span>
              </div>
              {config?.night_audit_cutoff && (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-neutral-500">
                  <Clock className="w-3.5 h-3.5" />
                  Audit cutoff: {config.night_audit_cutoff}
                  <button
                    onClick={() => { setEditCutoff(config.night_audit_cutoff); setShowCutoffEdit(true); }}
                    className="ml-1 text-[11px] text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[12px] font-semibold border border-amber-200">
                <Calendar className="w-3.5 h-3.5" />
                {businessDate || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Pre-Audit Checklist */}
        <div className="bg-white rounded-xl border border-neutral-100 p-6 mb-6">
          <h2 className="text-[14px] font-semibold text-neutral-900 mb-4">Pre-Audit Checklist</h2>
          <div className="space-y-3">
            {/* Pending Departures */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-neutral-500" />
                <span className="text-[13px] text-neutral-700">Pending Departures (today)</span>
              </div>
              <span className={`text-[13px] font-semibold ${pendingDepartures > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingDepartures > 0 ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {pendingDepartures} pending
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All clear
                  </span>
                )}
              </span>
            </div>

            {/* Business Date */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-neutral-500" />
                <span className="text-[13px] text-neutral-700">Business date will advance to</span>
              </div>
              <span className="text-[13px] font-semibold text-indigo-600 flex items-center gap-1">
                {businessDate}
                <ArrowRight className="w-3 h-3" />
                {getNextDate(businessDate)}
              </span>
            </div>
          </div>

          {pendingDepartures > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[12px] text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                There are {pendingDepartures} pending departures. These guests should be checked out before running the night audit.
              </p>
            </div>
          )}
        </div>

        {/* Run Audit Button */}
        <div className="bg-white rounded-xl border border-neutral-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-neutral-900">Run Night Audit</h2>
              <p className="text-[12px] text-neutral-500 mt-1">
                Posts room charges for all in-house guests and advances the business date
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowConfirm(true)}
              disabled={running}
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Running Audit...
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-1.5" />
                  Run Night Audit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-neutral-900">Confirm Night Audit</h3>
                </div>
                <p className="text-[13px] text-neutral-600 mb-2">
                  This will:
                </p>
                <ul className="text-[12px] text-neutral-600 space-y-1.5 mb-4 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400 mt-0.5">1.</span>
                    Mark unresolved arrivals as <strong>No-Show</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400 mt-0.5">2.</span>
                    Auto-checkout overdue departures
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400 mt-0.5">3.</span>
                    Post nightly room charges (with tax) for all in-house guests
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400 mt-0.5">4.</span>
                    Sync room statuses (occupied rooms → dirty for housekeeping)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400 mt-0.5">5.</span>
                    Return OOO rooms past return date, update AR aging, flag expired holds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-400 mt-0.5">6.</span>
                    Calculate statistics (ADR, RevPAR) and advance business date to <strong>{getNextDate(businessDate)}</strong>
                  </li>
                </ul>
                <p className="text-[12px] text-amber-600 font-medium">
                  This action cannot be undone. Proceed?
                </p>
              </div>
              <div className="px-6 py-4 bg-neutral-50 rounded-b-xl flex justify-end gap-2">
                <Button variant="outline-neutral" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleRunAudit}>
                  <Moon className="w-4 h-4 mr-1.5" />
                  Confirm &amp; Run
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cutoff Edit Modal (B-15) */}
        {showCutoffEdit && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCutoffEdit(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-neutral-900">Night Audit Cutoff</h3>
                </div>
                <p className="text-[12px] text-neutral-500 mb-4">
                  Set the time after which the night audit should run. The system will use this as the operational cutoff.
                </p>
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Cutoff Time</label>
                  <input
                    type="time"
                    value={editCutoff}
                    onChange={e => setEditCutoff(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-[14px] bg-white border border-neutral-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-50 rounded-b-xl flex justify-end gap-2">
                <Button variant="outline-neutral" onClick={() => setShowCutoffEdit(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveCutoff} disabled={savingCutoff}>
                  {savingCutoff ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Success / Error Banner */}
            <div className={`rounded-xl border p-6 ${
              result.status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
              result.warnings?.length ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <h2 className="text-[14px] font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                {result.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                Audit Results {result.audit_date ? `— ${result.audit_date}` : ''}
              </h2>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {result.new_business_date && (
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase">New Business Date</p>
                    <p className="text-[15px] font-bold text-indigo-700 mt-0.5">{result.new_business_date}</p>
                  </div>
                )}
                {typeof result.room_charges_posted === 'number' && (
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase">Charges Posted</p>
                    <p className="text-[15px] font-bold text-neutral-900 mt-0.5">{result.room_charges_posted}</p>
                  </div>
                )}
                {typeof result.room_charge_revenue === 'number' && (
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase">Revenue (incl. tax)</p>
                    <p className="text-[15px] font-bold text-emerald-700 mt-0.5">₹{result.room_charge_revenue.toLocaleString()}</p>
                  </div>
                )}
                {typeof result.occupancy_rate === 'number' && (
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase">Occupancy</p>
                    <p className="text-[15px] font-bold text-neutral-900 mt-0.5">{result.occupancy_rate.toFixed(1)}%</p>
                  </div>
                )}
              </div>

              {/* Detail Rows */}
              <div className="space-y-1.5 text-[12px]">
                {typeof result.in_house === 'number' && (
                  <div className="flex justify-between"><span className="text-neutral-600">In-house guests</span><span className="font-medium">{result.in_house}</span></div>
                )}
                {typeof result.arrivals === 'number' && (
                  <div className="flex justify-between"><span className="text-neutral-600">Arrivals</span><span className="font-medium">{result.arrivals}</span></div>
                )}
                {typeof result.departures === 'number' && (
                  <div className="flex justify-between"><span className="text-neutral-600">Departures</span><span className="font-medium">{result.departures}</span></div>
                )}
                {typeof result.no_shows === 'number' && result.no_shows > 0 && (
                  <div className="flex justify-between"><span className="text-amber-700">No-shows marked</span><span className="font-medium text-amber-700">{result.no_shows}</span></div>
                )}
                {typeof result.auto_checkouts === 'number' && result.auto_checkouts > 0 && (
                  <div className="flex justify-between"><span className="text-amber-700">Auto-checkouts</span><span className="font-medium text-amber-700">{result.auto_checkouts}</span></div>
                )}
                {typeof result.rooms_set_dirty === 'number' && result.rooms_set_dirty > 0 && (
                  <div className="flex justify-between"><span className="text-neutral-600">Rooms set to dirty</span><span className="font-medium">{result.rooms_set_dirty}</span></div>
                )}
                {typeof result.rooms_returned_from_ooo === 'number' && result.rooms_returned_from_ooo > 0 && (
                  <div className="flex justify-between"><span className="text-neutral-600">Rooms returned from OOO</span><span className="font-medium">{result.rooms_returned_from_ooo}</span></div>
                )}
                {typeof result.expired_auth_holds === 'number' && result.expired_auth_holds > 0 && (
                  <div className="flex justify-between"><span className="text-amber-700">Expired auth holds flagged</span><span className="font-medium text-amber-700">{result.expired_auth_holds}</span></div>
                )}
                {typeof result.ar_postings_aged === 'number' && result.ar_postings_aged > 0 && (
                  <div className="flex justify-between"><span className="text-neutral-600">AR postings aged to overdue</span><span className="font-medium">{result.ar_postings_aged}</span></div>
                )}
              </div>
            </div>

            {/* Revenue Breakdown (Opera-style) */}
            {result.revenue && typeof result.revenue === 'object' && (
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <h3 className="text-[13px] font-semibold text-neutral-900 mb-3">Revenue Summary</h3>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between"><span className="text-neutral-600">Room Revenue</span><span className="font-medium">₹{(result.revenue.room || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-600">F&B Revenue</span><span className="font-medium">₹{(result.revenue.fnb || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-600">Other Revenue</span><span className="font-medium">₹{(result.revenue.other || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between border-t border-neutral-100 pt-1.5 mt-1.5">
                    <span className="text-neutral-900 font-semibold">Total Revenue</span>
                    <span className="font-bold text-emerald-700">₹{(result.revenue.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-neutral-600">Tax Collected</span><span className="font-medium">₹{(result.revenue.tax || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-600">Payments Received</span><span className="font-medium">₹{(result.revenue.payments_received || 0).toLocaleString()}</span></div>
                </div>
              </div>
            )}

            {/* Statistics (ADR, RevPAR) */}
            {result.statistics && (result.statistics.adr || result.statistics.revpar) ? (
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <h3 className="text-[13px] font-semibold text-neutral-900 mb-3">Key Performance Indicators</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase">ADR</p>
                    <p className="text-[15px] font-bold text-neutral-900 mt-0.5">₹{(result.statistics.adr || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-neutral-400">Avg Daily Rate</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase">RevPAR</p>
                    <p className="text-[15px] font-bold text-neutral-900 mt-0.5">₹{(result.statistics.revpar || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-neutral-400">Rev Per Available Room</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Blockers Resolved */}
            {result.blockers_resolved && result.blockers_resolved.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="text-[13px] font-semibold text-amber-800 mb-3">Blockers Resolved</h3>
                {result.blockers_resolved.map((b, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] text-amber-700 font-medium">{b.message}</p>
                      {b.auto_resolved && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">auto</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charge Errors */}
            {result.charge_errors && result.charge_errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <h3 className="text-[13px] font-semibold text-red-800 mb-2">Charge Posting Errors</h3>
                {result.charge_errors.map((err, i) => (
                  <p key={i} className="text-[12px] text-red-700 flex items-start gap-1.5 mb-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {err}
                  </p>
                ))}
              </div>
            )}

            {/* Fallback for plain error messages */}
            {result.message && !result.status && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <p className="text-[13px] text-red-700">{result.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
