export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  FALLBACK_SECRET: 'development-jwt-secret', // Only used if no secret is configured
  EXPIRES_IN: '24h',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_TOKEN: 'Invalid token',
  NO_TOKEN: 'No token provided',
  UNAUTHORIZED: 'Unauthorized access',
} as const;

export const SERVER_CONFIG = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

export const FRONTEND_URL = process.env.FRONTEND_URL;

export const STRIPE_CONFIG = {
  SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  VITE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
} as const;
