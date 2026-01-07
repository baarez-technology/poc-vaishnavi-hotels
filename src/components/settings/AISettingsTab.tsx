import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { defaultSettings, deepMerge } from '../../utils/settings';
import { Button } from '../ui2/Button';
import { SelectDropdown } from '../ui2/Input';

const STORAGE_KEY = 'glimmora_ai_settings';

// Toggle Switch Component
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-terra-500' : 'bg-neutral-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// Toggle Item Component
function ToggleItem({
  title,
  description,
  enabled,
  onChange
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

// Setting Row Component for select/input fields
function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-center justify-between">
        <div className="pr-4">
          <p className="text-sm font-medium text-neutral-900">{label}</p>
          {hint && <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>}
        </div>
        <div className="w-48">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AISettingsTab() {
  const [ai, setAI] = useState(defaultSettings.ai);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAI(deepMerge(defaultSettings.ai, parsed));
      } catch (e) {
        console.error('Error parsing AI settings from localStorage:', e);
      }
    }
  }, []);

  const saveAI = (newAI: typeof ai) => {
    setAI(newAI);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAI));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSection = (section: string, updates: Record<string, unknown>) => {
    saveAI({
      ...ai,
      [section]: { ...ai[section as keyof typeof ai], ...updates }
    });
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20 focus:outline-none transition-colors";

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">AI Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure AI modules and intelligence features
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-50 text-sage-600 rounded-lg">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Saved</span>
          </div>
        )}
      </header>

      {/* Revenue AI Section */}
      <section className="bg-neutral-50/50 rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Revenue AI</h2>
        </div>
        <div className="p-6">
          <ToggleItem
            title="Competitor Rate Tracking"
            description="Monitor and compare rates from competing properties"
            enabled={ai.revenueAI.competitorTracking}
            onChange={(value) => updateSection('revenueAI', { competitorTracking: value })}
          />
          <SettingRow label="Forecast Interval" hint="How often to update forecasts">
            <SelectDropdown
              value={ai.revenueAI.forecastInterval}
              onChange={(value) => updateSection('revenueAI', { forecastInterval: value })}
              options={[
                { value: 'hourly', label: 'Hourly' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Aggressiveness Level" hint="How bold rate recommendations should be">
            <SelectDropdown
              value={ai.revenueAI.aggressivenessLevel}
              onChange={(value) => updateSection('revenueAI', { aggressivenessLevel: value })}
              options={[
                { value: 'conservative', label: 'Conservative' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'aggressive', label: 'Aggressive' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Rate Update Policy" hint="How rate changes are applied">
            <SelectDropdown
              value={ai.revenueAI.rateUpdatePolicy}
              onChange={(value) => updateSection('revenueAI', { rateUpdatePolicy: value })}
              options={[
                { value: 'manual', label: 'Manual Approval' },
                { value: 'auto', label: 'Auto-Apply' },
                { value: 'scheduled', label: 'Scheduled' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Min Rate Change" hint="Minimum percentage change to trigger update">
            <input
              type="number"
              value={ai.revenueAI.minRateChange}
              onChange={(e) => updateSection('revenueAI', { minRateChange: parseInt(e.target.value) })}
              min="1"
              max="20"
              className={inputClass}
            />
          </SettingRow>
          <SettingRow label="Max Rate Change" hint="Maximum percentage change allowed">
            <input
              type="number"
              value={ai.revenueAI.maxRateChange}
              onChange={(e) => updateSection('revenueAI', { maxRateChange: parseInt(e.target.value) })}
              min="10"
              max="100"
              className={inputClass}
            />
          </SettingRow>
        </div>
      </section>

      {/* Reputation AI Section */}
      <section className="bg-neutral-50/50 rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Reputation AI</h2>
        </div>
        <div className="p-6">
          <ToggleItem
            title="Auto-Response"
            description="Automatically generate review responses"
            enabled={ai.reputationAI.autoResponse}
            onChange={(value) => updateSection('reputationAI', { autoResponse: value })}
          />
          <ToggleItem
            title="Alert on Negative Reviews"
            description="Get notified when negative reviews are detected"
            enabled={ai.reputationAI.alertOnNegative}
            onChange={(value) => updateSection('reputationAI', { alertOnNegative: value })}
          />
          <ToggleItem
            title="Use Response Templates"
            description="Apply templates when generating responses"
            enabled={ai.reputationAI.responseTemplates}
            onChange={(value) => updateSection('reputationAI', { responseTemplates: value })}
          />
          <SettingRow label="Auto-Response Delay" hint="Hours to wait before auto-responding">
            <input
              type="number"
              value={ai.reputationAI.autoResponseDelay}
              onChange={(e) => updateSection('reputationAI', { autoResponseDelay: parseInt(e.target.value) })}
              min="1"
              max="72"
              className={inputClass}
            />
          </SettingRow>
          <SettingRow label="Sentiment Threshold" hint="Percentage below which review is negative">
            <input
              type="number"
              value={ai.reputationAI.sentimentThreshold}
              onChange={(e) => updateSection('reputationAI', { sentimentThreshold: parseInt(e.target.value) })}
              min="10"
              max="70"
              className={inputClass}
            />
          </SettingRow>
          <SettingRow label="Escalate Threshold" hint="Percentage below which to alert manager">
            <input
              type="number"
              value={ai.reputationAI.escalateThreshold}
              onChange={(e) => updateSection('reputationAI', { escalateThreshold: parseInt(e.target.value) })}
              min="5"
              max="40"
              className={inputClass}
            />
          </SettingRow>
        </div>
      </section>

      {/* CRM AI Section */}
      <section className="bg-neutral-50/50 rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">CRM AI</h2>
        </div>
        <div className="p-6">
          <ToggleItem
            title="AI Segmentation"
            description="Automatically segment guests based on behavior"
            enabled={ai.crmAI.segmentationEnabled}
            onChange={(value) => updateSection('crmAI', { segmentationEnabled: value })}
          />
          <ToggleItem
            title="Auto-Tag Guests"
            description="Automatically apply tags based on guest activity"
            enabled={ai.crmAI.autoTagging}
            onChange={(value) => updateSection('crmAI', { autoTagging: value })}
          />
          <SettingRow label="Churn Threshold" hint="Percentage above which guest is at-risk">
            <input
              type="number"
              value={ai.crmAI.churnThreshold}
              onChange={(e) => updateSection('crmAI', { churnThreshold: parseInt(e.target.value) })}
              min="10"
              max="60"
              className={inputClass}
            />
          </SettingRow>
          <SettingRow label="Upgrade Likelihood Cutoff" hint="Show upgrade suggestions above this percentage">
            <input
              type="number"
              value={ai.crmAI.upgradeLikelihoodCutoff}
              onChange={(e) => updateSection('crmAI', { upgradeLikelihoodCutoff: parseInt(e.target.value) })}
              min="50"
              max="95"
              className={inputClass}
            />
          </SettingRow>
          <SettingRow label="Return Probability Window" hint="Days to calculate return probability">
            <input
              type="number"
              value={ai.crmAI.returnProbabilityWindow}
              onChange={(e) => updateSection('crmAI', { returnProbabilityWindow: parseInt(e.target.value) })}
              min="30"
              max="730"
              className={inputClass}
            />
          </SettingRow>
        </div>
      </section>

      {/* Baarez AI Assistant Section */}
      <section className="bg-neutral-50/50 rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Baarez AI Assistant</h2>
        </div>
        <div className="p-6">
          <ToggleItem
            title="Enable Assistant"
            description="Activate Baarez AI voice assistant"
            enabled={ai.baarezAssistant.enabled}
            onChange={(value) => updateSection('baarezAssistant', { enabled: value })}
          />
          <ToggleItem
            title="Wake Word"
            description="Activate with 'Hey Baarez' voice command"
            enabled={ai.baarezAssistant.wakeWord}
            onChange={(value) => updateSection('baarezAssistant', { wakeWord: value })}
          />
          <ToggleItem
            title="Mic Auto-Start"
            description="Start listening when page loads"
            enabled={ai.baarezAssistant.micAutoStart}
            onChange={(value) => updateSection('baarezAssistant', { micAutoStart: value })}
          />
          <ToggleItem
            title="Voice Responses"
            description="Enable text-to-speech for responses"
            enabled={ai.baarezAssistant.voiceResponse}
            onChange={(value) => updateSection('baarezAssistant', { voiceResponse: value })}
          />
          <SettingRow label="Command Sensitivity" hint="How strictly commands are matched">
            <SelectDropdown
              value={ai.baarezAssistant.commandSensitivity}
              onChange={(value) => updateSection('baarezAssistant', { commandSensitivity: value })}
              options={[
                { value: 'low', label: 'Low (strict)' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High (fuzzy)' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Language" hint="Voice recognition language">
            <SelectDropdown
              value={ai.baarezAssistant.language}
              onChange={(value) => updateSection('baarezAssistant', { language: value })}
              options={[
                { value: 'en-IN', label: 'English (India)' },
                { value: 'en-US', label: 'English (US)' },
                { value: 'en-GB', label: 'English (UK)' },
                { value: 'hi-IN', label: 'Hindi' },
              ]}
            />
          </SettingRow>
        </div>
      </section>
    </div>
  );
}
