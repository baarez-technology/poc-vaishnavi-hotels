import { useState, useRef, useEffect } from 'react';
import { Edit2, Lock, AlertTriangle, TrendingUp, TrendingDown, Check, X, Loader2, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../ui2/Modal';

const RateCell = ({
  date,
  roomData,
  isSelected,
  onSelect,
  onUpdateRate,
  onApplyRestriction,
  compact = false,
}) => {
  const { success, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showValidationError, setShowValidationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [largeChangeConfirm, setLargeChangeConfirm] = useState({ isOpen: false, newRate: null, percentChange: 0 });
  const cellRef = useRef(null);
  const tooltipRef = useRef(null);

  if (!roomData) return null;

  // Validation constants
  const MIN_RATE = 50; // Minimum allowed rate
  const MAX_RATE = 5000; // Maximum allowed rate
  const LARGE_CHANGE_THRESHOLD = 0.5; // 50% change requires confirmation

  const { dynamicRate, baseRate, available, restrictions, overrideRate, rates } = roomData;
  const hasOverride = overrideRate !== null;
  const rateChange = dynamicRate - baseRate;
  const rateChangePercent = Math.round((rateChange / baseRate) * 100);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditValue(dynamicRate.toString());
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    const newRate = parseInt(editValue, 10);

    // Clear previous errors
    setShowValidationError('');

    // Validation checks
    if (isNaN(newRate)) {
      setShowValidationError('Please enter a valid number');
      return;
    }

    if (newRate < MIN_RATE) {
      setShowValidationError(`Rate must be at least $${MIN_RATE}`);
      return;
    }

    if (newRate > MAX_RATE) {
      setShowValidationError(`Rate cannot exceed $${MAX_RATE}`);
      return;
    }

    // Check for large changes that require confirmation
    const changePercent = Math.abs((newRate - dynamicRate) / dynamicRate);
    if (changePercent > LARGE_CHANGE_THRESHOLD) {
      const percentChange = Math.round(changePercent * 100);
      setLargeChangeConfirm({ isOpen: true, newRate, percentChange });
      return;
    }

    // Continue with save
    await executeSave(newRate);
  };

  const executeSave = async (newRate) => {
    // Show loading state
    setIsSaving(true);

    try {
      // Simulate async save (in real app, this would be an API call)
      await new Promise(resolve => setTimeout(resolve, 300));

      onUpdateRate(date, newRate);

      // Show success toast
      const oldRate = dynamicRate;
      const change = newRate - oldRate;
      const changeText = change > 0 ? `+$${change}` : `-$${Math.abs(change)}`;

      success(`Rate updated to $${newRate} (${changeText})`, {
        duration: 3000
      });

      setIsEditing(false);
    } catch (err) {
      // Show error toast
      showError('Failed to update rate. Please try again.');
      setShowValidationError('Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave(e);
    if (e.key === 'Escape') handleCancel(e);
  };

  const confirmLargeChange = async () => {
    if (largeChangeConfirm.newRate) {
      await executeSave(largeChangeConfirm.newRate);
    }
    setLargeChangeConfirm({ isOpen: false, newRate: null, percentChange: 0 });
  };

  // Handle tooltip positioning
  const handleMouseEnter = (e) => {
    if (compact && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const tooltipWidth = 240; // Approximate width
      const tooltipHeight = 140; // Approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = rect.bottom + 8;
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

      // Adjust if tooltip goes off screen
      if (left + tooltipWidth > viewportWidth) {
        left = viewportWidth - tooltipWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
      if (top + tooltipHeight > viewportHeight) {
        top = rect.top - tooltipHeight - 8;
      }

      setTooltipPosition({ top, left });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Determine cell status color - using Glimmora palette
  const getStatusColor = () => {
    if (restrictions.stopSell) return 'bg-rose-50 border-rose-200';
    if (restrictions.CTA) return 'bg-ocean-50 border-ocean-200';
    if (available <= 2) return 'bg-terra-50 border-terra-200';
    if (available <= 5) return 'bg-gold-50 border-gold-200';
    return 'bg-white border-neutral-200';
  };

  if (compact) {
    return (
      <>
        <div
          ref={cellRef}
          onClick={() => onSelect(date)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`relative p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getStatusColor()} ${isSelected ? 'ring-2 ring-terra-500' : ''}`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-[15px] font-bold text-neutral-800">${dynamicRate}</p>
              <Info className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {rateChange !== 0 && (
              <p className={`text-[11px] font-semibold ${rateChange > 0 ? 'text-sage-600' : 'text-rose-600'}`}>
                {rateChange > 0 ? '+' : ''}{rateChangePercent}%
              </p>
            )}
            <p className="text-[11px] text-neutral-500">{available} left</p>
          </div>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="fixed z-[9999] w-60 p-4 bg-white rounded-[10px] shadow-xl border border-neutral-200 animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{ top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px` }}
          >
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-neutral-200 transform rotate-45" />

            {/* Content */}
            <div className="relative">
              <div className="mb-3 pb-3 border-b border-neutral-100">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">Rate Details</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-neutral-900">${dynamicRate}</p>
                  {hasOverride && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-terra-50 text-terra-600 rounded">
                      Override
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-500">BAR (Best Available)</span>
                  <span className="text-[13px] font-bold text-neutral-900">${rates.BAR}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-500">OTA Rate (+15%)</span>
                  <span className="text-[13px] font-bold text-neutral-900">${rates.OTA}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-500">Corporate (-20%)</span>
                  <span className="text-[13px] font-bold text-neutral-900">${rates.CORP}</span>
                </div>
              </div>

              {rateChange !== 0 && (
                <div className={`mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2 ${rateChange > 0 ? 'text-sage-600' : 'text-rose-600'}`}>
                  {rateChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-[11px] font-medium">
                    {rateChange > 0 ? '+' : ''}{rateChangePercent}% vs base rate (${baseRate})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Large Change Confirmation Modal */}
        <ConfirmModal
          open={largeChangeConfirm.isOpen}
          onClose={() => setLargeChangeConfirm({ isOpen: false, newRate: null, percentChange: 0 })}
          onConfirm={confirmLargeChange}
          title="Confirm Large Rate Change"
          description={`This is a ${largeChangeConfirm.percentChange}% change from $${dynamicRate} to $${largeChangeConfirm.newRate}. Are you sure you want to apply this rate change?`}
          variant="warning"
          confirmText="Apply Change"
          cancelText="Cancel"
        />
      </>
    );
  }

  return (
    <>
    <div
      onClick={() => onSelect(date)}
      className={`p-3 rounded-[10px] border cursor-pointer transition-all hover:shadow-md group ${getStatusColor()} ${isSelected ? 'ring-2 ring-terra-500 shadow-md' : ''}`}
    >
      {/* Rate Display */}
      <div className="flex items-start justify-between mb-2">
        {isEditing ? (
          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-20 px-2 py-1 text-lg font-bold border rounded-lg focus:outline-none focus:ring-2 ${
                  showValidationError
                    ? 'border-rose-500 focus:ring-rose-500/40'
                    : 'border-terra-400 focus:ring-terra-500/40'
                }`}
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-1 text-sage-600 hover:bg-sage-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save (Enter)"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                title="Cancel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {showValidationError && (
              <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-rose-600 bg-rose-50 rounded-md">
                <AlertTriangle className="w-3 h-3" />
                <span>{showValidationError}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-neutral-800">${dynamicRate}</span>
            {hasOverride && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-terra-50 text-terra-600 rounded">
                Override
              </span>
            )}
          </div>
        )}

        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="p-1.5 text-neutral-400 hover:text-terra-600 hover:bg-terra-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Rate Change Indicator */}
      {rateChange !== 0 && (
        <div className={`flex items-center gap-1 mb-2 ${rateChange > 0 ? 'text-sage-600' : 'text-rose-600'}`}>
          {rateChange > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span className="text-[11px] font-medium">
            {rateChange > 0 ? '+' : ''}{rateChangePercent}% vs base
          </span>
        </div>
      )}

      {/* Rate Codes */}
      <div className="space-y-1 mb-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-neutral-500">BAR</span>
          <span className="font-medium">${rates.BAR}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">OTA</span>
          <span className="font-medium">${rates.OTA}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Corp</span>
          <span className="font-medium">${rates.CORP}</span>
        </div>
      </div>

      {/* Availability */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-neutral-500">Available</span>
        <span className={`text-[13px] font-bold ${available <= 2 ? 'text-rose-600' : available <= 5 ? 'text-gold-600' : 'text-sage-600'}`}>
          {available} rooms
        </span>
      </div>

      {/* Restrictions */}
      <div className="flex flex-wrap gap-1">
        {restrictions.stopSell && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-rose-100 text-rose-700 rounded-full">
            <Lock className="w-3 h-3" />
            Stop Sell
          </span>
        )}
        {restrictions.CTA && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-ocean-100 text-ocean-700 rounded-full">
            CTA
          </span>
        )}
        {restrictions.CTD && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-terra-100 text-terra-700 rounded-full">
            CTD
          </span>
        )}
        {restrictions.minStay > 1 && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-ocean-100 text-ocean-700 rounded-full">
            Min {restrictions.minStay}N
          </span>
        )}
      </div>
    </div>

    {/* Large Change Confirmation Modal */}
    <ConfirmModal
      open={largeChangeConfirm.isOpen}
      onClose={() => setLargeChangeConfirm({ isOpen: false, newRate: null, percentChange: 0 })}
      onConfirm={confirmLargeChange}
      title="Confirm Large Rate Change"
      description={`This is a ${largeChangeConfirm.percentChange}% change from $${dynamicRate} to $${largeChangeConfirm.newRate}. Are you sure you want to apply this rate change?`}
      variant="warning"
      confirmText="Apply Change"
      cancelText="Cancel"
    />
    </>
  );
};

export default RateCell;
