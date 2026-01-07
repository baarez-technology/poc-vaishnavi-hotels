export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || '',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  ENV: import.meta.env.VITE_ENV || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
