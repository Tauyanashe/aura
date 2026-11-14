import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';

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
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Only allow admin or verified backend internal token to call arbitrary award
  const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: user.id });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin access required to manually adjust AP' }), { status: 403 });
  }

  try {
    const { targetUserId, amount, type, idempotencyKey, description } = await req.json();

    const { data, error } = await supabase.rpc('fn_award_aura_points', {
      p_user_id: targetUserId,
      p_amount: amount,
      p_type: type || 'admin_adjustment',
      p_idempotency_key: idempotencyKey,
      p_description: description || 'Admin manual balance adjustment',
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
