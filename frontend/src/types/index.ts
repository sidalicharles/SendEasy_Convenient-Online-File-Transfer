export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  content?: string;
}

export interface TransferBlock {
  id: string;
  sessionId: string;
  textContent?: string;
  files: FileItem[];
  images: FileItem[];
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface Session {
  id: string;
  password: string;
  deviceId: string;
  createdAt: string;
  transfers: TransferBlock[];
}

export interface AppState {
  currentView: 'landing' | 'send' | 'receive';
  currentSession: Session | null;
  isDarkMode: boolean;
  receiverPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}