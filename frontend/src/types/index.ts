export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface TextItem {
  id: string;
  content: string;
  createdAt: string;
}

export interface TransferBlock {
  id: string;
  sessionId: string;
  textItems: TextItem[];
  fileItems: FileItem[];
  createdAt: string;
  expiresAt: string;
}

export interface Session {
  id: string;
  password: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateSessionResponse {
  session: Session;
  password: string;
}

export interface UploadResponse {
  transferBlock: TransferBlock;
}

export interface SessionValidationResponse {
  valid: boolean;
  sessionId?: string;
}

export interface ExtendExpirationResponse {
  success: boolean;
  newExpiresAt: string;
}