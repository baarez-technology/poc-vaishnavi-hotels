import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Gift,
  DollarSign,
  Moon
} from 'lucide-react';
import { generateId, countByLoyaltyTier, formatCurrency } from '../../utils/crm';

const TIER_COLORS = [
  '#CD7F32', '#C0C0C0', '#CDB261', '#E5E4E2', '#A57865',
  '#4E5840', '#5C9BA4', '#8E6554', '#6B7280', '#FFD700'
];

const TIER_ICONS = ['🥉', '🥈', '🥇', '💎', '👑', '⭐', '🏆', '💫', '✨', '🌟'];

function TierModal({ isOpen, onClose, onSave, tier, mode }) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    color: tier?.color || TIER_COLORS[0],
    icon: tier?.icon || TIER_ICONS[0],
    minNights: tier?.minNights || 0,
    minRevenue: tier?.minRevenue || 0,
    benefits: tier?.benefits || ['']
  });

  // ESC key handler and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData(prev => ({ ...prev, benefits: newBenefits }));
  };

  const handleAddBenefit = () => {
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
  };

  const handleRemoveBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const tierData = {
      id: tier?.id || generateId(),
      name: formData.name.trim(),
      color: formData.color,
      icon: formData.icon,
      minNights: parseInt(formData.minNights) || 0,
      minRevenue: parseInt(formData.minRevenue) || 0,
      benefits: formData.benefits.filter(b => b.trim())
    };

    onSave(tierData);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md max-h-[90vh] bg-white shadow-2xl rounded-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {mode === 'create' ? 'Create Tier' : 'Edit Tier'}
                </h2>
                <p className="text-sm text-neutral-500">Configure loyalty tier settings</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Tier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Gold"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Tier Color</label>
              <div className="flex flex-wrap gap-2">
                {TIER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-lg transition-transform ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-[#A57865] scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">Tier Icon</label>
              <div className="flex flex-wrap gap-2">
                {TIER_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-transform ${
                      formData.icon === icon
                        ? 'bg-[#A57865]/10 ring-2 ring-[#A57865] scale-110'
                        : 'bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">
                  Minimum Nights
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minNights}
                  onChange={(e) => setFormData(prev => ({ ...prev, minNights: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">
                  Minimum Revenue
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minRevenue}
                  onChange={(e) => setFormData(prev => ({ ...prev, minRevenue: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">
                Benefits
              </label>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      placeholder="e.g., 10% room discount"
                      className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
                    />
                    {formData.benefits.length > 1 && (
                      <button
                        onClick={() => handleRemoveBenefit(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddBenefit}
                  className="flex items-center gap-1 text-sm text-[#A57865] hover:text-[#8E6554]"
                >
                  <Plus className="w-4 h-4" />
                  Add benefit
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-neutral-200 p-4 bg-white rounded-b-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  formData.name.trim()
                    ? 'bg-[#4E5840] text-white hover:bg-[#3d4632]'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {mode === 'create' ? 'Create Tier' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

export default function LoyaltyTiers({ tiers, guests, onSave, onDelete }) {
  const [modalState, setModalState] = useState({ isOpen: false, tier: null, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const tierCounts = countByLoyaltyTier(guests || [], tiers);

  const handleCreateTier = () => {
    setModalState({ isOpen: true, tier: null, mode: 'create' });
  };

  const handleEditTier = (tier) => {
    setModalState({ isOpen: true, tier, mode: 'edit' });
  };

  const handleSaveTier = (tierData) => {
    if (modalState.mode === 'create') {
      onSave([...tiers, tierData]);
    } else {
      onSave(tiers.map(t => t.id === tierData.id ? tierData : t));
    }
  };

  const handleDeleteTier = (tierId) => {
    onDelete(tierId);
    setDeleteConfirm(null);
  };

  const sortedTiers = [...tiers].sort((a, b) => a.minNights - b.minNights);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#CDB261]/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-[#CDB261]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Loyalty Tiers</h3>
            <p className="text-sm text-neutral-500">{tiers.length} tiers configured</p>
          </div>
        </div>
        <button
          onClick={handleCreateTier}
          className="flex items-center gap-2 px-4 py-2 bg-[#A57865] text-white rounded-lg text-sm font-medium hover:bg-[#A57865]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      <div className="space-y-3">
        {sortedTiers.map((tier) => (
          <div
            key={tier.id}
            className="border border-neutral-200 rounded-xl p-4 hover:border-[#A57865]/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${tier.color}20` }}
                >
                  {tier.icon}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900" style={{ color: tier.color }}>
                    {tier.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      {tier.minNights}+ nights
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(tier.minRevenue)}+ spend
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">
                  {tierCounts[tier.id] || 0} guests
                </span>
                <button
                  onClick={() => handleEditTier(tier)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-neutral-500" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(tier.id)}
                  className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </div>

            {tier.benefits && tier.benefits.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 mb-2">Benefits:</p>
                <div className="flex flex-wrap gap-2">
                  {tier.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
                    >
                      <Check className="w-3 h-3" />
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deleteConfirm === tier.id && (
              <div className="mt-3 pt-3 border-t border-neutral-100 bg-rose-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                <p className="text-sm text-rose-800 mb-2">Delete this tier?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <TierModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, tier: null, mode: 'create' })}
        onSave={handleSaveTier}
        tier={modalState.tier}
        mode={modalState.mode}
      />
    </div>
  );
}
