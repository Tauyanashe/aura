import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';
import { getStorageAdapter } from '../_shared/storage-adapter.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, range',
      },
    });
  }

  const url = new URL(req.url);
  const mediaId = url.searchParams.get('id');

  if (!mediaId) {
    return new Response('Media ID required', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Authenticate optional viewer
  let viewerId: string | null = null;
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      viewerId = user.id;
    }
  }

  // 1. Fetch Media Metadata
  const { data: media, error: mediaError } = await supabase
    .from('media_assets')
    .select('*, posts(user_id, status, visibility)')
    .eq('id', mediaId)
    .single();

  if (mediaError || !media) {
    return new Response('Media not found', { status: 404 });
  }

  if (media.status === 'deleted') {
    return new Response('Media no longer available', { status: 410 });
  }

  // 2. Access Authorization Check
  // If post exists, check viewer access
  if (media.post_id) {
    const { data: canView, error: authCheckError } = await supabase.rpc('can_view_post', {
      p_post_id: media.post_id,
      p_viewer_id: viewerId,
    });

    if (authCheckError || !canView) {
      return new Response('Access denied to private media', { status: 403 });
    }
  } else {
    // Unattached media: only owner may view
    if (!viewerId || viewerId !== media.user_id) {
      return new Response('Access denied', { status: 403 });
    }
  }

  // 3. Stream from Storage Adapter with Range header support
  const storageAdapter = getStorageAdapter();
  const rangeHeader = req.headers.get('Range');

  try {
    const result = await storageAdapter.retrieve(media.drive_file_id, rangeHeader);

    const headers: Record<string, string> = {
      'Content-Type': result.contentType || media.mime_type,
      'Content-Length': result.contentLength.toString(),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Cache-Control': 'private, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    };

    if (result.contentRange) {
      headers['Content-Range'] = result.contentRange;
    }

    if (result.stream) {
      return new Response(result.stream, {
        status: result.status,
        headers,
      });
    } else if (result.buffer) {
      return new Response(result.buffer, {
        status: result.status,
        headers,
      });
    }

    return new Response('No content', { status: 204, headers });
  } catch (err: any) {
    return new Response(`Media stream error: ${err.message}`, { status: 502 });
  }
});
