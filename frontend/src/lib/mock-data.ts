import { Session, TransferBlock, FileItem, ApiResponse } from '@/types';

// Generate consistent 6-character alphanumeric password for device
function generateDevicePassword(deviceId: string): string {
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

// Get or create device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem('sendeasy_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sendeasy_device_id', deviceId);
  }
  return deviceId;
}

class MockApiService {
  private getStoredSessions(): Session[] {
    try {
      const stored = localStorage.getItem('sendeasy_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveStoredSessions(sessions: Session[]): void {
    localStorage.setItem('sendeasy_sessions', JSON.stringify(sessions));
  }

  generateSession(): ApiResponse<Session> {
    try {
      const deviceId = getDeviceId();
      const password = generateDevicePassword(deviceId);
      
      // Copy password to clipboard
      navigator.clipboard.writeText(password).catch(() => {
        // Clipboard access failed, but continue
      });
      
      const session: Session = {
        id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        password,
        deviceId,
        createdAt: new Date().toISOString(),
        transfers: []
      };
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to generate session' };
    }
  }

  saveSession(session: Session): ApiResponse<Session> {
    try {
      const sessions = this.getStoredSessions();
      
      // Remove existing session for this device
      const filteredSessions = sessions.filter(s => s.deviceId !== session.deviceId);
      filteredSessions.push(session);
      
      this.saveStoredSessions(filteredSessions);
      return { success: true, data: session };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to save session' };
    }
  }

  validatePassword(password: string): ApiResponse<Session> {
    try {
      const sessions = this.getStoredSessions();
      const session = sessions.find(s => s.password === password.toUpperCase());
      
      if (!session) {
        return { success: false, data: null, message: 'Invalid password' };
      }
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to validate password' };
    }
  }

  getAllSessions(): ApiResponse<Session[]> {
    try {
      const sessions = this.getStoredSessions();
      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to get sessions' };
    }
  }

  addTransferBlock(
    sessionId: string,
    textContent: string,
    files: FileItem[],
    images: FileItem[]
  ): ApiResponse<TransferBlock> {
    try {
      const sessions = this.getStoredSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) {
        return { success: false, data: null, message: 'Session not found' };
      }
      
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      const transferBlock: TransferBlock = {
        id: 'transfer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        sessionId,
        textContent: textContent || undefined,
        files,
        images,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isExpired: false
      };
      
      sessions[sessionIndex].transfers.push(transferBlock);
      this.saveStoredSessions(sessions);
      
      return { success: true, data: transferBlock };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to add transfer block' };
    }
  }

  deleteTransferBlock(sessionId: string, transferId: string): ApiResponse<boolean> {
    try {
      const sessions = this.getStoredSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) {
        return { success: false, data: null, message: 'Session not found' };
      }
      
      sessions[sessionIndex].transfers = sessions[sessionIndex].transfers.filter(
        t => t.id !== transferId
      );
      
      this.saveStoredSessions(sessions);
      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to delete transfer block' };
    }
  }

  extendTransferBlock(sessionId: string, transferId: string): ApiResponse<boolean> {
    try {
      const sessions = this.getStoredSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) {
        return { success: false, data: null, message: 'Session not found' };
      }
      
      const transferIndex = sessions[sessionIndex].transfers.findIndex(t => t.id === transferId);
      if (transferIndex === -1) {
        return { success: false, data: null, message: 'Transfer not found' };
      }
      
      // Extend to next day from now (not stacking)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      sessions[sessionIndex].transfers[transferIndex].expiresAt = tomorrow.toISOString();
      sessions[sessionIndex].transfers[transferIndex].isExpired = false;
      
      this.saveStoredSessions(sessions);
      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to extend transfer block' };
    }
  }
}

export const mockApi = new MockApiService();