/**
 * Hook for integrating SSE with Channel Manager components
 * Handles availability, rates, and restrictions SSE events
 */

import { useEffect, useCallback } from 'react';
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

  // Handle availability.updated event
  useEffect(() => {
    console.log('[useChannelManagerSSEEvents] 📝 Registering handler for availability.updated');
    return registerEventHandler(SSE_EVENT_TYPES.AVAILABILITY_UPDATED, (event: SSEEvent) => {
      console.log('[useChannelManagerSSEEvents] 🏠 AVAILABILITY.UPDATED EVENT RECEIVED');
      console.log('[useChannelManagerSSEEvents]   Full event:', JSON.stringify(event, null, 2));
      
      if (onAvailabilityUpdated) {
        console.log('[useChannelManagerSSEEvents]   Calling onAvailabilityUpdated callback');
        onAvailabilityUpdated();
      } else if (refetchData) {
        console.log('[useChannelManagerSSEEvents]   ⚡ Triggering refetchData...');
        try {
          const result = refetchData();
          if (result instanceof Promise) {
            result.then(() => console.log('[useChannelManagerSSEEvents]   ✅ Refetch completed'));
          }
        } catch (error) {
          console.error('[useChannelManagerSSEEvents]   ❌ Error calling refetchData:', error);
        }
      }
    });
  }, [registerEventHandler, onAvailabilityUpdated, refetchData]);

  // Handle rates.updated event
  useEffect(() => {
    console.log('[useChannelManagerSSEEvents] 📝 Registering handler for rates.updated');
    return registerEventHandler(SSE_EVENT_TYPES.RATES_UPDATED, (event: SSEEvent) => {
      console.log('[useChannelManagerSSEEvents] 💰 RATES.UPDATED EVENT RECEIVED');
      console.log('[useChannelManagerSSEEvents]   Full event:', JSON.stringify(event, null, 2));
      
      if (onRatesUpdated) {
        console.log('[useChannelManagerSSEEvents]   Calling onRatesUpdated callback');
        onRatesUpdated();
      } else if (refetchData) {
        console.log('[useChannelManagerSSEEvents]   ⚡ Triggering refetchData...');
        try {
          const result = refetchData();
          if (result instanceof Promise) {
            result.then(() => console.log('[useChannelManagerSSEEvents]   ✅ Refetch completed'));
          }
        } catch (error) {
          console.error('[useChannelManagerSSEEvents]   ❌ Error calling refetchData:', error);
        }
      }
    });
  }, [registerEventHandler, onRatesUpdated, refetchData]);

  // Handle restrictions.updated event
  useEffect(() => {
    console.log('[useChannelManagerSSEEvents] 📝 Registering handler for restrictions.updated');
    return registerEventHandler(SSE_EVENT_TYPES.RESTRICTIONS_UPDATED, (event: SSEEvent) => {
      console.log('[useChannelManagerSSEEvents] 🔒 RESTRICTIONS.UPDATED EVENT RECEIVED');
      console.log('[useChannelManagerSSEEvents]   Full event:', JSON.stringify(event, null, 2));
      
      if (onRestrictionsUpdated) {
        console.log('[useChannelManagerSSEEvents]   Calling onRestrictionsUpdated callback');
        onRestrictionsUpdated();
      } else if (refetchData) {
        console.log('[useChannelManagerSSEEvents]   ⚡ Triggering refetchData...');
        try {
          const result = refetchData();
          if (result instanceof Promise) {
            result.then(() => console.log('[useChannelManagerSSEEvents]   ✅ Refetch completed'));
          }
        } catch (error) {
          console.error('[useChannelManagerSSEEvents]   ❌ Error calling refetchData:', error);
        }
      }
    });
  }, [registerEventHandler, onRestrictionsUpdated, refetchData]);

  // Handle sync.status event
  useEffect(() => {
    console.log('[useChannelManagerSSEEvents] 📝 Registering handler for sync.status');
    return registerEventHandler(SSE_EVENT_TYPES.SYNC_STATUS, (event: SSEEvent) => {
      console.log('[useChannelManagerSSEEvents] 🔄 SYNC.STATUS EVENT RECEIVED');
      console.log('[useChannelManagerSSEEvents]   Full event:', JSON.stringify(event, null, 2));
      console.log('[useChannelManagerSSEEvents]   Status:', event.data?.status);
      
      if (onSyncStatus) {
        console.log('[useChannelManagerSSEEvents]   Calling onSyncStatus callback');
        onSyncStatus(event.data?.status);
      } else {
        console.warn('[useChannelManagerSSEEvents]   ⚠️ No onSyncStatus handler provided');
      }
    });
  }, [registerEventHandler, onSyncStatus]);
}
