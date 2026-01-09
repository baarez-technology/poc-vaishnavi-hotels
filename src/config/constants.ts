export const APP_NAME = 'Glimmora';
export const APP_VERSION = '2.0.0';
export const APP_TAGLINE = 'Grounded in Luxury';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  ROOMS: '/rooms',
  BOOKING: '/booking',
  PROFILE: '/profile',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    SIGNUP: '/api/v1/auth/signup',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    ME: '/api/v1/auth/me',
    TOKEN: '/api/v1/auth/token',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    VERIFY_RESET_TOKEN: '/api/v1/auth/verify-reset-token',
  },
  OTP: {
    SEND: '/api/v1/otp/send',
    VERIFY: '/api/v1/otp/verify',
  },
  ROOMS: {
    LIST: '/api/v1/rooms',
    DETAIL: (id: string) => `/api/v1/rooms/${id}`,
    AVAILABILITY: '/api/v1/rooms/availability',
  },
  BOOKINGS: {
    CREATE: '/api/v1/bookings',
    LIST: '/api/v1/bookings',
    DETAIL: (id: string) => `/api/v1/bookings/${id}`,
    UPDATE: (id: string) => `/api/v1/bookings/${id}`,
    CANCEL: (id: string) => `/api/v1/bookings/${id}/cancel`,
  },
  USERS: {
    PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile',
    CHANGE_PASSWORD: '/api/v1/users/change-password',
    PREFERENCES: '/api/v1/users/preferences',
  },
  PAYMENT_METHODS: {
    LIST: '/api/v1/payment-methods',
    CREATE: '/api/v1/payment-methods',
    UPDATE: (id: string) => `/api/v1/payment-methods/${id}`,
    DELETE: (id: string) => `/api/v1/payment-methods/${id}`,
  },
  ADMIN: {
    PAYMENT_METHODS: '/api/v1/admin/payment-methods',
    USER_PREFERENCES: '/api/v1/admin/user-preferences',
    PRECHECKINS: '/api/v1/admin/precheckins',
    BOOKINGS: '/api/v1/admin/bookings',
    DASHBOARD: '/api/v1/dashboards/admin',
    FRONTDESK_DASHBOARD: '/api/v1/dashboards/frontdesk',
    OPERATIONS_DASHBOARD: '/api/v1/dashboards/operations',
    FINANCE_DASHBOARD: '/api/v1/dashboards/finance',
  },
  GUESTS: {
    LIST: '/api/v1/guests',
    DETAIL: (id: string) => `/api/v1/guests/${id}`,
    CREATE: '/api/v1/guests',
    UPDATE: (id: string) => `/api/v1/guests/${id}`,
  },
  RESERVATIONS: {
    LIST: '/api/v1/bookings',
    DETAIL: (id: string) => `/api/v1/bookings/${id}`,
    CREATE: '/api/v1/bookings',
    UPDATE: (id: string) => `/api/v1/bookings/${id}`,
    CANCEL: (id: string) => `/api/v1/bookings/${id}/cancel`,
  },
  ROOM_TYPES: {
    LIST: '/api/v1/room-types',
    DETAIL: (slug: string) => `/api/v1/room-types/${slug}`,
    UPDATE: (slug: string) => `/api/v1/room-types/${slug}`,
  },
  DASHBOARDS: {
    GUEST: '/api/v1/dashboards/guest',
  },
  GUEST_AI: {
    CHAT: '/api/v1/guest-ai/chat',
    CREATE_BOOKING: '/api/v1/guest-ai/create-booking',
  },
} as const;

export const QUERY_KEYS = {
  ROOMS: 'rooms',
  ROOM_DETAIL: 'room-detail',
  BOOKINGS: 'bookings',
  BOOKING_DETAIL: 'booking-detail',
  USER: 'user',
} as const;

export const CONTACT_INFO = {
  address: {
    street: '1250 Ocean Boulevard',
    city: 'Santa Monica',
    state: 'California',
    zip: '90401',
    country: 'United States',
  },
  phone: '+1 (310) 555-2847',
  email: 'reservations@terrasuites.com',
  website: 'www.terrasuites.com',
  hours: {
    frontDesk: '24/7',
    checkIn: '3:00 PM',
    checkOut: '11:00 AM',
  },
  social: {
    instagram: 'https://instagram.com/terrasuites',
    facebook: 'https://facebook.com/terrasuites',
    twitter: '@terrasuites',
    linkedin: 'https://linkedin.com/company/terra-suites',
  },
} as const;

export const ABOUT_TEXT = 'TERRA Suites embodies the perfect balance of modern luxury and natural tranquility. Nestled along the California coast, our boutique property offers thoughtfully designed spaces where contemporary elegance meets organic materials and mindful hospitality. Each stay is crafted to ground you in comfort while elevating your experience through personalized service and sustainable luxury.';