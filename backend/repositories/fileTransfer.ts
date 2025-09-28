import { db } from '../db/db';
import { sessions, transferBlocks, textItems, fileItems, Session, TransferBlock, TextItem, FileItem } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';

export class FileTransferRepository {
  // Generate unique 6-character alphanumeric password
  generatePassword(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create or get existing session for device
  async createOrGetSession(deviceId: string): Promise<{ session: Session; password: string }> {
    // Check if device already has an active session
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.deviceId, deviceId),
        lt(new Date(), sessions.expiresAt)
      ))
      .limit(1);

    if (existingSession) {
      return { session: existingSession, password: existingSession.password };
    }

    // Create new session
    const password = this.generatePassword();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [newSession] = await db
      .insert(sessions)
      .values({
        password,
        deviceId,
        expiresAt,
      })
      .returning();

    return { session: newSession, password };
  }

  // Validate session password
  async validateSession(password: string): Promise<Session | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.password, password),
        lt(new Date(), sessions.expiresAt)
      ))
      .limit(1);

    return session || null;
  }

  // Create transfer block with content
  async createTransferBlock(
    sessionId: string,
    textContent?: string,
    files?: Array<{ name: string; size: number; type: string; url: string }>
  ): Promise<TransferBlock & { textItems: TextItem[]; fileItems: FileItem[] }> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [transferBlock] = await db
      .insert(transferBlocks)
      .values({
        sessionId,
        expiresAt,
      })
      .returning();

    const createdTextItems: TextItem[] = [];
    const createdFileItems: FileItem[] = [];

    // Add text content if provided
    if (textContent && textContent.trim()) {
      const [textItem] = await db
        .insert(textItems)
        .values({
          transferBlockId: transferBlock.id,
          content: textContent.trim(),
        })
        .returning();
      createdTextItems.push(textItem);
    }

    // Add files if provided
    if (files && files.length > 0) {
      const fileValues = files.map(file => ({
        transferBlockId: transferBlock.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
      }));

      const insertedFiles = await db
        .insert(fileItems)
        .values(fileValues)
        .returning();
      createdFileItems.push(...insertedFiles);
    }

    return {
      ...transferBlock,
      textItems: createdTextItems,
      fileItems: createdFileItems,
    };
  }

  // Get transfer blocks for session
  async getTransferBlocks(sessionId: string): Promise<Array<TransferBlock & { textItems: TextItem[]; fileItems: FileItem[] }>> {
    const blocks = await db
      .select()
      .from(transferBlocks)
      .where(and(
        eq(transferBlocks.sessionId, sessionId),
        lt(new Date(), transferBlocks.expiresAt)
      ));

    const result = [];
    for (const block of blocks) {
      const blockTextItems = await db
        .select()
        .from(textItems)
        .where(eq(textItems.transferBlockId, block.id));

      const blockFileItems = await db
        .select()
        .from(fileItems)
        .where(eq(fileItems.transferBlockId, block.id));

      result.push({
        ...block,
        textItems: blockTextItems,
        fileItems: blockFileItems,
      });
    }

    return result;
  }

  // Extend transfer block expiration
  async extendTransferBlock(blockId: string): Promise<TransferBlock | null> {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(23, 59, 59, 999);

    const [updatedBlock] = await db
      .update(transferBlocks)
      .set({ expiresAt: nextDay })
      .where(eq(transferBlocks.id, blockId))
      .returning();

    return updatedBlock || null;
  }

  // Delete transfer block
  async deleteTransferBlock(blockId: string): Promise<boolean> {
    const result = await db
      .delete(transferBlocks)
      .where(eq(transferBlocks.id, blockId));

    return result.rowCount > 0;
  }

  // Delete individual text item
  async deleteTextItem(itemId: string): Promise<boolean> {
    const result = await db
      .delete(textItems)
      .where(eq(textItems.id, itemId));

    return result.rowCount > 0;
  }

  // Delete individual file item
  async deleteFileItem(itemId: string): Promise<boolean> {
    const result = await db
      .delete(fileItems)
      .where(eq(fileItems.id, itemId));

    return result.rowCount > 0;
  }

  // Clean up expired items
  async cleanupExpired(): Promise<void> {
    const now = new Date();
    
    // Delete expired transfer blocks (cascade will handle related items)
    await db
      .delete(transferBlocks)
      .where(lt(transferBlocks.expiresAt, now));

    // Delete expired sessions
    await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, now));
  }
}

export const fileTransferRepository = new FileTransferRepository();