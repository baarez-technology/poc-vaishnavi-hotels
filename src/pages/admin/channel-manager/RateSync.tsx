/**
 * RateSync Page
 * Rate and inventory synchronization - Glimmora Design System v5.0
 * Consistent with OTAConnections and RoomMapping pages
 */

import { useState } from 'react';
import {
  RefreshCw, Upload, Download, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { useChannelManager } from '../../../context/ChannelManagerContext';
import RateSyncCalendar from '../../../components/channel-manager/RateSyncCalendar';
import { Button } from '../../../components/ui2/Button';

export default function RateSync() {
  const {
    otas,
    rateCalendar,
    syncingOTAs,
    pushRatesToOTAs,
    syncRatesToAllOTAs,
    getChannelStats
  } = useChannelManager();

  const [isPushing, setIsPushing] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);

  const connectedOTAs = otas.filter(o => o.status === 'connected');
  const stats = getChannelStats();

  const handlePushRates = async () => {
    setIsPushing(true);
    await pushRatesToOTAs();
    setIsPushing(false);
  };

  const handleSyncAll = async () => {
    await syncRatesToAllOTAs();
  };

  // Calculate rate parity issues
  const calculateParityIssues = () => {
    let issues = 0;
    Object.values(rateCalendar).forEach(dayData => {
      Object.values(dayData).forEach(roomData => {
        if (roomData.otaRates) {
          const rates = Object.values(roomData.otaRates);
          const baseRate = roomData.rates?.BAR;
          if (rates.some(r => Math.abs(r - baseRate) >= baseRate * 0.1)) {
            issues++;
          }
        }
      });
    });
    return issues;
  };

  const parityIssues = calculateParityIssues();

  // KPI cards configuration - 4 cards like other pages
  const kpiCards = [
    {
      icon: DollarSign,
      title: 'Avg Daily Rate',
      value: `$${stats.avgRate || 185}`,
      accent: 'sage'
    },
    {
      icon: TrendingUp,
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate || 78}%`,
      accent: 'terra'
    },
    {
      icon: Globe,
      title: 'Active Channels',
      value: connectedOTAs.length,
      accent: 'sage'
    },
    {
      icon: parityIssues > 0 ? AlertTriangle : CheckCircle,
      title: 'Parity Issues',
      value: parityIssues,
      accent: parityIssues > 0 ? 'gold' : 'sage'
    }
  ];

  const accentColors = {
    terra: { icon: 'bg-terra-100 text-terra-600' },
    sage: { icon: 'bg-sage-100 text-sage-600' },
    gold: { icon: 'bg-gold-100 text-gold-600' },
    rose: { icon: 'bg-rose-100 text-rose-600' },
    neutral: { icon: 'bg-neutral-100 text-neutral-500' }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-6 space-y-6">

        {/* Page Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Rate & Inventory Sync
            </h1>
            <p className="text-[13px] text-neutral-500 mt-1">
              Manage rates and availability across all connected OTAs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={Download}
              onClick={handleSyncAll}
              disabled={syncingOTAs.length > 0}
              loading={syncingOTAs.length > 0}
            >
              Pull from OTAs
            </Button>
            <Button
              variant="primary"
              icon={Upload}
              onClick={handlePushRates}
              disabled={isPushing}
              loading={isPushing}
            >
              Push to OTAs
            </Button>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi, index) => {
            const colors = accentColors[kpi.accent];
            return (
              <div key={index} className="rounded-[10px] bg-white p-6">
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
                <p className="text-[28px] font-semibold tracking-tight text-neutral-900">
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* AI Insights Card */}
        {parityIssues > 0 && (
          <section className="rounded-[10px] bg-white overflow-hidden">
            <button
              onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
              className="w-full px-6 py-5 flex items-center justify-between transition-colors hover:bg-neutral-50/50"
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    AI Rate Insights
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-gold-100 text-gold-700">
                    Smart
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                  {parityIssues} parity issue{parityIssues !== 1 ? 's' : ''} detected
                </p>
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
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gold-50/50">
                  <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-gold-700">Rate Parity Warning</p>
                    <p className="text-[11px] mt-0.5 text-neutral-500 font-medium">
                      {parityIssues} date/room combinations have rate differences exceeding 10%. This may impact your OTA rankings.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-sage-50/50">
                  <div className="w-2 h-2 rounded-full bg-sage-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-sage-700">Recommendation</p>
                    <p className="text-[11px] mt-0.5 text-neutral-500 font-medium">
                      Review your BAR rates and sync to all channels to maintain rate parity and protect your OTA rankings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Connected OTAs Status */}
        <section className="rounded-[10px] bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-4">
            Syncing To
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {connectedOTAs.map(ota => (
              <div
                key={ota.code}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: ota.color }}
                >
                  {ota.name.substring(0, 1)}
                </div>
                <span>{ota.name}</span>
                {syncingOTAs.includes(ota.code) && (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                )}
              </div>
            ))}
            {connectedOTAs.length === 0 && (
              <span className="text-[13px] text-neutral-400 italic">No OTAs connected</span>
            )}
          </div>
        </section>

        {/* Rate Calendar */}
        <section className="space-y-4">
          <RateSyncCalendar />
        </section>
      </div>
    </div>
  );
}
