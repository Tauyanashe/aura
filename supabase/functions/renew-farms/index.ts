import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';

serve(async (req: Request) => {
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');

  if (expectedSecret && cronSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized cron invocation' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Current UTC month boundaries
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

    const periodStart = startOfMonth.toISOString().split('T')[0];
    const periodEnd = endOfMonth.toISOString().split('T')[0];

    // Find all active user farms that don't have a cycle for this month yet
    const { data: activeFarms, error: farmError } = await supabase
      .from('user_farms')
      .select('id, user_id, farm_id, farms(monthly_post_limit)')
      .eq('is_active', true);

    if (farmError) {
      throw farmError;
    }

    let cyclesCreated = 0;
    for (const uf of activeFarms || []) {
      const postLimit = (uf.farms as any)?.monthly_post_limit || 3;

      const { error: cycleErr } = await supabase
        .from('farm_cycles')
        .insert({
          user_farm_id: uf.id,
          user_id: uf.user_id,
          period_start: periodStart,
          period_end: periodEnd,
          posts_limit: postLimit,
          posts_used: 0,
        })
        .select()
        .single();

      if (!cycleErr) {
        cyclesCreated++;
      }
    }

    return new Response(JSON.stringify({
      message: 'Monthly farm cycles verified and renewed.',
      periodStart,
      periodEnd,
      cyclesCreated,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
