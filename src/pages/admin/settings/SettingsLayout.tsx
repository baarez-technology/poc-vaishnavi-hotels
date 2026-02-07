import { useState, useEffect } from 'react';
import { Building2, Shield, Plug, Palette, Brain, ChevronRight, TrendingUp, Menu, X } from 'lucide-react';
import HotelInfoTab from '../../../components/settings/HotelInfoTab';
import RoomTypesTab from '../../../components/settings/RoomTypesTab';
import TaxesTab from '../../../components/settings/TaxesTab';
import RolesPermissionsTab from '../../../components/settings/RolesPermissionsTab';
import IntegrationsTab from '../../../components/settings/IntegrationsTab';
import NotificationsTab from '../../../components/settings/NotificationsTab';
import BrandingTab from '../../../components/settings/BrandingTab';
import StaffPortalSettingsTab from '../../../components/settings/StaffPortalSettingsTab';
import AISettingsTab from '../../../components/settings/AISettingsTab';
import OverbookingSettingsTab from '../../../components/settings/OverbookingSettingsTab';
import { defaultSettings } from '../../../utils/settings';

const BRANDING_KEY = 'glimmora_branding';

type MainTab = 'property' | 'security' | 'connectivity' | 'appearance' | 'ai' | 'revenue';
type PropertySubTab = 'hotel-info' | 'room-types' | 'taxes';
type ConnectivitySubTab = 'integrations' | 'notifications';
type AISubTab = 'ai-settings' | 'staff-portal';
type RevenueSubTab = 'overbooking';

const navigationConfig = [
  {
    id: 'property' as MainTab,
    label: 'Property',
    icon: Building2,
    description: 'Hotel info, rooms & taxes',
    subTabs: [
      { id: 'hotel-info' as PropertySubTab, label: 'Hotel Info' },
      { id: 'room-types' as PropertySubTab, label: 'Room Types' },
      { id: 'taxes' as PropertySubTab, label: 'Taxes & Fees' },
    ],
  },
  {
    id: 'security' as MainTab,
    label: 'Security',
    icon: Shield,
    description: 'Roles & permissions',
    subTabs: [],
  },
  {
    id: 'connectivity' as MainTab,
    label: 'Connectivity',
    icon: Plug,
    description: 'Integrations & notifications',
    subTabs: [
      { id: 'integrations' as ConnectivitySubTab, label: 'Integrations' },
      { id: 'notifications' as ConnectivitySubTab, label: 'Notifications' },
    ],
  },
  {
    id: 'appearance' as MainTab,
    label: 'Appearance',
    icon: Palette,
    description: 'Branding & theme',
    subTabs: [],
  },
  {
    id: 'ai' as MainTab,
    label: 'AI & Automation',
    icon: Brain,
    description: 'AI settings & staff portal',
    subTabs: [
      { id: 'ai-settings' as AISubTab, label: 'AI Settings' },
      { id: 'staff-portal' as AISubTab, label: 'Staff Portal' },
    ],
  },
  {
    id: 'revenue' as MainTab,
    label: 'Revenue',
    icon: TrendingUp,
    description: 'Overbooking & yield management',
    subTabs: [
      { id: 'overbooking' as RevenueSubTab, label: 'Overbooking' },
    ],
  },
];

export default function SettingsLayout() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('property');
  const [propertySubTab, setPropertySubTab] = useState<PropertySubTab>('hotel-info');
  const [connectivitySubTab, setConnectivitySubTab] = useState<ConnectivitySubTab>('integrations');
  const [aiSubTab, setAISubTab] = useState<AISubTab>('ai-settings');
  const [revenueSubTab, setRevenueSubTab] = useState<RevenueSubTab>('overbooking');
  const [primaryColor, setPrimaryColor] = useState(defaultSettings.branding.primaryColor);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(BRANDING_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
      } catch (e) {
        console.error('Error parsing branding:', e);
      }
    }
  }, []);

  const renderContent = () => {
    switch (activeMainTab) {
      case 'property':
        switch (propertySubTab) {
          case 'hotel-info':
            return <HotelInfoTab />;
          case 'room-types':
            return <RoomTypesTab />;
          case 'taxes':
            return <TaxesTab />;
        }
        break;
      case 'security':
        return <RolesPermissionsTab />;
      case 'connectivity':
        switch (connectivitySubTab) {
          case 'integrations':
            return <IntegrationsTab />;
          case 'notifications':
            return <NotificationsTab />;
        }
        break;
      case 'appearance':
        return <BrandingTab />;
      case 'ai':
        switch (aiSubTab) {
          case 'ai-settings':
            return <AISettingsTab />;
          case 'staff-portal':
            return <StaffPortalSettingsTab />;
        }
        break;
      case 'revenue':
        switch (revenueSubTab) {
          case 'overbooking':
            return <OverbookingSettingsTab />;
        }
        break;
    }
    return null;
  };

  const getActiveSubTab = () => {
    switch (activeMainTab) {
      case 'property':
        return propertySubTab;
      case 'connectivity':
        return connectivitySubTab;
      case 'ai':
        return aiSubTab;
      case 'revenue':
        return revenueSubTab;
      default:
        return null;
    }
  };

  const setActiveSubTab = (tabId: string) => {
    switch (activeMainTab) {
      case 'property':
        setPropertySubTab(tabId as PropertySubTab);
        break;
      case 'connectivity':
        setConnectivitySubTab(tabId as ConnectivitySubTab);
        break;
      case 'ai':
        setAISubTab(tabId as AISubTab);
        break;
      case 'revenue':
        setRevenueSubTab(tabId as RevenueSubTab);
        break;
    }
  };

  const currentNav = navigationConfig.find((n) => n.id === activeMainTab);

  const handleNavItemClick = (id: MainTab) => {
    setActiveMainTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        {/* Page Header */}
        <header className="mb-4 sm:mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">Settings</h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">
              Manage your property configuration and preferences.
            </p>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-neutral-600" />
            ) : (
              <Menu className="w-5 h-5 text-neutral-600" />
            )}
          </button>
        </header>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar Navigation */}
          <div
            className={`${
              sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-72 pt-4 px-4 bg-[#F9F7F7]' : 'hidden'
            } lg:relative lg:block lg:w-64 lg:p-0 flex-shrink-0`}
          >
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="text-sm font-semibold text-neutral-700">Settings Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"
              >
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            <nav className="bg-neutral-50/80 rounded-[10px] overflow-hidden">
              {navigationConfig.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeMainTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors ${
                      index !== navigationConfig.length - 1 ? 'border-b border-neutral-100' : ''
                    } ${
                      isActive
                        ? 'bg-white shadow-sm border-l-[3px] border-l-terra-500'
                        : 'hover:bg-neutral-50 border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-terra-500 text-white' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13px] font-semibold ${
                          isActive ? 'text-terra-700' : 'text-neutral-800'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">{item.description}</p>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? 'text-terra-500' : 'text-neutral-300'
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Active Section Indicator */}
            <div className="lg:hidden mb-3 flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
              >
                {currentNav && (
                  <>
                    <currentNav.icon className="w-4 h-4 text-terra-500" />
                    <span className="text-sm font-semibold text-neutral-800">{currentNav.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  </>
                )}
              </button>
            </div>

            {/* Sub Navigation (if applicable) */}
            {currentNav && currentNav.subTabs.length > 0 && (
              <div className="bg-white rounded-lg px-1 py-1 mb-3 sm:mb-4 inline-flex gap-1 overflow-x-auto max-w-full">
                {currentNav.subTabs.map((tab) => {
                  const isActive = getActiveSubTab() === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`h-8 px-3 sm:px-3.5 rounded-md text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-terra-500 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab Content */}
            <div className="bg-white rounded-[10px] p-4 sm:p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
