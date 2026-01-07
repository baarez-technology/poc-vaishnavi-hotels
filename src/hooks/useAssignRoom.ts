import { useState, useCallback } from 'react';

/**
 * Hook to assign a room to a booking locally.
 */
export function useAssignRoom(bookings, setBookings) {
  const [isAssigning, setIsAssigning] = useState(false);

  const assignRoom = useCallback(
    async (updatedBooking) => {
      setIsAssigning(true);
      try {
        const bookingExists = bookings.some((booking) => booking.id === updatedBooking.id);
        if (!bookingExists) {
          setIsAssigning(false);
          return false;
        }

        await new Promise((resolve) => setTimeout(resolve, 300));

        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === updatedBooking.id ? { ...booking, ...updatedBooking } : booking
          )
        );

        setIsAssigning(false);
        return true;
      } catch (error) {
        console.error('Failed to assign room', error);
        setIsAssigning(false);
        return false;
      }
    },
    [setBookings, bookings]
  );

  return { assignRoom, isAssigning };
}
