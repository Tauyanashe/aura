import { supabase, isMockMode } from '../lib/supabase';
import { APP_CONFIG } from '../lib/constants';

export const mediaService = {
  validateFile(file) {
    if (!file) throw new Error('No file provided');

    const validTypes = [...APP_CONFIG.ALLOWED_IMAGE_TYPES, ...APP_CONFIG.ALLOWED_VIDEO_TYPES];
    if (!validTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Please upload JPEG, PNG, WebP, GIF, or MP4.`);
    }

    if (file.size > APP_CONFIG.MAX_UPLOAD_SIZE_BYTES) {
      throw new Error('File exceeds the 25 MB beta limit.');
    }

    return true;
  },

  async uploadMedia(file, idempotencyKey = crypto.randomUUID()) {
    this.validateFile(file);

    if (isMockMode) {
      // In mock mode, generate an object URL or base64 preview and simulate upload
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fakeId = 'media-' + Math.random().toString(36).substring(2, 9);
          resolve({
            id: fakeId,
            drive_file_id: 'drive_' + fakeId,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            dataUrl: e.target.result,
            reservationId: 'res-' + Math.random().toString(36).substring(2, 9),
            status: 'uploaded',
          });
        };
        reader.readAsDataURL(file);
      });
    }

    // Call Supabase Edge Function 'drive-upload'
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idempotencyKey', idempotencyKey);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Media upload failed');
    }

    return response.json();
  },

  getMediaUrl(mediaAsset) {
    if (!mediaAsset) return '';
    if (mediaAsset.dataUrl) return mediaAsset.dataUrl;
    if (mediaAsset.url) return mediaAsset.url;

    if (isMockMode) {
      // Return a reliable fallback placeholder if dataUrl isn't stored
      return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`;
    }

    // Authenticated Edge Function stream
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-media?id=${mediaAsset.id}`;
  },
};
