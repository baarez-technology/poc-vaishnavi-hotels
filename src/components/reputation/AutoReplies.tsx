import { useState } from 'react';
import { Save, Clock, Globe, Edit3, Check, X, Zap } from 'lucide-react';
import { SelectDropdown, Textarea } from '../ui2/Input';
import { Button } from '../ui2/Button';

const DELAY_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '3h', label: '3 Hours' },
  { value: '6h', label: '6 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '24h', label: '24 Hours' }
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' }
];

const TEMPLATE_TYPES = [
  {
    id: 'positive',
    label: 'Positive Reviews',
    description: 'For sentiment > 70',
    color: '#A57865',
    bgColor: 'bg-terra-50'
  },
  {
    id: 'neutral',
    label: 'Neutral Reviews',
    description: 'For sentiment 40-70',
    color: '#9CA3AF',
    bgColor: 'bg-neutral-100'
  },
  {
    id: 'negative',
    label: 'Negative Reviews',
    description: 'For sentiment < 40',
    color: '#CDB261',
    bgColor: 'bg-[#CDB261]/10'
  }
];

export default function AutoReplies({ settings, onSettingsChange }) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [tempTemplate, setTempTemplate] = useState('');
  const [saved, setSaved] = useState(false);

  const handleToggleAutoReply = () => {
    onSettingsChange({
      ...settings,
      autoReply: {
        ...settings.autoReply,
        enabled: !settings.autoReply.enabled
      }
    });
  };

  const handleDelayChange = (delay) => {
    onSettingsChange({
      ...settings,
      autoReply: {
        ...settings.autoReply,
        delay
      }
    });
  };

  const handleLanguageChange = (language) => {
    onSettingsChange({
      ...settings,
      autoReply: {
        ...settings.autoReply,
        language
      }
    });
  };

  const handleEditTemplate = (type) => {
    setEditingTemplate(type);
    setTempTemplate(settings.autoReply.templates[type]);
  };

  const handleSaveTemplate = () => {
    onSettingsChange({
      ...settings,
      autoReply: {
        ...settings.autoReply,
        templates: {
          ...settings.autoReply.templates,
          [editingTemplate]: tempTemplate
        }
      }
    });
    setEditingTemplate(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setTempTemplate('');
  };

  return (
    <div className="bg-white rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Auto-Reply Engine</h3>
            <p className="text-[13px] text-neutral-500 mt-0.5">AI-powered response automation</p>
          </div>

          {/* Enable Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-[13px] text-neutral-600 font-medium">
              {settings.autoReply?.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleToggleAutoReply}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.autoReply?.enabled ? 'bg-terra-500' : 'bg-neutral-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  settings.autoReply?.enabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Settings Row */}
        <div className="flex items-center gap-4">
          {/* Delay */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">Response Delay</p>
              <div className="w-[120px]">
                <SelectDropdown
                  value={settings.autoReply?.delay || '3h'}
                  onChange={(value) => handleDelayChange(value)}
                  options={DELAY_OPTIONS}
                  disabled={!settings.autoReply?.enabled}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-neutral-200" />

          {/* Language */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">Language</p>
              <div className="w-[120px]">
                <SelectDropdown
                  value={settings.autoReply?.language || 'en'}
                  onChange={(value) => handleLanguageChange(value)}
                  options={LANGUAGE_OPTIONS}
                  disabled={!settings.autoReply?.enabled}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Rules */}
        <div className="bg-neutral-50 rounded-[8px] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-terra-600" />
            <h4 className="text-[13px] font-semibold text-neutral-900">AI Response Rules</h4>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold-500" />
              <span className="text-[11px] text-neutral-600">Negative: Apology + recovery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neutral-400" />
              <span className="text-[11px] text-neutral-600">Neutral: Acknowledgment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-terra-500" />
              <span className="text-[11px] text-neutral-600">Positive: Appreciation + invite</span>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div>
          <h4 className="text-[13px] font-semibold text-neutral-900 mb-3">Response Templates</h4>
          <div className="space-y-3">
            {TEMPLATE_TYPES.map((type) => (
              <div
                key={type.id}
                className="bg-neutral-50 rounded-[8px] overflow-hidden"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">{type.label}</p>
                      <p className="text-[11px] text-neutral-500">{type.description}</p>
                    </div>
                  </div>
                  {editingTemplate !== type.id && (
                    <Button
                      variant="outline-neutral"
                      size="xs"
                      icon={Edit3}
                      onClick={() => handleEditTemplate(type.id)}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {editingTemplate === type.id ? (
                  <div className="px-4 pb-4">
                    <Textarea
                      value={tempTemplate}
                      onChange={(e) => setTempTemplate(e.target.value)}
                      rows={3}
                      placeholder="Enter template text... Use {guest} for guest name"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="primary" size="xs" onClick={handleSaveTemplate}>
                        Save
                      </Button>
                      <Button variant="outline" size="xs" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 pb-4">
                    <p className="text-[12px] text-neutral-600 line-clamp-2">
                      {settings.autoReply?.templates?.[type.id] || 'No template set'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Footer */}
      {(saved || settings.autoReply?.enabled) && (
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
          {saved ? (
            <div className="flex items-center gap-2 text-terra-600">
              <Check className="w-4 h-4" />
              <span className="text-[12px] font-medium">Template saved successfully!</span>
            </div>
          ) : settings.autoReply?.enabled ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-terra-500 animate-pulse" />
              <span className="text-[12px] text-neutral-600">
                Auto-reply active. Responses posted {settings.autoReply?.delay || '3h'} after new reviews.
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
