/**
 * RatePlanCard Component
 * Individual rate plan card with inline editing - Glimmora Design System v4.0
 * Redesigned for optimal UX with clear visual hierarchy
 */

import { useState, useEffect } from 'react';
import {
  Edit2, Check, X, Tag, Calendar,
  ChevronDown, ChevronUp, Globe, Clock, Ban, AlertCircle, Info,
  Utensils, Percent, TrendingUp, CheckCircle, XCircle
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { Tooltip } from '../ui2/Tooltip';
import { Button, IconButton } from '../ui2/Button';

export default function RatePlanCard({
  ratePlan,
  onUpdate,
  onToggleStatus,
  onViewDetails,
  isEditing: isEditingExternal,
  onEditStart,
  onEditEnd,
  disableEdit = false
}) {
  const { formatCurrency } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editData, setEditData] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editData]);

  const handleEdit = () => {
    if (disableEdit) return;

    setEditData({
      minStay: ratePlan.minStay ?? 1,
      maxStay: ratePlan.maxStay ?? 30,
      ctaEnabled: ratePlan.ctaEnabled ?? false,
      ctdEnabled: ratePlan.ctdEnabled ?? false
    });
    setValidationErrors([]);
    setIsEditing(true);
    if (onEditStart) onEditStart();
  };

  const validateData = () => {
    const errors = [];

    if (editData.minStay < 1) {
      errors.push({
        field: 'minStay',
        message: 'Minimum stay must be at least 1 night'
      });
    }

    if (editData.maxStay < 1) {
      errors.push({
        field: 'maxStay',
        message: 'Maximum stay must be at least 1 night'
      });
    }

    if (editData.minStay > editData.maxStay) {
      errors.push({
        field: 'minStay',
        message: 'Minimum stay cannot be greater than maximum stay'
      });
    }

    return errors;
  };

  const handleSave = () => {
    const errors = validateData();

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    onUpdate(ratePlan.id, editData);
    setIsEditing(false);
    setValidationErrors([]);
    if (onEditEnd) onEditEnd();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setValidationErrors([]);
    if (onEditEnd) onEditEnd();
  };

  const hasFieldError = (fieldName) => {
    return validationErrors.some(error => error.field === fieldName);
  };

  
  // Calculate price range
  const prices = Object.values(ratePlan.basePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <div className={`rounded-[10px] bg-white transition-all duration-200 ${
      !ratePlan.isActive ? 'opacity-60' : ''
    }`}>
      {/* Collapsed Header - Always Visible */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Identity */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Name & Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-neutral-800 truncate">
                  {ratePlan.name}
                </h3>
                <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded flex-shrink-0 ${
                  ratePlan.isActive
                    ? 'bg-sage-100 text-sage-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {ratePlan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium truncate">
                {ratePlan.fullName}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium ${!ratePlan.isActive ? 'text-neutral-600' : 'text-neutral-400'}`}>Off</span>
              <button
                onClick={() => onToggleStatus(ratePlan.id)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  ratePlan.isActive ? 'bg-terra-500' : 'bg-neutral-300'
                }`}
                title={ratePlan.isActive ? 'Deactivate' : 'Activate'}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    ratePlan.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[11px] font-medium ${ratePlan.isActive ? 'text-neutral-600' : 'text-neutral-400'}`}>On</span>
            </div>
            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              icon={isExpanded ? ChevronUp : ChevronDown}
              variant="ghost"
              size="sm"
              label={isExpanded ? 'Collapse details' : 'Expand details'}
            />
          </div>
        </div>

        {/* Quick Info Row - Pricing Grid */}
        <div className="mt-5 pt-5 border-t border-neutral-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(ratePlan.basePrice).map(([roomType, price]) => {
              const isLowest = price === minPrice;
              return (
                <div
                  key={roomType}
                  className={`p-3 rounded-lg text-center ${
                    isLowest ? 'bg-terra-50 ring-1 ring-terra-200' : 'bg-neutral-50'
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                    {roomType}
                  </p>
                  <p className={`text-lg font-bold tracking-tight ${
                    isLowest ? 'text-terra-600' : 'text-neutral-800'
                  }`}>
                    {formatCurrency(price)}
                  </p>
                  <p className="text-[9px] text-neutral-400 font-medium">per night</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-neutral-100">
          {/* Description */}
          <div className="px-6 py-4 bg-neutral-50/50">
            <p className="text-[13px] text-neutral-600 leading-relaxed">
              {ratePlan.description}
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stay Duration */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Stay</p>
                <p className="text-[13px] font-semibold text-neutral-800">
                  {ratePlan.minStay}–{ratePlan.maxStay} nights
                </p>
              </div>
            </div>

            {/* Meal Plan */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-4 h-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Meal Plan</p>
                <p className="text-[13px] font-semibold text-neutral-800">
                  {ratePlan.mealPlan}
                </p>
              </div>
            </div>

            {/* Commission */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <Percent className="w-4 h-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Commission</p>
                <p className="text-[13px] font-semibold text-terra-600">
                  {ratePlan.commission}%
                </p>
              </div>
            </div>

            {/* Channels */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Channels</p>
                <p className="text-[13px] font-semibold text-neutral-800">
                  {ratePlan.channels.length} active
                </p>
              </div>
            </div>
          </div>

          {/* Restrictions & Channels Section */}
          <div className="px-6 py-5 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Restrictions */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
                Booking Restrictions
              </h4>
              <div className="flex items-center gap-2">
                <Tooltip content="Closed to Arrival: Prevents new check-ins" side="top">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg ${
                    ratePlan.ctaEnabled
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {ratePlan.ctaEnabled ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    CTA {ratePlan.ctaEnabled ? 'On' : 'Off'}
                  </span>
                </Tooltip>
                <Tooltip content="Closed to Departure: Prevents check-outs" side="top">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg ${
                    ratePlan.ctdEnabled
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {ratePlan.ctdEnabled ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    CTD {ratePlan.ctdEnabled ? 'On' : 'Off'}
                  </span>
                </Tooltip>
              </div>
            </div>

            {/* Distribution Channels */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
                Distribution Channels
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {ratePlan.channels.map(channel => (
                  <span
                    key={channel}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-ocean-50 text-ocean-700"
                  >
                    <span className="w-1 h-1 rounded-full bg-ocean-500" />
                    {channel}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Price Rules */}
          {ratePlan.priceRules.length > 0 && (
            <div className="px-6 py-5 border-t border-neutral-100">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
                Dynamic Pricing Rules
              </h4>
              <div className="space-y-2">
                {ratePlan.priceRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      rule.adjustment > 0 ? 'bg-rose-100' : 'bg-sage-100'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${
                        rule.adjustment > 0 ? 'text-rose-500' : 'text-sage-500 rotate-180'
                      }`} />
                    </div>
                    <span className="text-[13px] text-neutral-700 flex-1">
                      {rule.type === 'weekend' && 'Weekend'}
                      {rule.type === 'flat' && 'Base adjustment'}
                      {rule.type === 'high_season' && `High season (${rule.startDate} - ${rule.endDate})`}
                      {rule.type === 'length_of_stay' && `${rule.minNights}+ nights`}
                      {rule.type === 'last_minute' && `Last minute (${rule.daysBeforeArrival} days)`}
                    </span>
                    <span className={`text-[13px] font-semibold ${
                      rule.adjustment > 0 ? 'text-rose-600' : 'text-sage-600'
                    }`}>
                      {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation Policy */}
          <div className="px-6 py-5 border-t border-neutral-100">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-2">
              Cancellation Policy
            </h4>
            <p className="text-[13px] text-neutral-600 leading-relaxed">
              {ratePlan.cancellationPolicy}
            </p>
          </div>

          {/* Edit Section */}
          {isEditing && (
            <div className="px-6 py-5 border-t border-neutral-100 bg-terra-50/30">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-4">
                Edit Restrictions
              </h4>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="text-[11px] font-semibold text-rose-700 mb-1">Please fix:</p>
                      {validationErrors.map((error, idx) => (
                        <p key={idx} className="text-[11px] text-rose-600">• {error.message}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stay Restrictions */}
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                    Stay Duration
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="text-[13px] w-16 font-medium text-neutral-600">Min</label>
                    <input
                      type="number"
                      value={editData.minStay}
                      onChange={(e) => setEditData(prev => ({ ...prev, minStay: parseInt(e.target.value) || 1 }))}
                      className={`w-20 h-9 px-3 rounded-lg text-sm bg-white border text-center font-semibold focus:outline-none transition-all duration-150 ${
                        hasFieldError('minStay')
                          ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/10'
                          : 'border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10'
                      }`}
                      min={1}
                    />
                    <span className="text-[13px] text-neutral-500">nights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[13px] w-16 font-medium text-neutral-600">Max</label>
                    <input
                      type="number"
                      value={editData.maxStay}
                      onChange={(e) => setEditData(prev => ({ ...prev, maxStay: parseInt(e.target.value) || 30 }))}
                      className={`w-20 h-9 px-3 rounded-lg text-sm bg-white border text-center font-semibold focus:outline-none transition-all duration-150 ${
                        hasFieldError('maxStay')
                          ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/10'
                          : 'border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10'
                      }`}
                      min={1}
                    />
                    <span className="text-[13px] text-neutral-500">nights</span>
                  </div>
                </div>

                {/* Booking Restrictions */}
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                    Booking Restrictions
                  </p>
                  <div
                    onClick={() => setEditData(prev => ({ ...prev, ctaEnabled: !(prev.ctaEnabled ?? false) }))}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-white transition-colors"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      (editData.ctaEnabled ?? false) ? 'bg-terra-500 border-terra-500' : 'border-neutral-300 bg-white'
                    }`}>
                      {(editData.ctaEnabled ?? false) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="text-[13px] font-medium text-neutral-800 block">CTA</span>
                      <span className="text-[10px] text-neutral-400">Closed to Arrival</span>
                    </div>
                  </div>
                  <div
                    onClick={() => setEditData(prev => ({ ...prev, ctdEnabled: !(prev.ctdEnabled ?? false) }))}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-white transition-colors"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      (editData.ctdEnabled ?? false) ? 'bg-terra-500 border-terra-500' : 'border-neutral-300 bg-white'
                    }`}>
                      {(editData.ctdEnabled ?? false) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="text-[13px] font-medium text-neutral-800 block">CTD</span>
                      <span className="text-[10px] text-neutral-400">Closed to Departure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
            <p className="text-[11px] text-neutral-400 font-medium">
              Last updated: {ratePlan.updatedAt}
            </p>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button onClick={handleCancel} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button onClick={handleSave} variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleEdit}
                disabled={disableEdit}
                variant="outline"
                size="sm"
                icon={Edit2}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
