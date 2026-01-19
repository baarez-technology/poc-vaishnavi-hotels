/**
 * Hook for integrating SSE with Bookings components
 * Handles booking-related SSE events and updates the UI accordingly
 */

import { useEffect, useCallback } from 'react';
import { useSSE } from '../contexts/SSEContext';
import { SSEEvent, SSE_EVENT_TYPES } from '../api/services/sse.service';

interface UseBookingsSSEOptions {
  onBookingCreated?: (booking: any) => void;
  onBookingModified?: (bookingId: number, changes: any) => void;
  onBookingCancelled?: (bookingId: number) => void;
  refetchBookings?: () => void | Promise<void>;
}

/**
 * Hook for handling booking-related SSE events
 */
export function useBookingsSSE(options: UseBookingsSSEOptions = {}) {
  const { registerEventHandler } = useSSE();
  const { onBookingCreated, onBookingModified, onBookingCancelled, refetchBookings } = options;

  console.log('[useBookingsSSE] 🎣 Hook initialized with options:', {
    hasOnBookingCreated: !!onBookingCreated,
    hasOnBookingModified: !!onBookingModified,
    hasOnBookingCancelled: !!onBookingCancelled,
    hasRefetchBookings: !!refetchBookings,
  });

  // Handle booking.created event
  useEffect(() => {
    console.log('[useBookingsSSE] 📝 Registering handler for booking.created');
    const cleanup = registerEventHandler(SSE_EVENT_TYPES.BOOKING_CREATED, (event: SSEEvent) => {
      console.log('[useBookingsSSE] 🎉🎉🎉 BOOKING.CREATED EVENT RECEIVED 🎉🎉🎉');
      console.log('[useBookingsSSE]   Full event:', JSON.stringify(event, null, 2));
      console.log('[useBookingsSSE]   Booking data:', event.data);
      
      if (onBookingCreated) {
        console.log('[useBookingsSSE]   Calling onBookingCreated callback');
        onBookingCreated(event.data);
      } else if (refetchBookings) {
        console.log('[useBookingsSSE]   ⚡ Triggering refetchBookings...');
        try {
          const result = refetchBookings();
          if (result instanceof Promise) {
            result.then(() => {
              console.log('[useBookingsSSE]   ✅ Refetch completed successfully');
            }).catch((err) => {
              console.error('[useBookingsSSE]   ❌ Refetch failed:', err);
            });
          } else {
            console.log('[useBookingsSSE]   ✅ Refetch function called (synchronous)');
          }
        } catch (error) {
          console.error('[useBookingsSSE]   ❌ Error calling refetchBookings:', error);
        }
      } else {
        console.warn('[useBookingsSSE]   ⚠️ No handler or refetch function provided!');
      }
    });
    console.log('[useBookingsSSE]   ✅ Handler registered successfully');
    return cleanup;
  }, [registerEventHandler, onBookingCreated, refetchBookings]);

  // Handle booking.modified event
  useEffect(() => {
    console.log('[useBookingsSSE] 📝 Registering handler for booking.modified');
    return registerEventHandler(SSE_EVENT_TYPES.BOOKING_MODIFIED, (event: SSEEvent) => {
      console.log('[useBookingsSSE] 🔄 BOOKING.MODIFIED EVENT RECEIVED');
      console.log('[useBookingsSSE]   Full event:', JSON.stringify(event, null, 2));
      console.log('[useBookingsSSE]   Booking ID:', event.data?.booking_id);
      console.log('[useBookingsSSE]   Changes:', event.data?.changes);
      
      if (onBookingModified) {
        console.log('[useBookingsSSE]   Calling onBookingModified callback');
        onBookingModified(event.data.booking_id, event.data.changes);
      } else if (refetchBookings) {
        console.log('[useBookingsSSE]   ⚡ Triggering refetchBookings...');
        try {
          const result = refetchBookings();
          if (result instanceof Promise) {
            result.then(() => console.log('[useBookingsSSE]   ✅ Refetch completed'));
          }
        } catch (error) {
          console.error('[useBookingsSSE]   ❌ Error calling refetchBookings:', error);
        }
      }
    });
  }, [registerEventHandler, onBookingModified, refetchBookings]);

  // Handle booking.cancelled event
  useEffect(() => {
    console.log('[useBookingsSSE] 📝 Registering handler for booking.cancelled');
    return registerEventHandler(SSE_EVENT_TYPES.BOOKING_CANCELLED, (event: SSEEvent) => {
      console.log('[useBookingsSSE] 🚫 BOOKING.CANCELLED EVENT RECEIVED');
      console.log('[useBookingsSSE]   Full event:', JSON.stringify(event, null, 2));
      console.log('[useBookingsSSE]   Booking ID:', event.data?.booking_id);
      
      if (onBookingCancelled) {
        console.log('[useBookingsSSE]   Calling onBookingCancelled callback');
        onBookingCancelled(event.data.booking_id);
      } else if (refetchBookings) {
        console.log('[useBookingsSSE]   ⚡ Triggering refetchBookings...');
        try {
          const result = refetchBookings();
          if (result instanceof Promise) {
            result.then(() => console.log('[useBookingsSSE]   ✅ Refetch completed'));
          }
        } catch (error) {
          console.error('[useBookingsSSE]   ❌ Error calling refetchBookings:', error);
        }
      }
    });
  }, [registerEventHandler, onBookingCancelled, refetchBookings]);
}
