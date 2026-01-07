export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || '',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  ENV: import.meta.env.VITE_ENV || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

// Debug: Log API URL on startup (only in browser)
if (typeof window !== 'undefined') {
  console.log('🔧 ENV Configuration:', {
    API_URL: ENV.API_URL,
    API_TIMEOUT: ENV.API_TIMEOUT,
    ENV: ENV.ENV,
    IS_DEV: ENV.IS_DEV,
    IS_PROD: ENV.IS_PROD,
    'Raw VITE_API_URL': import.meta.env.VITE_API_URL,
  });
}
