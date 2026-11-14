import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';
import { getStorageAdapter } from '../_shared/storage-adapter.ts';

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
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { mediaId } = await req.json();

    const { data: media, error: mediaError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      return new Response(JSON.stringify({ error: 'Media asset not found' }), { status: 404 });
    }

    // Check ownership or moderator role
    const { data: isMod } = await supabase.rpc('is_moderator', { check_user_id: user.id });

    if (media.user_id !== user.id && !isMod) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Mark as deleted in DB
    await supabase
      .from('media_assets')
      .update({ status: 'deleted' })
      .eq('id', mediaId);

    // Queue for storage cleanup
    await supabase.from('media_cleanup_queue').insert({
      drive_file_id: media.drive_file_id,
      media_asset_id: media.id,
      reason: 'manual_media_delete',
      status: 'pending',
    });

    // Best-effort immediate storage deletion
    const storage = getStorageAdapter();
    try {
      await storage.delete(media.drive_file_id);
    } catch {
      // Background worker will retry
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
