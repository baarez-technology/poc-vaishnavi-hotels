import { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { DEFAULT_LOYALTY_TIERS } from '../../../utils/crm';
import { sampleGuests, sampleSegments } from '../../../data/crmData';
import SegmentDetails from './SegmentDetails';

// Storage keys
const GUESTS_STORAGE_KEY = 'glimmora_crm_guests';
const SEGMENTS_STORAGE_KEY = 'glimmora_crm_segments';
const TIERS_STORAGE_KEY = 'glimmora_crm_tiers';

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e);
  }
  return defaultValue;
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

export default function SegmentDetailsWrapper() {
  const { showToast } = useToast();

  const [guests] = useState(() => loadFromStorage(GUESTS_STORAGE_KEY, sampleGuests));
  const [segments, setSegments] = useState(() => loadFromStorage(SEGMENTS_STORAGE_KEY, sampleSegments));
  const [loyaltyTiers] = useState(() => loadFromStorage(TIERS_STORAGE_KEY, DEFAULT_LOYALTY_TIERS));

  // Persist segments to localStorage
  useEffect(() => {
    saveToStorage(SEGMENTS_STORAGE_KEY, segments);
  }, [segments]);

  const handleUpdateSegment = (updatedSegment) => {
    setSegments(prev => prev.map(s => s.id === updatedSegment.id ? updatedSegment : s));
  };

  const handleDeleteSegment = (segmentId) => {
    setSegments(prev => prev.filter(s => s.id !== segmentId));
  };

  return (
    <SegmentDetails
      segments={segments}
      guests={guests}
      loyaltyTiers={loyaltyTiers}
      onUpdateSegment={handleUpdateSegment}
      onDeleteSegment={handleDeleteSegment}
      showToast={showToast}
    />
  );
}
