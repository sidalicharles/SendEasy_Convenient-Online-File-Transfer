import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('Sessions', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  password: text('password').notNull().unique(),
  deviceId: text('device_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const transfers = pgTable('Transfers', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  textContent: text('text_content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isExpired: boolean('is_expired').default(false).notNull(),
});

export const files = pgTable('Files', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  transferId: text('transfer_id').notNull().references(() => transfers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  type: text('type').notNull(),
  url: text('url').notNull(),
  isImage: boolean('is_image').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const createSessionSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const validatePasswordSchema = z.object({
  password: z.string().length(6, 'Password must be 6 characters'),
});

export const createTransferSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  textContent: z.string().optional(),
  files: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    content: z.string(), // base64 encoded
  })).optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type ValidatePasswordInput = z.infer<typeof validatePasswordSchema>;

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = typeof transfers.$inferInsert;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;