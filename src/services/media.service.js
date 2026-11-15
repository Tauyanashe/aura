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
      throw new Error('File exceeds the 25 MB limit.');
    }

    return true;
  },

  async uploadMedia(file, idempotencyKey = crypto.randomUUID()) {
    this.validateFile(file);

    if (isMockMode) {
      // In mock mode (local testing before cloud bucket is set), compress locally
      const dataUrl = await compressMockImage(file);
      const fakeId = 'media-' + Math.random().toString(36).substring(2, 9);
      return {
        id: fakeId,
        drive_file_id: 'drive_' + fakeId,
        file_name: file.name,
        mime_type: file.type.startsWith('image/') ? 'image/jpeg' : file.type,
        size_bytes: file.size,
        dataUrl,
        url: dataUrl,
        reservationId: 'res-' + Math.random().toString(36).substring(2, 9),
        status: 'uploaded',
      };
    }

    // ─── Real Production Cloud Storage Upload via Supabase ───
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr) {
      throw new Error(`Cloud storage upload failed: ${uploadErr.message}`);
    }

    // Retrieve public CDN URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return {
      id: 'media-' + Date.now(),
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      url: publicUrl,
      dataUrl: publicUrl,
      status: 'uploaded',
    };
  },

  async uploadAvatar(file, userId) {
    this.validateFile(file);

    if (isMockMode) {
      return compressMockImage(file, 256, 0.8);
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  getMediaUrl(mediaAsset) {
    if (!mediaAsset) return '';
    if (mediaAsset.url) return mediaAsset.url;
    if (mediaAsset.dataUrl) return mediaAsset.dataUrl;

    if (isMockMode) {
      return '';
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(mediaAsset.file_name || mediaAsset.id);

    return publicUrl || '';
  },
};
