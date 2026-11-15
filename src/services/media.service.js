import { supabase, isMockMode } from '../lib/supabase';
import { APP_CONFIG } from '../lib/constants';

function compressMockImage(file, maxDimension = 1080, quality = 0.72) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

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
      // In mock mode, compress the media so it easily fits within browser localStorage quotas
      const dataUrl = await compressMockImage(file);
      const fakeId = 'media-' + Math.random().toString(36).substring(2, 9);
      return {
        id: fakeId,
        drive_file_id: 'drive_' + fakeId,
        file_name: file.name,
        mime_type: file.type.startsWith('image/') ? 'image/jpeg' : file.type,
        size_bytes: file.size,
        dataUrl,
        reservationId: 'res-' + Math.random().toString(36).substring(2, 9),
        status: 'uploaded',
      };
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
      return '';
    }

    // Authenticated Edge Function stream
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-media?id=${mediaAsset.id}`;
  },
};
