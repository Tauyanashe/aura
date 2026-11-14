/**
 * AURA MEDIA STORAGE SERVICE ADAPTER (TypeScript)
 * File: supabase/functions/_shared/storage-adapter.ts
 *
 * Implements interchangeable storage interface per Blueprint Section 2.
 * Google Drive is isolated behind this adapter.
 */

export interface StorageUploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  provider: 'google_drive' | 's3' | 'mock';
  checksumSha256?: string;
}

export interface StorageRetrieveResult {
  stream: ReadableStream<Uint8Array> | null;
  buffer?: ArrayBuffer;
  contentType: string;
  contentLength: number;
  contentRange?: string;
  status: number;
}

export interface MediaStorageService {
  upload(
    fileBuffer: Uint8Array,
    fileName: string,
    mimeType: string
  ): Promise<StorageUploadResult>;

  retrieve(
    fileId: string,
    rangeHeader?: string | null
  ): Promise<StorageRetrieveResult>;

  delete(fileId: string): Promise<boolean>;

  verifyHealth(): Promise<boolean>;
}

/**
 * Google Drive Beta Implementation
 * Secure server-side OAuth2 bearer token exchange & multipart Drive v3 API
 */
export class GoogleDriveStorageAdapter implements MediaStorageService {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private folderId: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    this.clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
    this.refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN') || '';
    this.folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') || '';
  }

  private async getValidAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error('Google Drive OAuth credentials are not properly configured.');
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    });

    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Failed to refresh Google OAuth token: ${resp.status} ${errText}`);
    }

    const data = await resp.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    return this.accessToken as string;
  }

  async upload(
    fileBuffer: Uint8Array,
    fileName: string,
    mimeType: string
  ): Promise<StorageUploadResult> {
    const token = await this.getValidAccessToken();

    const metadata = {
      name: fileName,
      parents: this.folderId ? [this.folderId] : undefined,
    };

    const boundary = '-------AURA_DRIVE_MULTIPART_BOUNDARY';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataHeader = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n`;

    const encoder = new TextEncoder();
    const metaBytes = encoder.encode(metadataHeader);
    const closeBytes = encoder.encode(closeDelimiter);

    const bodyBytes = new Uint8Array(metaBytes.length + fileBuffer.length + closeBytes.length);
    bodyBytes.set(metaBytes, 0);
    bodyBytes.set(fileBuffer, metaBytes.length);
    bodyBytes.set(closeBytes, metaBytes.length + fileBuffer.length);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,md5Checksum';

    const resp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyBytes,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Drive upload failed [${resp.status}]: ${err}`);
    }

    const resJson = await resp.json();

    return {
      fileId: resJson.id,
      name: resJson.name,
      mimeType: resJson.mimeType || mimeType,
      sizeBytes: fileBuffer.length,
      provider: 'google_drive',
      checksumSha256: resJson.md5Checksum,
    };
  }

  async retrieve(
    fileId: string,
    rangeHeader?: string | null
  ): Promise<StorageRetrieveResult> {
    const token = await this.getValidAccessToken();
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const resp = await fetch(downloadUrl, {
      method: 'GET',
      headers,
    });

    if (!resp.ok && resp.status !== 206) {
      const err = await resp.text();
      throw new Error(`Drive download failed [${resp.status}]: ${err}`);
    }

    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
    const contentRange = resp.headers.get('content-range') || undefined;

    return {
      stream: resp.body,
      contentType,
      contentLength,
      contentRange,
      status: resp.status,
    };
  }

  async delete(fileId: string): Promise<boolean> {
    const token = await this.getValidAccessToken();
    const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    const resp = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return resp.ok || resp.status === 404;
  }

  async verifyHealth(): Promise<boolean> {
    try {
      const token = await this.getValidAccessToken();
      return !!token;
    } catch {
      return false;
    }
  }
}

/**
 * Mock / Local Storage Adapter for testing, offline beta preview, and CI validation
 */
export class MockStorageAdapter implements MediaStorageService {
  private inMemoryStore = new Map<string, { buffer: Uint8Array; mimeType: string; name: string }>();

  async upload(
    fileBuffer: Uint8Array,
    fileName: string,
    mimeType: string
  ): Promise<StorageUploadResult> {
    const fileId = 'mock_drive_' + crypto.randomUUID();
    this.inMemoryStore.set(fileId, {
      buffer: fileBuffer,
      mimeType,
      name: fileName,
    });

    return {
      fileId,
      name: fileName,
      mimeType,
      sizeBytes: fileBuffer.length,
      provider: 'mock',
    };
  }

  async retrieve(
    fileId: string,
    rangeHeader?: string | null
  ): Promise<StorageRetrieveResult> {
    const item = this.inMemoryStore.get(fileId);
    if (!item) {
      throw new Error(`Mock media ${fileId} not found`);
    }

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : item.buffer.length - 1;
      const chunk = item.buffer.slice(start, end + 1);

      return {
        stream: null,
        buffer: chunk.buffer,
        contentType: item.mimeType,
        contentLength: chunk.length,
        contentRange: `bytes ${start}-${end}/${item.buffer.length}`,
        status: 206,
      };
    }

    return {
      stream: null,
      buffer: item.buffer.buffer,
      contentType: item.mimeType,
      contentLength: item.buffer.length,
      status: 200,
    };
  }

  async delete(fileId: string): Promise<boolean> {
    this.inMemoryStore.delete(fileId);
    return true;
  }

  async verifyHealth(): Promise<boolean> {
    return true;
  }
}

/**
 * Factory method selecting the appropriate adapter based on environment
 */
export function getStorageAdapter(): MediaStorageService {
  const hasGoogleCreds =
    !!Deno.env.get('GOOGLE_CLIENT_ID') &&
    !!Deno.env.get('GOOGLE_CLIENT_SECRET') &&
    !!Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (hasGoogleCreds) {
    return new GoogleDriveStorageAdapter();
  }
  return new MockStorageAdapter();
}
