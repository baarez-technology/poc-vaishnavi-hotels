/**
 * BulkMappingDrawer Component
 * Single-screen bulk room mapping: all PMS room types and OTA room type selectors in one view.
 * Uses GET /room-mappings/bulk-view and POST /room-mappings/bulk.
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Layers, ArrowRight, Check } from 'lucide-react';
import { channelManagerService } from '../../api/services/channel-manager.service';
import { useToast } from '../../contexts/ToastContext';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';

export default function BulkMappingDrawer({
  isOpen,
  onClose,
  otaCode,
  otaName,
  onSuccess,
}) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [localMappings, setLocalMappings] = useState<Record<number, string>>({});

  const fetchBulkView = async () => {
    if (!otaCode || !isOpen) return;
    setLoading(true);
    try {
      const res = await channelManagerService.getRoomMappingsBulkView(otaCode);
      setData(res);
      const init = (res.items || []).reduce(
        (acc, it) => ({ ...acc, [it.pmsRoomTypeId]: it.otaRoomType ?? '' }),
        {}
      );
      setLocalMappings(init);
    } catch (err) {
      console.error('Bulk view fetch error:', err);
      showError(err?.response?.data?.error || 'Failed to load bulk mapping data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && otaCode) {
      fetchBulkView();
    } else if (!isOpen) {
      setData(null);
      setLocalMappings({});
    }
  }, [isOpen, otaCode]);

  const items = data?.items ?? [];
  const knownOtaRoomTypes = data?.knownOtaRoomTypes ?? [];
  const datalistId = `bulk-ota-list-${otaCode}`;

  const setOtaFor = (pmsRoomTypeId: number, value: string) => {
    setLocalMappings((prev) => ({ ...prev, [pmsRoomTypeId]: value }));
  };

  const mappingsToSave = useMemo(() => {
    return items
      .filter((it) => {
        const v = (localMappings[it.pmsRoomTypeId] ?? '').trim();
        return v.length > 0;
      })
      .map((it) => ({
        pmsRoomTypeId: it.pmsRoomTypeId,
        otaRoomType: (localMappings[it.pmsRoomTypeId] ?? '').trim(),
      }));
  }, [items, localMappings]);

  const handleSave = async () => {
    if (mappingsToSave.length === 0) {
      showError('Add at least one OTA room type to save.');
      return;
    }
    setSaving(true);
    try {
      const result = await channelManagerService.bulkRoomMappings({
        otaCode,
        mappings: mappingsToSave,
      });
      const created = result?.created ?? 0;
      const updated = result?.updated ?? 0;
      const errs = result?.errors ?? [];
      if (errs.length > 0) {
        showError(errs.slice(0, 3).join('; ') + (errs.length > 3 ? '…' : ''));
      }
      if (created > 0 || updated > 0) {
        success(`Mappings saved: ${created} created, ${updated} updated.`);
        onSuccess?.();
        onClose();
      } else if (errs.length === 0) {
        success('No changes to save.');
        onClose();
      }
    } catch (err) {
      console.error('Bulk save error:', err);
      showError(err?.response?.data?.error || 'Failed to save bulk mappings');
    } finally {
      setSaving(false);
    }
  };

  const mappedCount = items.filter(
    (it) => ((localMappings[it.pmsRoomTypeId] ?? '').trim().length > 0)
  ).length;
  const totalCount = items.length;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Map Room Types"
      subtitle={otaName ? `${otaName} — map all room types in one screen` : otaCode}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-[13px] text-neutral-500">
            {mappedCount}/{totalCount} mapped
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={mappingsToSave.length === 0 || saving}
              loading={saving}
              className="px-5 py-2 text-[13px] font-semibold"
            >
              Save Mappings
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-terra-500 mb-4" />
          <p className="text-[13px] text-neutral-500">Loading room types…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
            <Layers className="w-7 h-7 text-neutral-400" />
          </div>
          <p className="text-[15px] font-medium text-neutral-800 mb-1">No room types</p>
          <p className="text-[13px] text-neutral-500">There are no PMS room types to map.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-terra-50 border border-terra-100 flex items-center gap-3">
            <Layers className="w-5 h-5 text-terra-600 flex-shrink-0" />
            <p className="text-[13px] text-terra-700">
              Map each hotel room type to an OTA room type. Choose from suggestions or type your own.
              Save once to apply all mappings.
            </p>
          </div>

          {/* Datalist for known OTA room types (shared across inputs) */}
          <datalist id={datalistId}>
            {knownOtaRoomTypes.map((k, i) => (
              <option key={i} value={k.otaRoomType} />
            ))}
          </datalist>

          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    PMS Room Type
                  </th>
                  <th className="w-8" aria-hidden />
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    OTA Room Type
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-right">
                    Base Price
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-right">
                    Inventory
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((it) => {
                  const val = localMappings[it.pmsRoomTypeId] ?? '';
                  const isMapped = val.trim().length > 0;
                  return (
                    <tr key={it.pmsRoomTypeId} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-neutral-500" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-neutral-900">
                              {it.pmsRoomType}
                            </p>
                            {it.pmsRoomCode && (
                              <p className="text-[11px] text-neutral-400">{it.pmsRoomCode}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="w-8 py-3">
                        <ArrowRight className="w-4 h-4 text-neutral-300" />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          list={datalistId}
                          value={val}
                          onChange={(e) => setOtaFor(it.pmsRoomTypeId, e.target.value)}
                          placeholder="Select or type OTA room type"
                          className="w-full max-w-[220px] h-9 px-3 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-500 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all"
                        />
                        {isMapped && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-sage-600">
                            <Check className="w-3 h-3" />
                            Mapped
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-neutral-600 tabular-nums">
                        {typeof it.basePrice === 'number' ? `$${it.basePrice}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-neutral-600 tabular-nums">
                        {typeof it.inventory === 'number' ? it.inventory : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Drawer>
  );
}
