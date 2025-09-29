import { db } from '../db/db';
import { sessions, transfers, files, InsertSession, InsertTransfer, InsertFile } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export class SessionRepository {
  // Generate consistent 6-character alphanumeric password for device
  private generateDevicePassword(deviceId: string): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
      hash = ((hash << 5) - hash + deviceId.charCodeAt(i)) & 0xffffffff;
    }
    
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars[Math.abs(hash + i) % chars.length];
    }
    return password;
  }

  async createSession(deviceId: string) {
    const password = this.generateDevicePassword(deviceId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Deactivate existing sessions for this device
    await db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.deviceId, deviceId));
    
    const [session] = await db
      .insert(sessions)
      .values({
        password,
        deviceId,
        expiresAt,
      })
      .returning();
    
    return session;
  }

  async findByPassword(password: string) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.password, password.toUpperCase()),
        eq(sessions.isActive, true)
      ));
    
    return session;
  }

  async getSessionWithTransfers(sessionId: string) {
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    
    if (!session[0]) return null;
    
    const sessionTransfers = await db
      .select()
      .from(transfers)
      .where(eq(transfers.sessionId, sessionId))
      .orderBy(desc(transfers.createdAt));
    
    const transfersWithFiles = await Promise.all(
      sessionTransfers.map(async (transfer) => {
        const transferFiles = await db
          .select()
          .from(files)
          .where(eq(files.transferId, transfer.id));
        
        return {
          ...transfer,
          files: transferFiles.filter(f => !f.isImage),
          images: transferFiles.filter(f => f.isImage),
        };
      })
    );
    
    return {
      ...session[0],
      transfers: transfersWithFiles,
    };
  }

  async createTransfer(transferData: InsertTransfer) {
    const [transfer] = await db
      .insert(transfers)
      .values(transferData)
      .returning();
    
    return transfer;
  }

  async addFiles(transferId: string, fileData: InsertFile[]) {
    if (fileData.length === 0) return [];
    
    const insertedFiles = await db
      .insert(files)
      .values(fileData.map(file => ({ ...file, transferId })))
      .returning();
    
    return insertedFiles;
  }

  async deleteTransfer(transferId: string) {
    await db.delete(transfers).where(eq(transfers.id, transferId));
  }

  async extendTransfer(transferId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await db
      .update(transfers)
      .set({ 
        expiresAt: tomorrow,
        isExpired: false 
      })
      .where(eq(transfers.id, transferId));
  }

  async deleteFile(fileId: string) {
    await db.delete(files).where(eq(files.id, fileId));
  }

  async cleanupExpiredTransfers() {
    const now = new Date();
    
    // Mark expired transfers
    await db
      .update(transfers)
      .set({ isExpired: true })
      .where(and(
        eq(transfers.isExpired, false),
        // expires_at < now
      ));
    
    // Delete transfers expired for more than 1 day
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await db
      .delete(transfers)
      .where(and(
        eq(transfers.isExpired, true),
        // expires_at < oneDayAgo
      ));
  }
}

export const sessionRepository = new SessionRepository();