import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Room } from '@/api/types/booking.types';

interface OriginalBookingData {
  id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  paymentStatus: string;
  nights: number;
}

interface BookingData {
  room: Room | null;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests?: string;
    eta?: string;
    etd?: string;
  };
  payment: {
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
    billingAddress: string;
    city: string;
    zipCode: string;
    country: string;
  };
  bookingNumber?: string;
  datesFromUrl?: boolean; // Track if dates came from URL parameters
  // Modification mode fields
  isModifyMode?: boolean;
  originalBooking?: OriginalBookingData | null;
}

interface BookingContextType {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  resetBooking: () => void;
  calculateTotal: () => { subtotal: number; tax: number; serviceFee: number; total: number; nights: number };
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialBookingData: BookingData = {
  room: null,
  checkIn: '',
  checkOut: '',
  guests: {
    adults: 1,
    children: 0,
  },
  guestInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
    eta: '',
    etd: '',
  },
  payment: {
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    zipCode: '',
    country: '',
  },
  datesFromUrl: false,
  isModifyMode: false,
  originalBooking: null,
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);

  const updateBookingData = useCallback((data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  }, []);

  const resetBooking = useCallback(() => {
    setBookingData(initialBookingData);
  }, []);

  const calculateTotal = useCallback(() => {
    if (!bookingData.room || !bookingData.checkIn || !bookingData.checkOut) {
      return { subtotal: 0, tax: 0, serviceFee: 0, total: 0, nights: 0 };
    }

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const subtotal = bookingData.room.price * nights;
    const tax = subtotal * 0.12; // 12% tax
    const serviceFee = subtotal * 0.05; // 5% service fee
    const total = subtotal + tax + serviceFee;

    return { subtotal, tax, serviceFee, total, nights };
  }, [bookingData.room, bookingData.checkIn, bookingData.checkOut]);

  return (
    <BookingContext.Provider value={{ bookingData, updateBookingData, resetBooking, calculateTotal }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}