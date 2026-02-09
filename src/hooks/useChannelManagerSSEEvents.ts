/**
 * Hook for integrating SSE with Channel Manager components
 * Handles availability, rates, and restrictions SSE events
 *
 * Uses refs for callbacks to ensure handlers are stable (registered once) and
 * always invoke the latest refetchData/callbacks - prevents handler churn
 * that could cause events to be missed during unregister/re-register cycles.
 */

import { useEffect, useRef } from 'react';
import { useSSE } from '../contexts/SSEContext';
import { SSEEvent, SSE_EVENT_TYPES } from '../api/services/sse.service';

interface UseChannelManagerSSEEventsOptions {
  onAvailabilityUpdated?: () => void;
  onRatesUpdated?: () => void;
  onRestrictionsUpdated?: () => void;
  onSyncStatus?: (status: any) => void;
  refetchData?: () => void | Promise<void>;
}

/**
 * Hook for handling channel manager-related SSE events
 */
export function useChannelManagerSSEEvents(options: UseChannelManagerSSEEventsOptions = {}) {
  const { registerEventHandler } = useSSE();
  const {
    onAvailabilityUpdated,
    onRatesUpdated,
    onRestrictionsUpdated,
    onSyncStatus,
    refetchData,
  } = options;

  // Refs ensure handlers stay stable (no re-register when callbacks change)
  const refs = useRef({
    onAvailabilityUpdated,
    onRatesUpdated,
    onRestrictionsUpdated,
    onSyncStatus,
    refetchData,
  });
  refs.current = {
    onAvailabilityUpdated,
    onRatesUpdated,
    onRestrictionsUpdated,
    onSyncStatus,
    refetchData,
  };

  // Register handlers once - they read latest callbacks via refs
  useEffect(() => {
    const handleAvailabilityUpdated = () => {
      const { onAvailabilityUpdated: cb, refetchData: refetch } = refs.current;
      if (cb) {
        cb();
      } else if (refetch) {
        const result = refetch();
        if (result instanceof Promise) {
          result.catch((err) => console.error('[useChannelManagerSSEEvents] Refetch failed:', err));
        }
      }
    };

    const handleRatesUpdated = () => {
      const { onRatesUpdated: cb, refetchData: refetch } = refs.current;
      if (cb) {
        cb();
      } else if (refetch) {
        const result = refetch();
        if (result instanceof Promise) {
          result.catch((err) => console.error('[useChannelManagerSSEEvents] Refetch failed:', err));
        }
      }
    };

    const handleRestrictionsUpdated = () => {
      const { onRestrictionsUpdated: cb, refetchData: refetch } = refs.current;
      if (cb) {
        cb();
      } else if (refetch) {
        const result = refetch();
        if (result instanceof Promise) {
          result.catch((err) => console.error('[useChannelManagerSSEEvents] Refetch failed:', err));
        }
      }
    };

    const handleSyncStatus = (event: SSEEvent) => {
      const { onSyncStatus: cb } = refs.current;
      if (cb) {
        cb(event.data?.status);
      }
    };

    const unregisterAvailability = registerEventHandler(
      SSE_EVENT_TYPES.AVAILABILITY_UPDATED,
      handleAvailabilityUpdated
    );
    const unregisterRates = registerEventHandler(
      SSE_EVENT_TYPES.RATES_UPDATED,
      handleRatesUpdated
    );
    const unregisterRestrictions = registerEventHandler(
      SSE_EVENT_TYPES.RESTRICTIONS_UPDATED,
      handleRestrictionsUpdated
    );
    const unregisterSync = registerEventHandler(
      SSE_EVENT_TYPES.SYNC_STATUS,
      handleSyncStatus
    );

    return () => {
      unregisterAvailability();
      unregisterRates();
      unregisterRestrictions();
      unregisterSync();
    };
  }, [registerEventHandler]);
}
