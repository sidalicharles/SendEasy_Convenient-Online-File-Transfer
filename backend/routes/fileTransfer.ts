import { Router, Request, Response, NextFunction } from 'express';
import { fileTransferRepository } from '../repositories/fileTransfer';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Generate or get session for device
const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const result = await fileTransferRepository.createOrGetSession(deviceId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Validate session password
const validateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      throw new AppError('Password is required', 400);
    }

    const session = await fileTransferRepository.validateSession(password);
    
    res.json({
      success: true,
      data: {
        valid: !!session,
        sessionId: session?.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload files and text
const uploadContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, textContent } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    // Validate session exists and is active
    const session = await fileTransferRepository.validateSession(sessionId);
    if (!session) {
      throw new AppError('Invalid or expired session', 401);
    }

    // Prepare file data
    const fileData = files?.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      url: `/api/files/download/${file.filename}`,
    })) || [];

    // Create transfer block
    const transferBlock = await fileTransferRepository.createTransferBlock(
      sessionId,
      textContent,
      fileData
    );
    
    res.json({
      success: true,
      data: { transferBlock },
    });
  } catch (error) {
    next(error);
  }
};

// Get transfer history for session
const getTransferHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const transferBlocks = await fileTransferRepository.getTransferBlocks(sessionId);
    
    res.json({
      success: true,
      data: { transferBlocks },
    });
  } catch (error) {
    next(error);
  }
};

// Extend transfer block expiration
const extendTransferBlock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { blockId } = req.params;
    
    if (!blockId) {
      throw new AppError('Block ID is required', 400);
    }

    const updatedBlock = await fileTransferRepository.extendTransferBlock(blockId);
    
    if (!updatedBlock) {
      throw new AppError('Transfer block not found', 404);
    }
    
    res.json({
      success: true,
      data: {
        success: true,
        newExpiresAt: updatedBlock.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete transfer block
const deleteTransferBlock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { blockId } = req.params;
    
    if (!blockId) {
      throw new AppError('Block ID is required', 400);
    }

    const deleted = await fileTransferRepository.deleteTransferBlock(blockId);
    
    if (!deleted) {
      throw new AppError('Transfer block not found', 404);
    }
    
    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
};

// Delete individual text item
const deleteTextItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      throw new AppError('Item ID is required', 400);
    }

    const deleted = await fileTransferRepository.deleteTextItem(itemId);
    
    if (!deleted) {
      throw new AppError('Text item not found', 404);
    }
    
    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
};

// Delete individual file item
const deleteFileItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      throw new AppError('Item ID is required', 400);
    }

    const deleted = await fileTransferRepository.deleteFileItem(itemId);
    
    if (!deleted) {
      throw new AppError('File item not found', 404);
    }
    
    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
};

// Download file
const downloadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404);
    }
    
    res.download(filePath);
  } catch (error) {
    next(error);
  }
};

// Routes
router.post('/session', createSession);
router.post('/validate', validateSession);
router.post('/upload', upload.array('files'), uploadContent);
router.get('/history/:sessionId', getTransferHistory);
router.put('/extend/:blockId', extendTransferBlock);
router.delete('/block/:blockId', deleteTransferBlock);
router.delete('/text/:itemId', deleteTextItem);
router.delete('/file/:itemId', deleteFileItem);
router.get('/download/:filename', downloadFile);

export default router;