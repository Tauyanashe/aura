import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';
import { getStorageAdapter } from '../_shared/storage-adapter.ts';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB beta limit

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let reservationId: string | null = null;
  let uploadedFileId: string | null = null;
  const storageAdapter = getStorageAdapter();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const idempotencyKey = (formData.get('idempotencyKey') as string) || crypto.randomUUID();

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return new Response(JSON.stringify({ error: `Unsupported media type: ${file.type}` }), { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File size exceeds maximum 25 MB limit.' }), { status: 400 });
    }

    // 1. ATOMIC QUOTA RESERVATION
    const { data: reservation, error: resError } = await supabase.rpc('fn_reserve_farm_quota', {
      p_user_id: user.id,
      p_bytes: file.size,
      p_idempotency_key: idempotencyKey,
    });

    if (resError || !reservation || reservation.status !== 'success') {
      return new Response(JSON.stringify({
        error: resError?.message || 'Quota reservation failed. You may have exceeded monthly posts or storage limits.',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    reservationId = reservation.reservation_id;

    // 2. UPLOAD TO DRIVE VIA STORAGE ADAPTER
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await storageAdapter.upload(
      new Uint8Array(arrayBuffer),
      `${user.id}_${Date.now()}_${file.name}`,
      file.type
    );
    uploadedFileId = uploadResult.fileId;

    // 3. PERSIST MEDIA ASSET METADATA
    const { data: mediaAsset, error: mediaError } = await supabase
      .from('media_assets')
      .insert({
        user_id: user.id,
        storage_provider: uploadResult.provider,
        drive_file_id: uploadResult.fileId,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        status: 'uploaded',
      })
      .select()
      .single();

    if (mediaError || !mediaAsset) {
      throw new Error(`Failed to record media asset: ${mediaError?.message}`);
    }

    return new Response(JSON.stringify({
      mediaAsset,
      reservationId,
      quotaInfo: reservation,
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err: any) {
    // COMPENSATION ROLLBACK
    if (reservationId) {
      await supabase.rpc('fn_release_farm_quota', {
        p_reservation_id: reservationId,
        p_reason: 'upload_failure_compensation',
      });
    }

    if (uploadedFileId) {
      // Queue orphaned Drive file for guaranteed deletion
      await supabase.from('media_cleanup_queue').insert({
        drive_file_id: uploadedFileId,
        reason: 'upload_exception_rollback',
        status: 'pending',
      });
      // Best-effort immediate deletion
      try {
        await storageAdapter.delete(uploadedFileId);
      } catch {
        // Handled by cleanup queue
      }
    }

    return new Response(JSON.stringify({ error: err.message || 'Internal upload error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
