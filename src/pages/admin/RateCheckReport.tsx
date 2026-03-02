/**
 * RateCheckReport — Compares actual rates vs standard room-type base price for checked-in bookings.
 */

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

interface RateRow {
  booking_id: number;
  booking_number: string;
  guest_name: string;
  room_number: string;
  room_type: string;
  nights: number;
  actual_rate: number;
  standard_rate: number;
  variance: number;
  variance_pct: number;
  flag: 'match' | 'discount' | 'surcharge';
  arrival_date: string | null;
  departure_date: string | null;
}

interface Summary {
  total_checked_in: number;
  matches: number;
  discounts: number;
  surcharges: number;
  avg_variance_pct: number;
}

function FlagBadge({ flag }: { flag: string }) {
  const colors: Record<string, string> = {
    match: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    discount: 'bg-amber-50 text-amber-700 border-amber-200',
    surcharge: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[flag] || colors.match}`}>
      {flag}
    </span>
  );
}

export default function RateCheckReport() {
  const [report, setReport] = useState<RateRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/bookings/rate-check-report');
      const data = res.data;
      setReport(Array.isArray(data.report) ? data.report : []);
      setSummary(data.summary || null);
    } catch {
      toast.error('Failed to load rate check report');
    }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, []);

  const filtered = useMemo(() => {
    let rows = report;
    if (flagFilter) rows = rows.filter(r => r.flag === flagFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.booking_number?.toLowerCase().includes(q) ||
        r.guest_name?.toLowerCase().includes(q) ||
        r.room_number?.toLowerCase().includes(q) ||
        r.room_type?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [report, search, flagFilter]);

  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const fmt = (v: number) => v.toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-50 rounded-xl flex items-center justify-center">
            <BarChart3 size={20} className="text-terra-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-neutral-900">Rate Check Report</h1>
            <p className="text-[12px] text-neutral-500">Actual vs standard rates for checked-in bookings</p>
          </div>
        </div>
        <button onClick={fetchReport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Checked-In', value: summary.total_checked_in, color: 'text-neutral-900' },
            { label: 'Matches', value: summary.matches, color: 'text-emerald-600' },
            { label: 'Discounts', value: summary.discounts, color: 'text-amber-600' },
            { label: 'Surcharges', value: summary.surcharges, color: 'text-red-600' },
            { label: 'Avg Variance', value: `${summary.avg_variance_pct}%`, color: 'text-neutral-900' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-neutral-200 px-4 py-3">
              <p className="text-[11px] font-medium text-neutral-500 uppercase">{c.label}</p>
              <p className={`text-[20px] font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input placeholder="Search bookings..." className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-500/30"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="px-3 py-2 text-[13px] border border-neutral-200 rounded-lg bg-white focus:outline-none"
          value={flagFilter} onChange={e => { setFlagFilter(e.target.value); setPage(1); }}>
          <option value="">All Flags</option>
          <option value="match">Match</option>
          <option value="discount">Discount</option>
          <option value="surcharge">Surcharge</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                {['Booking', 'Guest', 'Room', 'Type', 'Nights', 'Actual Rate', 'Std Rate', 'Variance', '%', 'Flag'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-neutral-200 border-t-terra-500 rounded-full animate-spin" /></div></td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-[13px] text-neutral-400">No data</td></tr>
              ) : paged.map(r => (
                <tr key={r.booking_id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3 text-[13px] font-mono font-bold text-neutral-900">{r.booking_number}</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700">{r.guest_name}</td>
                  <td className="px-4 py-3 text-[13px] font-mono text-neutral-700">{r.room_number}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{r.room_type}</td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600">{r.nights}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-neutral-900">{fmt(r.actual_rate)}</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-600">{fmt(r.standard_rate)}</td>
                  <td className={`px-4 py-3 text-[13px] font-semibold ${r.variance < 0 ? 'text-amber-600' : r.variance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {r.variance > 0 ? '+' : ''}{fmt(r.variance)}
                  </td>
                  <td className={`px-4 py-3 text-[12px] ${r.variance_pct < 0 ? 'text-amber-600' : r.variance_pct > 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                    {r.variance_pct > 0 ? '+' : ''}{r.variance_pct}%
                  </td>
                  <td className="px-4 py-3"><FlagBadge flag={r.flag} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <p className="text-[12px] text-neutral-500">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="px-2 text-[12px] text-neutral-600">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
