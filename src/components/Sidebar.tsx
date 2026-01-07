import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BedDouble,
  UserCheck,
  ClipboardCheck,
  Wrench,
  MessageSquare,
  Contact,
  Settings,
  FileText,
  BookOpen,
  Calendar,
  Tag,
  Gift,
  Wifi,
  Link2,
  DollarSign,
  Ban,
  RefreshCw,
  TrendingUp,
  Zap,
  PieChart,
  Globe,
  Activity,
  Brain,
  Search,
  X,
  Layers,
  Radio,
  BarChart2,
  Cpu,
  FileBarChart,
  Cog,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import GlimmoraLogo from '../Assets/G white logo.svg';

/**
 * Glimmora Design System v5.0 - Modern Sidebar
 * Clean white background with accent highlights
 */

const navCategories = [
  {
    id: 'overview',
    name: 'Overview',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    ]
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: Cog,
    items: [
      { name: 'Bookings', icon: CalendarCheck, to: '/admin/bookings' },
      { name: 'Guests', icon: Users, to: '/admin/guests' },
      { name: 'Rooms', icon: BedDouble, to: '/admin/rooms' },
      { name: 'Staff', icon: UserCheck, to: '/admin/staff' },
      { name: 'Housekeeping', icon: ClipboardCheck, to: '/admin/housekeeping' },
      { name: 'Maintenance', icon: Wrench, to: '/admin/maintenance' },
    ]
  },
  {
    id: 'cms',
    name: 'CMS',
    icon: Layers,
    items: [
      { name: 'Bookings', icon: BookOpen, to: '/admin/cms/bookings' },
      { name: 'Availability', icon: Calendar, to: '/admin/cms/availability' },
      { name: 'Rate Plans', icon: Tag, to: '/admin/cms/rate-plans' },
      { name: 'Promotions', icon: Gift, to: '/admin/cms/promotions' },
    ]
  },
  {
    id: 'channel',
    name: 'Channels',
    icon: Radio,
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, to: '/admin/channel-manager', end: true },
      { name: 'OTA Connections', icon: Wifi, to: '/admin/channel-manager/ota' },
      { name: 'Room Mapping', icon: Link2, to: '/admin/channel-manager/mapping' },
      { name: 'Rate Sync', icon: DollarSign, to: '/admin/channel-manager/rate-sync' },
      { name: 'Restrictions', icon: Ban, to: '/admin/channel-manager/restrictions' },
      { name: 'Promotions', icon: Gift, to: '/admin/channel-manager/promotions' },
      { name: 'Sync Logs', icon: RefreshCw, to: '/admin/channel-manager/logs' },
    ]
  },
  {
    id: 'revenue',
    name: 'Revenue',
    icon: BarChart2,
    items: [
      { name: 'Dashboard', icon: TrendingUp, to: '/admin/revenue', end: true },
      { name: 'Rate Calendar', icon: Calendar, to: '/admin/revenue/calendar' },
      { name: 'Pickup Analysis', icon: Activity, to: '/admin/revenue/pickup' },
      { name: 'Demand Forecast', icon: Zap, to: '/admin/revenue/forecast' },
      { name: 'Competitors', icon: Globe, to: '/admin/revenue/competitors' },
      { name: 'Segmentation', icon: PieChart, to: '/admin/revenue/segments' },
      { name: 'Pricing Rules', icon: Settings, to: '/admin/revenue/pricing' },
      { name: 'Revenue AI', icon: Brain, to: '/admin/revenue/ai' },
    ]
  },
  {
    id: 'ai',
    name: 'AI Tools',
    icon: Cpu,
    items: [
      { name: 'Reputation AI', icon: MessageSquare, to: '/admin/ai/reputation' },
      { name: 'CRM AI', icon: Contact, to: '/admin/ai/crm' },
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: FileBarChart,
    items: [
      { name: 'Reports', icon: FileText, to: '/admin/reports' },
    ]
  },
  {
    id: 'system',
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Settings', icon: Settings, to: '/admin/settings' },
    ]
  }
];

const Sidebar = ({ isCollapsed, onToggle, renderBrandOnly, renderNavigationOnly }) => {
  const { isDark } = useTheme();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const activeCategory = navCategories.find(cat =>
      cat.items.some(item => location.pathname.startsWith(item.to))
    );
    if (activeCategory) {
      setExpandedSections(prev => ({ ...prev, [activeCategory.id]: true }));
    }
  }, [location.pathname]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const filteredCategories = searchQuery
    ? navCategories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.items.length > 0)
    : navCategories;

  // Brand Section
  if (renderBrandOnly) {
    return (
      <div className="h-full bg-white border-r border-neutral-100">
        <div className={`h-full flex items-center ${
          isCollapsed ? 'justify-center px-3' : 'justify-between px-5'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'}`}>
              <div className="w-full h-full rounded-xl flex items-center justify-center p-1.5 bg-gradient-to-br from-terra-500 to-terra-600">
                <img src={GlimmoraLogo} alt="Glimmora" className="w-full h-full object-contain" />
              </div>
            </div>

            {!isCollapsed && (
              <div>
                <h1 className="text-sm font-semibold text-neutral-800">
                  Glimmora
                </h1>
                <p className="text-[10px] text-neutral-400">
                  Hotel Management
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Navigation Section
  if (renderNavigationOnly) {
    return (
      <div className="h-full flex flex-col bg-white border-r border-neutral-100">
        {/* Search */}
        {!isCollapsed && (
          <div className="px-4 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full h-10 pl-9 pr-9 text-sm rounded-lg outline-none transition-all bg-neutral-50 border ${
                  isSearchFocused
                    ? 'border-terra-300 bg-white'
                    : 'border-transparent hover:border-neutral-200'
                } text-neutral-700 placeholder-neutral-400`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Expand button */}
        {isCollapsed && (
          <div className="px-2 pt-4 pb-3 flex justify-center">
            <button
              onClick={onToggle}
              className="p-2.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto custom-scrollbar ${
          isCollapsed ? 'px-2' : 'px-3'
        } pb-4`}>
          <div className="space-y-6">
            {filteredCategories.map((category) => {
              const isExpanded = expandedSections[category.id] !== false;
              const hasActiveItem = category.items.some(item =>
                location.pathname === item.to || location.pathname.startsWith(item.to + '/')
              );
              const isSingleItem = category.items.length === 1;
              const CategoryIcon = category.icon;

              return (
                <div key={category.id}>
                  {/* Category Header */}
                  {!isCollapsed && !isSingleItem && (
                    <button
                      onClick={() => toggleSection(category.id)}
                      className="w-full flex items-center justify-between px-3 py-2 mb-0.5 rounded-lg group hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon className={`w-4 h-4 ${
                          hasActiveItem ? 'text-terra-500' : 'text-neutral-400'
                        }`} />
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          hasActiveItem ? 'text-neutral-700' : 'text-neutral-500'
                        }`}>
                          {category.name}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                        isExpanded ? '' : '-rotate-90'
                      }`} />
                    </button>
                  )}


                  {/* Collapsed mode separator */}
                  {isCollapsed && (
                    <div className="flex justify-center py-2">
                      <div className="w-6 h-px bg-neutral-200" />
                    </div>
                  )}

                  {/* Items */}
                  <div className={`transition-all duration-200 ${
                    (isExpanded || isCollapsed || isSingleItem) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                  }`}>
                    {/* Collapsed mode - icons only */}
                    {isCollapsed ? (
                      <ul className="space-y-0.5">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.to} className="relative group/item">
                              <NavLink
                                to={item.to}
                                end={item.end || item.to === '/admin/dashboard'}
                                className={({ isActive }) =>
                                  `relative flex items-center justify-center p-3 mx-auto rounded-xl transition-all duration-150 ${
                                    isActive
                                      ? 'bg-terra-50 text-terra-600'
                                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                  }`
                                }
                              >
                                {({ isActive }) => (
                                  <Icon className={`flex-shrink-0 w-[18px] h-[18px] ${
                                    isActive ? 'text-terra-500' : 'text-neutral-400'
                                  }`} strokeWidth={1.75} />
                                )}
                              </NavLink>

                              {/* Tooltip */}
                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-neutral-800 text-white text-xs font-medium opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-150 whitespace-nowrap z-50">
                                {item.name}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : !isSingleItem || searchQuery ? (
                      /* Multi-item categories OR search results - tree structure, text only */
                      <div className={`relative ${searchQuery ? 'ml-3' : 'ml-[22px]'} pl-4 border-l border-neutral-200`}>
                        <ul className="space-y-0.5">
                          {category.items.map((item, index) => {
                            return (
                              <li key={item.to} className="relative group/item">
                                {/* Horizontal connector line */}
                                <div className={`absolute -left-4 top-1/2 w-3 h-px ${
                                  location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                                    ? 'bg-terra-400'
                                    : 'bg-neutral-200'
                                }`} />

                                <NavLink
                                  to={item.to}
                                  end={item.end || item.to === '/admin/dashboard'}
                                  className={({ isActive }) =>
                                    `relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 ${
                                      isActive
                                        ? 'bg-terra-50 text-terra-700'
                                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                    }`
                                  }
                                >
                                  {({ isActive }) => (
                                    <span className={`text-[13px] ${
                                      isActive ? 'font-medium' : 'font-normal'
                                    }`}>
                                      {item.name}
                                    </span>
                                  )}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      /* Single item categories (Dashboard, Reports, Settings) - with icon */
                      <ul className="space-y-0.5">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.to} className="relative group/item">
                              <NavLink
                                to={item.to}
                                end={item.end || item.to === '/admin/dashboard'}
                                className={({ isActive }) =>
                                  `relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                                    isActive
                                      ? 'bg-terra-50 text-terra-700'
                                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                                  }`
                                }
                              >
                                {({ isActive }) => (
                                  <>
                                    <Icon className={`flex-shrink-0 w-[18px] h-[18px] ${
                                      isActive ? 'text-terra-500' : 'text-neutral-400'
                                    }`} strokeWidth={1.75} />

                                    <span className={`text-[13px] ${
                                      isActive ? 'font-medium' : 'font-normal'
                                    }`}>
                                      {item.name}
                                    </span>
                                  </>
                                )}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  return null;
};

export default Sidebar;
