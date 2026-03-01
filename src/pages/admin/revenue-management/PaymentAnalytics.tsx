import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,

  Download,
  FileText,
  BarChart3,
  Table2,
  ArrowUpDown,
  Banknote,
  Wallet,
  Smartphone,
  Globe,
  Building2,
  BedDouble,
  Star,
  DollarSign,
  Lightbulb,
  CalendarDays,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { jsPDF } from 'jspdf';
import { bookingService } from '../../../api/services/booking.service';
import { dashboardsService, FinanceDashboard } from '../../../api/services/dashboards.service';
import { reportsService, RevenueByRoomType } from '../../../api/services/reports.service';
import { useCurrency } from '../../../hooks/useCurrency';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/ui2/Button';
import { DropdownMenu, DropdownMenuItem } from '../../../components/ui2/DropdownMenu';
import { DatePicker } from '../../../components/ui2/DatePicker';

// ── Design System Colors ──
const PAYMENT_MODE_COLORS: Record<string, string> = {
  Card: '#4E5840', Cash: '#A57865', UPI: '#5C9BA4', Online: '#CDB261',
  'Bank Transfer': '#C8B29D', 'Pay at Hotel': '#8B7355',
};
const COLOR_LIST = ['#4E5840', '#A57865', '#5C9BA4', '#CDB261', '#7B6B8D', '#C47D5A', '#5A7C65', '#B8936A', '#6A8FA8', '#9C7C5C'];

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  Card: CreditCard, Cash: Banknote, UPI: Smartphone, Online: Globe,
  'Bank Transfer': Wallet, 'Pay at Hotel': Banknote,
};

// ── Skeleton ──
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200/60 rounded-lg ${className}`} />;
}

function KPISkeleton() {
  return (
    <div className="rounded-[10px] bg-white p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-28 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// ── Helpers ──
const normalizePaymentMethod = (method: string): string => {
  const lower = (method || '').toLowerCase().trim();
  if (!lower) return '';
  if (lower === 'cash') return 'Cash';
  if (['card', 'credit_card', 'debit_card', 'credit card', 'debit card'].includes(lower)) return 'Card';
  if (lower === 'upi') return 'UPI';
  if (['online', 'net_banking', 'net banking', 'wallet'].includes(lower)) return 'Online';
  if (['bank_transfer', 'bank transfer'].includes(lower)) return 'Bank Transfer';
  if (['pay_at_hotel', 'pay at hotel'].includes(lower)) return 'Pay at Hotel';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

type SortDir = 'asc' | 'desc';
type ActiveTab = 'payment' | 'roomtype';

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const PaymentAnalytics = () => {
  const toast = useToast();
  const { symbol } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: ActiveTab = (searchParams.get('tab') as ActiveTab) || 'payment';
  const setActiveTab = (tab: ActiveTab) => setSearchParams({ tab }, { replace: true });

  // ── Shared State ──
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<FinanceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // ── Payment Filters ──
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  // ── Payment Sort ──
  const [paySortField, setPaySortField] = useState<string>('amount');
  const [paySortDir, setPaySortDir] = useState<SortDir>('desc');

  // ── Room Type State ──
  const [roomTypeData, setRoomTypeData] = useState<RevenueByRoomType[]>([]);
  const [roomTypeLoading, setRoomTypeLoading] = useState(true);
  const [roomTimePeriod, setRoomTimePeriod] = useState<string>('last_30_days');
  const [roomSortField, setRoomSortField] = useState<string>('revenue');
  const [roomSortDir, setRoomSortDir] = useState<SortDir>('desc');

  // ── Fetch Data ──
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [finance, bookingsRes] = await Promise.all([
          dashboardsService.getFinanceDashboard().catch(() => null),
          bookingService.getBookings(1, 500).catch(() => null),
        ]);
        setFinanceData(finance);
        setAllBookings(bookingsRes?.items || (Array.isArray(bookingsRes) ? bookingsRes : []));
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoomTypeData = useCallback(async (period: string) => {
    setRoomTypeLoading(true);
    try {
      const report = await reportsService.getRevenueSnapshotReport(period);
      setRoomTypeData(report?.revenue_by_room_type || []);
    } catch (err) {
      console.error('Failed to fetch room type revenue:', err);
    } finally {
      setRoomTypeLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoomTypeData(roomTimePeriod); }, [roomTimePeriod, fetchRoomTypeData]);

  // ═══════════════════════════════════════════════
  // PAYMENT COMPUTATIONS
  // ═══════════════════════════════════════════════
  const paymentModeData = useMemo(() => {
    const modeMap: Record<string, { amount: number; count: number }> = {};

    if (financeData?.payment_methods && Object.keys(financeData.payment_methods).length > 0) {
      for (const [method, amount] of Object.entries(financeData.payment_methods)) {
        const mode = normalizePaymentMethod(method);
        if (mode) { if (!modeMap[mode]) modeMap[mode] = { amount: 0, count: 0 }; modeMap[mode].amount += amount || 0; }
      }
      for (const b of allBookings) {
        const method = normalizePaymentMethod(b.paymentMethod || b.payment_method || '');
        if (method && modeMap[method]) modeMap[method].count++;
      }
    } else if (allBookings.length > 0) {
      for (const b of allBookings) {
        const method = normalizePaymentMethod(b.paymentMethod || b.payment_method || '');
        const amount = b.totalPrice || b.total_price || b.total_amount || b.amount || 0;
        if (method) { if (!modeMap[method]) modeMap[method] = { amount: 0, count: 0 }; modeMap[method].amount += amount; modeMap[method].count++; }
      }
    }

    const total = Object.values(modeMap).reduce((s, v) => s + v.amount, 0);
    const totalCount = Object.values(modeMap).reduce((s, v) => s + v.count, 0);
    const entries = Object.entries(modeMap).sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, data], i) => ({
        name, amount: Math.round(data.amount), count: data.count,
        avgTransaction: data.count > 0 ? Math.round(data.amount / data.count) : 0,
        percent: total > 0 ? parseFloat(((data.amount / total) * 100).toFixed(1)) : 0,
        color: PAYMENT_MODE_COLORS[name] || COLOR_LIST[i % COLOR_LIST.length],
      }));
    return entries.length > 0 ? entries : [
      { name: 'Cash', amount: 0, count: 0, avgTransaction: 0, percent: 0, color: '#A57865' },
      { name: 'Card', amount: 0, count: 0, avgTransaction: 0, percent: 0, color: '#4E5840' },
      { name: 'UPI', amount: 0, count: 0, avgTransaction: 0, percent: 0, color: '#5C9BA4' },
      { name: 'Online', amount: 0, count: 0, avgTransaction: 0, percent: 0, color: '#CDB261' },
    ];
  }, [financeData, allBookings]);

  // Date-filtered
  const filteredPaymentData = useMemo(() => {
    if (!dateFrom && !dateTo) return paymentModeData;
    const modeMap: Record<string, { amount: number; count: number }> = {};
    for (const b of allBookings) {
      const ds = (b.checkIn || b.check_in || b.created_at || '').slice(0, 10);
      if (!ds || (dateFrom && ds < dateFrom) || (dateTo && ds > dateTo)) continue;
      const method = normalizePaymentMethod(b.paymentMethod || b.payment_method || '');
      if (!method) continue;
      const amount = b.totalPrice || b.total_price || b.total_amount || b.amount || 0;
      if (!modeMap[method]) modeMap[method] = { amount: 0, count: 0 };
      modeMap[method].amount += amount; modeMap[method].count++;
    }
    const total = Object.values(modeMap).reduce((s, v) => s + v.amount, 0);
    const entries = Object.entries(modeMap).sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, data], i) => ({
        name, amount: Math.round(data.amount), count: data.count,
        avgTransaction: data.count > 0 ? Math.round(data.amount / data.count) : 0,
        percent: total > 0 ? parseFloat(((data.amount / total) * 100).toFixed(1)) : 0,
        color: PAYMENT_MODE_COLORS[name] || COLOR_LIST[i % COLOR_LIST.length],
      }));
    return entries.length > 0 ? entries : paymentModeData;
  }, [paymentModeData, allBookings, dateFrom, dateTo]);

  const filteredTotal = filteredPaymentData.reduce((s, d) => s + d.amount, 0);
  const filteredTxns = filteredPaymentData.reduce((s, d) => s + d.count, 0);

  // Daily trend
  const dailyTrendData = useMemo(() => {
    if (allBookings.length === 0) return [];
    const dayMap: Record<string, Record<string, number>> = {};
    for (const b of allBookings) {
      const ds = (b.checkIn || b.check_in || b.created_at || '').slice(0, 10);
      if (!ds || (dateFrom && ds < dateFrom) || (dateTo && ds > dateTo)) continue;
      const method = normalizePaymentMethod(b.paymentMethod || b.payment_method || '');
      if (!method || (selectedMethod !== 'all' && method !== selectedMethod)) continue;
      const amount = b.totalPrice || b.total_price || b.total_amount || b.amount || 0;
      if (!dayMap[ds]) dayMap[ds] = {};
      dayMap[ds][method] = (dayMap[ds][method] || 0) + amount;
    }
    const methods = selectedMethod === 'all' ? filteredPaymentData.map(d => d.name) : [selectedMethod];
    const sorted = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));
    const sliced = (!dateFrom && !dateTo) ? sorted.slice(-30) : sorted;
    return sliced.map(([date, modes]) => {
      const entry: any = { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      for (const m of methods) entry[m] = Math.round(modes[m] || 0);
      return entry;
    });
  }, [allBookings, filteredPaymentData, dateFrom, dateTo, selectedMethod]);

  // Payment insight
  const paymentInsight = useMemo(() => {
    if (filteredPaymentData.length === 0 || filteredTotal === 0) return null;
    const top = filteredPaymentData[0];
    if (!top || top.amount === 0) return null;
    return `${top.name} is the dominant payment method at ${top.percent}% of revenue (${symbol}${top.amount.toLocaleString()}). ${
      filteredPaymentData.length > 1 && filteredPaymentData[1].percent > 20
        ? `${filteredPaymentData[1].name} follows at ${filteredPaymentData[1].percent}%.`
        : ''
    }`;
  }, [filteredPaymentData, filteredTotal, symbol]);

  // Sort
  const togglePaySort = (field: string) => {
    if (paySortField === field) setPaySortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setPaySortField(field); setPaySortDir('desc'); }
  };

  const sortedPayData = useMemo(() => {
    const data = [...filteredPaymentData];
    data.sort((a: any, b: any) => {
      const va = a[paySortField]; const vb = b[paySortField];
      if (typeof va === 'string') return paySortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return paySortDir === 'asc' ? va - vb : vb - va;
    });
    return data;
  }, [filteredPaymentData, paySortField, paySortDir]);

  const payMethods = selectedMethod === 'all' ? filteredPaymentData : filteredPaymentData.filter(d => d.name === selectedMethod);

  // ═══════════════════════════════════════════════
  // ROOM TYPE COMPUTATIONS
  // ═══════════════════════════════════════════════
  const roomTypeChartData = useMemo(() => {
    if (!roomTypeData.length) return [];
    const total = roomTypeData.reduce((s, r) => s + r.revenue, 0);
    return roomTypeData.sort((a, b) => b.revenue - a.revenue).map((rt, i) => ({
      name: rt.name, revenue: Math.round(rt.revenue), rooms: rt.rooms, adr: Math.round(rt.adr),
      percent: total > 0 ? parseFloat(((rt.revenue / total) * 100).toFixed(1)) : 0,
      color: COLOR_LIST[i % COLOR_LIST.length],
    }));
  }, [roomTypeData]);

  const totalRoomRevenue = roomTypeChartData.reduce((s, r) => s + r.revenue, 0);
  const totalRoomsSold = roomTypeChartData.reduce((s, r) => s + r.rooms, 0);
  const topRoom = roomTypeChartData[0];
  const highestADR = roomTypeChartData.length > 0 ? Math.max(...roomTypeChartData.map(r => r.adr)) : 0;

  // Room type trend
  const roomTrendData = useMemo(() => {
    if (allBookings.length === 0 || roomTypeChartData.length === 0) return [];
    const dayMap: Record<string, Record<string, number>> = {};
    for (const b of allBookings) {
      const ds = (b.checkIn || b.check_in || b.created_at || '').slice(0, 10);
      if (!ds) continue;
      const rn = b.roomType || b.room_type || b.room?.name || b.room?.category || '';
      if (!rn) continue;
      const amount = b.totalPrice || b.total_price || b.total_amount || b.amount || 0;
      if (!dayMap[ds]) dayMap[ds] = {};
      dayMap[ds][rn] = (dayMap[ds][rn] || 0) + amount;
    }
    const names = roomTypeChartData.map(r => r.name);
    return Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, rooms]) => {
      const entry: any = { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      for (const n of names) entry[n] = Math.round(rooms[n] || 0);
      return entry;
    });
  }, [allBookings, roomTypeChartData]);

  // Room insight
  const roomInsight = useMemo(() => {
    if (roomTypeChartData.length === 0 || totalRoomRevenue === 0) return null;
    const top = roomTypeChartData[0];
    const avgADR = totalRoomsSold > 0 ? Math.round(totalRoomRevenue / totalRoomsSold) : 0;
    return `${top.name} leads with ${top.percent}% of room revenue (${symbol}${top.revenue.toLocaleString()}). Average ADR across all types is ${symbol}${avgADR.toLocaleString()}.`;
  }, [roomTypeChartData, totalRoomRevenue, totalRoomsSold, symbol]);

  // Sort
  const toggleRoomSort = (field: string) => {
    if (roomSortField === field) setRoomSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setRoomSortField(field); setRoomSortDir('desc'); }
  };

  const sortedRoomData = useMemo(() => {
    const data = [...roomTypeChartData];
    data.sort((a: any, b: any) => {
      const va = a[roomSortField]; const vb = b[roomSortField];
      if (typeof va === 'string') return roomSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return roomSortDir === 'asc' ? va - vb : vb - va;
    });
    return data;
  }, [roomTypeChartData, roomSortField, roomSortDir]);

  // ── Export ──
  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      if (format === 'pdf') {
        const doc = new jsPDF();
        const pw = doc.internal.pageSize.getWidth();
        let y = 20;
        doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text('Revenue Analytics Report', pw / 2, y, { align: 'center' }); y += 10;
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, y, { align: 'center' }); y += 15;

        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
        doc.text('Revenue by Payment Method', 14, y); y += 7;
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Method', 14, y); doc.text('Revenue', 65, y); doc.text('Txns', 105, y); doc.text('Avg Txn', 135, y); doc.text('Share', 170, y); y += 5;
        doc.setFont('helvetica', 'normal');
        sortedPayData.forEach(r => { doc.text(r.name, 14, y); doc.text(`${symbol}${r.amount.toLocaleString()}`, 65, y); doc.text(String(r.count), 105, y); doc.text(`${symbol}${r.avgTransaction.toLocaleString()}`, 135, y); doc.text(`${r.percent}%`, 170, y); y += 5; });
        y += 8;
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Revenue by Room Type', 14, y); y += 7;
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Room Type', 14, y); doc.text('Revenue', 75, y); doc.text('Rooms', 115, y); doc.text('ADR', 145, y); doc.text('Share', 170, y); y += 5;
        doc.setFont('helvetica', 'normal');
        sortedRoomData.forEach(r => { if (y > 270) { doc.addPage(); y = 20; } doc.text(r.name, 14, y); doc.text(`${symbol}${r.revenue.toLocaleString()}`, 75, y); doc.text(String(r.rooms), 115, y); doc.text(`${symbol}${r.adr.toLocaleString()}`, 145, y); doc.text(`${r.percent}%`, 170, y); y += 5; });

        doc.save(`revenue-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Exported as PDF');
      } else {
        const rows: string[] = ['Revenue Analytics Report', `Generated:,${new Date().toLocaleString()}`, '',
          'REVENUE BY PAYMENT METHOD', 'Method,Revenue,Transactions,Avg Transaction,Share'];
        sortedPayData.forEach(r => rows.push(`${r.name},${r.amount},${r.count},${r.avgTransaction},${r.percent}%`));
        rows.push('', 'REVENUE BY ROOM TYPE', 'Room Type,Revenue,Rooms Sold,ADR,Share');
        sortedRoomData.forEach(r => rows.push(`${r.name},${r.revenue},${r.rooms},${r.adr},${r.percent}%`));
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `revenue-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        toast.success('Exported as CSV');
      }
    } catch { toast.error('Failed to export'); } finally { setExportLoading(false); }
  }, [exportLoading, sortedPayData, sortedRoomData, symbol, toast]);

  const hasFilters = dateFrom || dateTo || selectedMethod !== 'all';

  // ── Shared chart tooltip style ──
  const tooltipStyle = { backgroundColor: '#fff', border: '1px solid #E5E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-4 sm:px-6 lg:px-10 py-5 sm:py-7 max-w-[1400px] mx-auto">

        {/* ─── HEADER ─── */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Revenue Analytics</h1>
              <p className="text-xs sm:text-[13px] text-neutral-500 mt-0.5">In-depth breakdown by payment method & room type</p>
            </div>

            <div className="flex items-center gap-2">
              {exportLoading ? (
                <Button variant="outline" icon={Download} disabled loading className="text-xs sm:text-sm">Exporting...</Button>
              ) : (
                <DropdownMenu
                  trigger={<Button variant="outline" icon={Download} className="text-xs sm:text-sm">Export</Button>}
                  align="end"
                >
                  <DropdownMenuItem icon={FileText} onSelect={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
                  <DropdownMenuItem icon={Download} onSelect={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-lg bg-neutral-100 w-fit">
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'payment' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab('roomtype')}
              className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'roomtype' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Room Types
            </button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════ */}
        {/* PAYMENT METHODS TAB                             */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'payment' && (
          <div className="space-y-5 sm:space-y-6">

            {/* ─── Filters ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From" maxDate={dateTo || undefined} className="w-[130px]" />
                <span className="text-[11px] text-neutral-400">—</span>
                <DatePicker value={dateTo} onChange={setDateTo} placeholder="To" minDate={dateFrom || undefined} className="w-[130px]" />
              </div>

              <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-lg bg-neutral-100 overflow-x-auto">
                {[{ name: 'All', value: 'all' }, ...paymentModeData.filter(d => d.amount > 0).map(d => ({ name: d.name, value: d.name }))].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedMethod(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
                      selectedMethod === opt.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                    }`}
                  >
                    {opt.value !== 'all' && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PAYMENT_MODE_COLORS[opt.value] || '#888' }} />}
                    {opt.name}
                  </button>
                ))}
              </div>

              {hasFilters && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); setSelectedMethod('all'); }} className="text-[11px] text-terra-600 hover:text-terra-700 font-semibold">
                  Reset
                </button>
              )}
            </div>

            {/* ─── KPI Cards ─── */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{[...Array(4)].map((_, i) => <KPISkeleton key={i} />)}</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Total Revenue', value: `${symbol}${filteredTotal >= 1000 ? `${(filteredTotal/1000).toFixed(1)}K` : filteredTotal.toLocaleString()}`, icon: DollarSign, accent: 'bg-terra-50 text-terra-600' },
                  { label: 'Transactions', value: filteredTxns.toLocaleString(), icon: BarChart3, accent: 'bg-sage-50 text-sage-600' },
                  { label: 'Avg per Txn', value: `${symbol}${filteredTxns > 0 ? Math.round(filteredTotal/filteredTxns).toLocaleString() : 0}`, icon: TrendingUp, accent: 'bg-ocean-50 text-ocean-600' },
                  { label: 'Top Method', value: filteredPaymentData[0]?.name || '-', icon: Star, accent: 'bg-gold-50 text-gold-600', sub: filteredPaymentData[0] ? `${filteredPaymentData[0].percent}% share` : '' },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-[10px] bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.accent.split(' ')[0]}`}>
                        <kpi.icon className={`w-4 h-4 ${kpi.accent.split(' ')[1]}`} />
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{kpi.label}</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">{kpi.value}</p>
                    {kpi.sub && <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">{kpi.sub}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* ─── Insight Banner ─── */}
            {!isLoading && paymentInsight && (
              <div className="flex items-start gap-3 p-4 rounded-[10px] bg-gold-50">
                <Lightbulb className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
                <p className="text-[12px] sm:text-[13px] text-gold-800 leading-relaxed">{paymentInsight}</p>
              </div>
            )}

            {/* ─── Charts: Donut + Trend ─── */}
            {isLoading ? (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
                <div className="xl:col-span-2 rounded-[10px] bg-white p-6"><Skeleton className="h-56 w-full" /></div>
                <div className="xl:col-span-3 rounded-[10px] bg-white p-6"><Skeleton className="h-56 w-full" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
                {/* Donut */}
                <section className="xl:col-span-2 rounded-[10px] bg-white p-5 sm:p-6">
                  <h3 className="text-[13px] font-semibold text-neutral-800 mb-4">Revenue Share</h3>

                  {filteredPaymentData.filter(d => d.amount > 0).length === 0 ? (
                    <div className="h-52 flex items-center justify-center">
                      <p className="text-[12px] text-neutral-400">No data for selected filters</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-48 sm:h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={filteredPaymentData.filter(d => d.amount > 0)} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="amount">
                              {filteredPaymentData.filter(d => d.amount > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <ChartTooltip formatter={(v: number, n: string) => [`${symbol}${v.toLocaleString()}`, n]} contentStyle={tooltipStyle} />
                            <text x="50%" y="48%" textAnchor="middle" dominantBaseline="central" className="fill-neutral-800 text-base sm:text-lg font-semibold">
                              {symbol}{filteredTotal >= 1000 ? `${(filteredTotal/1000).toFixed(1)}K` : filteredTotal.toLocaleString()}
                            </text>
                            <text x="50%" y="58%" textAnchor="middle" dominantBaseline="central" className="fill-neutral-400 text-[9px] sm:text-[10px]">
                              Total
                            </text>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="space-y-2.5 mt-3 pt-3 border-t border-neutral-100">
                        {filteredPaymentData.filter(d => d.amount > 0).map(mode => {
                          const Icon = PAYMENT_ICONS[mode.name] || CreditCard;
                          return (
                            <div key={mode.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ backgroundColor: mode.color }} />
                                <Icon className="w-3.5 h-3.5 text-neutral-400" />
                                <span className="text-[12px] text-neutral-700 font-medium">{mode.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-semibold text-neutral-800">{symbol}{mode.amount.toLocaleString()}</span>
                                <span className="text-[10px] text-neutral-400 w-9 text-right">{mode.percent}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </section>

                {/* Stacked Bar Trend */}
                <section className="xl:col-span-3 rounded-[10px] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-neutral-800">Revenue Trend</h3>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {dateFrom || dateTo
                        ? `${dateFrom ? new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start'} — ${dateTo ? new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Now'}`
                        : `Last ${dailyTrendData.length} days`}
                    </span>
                  </div>

                  {dailyTrendData.length === 0 ? (
                    <div className="h-56 flex flex-col items-center justify-center bg-neutral-50 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-neutral-300 mb-2" />
                      <p className="text-[12px] text-neutral-500 font-medium">No trend data available</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Try adjusting the date range</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-56 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyTrendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#E5E4E0' }} tickLine={false} dy={8} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                            <ChartTooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${symbol}${v.toLocaleString()}`, n]} labelStyle={{ fontWeight: 600, marginBottom: 4 }} />
                            {payMethods.map(m => <Bar key={m.name} dataKey={m.name} stackId="s" fill={m.color} radius={[2, 2, 0, 0]} />)}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-center gap-5 mt-3 flex-wrap">
                        {payMethods.map(m => (
                          <div key={m.name} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: m.color }} />
                            <span className="text-[11px] text-neutral-500 font-medium">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}

            {/* ─── Data Table ─── */}
            {!isLoading && (
              <section className="rounded-[10px] bg-white overflow-hidden">
                <div className="px-5 sm:px-6 py-4 flex items-center gap-2 border-b border-neutral-100">
                  <Table2 className="w-4 h-4 text-neutral-400" />
                  <h3 className="text-[13px] font-semibold text-neutral-800">Detailed Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="bg-neutral-50/80">
                        {[
                          { key: 'name', label: 'Payment Method', align: '' },
                          { key: 'amount', label: 'Revenue', align: 'text-right' },
                          { key: 'count', label: 'Transactions', align: 'text-right hidden sm:table-cell' },
                          { key: 'avgTransaction', label: 'Avg per Txn', align: 'text-right hidden md:table-cell' },
                          { key: 'percent', label: 'Share', align: 'text-right' },
                        ].map(col => (
                          <th
                            key={col.key}
                            onClick={() => togglePaySort(col.key)}
                            className={`px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-semibold text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-600 transition-colors ${col.align}`}
                          >
                            <div className={`flex items-center gap-1 ${col.align.includes('right') ? 'justify-end' : ''}`}>
                              {col.label}
                              <ArrowUpDown className={`w-3 h-3 ${paySortField === col.key ? 'text-neutral-600' : ''}`} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPayData.map(row => {
                        const Icon = PAYMENT_ICONS[row.name] || CreditCard;
                        return (
                          <tr key={row.name} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                            <td className="px-5 sm:px-6 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ backgroundColor: row.color }} />
                                <Icon className="w-3.5 h-3.5 text-neutral-400" />
                                <span className="text-[12px] sm:text-[13px] font-medium text-neutral-800">{row.name}</span>
                              </div>
                            </td>
                            <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-semibold text-neutral-800 text-right">{symbol}{row.amount.toLocaleString()}</td>
                            <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] text-neutral-600 text-right hidden sm:table-cell">{row.count}</td>
                            <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] text-neutral-600 text-right hidden md:table-cell">{symbol}{row.avgTransaction.toLocaleString()}</td>
                            <td className="px-5 sm:px-6 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden hidden sm:block">
                                  <div className="h-full rounded-full" style={{ width: `${row.percent}%`, backgroundColor: row.color }} />
                                </div>
                                <span className="text-[12px] font-medium text-neutral-600 w-11 text-right">{row.percent}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50/80 border-t border-neutral-200">
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-800">Total</td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-800 text-right">{symbol}{filteredTotal.toLocaleString()}</td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-600 text-right hidden sm:table-cell">{filteredTxns}</td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-600 text-right hidden md:table-cell">{symbol}{filteredTxns > 0 ? Math.round(filteredTotal/filteredTxns).toLocaleString() : 0}</td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-600 text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* ROOM TYPES TAB                                  */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'roomtype' && (
          <div className="space-y-5 sm:space-y-6">

            {/* ─── Time Period ─── */}
            <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-lg bg-neutral-100 w-fit overflow-x-auto">
              {[
                { label: '7 Days', value: 'last_7_days' },
                { label: '30 Days', value: 'last_30_days' },
                { label: '90 Days', value: 'last_90_days' },
                { label: 'This Month', value: 'this_month' },
                { label: 'Last Month', value: 'last_month' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRoomTimePeriod(opt.value)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
                    roomTimePeriod === opt.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* ─── KPI Cards ─── */}
            {roomTypeLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{[...Array(4)].map((_, i) => <KPISkeleton key={i} />)}</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Total Revenue', value: `${symbol}${totalRoomRevenue >= 1000 ? `${(totalRoomRevenue/1000).toFixed(1)}K` : totalRoomRevenue.toLocaleString()}`, icon: DollarSign, accent: 'bg-terra-50 text-terra-600' },
                  { label: 'Rooms Sold', value: totalRoomsSold.toString(), icon: BedDouble, accent: 'bg-sage-50 text-sage-600' },
                  { label: 'Best Seller', value: topRoom?.name || '-', icon: Star, accent: 'bg-ocean-50 text-ocean-600', sub: topRoom ? `${topRoom.percent}% of revenue` : '' },
                  { label: 'Highest ADR', value: `${symbol}${highestADR.toLocaleString()}`, icon: TrendingUp, accent: 'bg-gold-50 text-gold-600' },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-[10px] bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.accent.split(' ')[0]}`}>
                        <kpi.icon className={`w-4 h-4 ${kpi.accent.split(' ')[1]}`} />
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{kpi.label}</p>
                    </div>
                    <p className={`${kpi.label === 'Best Seller' ? 'text-lg sm:text-xl truncate' : 'text-xl sm:text-2xl'} font-semibold tracking-tight text-neutral-900`}>{kpi.value}</p>
                    {kpi.sub && <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">{kpi.sub}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* ─── Insight Banner ─── */}
            {!roomTypeLoading && roomInsight && (
              <div className="flex items-start gap-3 p-4 rounded-[10px] bg-ocean-50">
                <Lightbulb className="w-4 h-4 text-ocean-600 mt-0.5 flex-shrink-0" />
                <p className="text-[12px] sm:text-[13px] text-ocean-800 leading-relaxed">{roomInsight}</p>
              </div>
            )}

            {/* ─── Charts: Donut + Horizontal Bar ─── */}
            {roomTypeLoading ? (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
                <div className="xl:col-span-2 rounded-[10px] bg-white p-6"><Skeleton className="h-56 w-full" /></div>
                <div className="xl:col-span-3 rounded-[10px] bg-white p-6"><Skeleton className="h-56 w-full" /></div>
              </div>
            ) : roomTypeChartData.length === 0 ? (
              <div className="rounded-[10px] bg-white p-10 sm:p-14 text-center">
                <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-neutral-600 mb-1">No room type data available</p>
                <p className="text-[11px] text-neutral-400 mb-4">Try selecting a different time period</p>
                <button onClick={() => setRoomTimePeriod('last_90_days')} className="px-4 py-2 bg-terra-500 text-white rounded-lg text-[12px] font-semibold hover:bg-terra-600 transition-colors">
                  Try 90 Days
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
                {/* Donut */}
                <section className="xl:col-span-2 rounded-[10px] bg-white p-5 sm:p-6">
                  <h3 className="text-[13px] font-semibold text-neutral-800 mb-4">Revenue Share</h3>
                  <div className="h-48 sm:h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roomTypeChartData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="revenue">
                          {roomTypeChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <ChartTooltip formatter={(v: number, n: string) => [`${symbol}${v.toLocaleString()}`, n]} contentStyle={tooltipStyle} />
                        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="central" className="fill-neutral-800 text-base sm:text-lg font-semibold">
                          {symbol}{totalRoomRevenue >= 1000 ? `${(totalRoomRevenue/1000).toFixed(1)}K` : totalRoomRevenue.toLocaleString()}
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="central" className="fill-neutral-400 text-[9px] sm:text-[10px]">Total</text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5 mt-3 pt-3 border-t border-neutral-100">
                    {roomTypeChartData.map(rt => (
                      <div key={rt.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ backgroundColor: rt.color }} />
                          <span className="text-[12px] text-neutral-700 font-medium truncate max-w-[150px] sm:max-w-[180px]">{rt.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-neutral-800">{symbol}{rt.revenue.toLocaleString()}</span>
                          <span className="text-[10px] text-neutral-400 w-9 text-right">{rt.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Horizontal Bar */}
                <section className="xl:col-span-3 rounded-[10px] bg-white p-5 sm:p-6">
                  <h3 className="text-[13px] font-semibold text-neutral-800 mb-4">Revenue by Room Type</h3>
                  <div style={{ height: Math.max(180, roomTypeChartData.length * 44) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roomTypeChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#E5E4E0' }} tickLine={false} tickFormatter={v => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#525252' }} axisLine={false} tickLine={false} width={120} />
                        <ChartTooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${symbol}${v.toLocaleString()}`, 'Revenue']} labelStyle={{ fontWeight: 600, marginBottom: 4 }} />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                          {roomTypeChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            )}

            {/* ─── Trend Chart ─── */}
            {!roomTypeLoading && roomTrendData.length > 0 && (
              <section className="rounded-[10px] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold text-neutral-800">Revenue Trend</h3>
                  <span className="text-[10px] text-neutral-400 font-medium">Last {roomTrendData.length} days</span>
                </div>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={roomTrendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <defs>
                        {roomTypeChartData.map(rt => (
                          <linearGradient key={rt.name} id={`rtg-${rt.name.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={rt.color} stopOpacity={0.12} />
                            <stop offset="95%" stopColor={rt.color} stopOpacity={0.01} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#E5E4E0' }} tickLine={false} dy={8} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                      <ChartTooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${symbol}${v.toLocaleString()}`, n]} labelStyle={{ fontWeight: 600, marginBottom: 4 }} />
                      {roomTypeChartData.map(rt => <Area key={rt.name} type="monotone" dataKey={rt.name} stroke={rt.color} strokeWidth={2} fill={`url(#rtg-${rt.name.replace(/\s/g, '')})`} />)}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 mt-3 flex-wrap">
                  {roomTypeChartData.map(rt => (
                    <div key={rt.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: rt.color }} />
                      <span className="text-[11px] text-neutral-500 font-medium">{rt.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── Data Table ─── */}
            {!roomTypeLoading && roomTypeChartData.length > 0 && (
              <section className="rounded-[10px] bg-white overflow-hidden">
                <div className="px-5 sm:px-6 py-4 flex items-center gap-2 border-b border-neutral-100">
                  <Table2 className="w-4 h-4 text-neutral-400" />
                  <h3 className="text-[13px] font-semibold text-neutral-800">Detailed Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="bg-neutral-50/80">
                        {[
                          { key: 'name', label: 'Room Type', align: '' },
                          { key: 'revenue', label: 'Revenue', align: 'text-right' },
                          { key: 'rooms', label: 'Rooms Sold', align: 'text-right hidden sm:table-cell' },
                          { key: 'adr', label: 'ADR', align: 'text-right hidden md:table-cell' },
                          { key: 'percent', label: 'Share', align: 'text-right' },
                        ].map(col => (
                          <th
                            key={col.key}
                            onClick={() => toggleRoomSort(col.key)}
                            className={`px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-semibold text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-600 transition-colors ${col.align}`}
                          >
                            <div className={`flex items-center gap-1 ${col.align.includes('right') ? 'justify-end' : ''}`}>
                              {col.label}
                              <ArrowUpDown className={`w-3 h-3 ${roomSortField === col.key ? 'text-neutral-600' : ''}`} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRoomData.map(rt => (
                        <tr key={rt.name} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                          <td className="px-5 sm:px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ backgroundColor: rt.color }} />
                              <BedDouble className="w-3.5 h-3.5 text-neutral-400" />
                              <span className="text-[12px] sm:text-[13px] font-medium text-neutral-800">{rt.name}</span>
                            </div>
                          </td>
                          <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-semibold text-neutral-800 text-right">{symbol}{rt.revenue.toLocaleString()}</td>
                          <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] text-neutral-600 text-right hidden sm:table-cell">{rt.rooms}</td>
                          <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] text-neutral-600 text-right hidden md:table-cell">{symbol}{rt.adr.toLocaleString()}</td>
                          <td className="px-5 sm:px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full rounded-full" style={{ width: `${rt.percent}%`, backgroundColor: rt.color }} />
                              </div>
                              <span className="text-[12px] font-medium text-neutral-600 w-11 text-right">{rt.percent}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50/80 border-t border-neutral-200">
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-800">Total</td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-800 text-right">{symbol}{totalRoomRevenue.toLocaleString()}</td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-600 text-right hidden sm:table-cell">{totalRoomsSold}</td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-600 text-right hidden md:table-cell">
                          {symbol}{totalRoomsSold > 0 ? Math.round(totalRoomRevenue/totalRoomsSold).toLocaleString() : 0}
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] sm:text-[13px] font-bold text-neutral-600 text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default PaymentAnalytics;
