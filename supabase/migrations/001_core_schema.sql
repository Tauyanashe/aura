-- ==============================================================================
-- AURA ZERO-BUDGET BETA: CORE SCHEMA MIGRATION
-- File: supabase/migrations/001_core_schema.sql
-- Description: Core tables, constraints, enums, and indexes with pro-level security
-- ==============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ROLES & PERMISSIONS (RBAC outside user-editable profile)
-- -----------------------------------------------------------------------------
create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
    granted_at timestamptz not null default now(),
    granted_by uuid references auth.users(id),
    unique(user_id, role)
);

create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

-- -----------------------------------------------------------------------------
-- 2. USER PROFILES & SETTINGS
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
    display_name text not null check (char_length(trim(display_name)) between 1 and 60),
    bio text default '' check (char_length(bio) <= 300),
    avatar_media_id uuid,
    is_private boolean not null default false,
    is_banned boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_created on public.profiles(created_at desc);

create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    notify_on_like boolean not null default true,
    notify_on_comment boolean not null default true,
    notify_on_rating boolean not null default true,
    notify_on_follow boolean not null default true,
    email_notifications boolean not null default false,
    updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. RELATIONSHIPS: FOLLOWS & BLOCKS
-- -----------------------------------------------------------------------------
create table if not exists public.user_blocks (
    blocker_id uuid not null references auth.users(id) on delete cascade,
    blocked_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key(blocker_id, blocked_id),
    check(blocker_id <> blocked_id)
);

create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_id);

create table if not exists public.follows (
    follower_id uuid not null references auth.users(id) on delete cascade,
    following_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'accepted' check (status in ('pending', 'accepted', 'rejected')),
    created_at timestamptz not null default now(),
    primary key(follower_id, following_id),
    check(follower_id <> following_id)
);

create index if not exists idx_follows_following on public.follows(following_id, status);
create index if not exists idx_follows_follower on public.follows(follower_id, status);

-- -----------------------------------------------------------------------------
-- 4. FARM CATALOGUE & USER OWNERSHIP
-- -----------------------------------------------------------------------------
create table if not exists public.farms (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    slug text not null unique,
    description text default '',
    monthly_price numeric(10,2) not null default 0 check (monthly_price >= 0),
    monthly_post_limit integer not null check (monthly_post_limit >= 0),
    storage_limit_bytes bigint not null check (storage_limit_bytes >= 0),
    is_active boolean not null default true,
    is_free_tier boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.user_farms (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    farm_id uuid not null references public.farms(id) on delete restrict,
    acquired_at timestamptz not null default now(),
    expires_at timestamptz,
    is_active boolean not null default true,
    auto_renew boolean not null default true
);

create index if not exists idx_user_farms_user on public.user_farms(user_id, is_active);

-- Monthly allowance cycle per active user farm
create table if not exists public.farm_cycles (
    id uuid primary key default gen_random_uuid(),
    user_farm_id uuid not null references public.user_farms(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    period_start date not null,
    period_end date not null,
    posts_limit integer not null check (posts_limit >= 0),
    posts_used integer not null default 0 check (posts_used >= 0),
    created_at timestamptz not null default now(),
    unique(user_farm_id, period_start),
    check (posts_used <= posts_limit),
    check (period_end > period_start)
);

create index if not exists idx_farm_cycles_lookup on public.farm_cycles(user_id, period_start, period_end);

-- -----------------------------------------------------------------------------
-- 5. ATOMIC USAGE & RESERVATION LEDGER (Prevents Race Conditions)
-- -----------------------------------------------------------------------------
create table if not exists public.farm_usage (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    user_farm_id uuid references public.user_farms(id) on delete set null,
    post_id uuid,
    media_id uuid,
    operation_type text not null check (operation_type in (
        'upload_reservation', 'post_publish', 'quota_release', 'storage_decrement'
    )),
    storage_bytes_reserved bigint not null default 0 check (storage_bytes_reserved >= 0),
    storage_bytes_committed bigint not null default 0 check (storage_bytes_committed >= 0),
    posts_reserved integer not null default 0 check (posts_reserved in (0, 1)),
    posts_committed integer not null default 0 check (posts_committed in (0, 1)),
    status text not null default 'reserved' check (status in ('reserved', 'committed', 'released', 'expired')),
    idempotency_key text not null unique,
    expires_at timestamptz not null default (now() + interval '1 hour'),
    created_at timestamptz not null default now()
);

create index if not exists idx_farm_usage_user on public.farm_usage(user_id, status);
create index if not exists idx_farm_usage_idempotency on public.farm_usage(idempotency_key);

-- -----------------------------------------------------------------------------
-- 6. POSTS & MEDIA ASSETS
-- -----------------------------------------------------------------------------
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    caption text default '' check (char_length(caption) <= 2200),
    status text not null default 'draft' check (status in ('draft', 'processing', 'published', 'rejected', 'deleted')),
    visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
    likes_count integer not null default 0 check (likes_count >= 0),
    comments_count integer not null default 0 check (comments_count >= 0),
    ratings_count integer not null default 0 check (ratings_count >= 0),
    rating_average numeric(3,2) not null default 0.00 check (rating_average between 0.00 and 5.00),
    created_at timestamptz not null default now(),
    published_at timestamptz,
    updated_at timestamptz not null default now()
);

create index if not exists idx_posts_feed on public.posts(status, visibility, published_at desc);
create index if not exists idx_posts_user on public.posts(user_id, status, created_at desc);

create table if not exists public.media_assets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid references public.posts(id) on delete cascade,
    storage_provider text not null default 'google_drive' check (storage_provider in ('google_drive', 's3', 'mock')),
    drive_file_id text not null unique,
    file_name text not null,
    mime_type text not null check (mime_type in (
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime'
    )),
    size_bytes bigint not null check (size_bytes > 0),
    width integer check (width is null or width > 0),
    height integer check (height is null or height > 0),
    duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 120),
    checksum_sha256 text,
    status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed', 'deleted')),
    created_at timestamptz not null default now()
);

create index if not exists idx_media_post on public.media_assets(post_id);
create index if not exists idx_media_user on public.media_assets(user_id, status);

-- Orphaned Drive file cleanup queue
create table if not exists public.media_cleanup_queue (
    id uuid primary key default gen_random_uuid(),
    drive_file_id text not null,
    media_asset_id uuid references public.media_assets(id) on delete set null,
    reason text not null,
    attempts integer not null default 0 check (attempts >= 0),
    status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    last_error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_cleanup_queue_status on public.media_cleanup_queue(status, attempts);

-- -----------------------------------------------------------------------------
-- 7. SOCIAL ENGAGEMENT: LIKES, COMMENTS, RATINGS
-- -----------------------------------------------------------------------------
create table if not exists public.likes (
    user_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid not null references public.posts(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key(user_id, post_id)
);

create index if not exists idx_likes_post on public.likes(post_id);

create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid not null references public.posts(id) on delete cascade,
    body text not null check (char_length(trim(body)) between 1 and 1000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_comments_post on public.comments(post_id, created_at asc);
create index if not exists idx_comments_user on public.comments(user_id);

create table if not exists public.ratings (
    user_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid not null references public.posts(id) on delete cascade,
    score smallint not null check (score between 1 and 5),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key(user_id, post_id)
);

create index if not exists idx_ratings_post on public.ratings(post_id);

-- -----------------------------------------------------------------------------
-- 8. ECONOMY: AURA WALLET, TRANSACTIONS & AURA SCORE
-- -----------------------------------------------------------------------------
create table if not exists public.aura_wallets (
    user_id uuid primary key references auth.users(id) on delete cascade,
    balance bigint not null default 0 check (balance >= 0),
    lifetime_earned bigint not null default 0 check (lifetime_earned >= 0),
    updated_at timestamptz not null default now()
);

create table if not exists public.aura_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    amount bigint not null check (amount <> 0),
    transaction_type text not null check (transaction_type in (
        'welcome_bonus', 'post_published', 'rating_received', 'rating_given',
        'like_received', 'comment_received', 'simulated_farm_purchase',
        'admin_adjustment', 'abuse_penalty', 'reversal'
    )),
    reference_id uuid,
    idempotency_key text not null unique,
    description text default '',
    created_at timestamptz not null default now()
);

create index if not exists idx_aura_tx_user on public.aura_transactions(user_id, created_at desc);
create index if not exists idx_aura_tx_type on public.aura_transactions(transaction_type);

create table if not exists public.aura_scores (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    score integer not null default 100 check (score >= 0),
    tier text not null default 'Novice' check (tier in ('Novice', 'Apprentice', 'Artisan', 'Aura Master', 'Legend')),
    posts_published_score integer not null default 0,
    ratings_average_score integer not null default 0,
    community_engagement_score integer not null default 0,
    penalties_score integer not null default 0,
    calculated_at timestamptz not null default now()
);

create index if not exists idx_aura_scores_user on public.aura_scores(user_id, calculated_at desc);
create index if not exists idx_aura_scores_score on public.aura_scores(score desc);

-- -----------------------------------------------------------------------------
-- 9. NOTIFICATIONS
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    actor_id uuid references auth.users(id) on delete cascade,
    type text not null check (type in ('like', 'comment', 'rating', 'follow', 'quota_warning', 'system')),
    post_id uuid references public.posts(id) on delete cascade,
    data jsonb default '{}'::jsonb,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- -----------------------------------------------------------------------------
-- 10. MODERATION & AUDIT
-- -----------------------------------------------------------------------------
create table if not exists public.content_reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid references public.posts(id) on delete cascade,
    reported_user_id uuid references auth.users(id) on delete cascade,
    reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'copyright', 'misinformation', 'other')),
    details text check (details is null or char_length(details) <= 1000),
    status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolved_by uuid references auth.users(id),
    resolution_notes text,
    created_at timestamptz not null default now(),
    resolved_at timestamptz
);

create index if not exists idx_content_reports_status on public.content_reports(status, created_at asc);

create table if not exists public.moderation_actions (
    id uuid primary key default gen_random_uuid(),
    moderator_id uuid not null references auth.users(id),
    target_type text not null check (target_type in ('post', 'user', 'comment')),
    target_id uuid not null,
    action_type text not null check (action_type in ('hide', 'delete', 'suspend', 'warn', 'restore')),
    reason text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_mod_actions_target on public.moderation_actions(target_type, target_id);

create table if not exists public.admin_audit_logs (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid not null references auth.users(id),
    action text not null,
    entity_table text not null,
    entity_id uuid,
    details jsonb default '{}'::jsonb,
    ip_address text,
    created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit on public.admin_audit_logs(admin_id, created_at desc);
