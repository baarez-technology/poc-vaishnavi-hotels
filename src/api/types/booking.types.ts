export interface Room {
  id: string;
  name: string;
  slug: string;
  number?: string; // Room number
  description: string;
  shortDescription?: string;
  price: number;
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedType: string;
  size: number;
  view: string;
  floor?: number; // Floor number
  status?: string; // Room status (clean, dirty, etc.)
  category?: 'standard' | 'deluxe' | 'suite' | 'presidential';
  features?: string[];
  rating?: number;
  reviewCount?: number;
  available?: boolean;
}

export interface BookingDraft {
  roomId: string;
  room?: Room;
  checkIn: Date;
  checkOut: Date;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  nights: number;
  basePrice: number;
  taxes: number;
  serviceFee: number;
  totalPrice: number;
}

export interface GuestInformation {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  specialRequests?: string;
}

export interface PaymentInformation {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  saveCard: boolean;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  room: Room;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  guestInfo: GuestInformation;
  nights: number;
  basePrice: number;
  taxes: number;
  serviceFee: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  guestInfo: GuestInformation;
  paymentToken: string;
}

export interface CreateBookingResponse {
  booking: Booking;
  paymentIntent?: {
    clientSecret: string;
  };
}

export interface CreateBookingData {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  guestInfo: GuestInformation;
  paymentMethodId: string;
  saveCard?: boolean;
  payment_method?: string;
}
