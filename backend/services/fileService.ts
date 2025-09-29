import { promises as fs } from 'fs';
import path from 'path';
import { InsertFile } from '../db/schema';

export class FileService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(fileData: {
    name: string;
    size: number;
    type: string;
    content: string; // base64
  }): Promise<InsertFile> {
    const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const fileName = `${fileId}_${fileData.name}`;
    const filePath = path.join(this.uploadDir, fileName);
    
    // Decode base64 and save file
    const buffer = Buffer.from(fileData.content, 'base64');
    await fs.writeFile(filePath, buffer);
    
    const fileUrl = `/uploads/${fileName}`;
    
    return {
      id: fileId,
      transferId: '', // Will be set by caller
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      url: fileUrl,
      isImage: fileData.type.startsWith('image/'),
      createdAt: new Date(),
    };
  }

  async deleteFile(fileUrl: string) {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async cleanupExpiredFiles(fileUrls: string[]) {
    for (const url of fileUrls) {
      await this.deleteFile(url);
    }
  }
}

export const fileService = new FileService();