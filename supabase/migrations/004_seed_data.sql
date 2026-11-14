-- ==============================================================================
-- AURA ZERO-BUDGET BETA: SEED DATA
-- File: supabase/migrations/004_seed_data.sql
-- Description: Standard farm catalogue and initial system configurations
-- ==============================================================================

insert into public.farms (
    name,
    slug,
    description,
    monthly_price,
    monthly_post_limit,
    storage_limit_bytes,
    is_active,
    is_free_tier
) values
(
    'Free Farm',
    'free-farm',
    'Starter farm for all beta members. Includes 3 monthly posts and 250 MB storage.',
    0.00,
    3,
    262144000, -- 250 MB in bytes
    true,
    true
),
(
    'Pioneer Farm',
    'pioneer-farm',
    'For passionate creators who publish weekly. Includes 30 monthly posts and 2 GB storage.',
    4.99,
    30,
    2147483648, -- 2 GB in bytes
    true,
    false
),
(
    'Creator Pro Farm',
    'creator-pro-farm',
    'High-capacity farm for daily creators. Includes 150 monthly posts and 10 GB storage.',
    14.99,
    150,
    10737418240, -- 10 GB in bytes
    true,
    false
)
on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    monthly_price = excluded.monthly_price,
    monthly_post_limit = excluded.monthly_post_limit,
    storage_limit_bytes = excluded.storage_limit_bytes;
