import { ApiResponse, CreateSessionResponse, SessionValidationResponse, UploadResponse, TransferBlock, ExtendExpirationResponse } from '../types';

class ApiService {
  private baseURL = '/api';

  async createSession(deviceId: string): Promise<ApiResponse<CreateSessionResponse>> {
    const response = await fetch(`${this.baseURL}/files/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    });
    return response.json() as Promise<ApiResponse<CreateSessionResponse>>;
  }

  async validateSession(password: string): Promise<ApiResponse<SessionValidationResponse>> {
    const response = await fetch(`${this.baseURL}/files/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    return response.json() as Promise<ApiResponse<SessionValidationResponse>>;
  }

  async uploadContent(
    sessionId: string,
    textContent?: string,
    files?: FileList
  ): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    
    if (textContent) {
      formData.append('textContent', textContent);
    }
    
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
    }

    const response = await fetch(`${this.baseURL}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json() as Promise<ApiResponse<UploadResponse>>;
  }

  async getTransferHistory(sessionId: string): Promise<ApiResponse<{ transferBlocks: TransferBlock[] }>> {
    const response = await fetch(`${this.baseURL}/files/history/${sessionId}`);
    return response.json() as Promise<ApiResponse<{ transferBlocks: TransferBlock[] }>>;
  }

  async extendTransferBlock(blockId: string): Promise<ApiResponse<ExtendExpirationResponse>> {
    const response = await fetch(`${this.baseURL}/files/extend/${blockId}`, {
      method: 'PUT',
    });
    return response.json() as Promise<ApiResponse<ExtendExpirationResponse>>;
  }

  async deleteTransferBlock(blockId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const response = await fetch(`${this.baseURL}/files/block/${blockId}`, {
      method: 'DELETE',
    });
    return response.json() as Promise<ApiResponse<{ deleted: boolean }>>;
  }

  async deleteTextItem(itemId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const response = await fetch(`${this.baseURL}/files/text/${itemId}`, {
      method: 'DELETE',
    });
    return response.json() as Promise<ApiResponse<{ deleted: boolean }>>;
  }

  async deleteFileItem(itemId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const response = await fetch(`${this.baseURL}/files/file/${itemId}`, {
      method: 'DELETE',
    });
    return response.json() as Promise<ApiResponse<{ deleted: boolean }>>;
  }
}

export const apiService = new ApiService();