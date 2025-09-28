import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from 'dotenv';

// Ensure environment variables are loaded
config();

// Debug database configuration
console.log('Attempting database connection with:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
  env_keys: Object.keys(process.env)
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Current env keys: " + Object.keys(process.env).join(', '));
}

// Database connection with connection pooling
const client = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  max: 10, // Set pool size
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client); 