import { Router, Request, Response, NextFunction } from 'express';
import { SessionRepository } from '../repositories/sessions';
import { FileService } from '../services/fileService';
import { createSessionSchema, validatePasswordSchema, createTransferSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const sessionRepo = new SessionRepository();
const fileService = new FileService();

// Create session (Send File)
const createSessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    
    const session = await sessionRepo.createSession(validatedData.deviceId);
    
    res.status(201).json({
      success: true,
      data: {
        id: session.id,
        password: session.password,
        deviceId: session.deviceId,
        createdAt: session.createdAt,
        transfers: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Validate password (Receive File)
const validatePasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = validatePasswordSchema.parse(req.body);
    
    const session = await sessionRepo.findByPassword(validatedData.password);
    if (!session) {
      throw new AppError('Invalid password', 404);
    }
    
    const sessionWithTransfers = await sessionRepo.getSessionWithTransfers(session.id);
    
    res.json({
      success: true,
      data: sessionWithTransfers,
    });
  } catch (error) {
    next(error);
  }
};

// Get session with transfers
const getSessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    
    const sessionWithTransfers = await sessionRepo.getSessionWithTransfers(sessionId);
    if (!sessionWithTransfers) {
      throw new AppError('Session not found', 404);
    }
    
    res.json({
      success: true,
      data: sessionWithTransfers,
    });
  } catch (error) {
    next(error);
  }
};

// Create transfer
const createTransferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createTransferSchema.parse(req.body);
    
    // Verify session exists
    const session = await sessionRepo.getSessionWithTransfers(validatedData.sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const transfer = await sessionRepo.createTransfer({
      sessionId: validatedData.sessionId,
      textContent: validatedData.textContent,
      expiresAt,
    });
    
    // Handle file uploads
    let uploadedFiles: any[] = [];
    if (validatedData.files && validatedData.files.length > 0) {
      const filePromises = validatedData.files.map(file => fileService.saveFile(file));
      const savedFiles = await Promise.all(filePromises);
      uploadedFiles = await sessionRepo.addFiles(transfer.id, savedFiles);
    }
    
    res.status(201).json({
      success: true,
      data: {
        ...transfer,
        files: uploadedFiles.filter(f => !f.isImage),
        images: uploadedFiles.filter(f => f.isImage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete transfer
const deleteTransferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transferId } = req.params;
    
    await sessionRepo.deleteTransfer(transferId);
    
    res.json({
      success: true,
      data: { message: 'Transfer deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

// Extend transfer
const extendTransferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transferId } = req.params;
    
    await sessionRepo.extendTransfer(transferId);
    
    res.json({
      success: true,
      data: { message: 'Transfer extended successfully' },
    });
  } catch (error) {
    next(error);
  }
};

// Delete file
const deleteFileHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.params;
    
    await sessionRepo.deleteFile(fileId);
    
    res.json({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.post('/create', createSessionHandler);
router.post('/validate', validatePasswordHandler);
router.get('/:sessionId', getSessionHandler);
router.post('/transfer', createTransferHandler);
router.delete('/transfer/:transferId', deleteTransferHandler);
router.put('/transfer/:transferId/extend', extendTransferHandler);
router.delete('/file/:fileId', deleteFileHandler);

export default router;