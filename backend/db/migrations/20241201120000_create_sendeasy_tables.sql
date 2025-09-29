-- Create Sessions table
CREATE TABLE IF NOT EXISTS "Sessions" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "password" TEXT NOT NULL UNIQUE,
    "device_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL
);

-- Create Transfers table
CREATE TABLE IF NOT EXISTS "Transfers" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "text_content" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "is_expired" BOOLEAN DEFAULT false NOT NULL,
    CONSTRAINT "transfers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Sessions"("id") ON DELETE CASCADE
);

-- Create Files table
CREATE TABLE IF NOT EXISTS "Files" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "transfer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_image" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT "files_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "Transfers"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "sessions_password_idx" ON "Sessions"("password");
CREATE INDEX IF NOT EXISTS "sessions_device_id_idx" ON "Sessions"("device_id");
CREATE INDEX IF NOT EXISTS "transfers_session_id_idx" ON "Transfers"("session_id");
CREATE INDEX IF NOT EXISTS "files_transfer_id_idx" ON "Files"("transfer_id");