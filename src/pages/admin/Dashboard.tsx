import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LogIn,
  LogOut,
  Sparkles,
  Hotel,
  BedDouble,
  Star,
  Layers,
  ArrowRight,
  Wifi,
  Coffee,
  Car,
  Dumbbell,
  Clock,
  Filter,
  MoreHorizontal,
  RefreshCw,
  ExternalLink,
  Sun,
  Moon,
  Activity,
  Zap,
  Crown,
  Award,
  TrendingUp as TrendUp,
  FileText,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { reviewsData, reviewsSummary } from '../../data/reviewsData';
import { formatCurrency } from '../../utils/dashboardUtils';
import { cn } from '../../lib/utils';
import { dashboardsService, AdminDashboard } from '../../api/services/dashboards.service';
import { Button, IconButton } from '../../components/ui2/Button';
import { Card } from '../../components/ui2/Card';
import { StatusBadge } from '../../components/ui2/Badge';

/**
 * Glimmora Luxury Hotel Management Dashboard
 * Premium hospitality design - Elegant, sophisticated, refined
 * Warm terra tones, gold accents, generous spacing, premium materials
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER - Smooth number transitions
// ═══════════════════════════════════════════════════════════════════════════════

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const startTime = useRef(null);

  useEffect(() => {
    const target = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    const duration = 1200;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(eased * target);

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}
      {suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LUXURY KPI CARD - Premium metric display with elegant styling
// ═══════════════════════════════════════════════════════════════════════════════

function LuxuryKPICard({
  label,
  value,
  prefix = '',
  suffix = '',
  change,
  changeType,
  icon: Icon,
  accentColor,
  accentColorClass,
  sparkData,
  delay = 0
}) {
  const { isDark } = useTheme();
  const isPositive = changeType === 'positive';

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] p-6 transition-colors",
        isDark ? "bg-neutral-800/50" : "bg-white"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        {/* Header with Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            accentColorClass === 'terra' && 'bg-terra-50',
            accentColorClass === 'sage' && 'bg-sage-50',
            accentColorClass === 'gold' && 'bg-gold-50',
            accentColorClass === 'ocean' && 'bg-ocean-50'
          )}>
            <Icon className={cn(
              "w-4 h-4",
              accentColorClass === 'terra' && 'text-terra-600',
              accentColorClass === 'sage' && 'text-sage-600',
              accentColorClass === 'gold' && 'text-gold-600',
              accentColorClass === 'ocean' && 'text-ocean-600'
            )} />
          </div>
          <p className={cn(
            "text-[11px] font-semibold uppercase tracking-widest",
            isDark ? "text-neutral-500" : "text-neutral-400"
          )}>
            {label}
          </p>
        </div>

        {/* Value */}
        <p className={cn(
          "text-[28px] font-semibold tracking-tight mb-2",
          isDark ? "text-neutral-100" : "text-neutral-900"
        )}>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
        </p>

        {/* Comparison */}
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-[11px] font-medium",
            isDark ? "text-neutral-500" : "text-neutral-400"
          )}>vs Last Month</p>
          {change && (
            <div className={cn(
              'flex items-center gap-1 text-[11px] font-semibold',
              isPositive
                ? 'text-sage-600'
                : 'text-rose-600'
            )}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {change}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LUXURY STATUS INDICATOR - Refined status badges
// ═══════════════════════════════════════════════════════════════════════════════

function LuxuryStatusIndicator({ label, value, colorClass, trend, icon: Icon }) {
  const colorMap = {
    'sage': { bg: 'bg-sage-50', icon: 'text-sage-600', dot: 'bg-sage-500', border: 'border-sage-200' },
    'ocean': { bg: 'bg-ocean-50', icon: 'text-ocean-600', dot: 'bg-ocean-500', border: 'border-ocean-200' },
    'terra': { bg: 'bg-terra-50', icon: 'text-terra-600', dot: 'bg-terra-500', border: 'border-terra-200' },
    'copper': { bg: 'bg-copper-50', icon: 'text-copper-600', dot: 'bg-copper-500', border: 'border-copper-200' },
    'rose': { bg: 'bg-rose-50', icon: 'text-rose-600', dot: 'bg-rose-500', border: 'border-rose-200' },
    'gold': { bg: 'bg-gold-50', icon: 'text-gold-600', dot: 'bg-gold-500', border: 'border-gold-200' },
  };
  const colors = colorMap[colorClass] || colorMap.terra;

  return (
    <div className={cn("flex items-center gap-4 px-5 py-4 rounded-[10px] bg-white border", colors.border)}>
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colors.bg)}>
        <Icon className={cn("w-5 h-5", colors.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-1">
          {label}
        </p>
        <p className="text-2xl font-light text-neutral-900 tracking-tight">
          {value}
        </p>
      </div>

      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold',
          trend >= 0 ? 'bg-sage-50 text-sage-700 border border-sage-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        )}>
          {trend >= 0 ? <TrendUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OCCUPANCY GAUGE - Elegant radial visualization
// ═══════════════════════════════════════════════════════════════════════════════

function OccupancyGauge({ value, occupied, total }) {
  const radius = 80;
  const strokeWidth = 12;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-3">
      <div className="relative" style={{ width: 180, height: 180 }}>
        <svg width="180" height="180" className="transform -rotate-90">
          <defs>
            <linearGradient id="occupancyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A57865" />
              <stop offset="100%" stopColor="#BFA793" />
            </linearGradient>
          </defs>
          
          {/* Background track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#F5F5F4"
            strokeWidth={strokeWidth}
            opacity={0.5}
          />
          
          {/* Progress arc with gradient */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="url(#occupancyGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Decorative inner ring */}
          <circle
            cx="90"
            cy="90"
            r={radius - 20}
            fill="none"
            stroke="#E7E5E4"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.3}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[32px] font-semibold text-neutral-900 tracking-tight">
            <AnimatedNumber value={value} suffix="%" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mt-1">
            Occupied
          </span>
        </div>
      </div>

      {/* Stats below */}
      <div className="flex items-center gap-6 mt-5 pt-5 border-t border-neutral-100 w-full">
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-terra-500"></div>
            <p className="text-2xl font-semibold text-neutral-900">
              <AnimatedNumber value={occupied} />
            </p>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Occupied</p>
        </div>
        <div className="w-px h-10 bg-neutral-100" />
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-sage-400"></div>
            <p className="text-2xl font-semibold text-neutral-900">
              <AnimatedNumber value={total - occupied} />
            </p>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Available</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI INSIGHT CARD - Elegant notification style
// ═══════════════════════════════════════════════════════════════════════════════

function InsightCard({ insight, index }) {
  const configs = {
    success: {
      icon: CheckCircle2,
      accentBar: 'bg-sage-500',
      iconBg: 'bg-sage-50',
      iconColor: 'text-sage-600',
      bg: 'bg-gradient-to-br from-sage-50/60 to-white'
    },
    warning: {
      icon: AlertCircle,
      accentBar: 'bg-gold-500',
      iconBg: 'bg-gold-50',
      iconColor: 'text-gold-600',
      bg: 'bg-gradient-to-br from-gold-50/60 to-white'
    },
    info: {
      icon: Sparkles,
      accentBar: 'bg-ocean-500',
      iconBg: 'bg-ocean-50',
      iconColor: 'text-ocean-600',
      bg: 'bg-gradient-to-br from-ocean-50/60 to-white'
    },
  };

  const config = configs[insight.type] || configs.info;
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'relative rounded-lg p-4 overflow-hidden hover:shadow-sm transition-all',
        config.bg
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.iconBg)}>
          <IconComponent className={cn("w-5 h-5", config.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {insight.category}
            </span>
            <span className="text-[10px] text-neutral-300">•</span>
            <span className="text-[10px] font-medium text-neutral-400">
              {insight.timeAgo}
            </span>
          </div>

          <p className="text-[13px] font-semibold text-neutral-800 mb-1 leading-snug">
            {insight.title}
          </p>

          <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2 mb-3">
            {insight.message}
          </p>

          {/* Confidence bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  insight.type === 'success' && 'bg-sage-500',
                  insight.type === 'warning' && 'bg-gold-500',
                  insight.type === 'info' && 'bg-ocean-500'
                )}
                style={{
                  width: `${insight.confidence}%`
                }}
              />
            </div>
            <span className="text-[10px] font-semibold text-neutral-600 min-w-[32px]">
              {insight.confidence}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOUSEKEEPING GRID - Visual room status map
// ═══════════════════════════════════════════════════════════════════════════════

function HousekeepingChart({ summary }) {
  const total = summary.dirty + summary.inProgress + summary.clean;
  const cleanPercentage = total > 0 ? Math.round((summary.clean / total) * 100) : 0;

  // Using Glimmora terra/copper palette (same as Booking Channels)
  const chartData = [
    { name: 'Clean', value: summary.clean, colorClass: 'bg-terra-500', chartColor: '#A57865' },
    { name: 'Cleaning', value: summary.inProgress, colorClass: 'bg-terra-400', chartColor: '#BFA793' },
    { name: 'Dirty', value: summary.dirty, colorClass: 'bg-terra-600', chartColor: '#8B6450' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Donut Chart */}
      <div className="flex-1 flex flex-col items-center justify-center py-2">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.chartColor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-semibold text-neutral-900 tracking-tight">
              {cleanPercentage}%
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mt-1">
              Clean
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full flex flex-col gap-2 mt-4">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
            >
              <div className={cn("w-3 h-3 rounded-full flex-shrink-0", item.colorClass)} />
              <span className="text-[13px] font-medium text-neutral-600 flex-1">{item.name}</span>
              <span className="text-[13px] font-semibold text-neutral-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-neutral-100">
        <div className="text-center">
          <p className="text-2xl font-semibold text-neutral-900 mb-0.5">
            {summary.avgCleaningTime}<span className="text-sm text-neutral-400 font-medium ml-0.5">m</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Avg Clean Time
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-neutral-900 mb-0.5">
            {summary.staffOnShift}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Staff on Duty
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL DISTRIBUTION - Elegant donut chart
// ═══════════════════════════════════════════════════════════════════════════════

function ChannelDistribution({ data }) {
  const COLORS = ['#A57865', '#BFA793', '#8B6450', '#D4C4B4', '#B49A82'];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-44 h-44 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  style={{ filter: 'url(#shadow)' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-semibold text-neutral-900 tracking-tight">
            {data[0]?.value}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mt-1">
            Direct
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        {data.slice(0, 4).map((channel, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i] }}
            />
            <span className="text-[13px] font-medium text-neutral-600 flex-1">{channel.name}</span>
            <span className="text-[13px] font-semibold text-neutral-900">{channel.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTION - Refined button style
// ═══════════════════════════════════════════════════════════════════════════════

function QuickAction({ icon: Icon, label, sublabel, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-lg bg-neutral-50/50 text-left hover:bg-neutral-50 transition-all group"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-neutral-800 mb-0.5 leading-tight">{label}</p>
        <p className="text-[11px] text-neutral-400 font-medium">{sublabel}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-terra-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AMENITY BAR - Progress indicator
// ═══════════════════════════════════════════════════════════════════════════════

function AmenityUsage({ icon: Icon, name, usage, color }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-neutral-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-neutral-800">{name}</span>
          <span className="text-[13px] font-semibold text-neutral-900">{usage}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-200/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${usage}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function BookingStatus({ status }) {
  return <StatusBadge status={status?.toLowerCase().replace('_', '-')} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LUXURY SECTION CARD - Premium card wrapper
// ═══════════════════════════════════════════════════════════════════════════════

function LuxurySectionCard({ title, subtitle, action, actionLabel, children, className, noPadding, icon: Icon, legend }: {
  title?: string;
  subtitle?: string;
  action?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  icon?: React.ElementType;
  legend?: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const hasFlex = className?.includes('flex');
  return (
    <div className={cn(
      'rounded-[10px] overflow-hidden transition-colors',
      isDark ? 'bg-neutral-800/50' : 'bg-white',
      className
    )}>
      {(title || action || legend) && (
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-terra-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-terra-600" />
              </div>
            )}
            <div>
              {title && (
                <h3 className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-neutral-200" : "text-neutral-800"
                )}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={cn(
                  "text-[11px] font-medium mt-0.5",
                  isDark ? "text-neutral-500" : "text-neutral-400"
                )}>{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {legend && (
              <div className="flex items-center gap-4">
                {legend}
              </div>
            )}
            {action && (
              <button
                onClick={action}
                className="flex items-center gap-1 text-[11px] font-semibold text-terra-600 px-3 py-1.5 rounded-lg hover:bg-terra-50 transition-colors"
              >
                {actionLabel} <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className={cn(noPadding ? '' : 'px-6 pb-6', hasFlex && 'flex-1')}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Live time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real dashboard data from API
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardsService.getAdminDashboard();
        setDashboardData(data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboard, 300000);
    return () => clearInterval(interval);
  }, []);

  // Extract metrics from dashboard data
  const occupancyRate = dashboardData?.kpis.occupancy_rate || 0;
  const adr = dashboardData?.kpis.adr || 0;
  const revpar = dashboardData?.kpis.revpar || 0;
  const occupiedRooms = dashboardData?.kpis.occupied_rooms || 0;
  const totalRooms = dashboardData?.kpis.total_rooms || 0;
  const todayRevenue = dashboardData?.kpis.revenue_today || 0;
  const arrivals = dashboardData?.kpis.checkins_today || 0;
  const departures = dashboardData?.kpis.checkouts_today || 0;
  const recentBookings = dashboardData?.recent_bookings || [];

  // Housekeeping data
  const housekeepingSummary = {
    clean: totalRooms - (dashboardData?.housekeeping.dirty_rooms || 0) - (dashboardData?.housekeeping.in_progress_tasks || 0),
    inProgress: dashboardData?.housekeeping.in_progress_tasks || 0,
    dirty: dashboardData?.housekeeping.dirty_rooms || 0,
    avgCleaningTime: 24,
    staffOnShift: dashboardData?.housekeeping.staff_on_shift || 1,
  };

  // Channel mix from real data
  const channelMix = dashboardData?.channel_distribution || [
    { name: 'Direct', value: 100 },
  ];

  // AI Insights - hardcoded for now, will be generated by backend later
  const aiInsights = [
    {
      id: 1,
      type: occupancyRate < 60 ? 'warning' : 'success',
      category: 'Occupancy',
      title: occupancyRate < 60 ? 'Low Occupancy Warning' : 'Healthy Occupancy',
      message: occupancyRate < 60 ? `Occupancy below 60% - consider promotional pricing` : `Occupancy is healthy at ${occupancyRate.toFixed(1)}%`,
      timeAgo: '5 min ago',
      confidence: 87,
    },
    {
      id: 2,
      type: 'info',
      category: 'Revenue',
      title: 'Pricing Opportunity',
      message: `ADR optimization opportunity detected - current ADR: $${adr.toFixed(0)}`,
      timeAgo: '15 min ago',
      confidence: 78,
    },
    {
      id: 3,
      type: dashboardData?.maintenance.high_priority ? 'warning' : 'success',
      category: 'Maintenance',
      title: dashboardData?.maintenance.high_priority ? 'High Priority Maintenance' : 'All Systems Normal',
      message: dashboardData?.maintenance.high_priority
        ? `${dashboardData.maintenance.high_priority} high priority maintenance requests need attention`
        : 'No critical maintenance issues',
      timeAgo: '30 min ago',
      confidence: 82,
    },
    {
      id: 4,
      type: 'success',
      category: 'Revenue',
      title: 'Revenue Projection',
      message: `Weekend revenue projected to exceed target by 18%`,
      timeAgo: '45 min ago',
      confidence: 89,
    },
  ];

  // Get upcoming arrivals - today's check-ins from backend
  const upcomingArrivals = (dashboardData?.upcoming_arrivals || []).map(b => ({
    ...b,
    isVIP: Math.random() > 0.7,
    specialRequests: Math.random() > 0.5 ? ['Late check-in', 'High floor'] : []
  }));

  // Get recent reviews from real data
  const recentReviews = (dashboardData?.recent_reviews || []).slice(0, 3).map(r => ({
    id: r.id,
    guestName: r.guestName,
    rating: r.rating,
    review: r.reviewText,
    date: r.date,
    platform: r.platform,
    platformIcon: r.platform === 'Google' ? 'G' : r.platform === 'Booking.Com' ? 'B' : r.platform[0],
    sentiment: r.sentiment,
    hasReply: r.hasReply,
  }));

  // Calculate performance metrics using trends from backend
  const performanceMetrics = {
    revenue: {
      thisWeek: dashboardData?.kpis.revenue_week || 0,
      lastWeek: dashboardData?.kpis.revenue_week && dashboardData?.trends.adr
        ? dashboardData.kpis.revenue_week / (1 + (dashboardData.trends.adr / 100))
        : 0,
      change: dashboardData?.trends.adr || 0
    },
    occupancy: {
      thisWeek: occupancyRate,
      lastWeek: dashboardData?.trends.occupancy
        ? occupancyRate / (1 + (dashboardData.trends.occupancy / 100))
        : occupancyRate,
      change: dashboardData?.trends.occupancy || 0
    },
    adr: {
      thisWeek: adr,
      lastWeek: dashboardData?.trends.adr
        ? adr / (1 + (dashboardData.trends.adr / 100))
        : adr,
      change: dashboardData?.trends.adr || 0
    }
  };

  // Chart data
  const generateSparkData = (base, variance) =>
    Array.from({ length: 7 }, () => ({ value: base + (Math.random() - 0.5) * variance }));

  // Revenue chart data from backend
  const revenueChartData = useMemo(() => {
    if (dashboardData?.revenue_chart && dashboardData.revenue_chart.length > 0) {
      // Use real data from backend
      return dashboardData.revenue_chart.map(item => ({
        day: item.day,
        revenue: Math.max(0, item.revenue), // Ensure never negative
        // Calculate last week - ensure it's never negative
        lastWeek: Math.max(0, item.revenue * (1 - Math.abs(dashboardData.trends.adr || 8) / 100)),
      }));
    }
    // Fallback to mock data if no backend data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      revenue: 18000 + Math.random() * 12000,
      lastWeek: 15000 + Math.random() * 8000,
    }));
  }, [dashboardData]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors",
        isDark
          ? "bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800"
          : "bg-gradient-to-br from-neutral-50 via-copper-50/30 to-neutral-50"
      )}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className={cn(
              "absolute inset-0 rounded-full border-2",
              isDark ? "border-neutral-700" : "border-neutral-200"
            )} />
            <div className="absolute inset-0 rounded-full border-2 border-terra-500 border-t-transparent animate-spin" />
          </div>
          <p className={cn(
            "text-lg animate-pulse font-light",
            isDark ? "text-neutral-400" : "text-neutral-600"
          )}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors",
        isDark
          ? "bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800"
          : "bg-gradient-to-br from-neutral-50 via-copper-50/30 to-neutral-50"
      )}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className={cn(
            "text-xl font-semibold mb-2",
            isDark ? "text-neutral-100" : "text-neutral-900"
          )}>Failed to Load Dashboard</h2>
          <p className={cn(
            "mb-6",
            isDark ? "text-neutral-400" : "text-neutral-600"
          )}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-terra-600 text-white rounded-lg hover:bg-terra-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors",
      isDark ? "bg-neutral-900" : "bg-[#F9F7F7]"
    )}>
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT - 12 Column Grid System */}
      {/* Grid: 12 columns, 24px gutters, 40px margins */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <main className="px-10 py-6">
        {/* Primary KPIs - 4 cards × 3 columns each = 12 columns */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <LuxuryKPICard
              label="Occupancy Rate"
              value={Math.round(occupancyRate)}
              suffix="%"
              change={`${dashboardData?.trends.occupancy >= 0 ? '+' : ''}${dashboardData?.trends.occupancy.toFixed(1) || '0.0'}%`}
              changeType={dashboardData?.trends.occupancy >= 0 ? "positive" : "negative"}
              icon={Home}
              accentColor="#A57865"
              accentColorClass="terra"
              sparkData={generateSparkData(occupancyRate, 15)}
              delay={0}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <LuxuryKPICard
              label="Today's Revenue"
              value={todayRevenue}
              prefix="$"
              change={`${dashboardData?.trends.adr >= 0 ? '+' : ''}${dashboardData?.trends.adr.toFixed(1) || '0.0'}%`}
              changeType={dashboardData?.trends.adr >= 0 ? "positive" : "negative"}
              icon={DollarSign}
              accentColor="#4E5840"
              accentColorClass="sage"
              sparkData={generateSparkData(todayRevenue / 1000, 5)}
              delay={50}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <LuxuryKPICard
              label="ADR"
              value={Math.round(adr)}
              prefix="$"
              change={`${dashboardData?.trends.adr >= 0 ? '+' : ''}${dashboardData?.trends.adr.toFixed(1) || '0.0'}%`}
              changeType={dashboardData?.trends.adr >= 0 ? "positive" : "negative"}
              icon={TrendingUp}
              accentColor="#CDB261"
              accentColorClass="gold"
              sparkData={generateSparkData(adr, 30)}
              delay={100}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <LuxuryKPICard
              label="RevPAR"
              value={Math.round(revpar)}
              prefix="$"
              change={`${dashboardData?.trends.revpar >= 0 ? '+' : ''}${dashboardData?.trends.revpar.toFixed(1) || '0.0'}%`}
              changeType={dashboardData?.trends.revpar >= 0 ? "positive" : "negative"}
              icon={Target}
              accentColor="#5C9BA4"
              accentColorClass="ocean"
              sparkData={generateSparkData(revpar, 25)}
              delay={150}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ANALYTICS SECTION - 4 cols + 8 cols = 12 columns */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Occupancy Gauge - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <LuxurySectionCard
              title="Live Occupancy"
              subtitle={`${totalRooms} total rooms`}
              className="h-full"
            >
              <OccupancyGauge
                value={Math.round(occupancyRate)}
                occupied={occupiedRooms}
                total={totalRooms}
              />
            </LuxurySectionCard>
          </div>

          {/* Revenue Chart - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <LuxurySectionCard
              title="Revenue Analytics"
              subtitle="Weekly performance comparison"
              noPadding={true}
              className="h-full"
              legend={
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-terra-500" />
                    <span className="text-[11px] font-medium text-neutral-600">This Week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                    <span className="text-[11px] font-medium text-neutral-400">Last Week</span>
                  </div>
                </>
              }
            >
              <div className="h-80 px-6 pt-4 pb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, bottom: -10, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A57865" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#A57865" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="lastWeekAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4D4D4" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#D4D4D4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#57534E', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#57534E', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                    width={55}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white rounded-xl px-5 py-4 shadow-xl">
                          <p className="font-semibold text-neutral-900 text-sm mb-3">{label}</p>
                          <div className="space-y-1.5">
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: index === 0 ? '#D4D4D4' : '#A57865' }}
                                  />
                                  <span className="text-xs text-neutral-600 font-medium">
                                    {index === 0 ? 'Last Week' : 'This Week'}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-neutral-900">
                                  ${entry.value?.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="lastWeek"
                    stroke="#D4D4D4"
                    strokeWidth={2.5}
                    fill="url(#lastWeekAreaGradient)"
                    dot={{ fill: '#D4D4D4', strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: '#D4D4D4', strokeWidth: 0, r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#A57865"
                    strokeWidth={3}
                    fill="url(#revenueAreaGradient)"
                    dot={{ fill: '#A57865', strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: '#A57865', strokeWidth: 0, r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </LuxurySectionCard>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* OPERATIONS SECTION - 3 × 4 columns = 12 columns */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Channel Distribution - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <LuxurySectionCard
              title="Booking Channels"
              subtitle="Distribution breakdown"
              className="h-full"
            >
              <ChannelDistribution data={channelMix} />
            </LuxurySectionCard>
          </div>

          {/* AI Insights - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <LuxurySectionCard
              title="AI Insights"
              subtitle="Powered by Glimmora Intelligence"
              className="h-full"
            >
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 -mr-2">
                {aiInsights.slice(0, 4).map((insight, idx) => (
                  <InsightCard key={insight.id} insight={insight} index={idx} />
                ))}
              </div>
            </LuxurySectionCard>
          </div>

          {/* Housekeeping - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <LuxurySectionCard
              title="Housekeeping Status"
              subtitle="Room cleaning overview"
              action={() => navigate('/admin/housekeeping')}
              actionLabel="Manage"
              className="h-full flex flex-col"
            >
              <div className="flex-1 flex flex-col justify-between">
                <HousekeepingChart summary={housekeepingSummary} />
              </div>
            </LuxurySectionCard>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* QUICK ACTIONS & AMENITIES - 6 + 6 = 12 columns */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Quick Actions - 6 columns */}
          <div className="col-span-12 lg:col-span-6">
            <LuxurySectionCard title="Quick Actions" subtitle="Common tasks" className="h-full">
              <div className="grid grid-cols-2 gap-3 -mt-1">
                <QuickAction
                  icon={LogIn}
                  label="Check-in Guest"
                  sublabel="Process arrival"
                  color="#4E5840"
                  onClick={() => navigate('/admin/guests')}
                />
                <QuickAction
                  icon={LogOut}
                  label="Check-out"
                  sublabel="Process departure"
                  color="#5C9BA4"
                  onClick={() => navigate('/admin/guests')}
                />
                <QuickAction
                  icon={Calendar}
                  label="Room Service"
                  sublabel="New request"
                  color="#CDB261"
                  onClick={() => navigate('/admin/maintenance')}
                />
                <QuickAction
                  icon={Sparkles}
                  label="AI Assistant"
                  sublabel="Get insights"
                  color="#5C9BA4"
                  onClick={() => navigate('/admin/revenue-ai')}
                />
                <QuickAction
                  icon={FileText}
                  label="Generate Report"
                  sublabel="Quick export"
                  color="#A57865"
                  onClick={() => navigate('/admin/reports')}
                />
                <QuickAction
                  icon={Bell}
                  label="Notifications"
                  sublabel="View alerts"
                  color="#CDB261"
                  onClick={() => {}}
                />
              </div>
            </LuxurySectionCard>
          </div>

          {/* Amenity Usage - 6 columns */}
          <div className="col-span-12 lg:col-span-6">
            <LuxurySectionCard title="Amenity Usage" subtitle="Facility utilization" className="h-full">
              <div className="space-y-3 -mt-1">
                <AmenityUsage icon={Wifi} name="WiFi" usage={94} color="#5C9BA4" />
                <AmenityUsage icon={Coffee} name="Breakfast" usage={78} color="#CDB261" />
                <AmenityUsage icon={Dumbbell} name="Gym" usage={45} color="#4E5840" />
                <AmenityUsage icon={Car} name="Parking" usage={62} color="#A57865" />
              </div>
            </LuxurySectionCard>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PERFORMANCE & ARRIVALS - 6 + 6 = 12 columns */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Performance Summary - 6 columns */}
          <div className="col-span-12 lg:col-span-6">
            <LuxurySectionCard
              title="Performance Summary"
              subtitle="This week vs. last week"
              className="h-full"
            >
            <div className="space-y-6">
              {/* Revenue */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Revenue</span>
                  <span className={cn(
                    "text-[11px] font-semibold",
                    performanceMetrics.revenue.change >= 0 ? "text-sage-600" : "text-rose-600"
                  )}>
                    {performanceMetrics.revenue.change >= 0 ? '+' : ''}
                    {performanceMetrics.revenue.change.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-semibold text-neutral-900">
                    {formatCurrency(performanceMetrics.revenue.thisWeek)}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    vs {formatCurrency(performanceMetrics.revenue.lastWeek)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-terra-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (performanceMetrics.revenue.thisWeek / performanceMetrics.revenue.lastWeek) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Occupancy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Occupancy</span>
                  <span className={cn(
                    "text-[11px] font-semibold",
                    performanceMetrics.occupancy.change >= 0 ? "text-sage-600" : "text-rose-600"
                  )}>
                    {performanceMetrics.occupancy.change >= 0 ? '+' : ''}
                    {performanceMetrics.occupancy.change.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-semibold text-neutral-900">
                    {performanceMetrics.occupancy.thisWeek.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    vs {performanceMetrics.occupancy.lastWeek.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sage-500 transition-all duration-1000"
                    style={{ width: `${performanceMetrics.occupancy.thisWeek}%` }}
                  />
                </div>
              </div>

              {/* ADR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">ADR</span>
                  <span className={cn(
                    "text-[11px] font-semibold",
                    performanceMetrics.adr.change >= 0 ? "text-sage-600" : "text-rose-600"
                  )}>
                    {performanceMetrics.adr.change >= 0 ? '+' : ''}
                    {performanceMetrics.adr.change.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-semibold text-neutral-900">
                    {formatCurrency(performanceMetrics.adr.thisWeek)}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    vs {formatCurrency(performanceMetrics.adr.lastWeek)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (performanceMetrics.adr.thisWeek / performanceMetrics.adr.lastWeek) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            </LuxurySectionCard>
          </div>

          {/* Upcoming Arrivals - 6 columns */}
          <div className="col-span-12 lg:col-span-6">
            <LuxurySectionCard
              title="Upcoming Arrivals"
              subtitle="Today's check-ins"
              action={() => navigate('/admin/cms/bookings')}
              actionLabel="View All"
              className="h-full"
            >
            <div className="space-y-3">
              {upcomingArrivals.length > 0 ? (
                upcomingArrivals.map((arrival, idx) => {
                  const checkInTime = arrival.checkIn ? new Date(arrival.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                  return (
                    <div
                      key={arrival.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4.5 h-4.5 text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[13px] font-semibold text-neutral-800">{arrival.guest}</p>
                          {arrival.isVIP && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold-50">
                              <Crown className="w-2.5 h-2.5 text-gold-600" />
                              <span className="text-[9px] font-semibold text-gold-700 uppercase tracking-wider">VIP</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                          <span className="font-medium">Room {arrival.room}</span>
                          <span className="text-neutral-300">•</span>
                          <span>{checkInTime}</span>
                          {arrival.specialRequests && arrival.specialRequests.length > 0 && (
                            <>
                              <span className="text-neutral-300">•</span>
                              <span className="text-terra-600 font-medium">{arrival.specialRequests.length} requests</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-[11px] text-neutral-400 font-medium">
                  No arrivals scheduled for today
                </div>
              )}
            </div>
            </LuxurySectionCard>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* REVIEWS - 12 columns full width */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-12">
            <LuxurySectionCard
              title="Recent Reviews"
              subtitle="Latest guest feedback"
              action={() => navigate('/admin/reputation')}
              actionLabel="View All"
            >
          <div className="space-y-3">
            {recentReviews.map((review) => {
              const platformColors = {
                'Google': '#4285F4',
                'Booking.com': '#003580',
                'TripAdvisor': '#00AA6C',
                'Expedia': '#FFB800',
                'Yelp': '#D32323'
              };
              const sentimentColors = {
                'Positive': 'bg-sage-50 text-sage-700',
                'Negative': 'bg-rose-50 text-rose-700',
                'Neutral': 'bg-neutral-100 text-neutral-600'
              };

              return (
                <div
                  key={review.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                >
                  {/* Platform Badge */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                    style={{ backgroundColor: platformColors[review.platform] || '#A57865' }}
                  >
                    {review.platformIcon}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < review.rating ? "fill-gold-500 text-gold-500" : "text-neutral-200"
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider",
                        sentimentColors[review.sentiment] || sentimentColors.Neutral
                      )}>
                        {review.sentiment}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-neutral-800 mb-0.5">{review.guestName}</p>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {review.reviewText}
                    </p>
                    {review.hasReply && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-sage-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="font-semibold">Responded</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
            </LuxurySectionCard>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RECENT BOOKINGS - 12 columns full width */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <LuxurySectionCard
              title="Recent Bookings"
              subtitle="Latest reservations and check-ins"
              action={() => navigate('/admin/cms/bookings')}
              actionLabel="View All"
              noPadding
            >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50/30">
                  {['Guest', 'Room', 'Check-in', 'Check-out', 'Source', 'Amount', 'Status'].map((header, i) => (
                    <th
                      key={header}
                      className={cn(
                        'py-4 px-6 text-[10px] font-semibold uppercase tracking-widest text-neutral-400',
                        i === 5 ? 'text-right' : 'text-left'
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentBookings.map((booking, idx) => {
                  const initials = booking.guest?.split(' ').filter(n => n).map(n => n[0]).join('') || 'G' || 'G';
                  const avatarColors = ['#A57865', '#CDB261', '#4E5840', '#5C9BA4', '#B49A82'];

                  return (
                    <tr key={booking.id} className="bg-white hover:bg-neutral-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
                            style={{ backgroundColor: avatarColors[idx % avatarColors.length] }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-neutral-800">{booking.guest}</p>
                            <p className="text-[10px] text-neutral-400 font-medium">{booking.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-[13px] font-medium text-neutral-800">{booking.room}</p>
                        <p className="text-[10px] text-neutral-400 font-medium">{booking.roomType}</p>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-neutral-600 font-medium">
                        {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-neutral-600 font-medium">
                        {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-neutral-500 font-medium">
                        {booking.source || 'Direct'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-[13px] font-semibold text-neutral-900">
                          {formatCurrency(booking.totalAmount || 324)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <BookingStatus status={booking.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            </LuxurySectionCard>
          </div>
        </div>
      </main>

      <style>{`
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
