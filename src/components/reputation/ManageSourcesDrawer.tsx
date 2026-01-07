import { useState, useEffect } from 'react';
import { RefreshCw, Key, Clock, Check, Link2 } from 'lucide-react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { Select, Input } from '../ui2/Input';
import { PLATFORMS } from '../../utils/reputation';

interface SourceConfig {
  platform: string;
  enabled: boolean;
  apiKey: string;
  importFrequency: string;
  lastSync?: string;
}

interface ManageSourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sourcesConfig: SourceConfig[];
  onSave: (config: SourceConfig[]) => void;
}

export default function ManageSourcesDrawer({ isOpen, onClose, sourcesConfig, onSave }: ManageSourcesDrawerProps) {
  const [config, setConfig] = useState<SourceConfig[]>([]);

  useEffect(() => {
    if (sourcesConfig) {
      setConfig([...sourcesConfig]);
    }
  }, [sourcesConfig]);

  const handleToggle = (platformId: string) => {
    setConfig(prev => prev.map(source =>
      source.platform === platformId
        ? { ...source, enabled: !source.enabled }
        : source
    ));
  };

  const handleApiKeyChange = (platformId: string, value: string) => {
    setConfig(prev => prev.map(source =>
      source.platform === platformId
        ? { ...source, apiKey: value }
        : source
    ));
  };

  const handleFrequencyChange = (platformId: string, value: string) => {
    setConfig(prev => prev.map(source =>
      source.platform === platformId
        ? { ...source, importFrequency: value }
        : source
    ));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const getPlatformConfig = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId) || { name: platformId, color: '#6B7280', icon: '?' };
  };

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Save Changes
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Review Sources"
      subtitle="Configure OTA platform connections"
      maxWidth="max-w-xl"
      footer={footer}
    >
      <div className="space-y-4">
        {config.map((source) => {
          const platform = getPlatformConfig(source.platform);
          return (
            <div
              key={source.platform}
              className={`rounded-[10px] border p-4 transition-colors ${
                source.enabled
                  ? 'bg-white border-terra-200'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-[8px] flex items-center justify-center text-white font-bold text-base"
                    style={{ backgroundColor: source.enabled ? platform.color : '#9CA3AF' }}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-neutral-900">{platform.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Last sync: {formatLastSync(source.lastSync)}
                    </div>
                  </div>
                </div>

                {/* Enable Toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span className="text-[12px] text-neutral-600 font-medium">
                    {source.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleToggle(source.platform)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      source.enabled ? 'bg-terra-500' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        source.enabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {source.enabled && (
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  {/* API Key */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Key className="w-3 h-3" />
                      API Key
                    </label>
                    <Input
                      type="password"
                      value={source.apiKey}
                      onChange={(e) => handleApiKeyChange(source.platform, e.target.value)}
                      placeholder="Enter API key..."
                    />
                  </div>

                  {/* Import Frequency */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3" />
                      Import Frequency
                    </label>
                    <Select
                      value={source.importFrequency}
                      onChange={(e) => handleFrequencyChange(source.platform, e.target.value)}
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </Select>
                  </div>

                  {/* Test Connection Button */}
                  <Button variant="ghost" size="sm" icon={Check}>
                    Test Connection
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Additional Connections */}
        <div className="bg-neutral-50 rounded-[10px] p-4 border border-dashed border-neutral-300">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-neutral-500" />
            <h3 className="text-[14px] font-semibold text-neutral-900">Connect Additional Sources</h3>
          </div>
          <p className="text-[12px] text-neutral-600 mb-4">
            Link your Google Business Profile or TripAdvisor account to automatically import reviews.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline-neutral" size="sm">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#4285F4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Connect Google
            </Button>
            <Button variant="outline-neutral" size="sm">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#00AF87">
                <circle cx="12" cy="12" r="10" />
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">T</text>
              </svg>
              Connect TripAdvisor
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
