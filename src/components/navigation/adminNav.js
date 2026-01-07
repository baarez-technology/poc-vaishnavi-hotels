import {
  Activity,
  Ban,
  BarChart2,
  BedDouble,
  BookOpen,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  Cog,
  Contact,
  Cpu,
  DollarSign,
  FileBarChart,
  FileText,
  Gift,
  Globe,
  LayoutDashboard,
  Layers,
  Link2,
  MessageSquare,
  PieChart,
  Radio,
  RefreshCw,
  Settings,
  Tag,
  TrendingUp,
  Users,
  Wifi,
  Wrench,
  Zap,
  Brain,
} from 'lucide-react';

export const adminNavCategories = [
  {
    id: 'overview',
    name: 'Overview',
    icon: LayoutDashboard,
    items: [{ name: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' }],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: Cog,
    items: [
      { name: 'Bookings', icon: CalendarCheck, to: '/admin/bookings' },
      { name: 'Guests', icon: Users, to: '/admin/guests' },
      { name: 'Rooms', icon: BedDouble, to: '/admin/rooms' },
      { name: 'Housekeeping', icon: ClipboardCheck, to: '/admin/housekeeping' },
      { name: 'Maintenance', icon: Wrench, to: '/admin/maintenance' },
    ],
  },
  {
    id: 'cms',
    name: 'Central Management',
    shortName: 'CMS',
    icon: Layers,
    items: [
      { name: 'Bookings', icon: BookOpen, to: '/admin/cms/bookings' },
      { name: 'Availability', icon: Calendar, to: '/admin/cms/availability' },
      { name: 'Rate Plans', icon: Tag, to: '/admin/cms/rate-plans' },
      { name: 'Promotions', icon: Gift, to: '/admin/cms/promotions' },
    ],
  },
  {
    id: 'channel',
    name: 'Channel Manager',
    shortName: 'Channels',
    icon: Radio,
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, to: '/admin/channel-manager' },
      { name: 'OTA Connections', icon: Wifi, to: '/admin/channel-manager/ota' },
      { name: 'Room Mapping', icon: Link2, to: '/admin/channel-manager/mapping' },
      { name: 'Rate Sync', icon: DollarSign, to: '/admin/channel-manager/rate-sync' },
      { name: 'Restrictions', icon: Ban, to: '/admin/channel-manager/restrictions' },
      { name: 'Promotions', icon: Gift, to: '/admin/channel-manager/promotions' },
      { name: 'Sync Logs', icon: RefreshCw, to: '/admin/channel-manager/logs' },
    ],
  },
  {
    id: 'revenue',
    name: 'Revenue Management',
    shortName: 'Revenue',
    icon: BarChart2,
    items: [
      { name: 'RMS Dashboard', icon: TrendingUp, to: '/admin/revenue' },
      { name: 'Rate Calendar', icon: Calendar, to: '/admin/revenue/calendar' },
      { name: 'Pickup Analysis', icon: Activity, to: '/admin/revenue/pickup' },
      { name: 'Demand Forecast', icon: Zap, to: '/admin/revenue/forecast' },
      { name: 'Competitors', icon: Globe, to: '/admin/revenue/competitors' },
      { name: 'Segmentation', icon: PieChart, to: '/admin/revenue/segments' },
      { name: 'Pricing Rules', icon: Settings, to: '/admin/revenue/pricing' },
      { name: 'Revenue AI', icon: Brain, to: '/admin/revenue/ai' },
    ],
  },
  {
    id: 'ai',
    name: 'AI Intelligence',
    shortName: 'AI',
    icon: Cpu,
    items: [
      { name: 'Reputation AI', icon: MessageSquare, to: '/admin/ai/reputation' },
      { name: 'CRM AI', icon: Contact, to: '/admin/ai/crm' },
      { name: 'ReConnect AI', icon: Brain, to: '/admin/ai/crm-dashboard' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: FileBarChart,
    items: [{ name: 'Reports', icon: FileText, to: '/admin/reports' }],
  },
  {
    id: 'system',
    name: 'System',
    icon: Settings,
    items: [{ name: 'Settings', icon: Settings, to: '/admin/settings' }],
  },
];







