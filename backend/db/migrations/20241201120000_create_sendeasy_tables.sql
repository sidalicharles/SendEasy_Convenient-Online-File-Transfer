-- Create Sessions table
CREATE TABLE IF NOT EXISTS "Sessions" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "password" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "expires_at" TIMESTAMP NOT NULL
);

-- Create TransferBlocks table
CREATE TABLE IF NOT EXISTS "TransferBlocks" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    FOREIGN KEY ("session_id") REFERENCES "Sessions"("id") ON DELETE CASCADE
);

-- Create TextItems table
CREATE TABLE IF NOT EXISTS "TextItems" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "transfer_block_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("transfer_block_id") REFERENCES "TransferBlocks"("id") ON DELETE CASCADE
);

-- Create FileItems table
CREATE TABLE IF NOT EXISTS "FileItems" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "transfer_block_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("transfer_block_id") REFERENCES "TransferBlocks"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "sessions_password_idx" ON "Sessions"("password");
CREATE INDEX IF NOT EXISTS "sessions_device_id_idx" ON "Sessions"("device_id");
CREATE INDEX IF NOT EXISTS "transfer_blocks_session_id_idx" ON "TransferBlocks"("session_id");
CREATE INDEX IF NOT EXISTS "text_items_transfer_block_id_idx" ON "TextItems"("transfer_block_id");
CREATE INDEX IF NOT EXISTS "file_items_transfer_block_id_idx" ON "FileItems"("transfer_block_id");