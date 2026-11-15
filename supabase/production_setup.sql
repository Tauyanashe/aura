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
    avatar_url text,
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
-- ==============================================================================
-- AURA ZERO-BUDGET BETA: ROW LEVEL SECURITY & HARDENED PERMISSIONS
-- File: supabase/migrations/002_rls_policies.sql
-- Description: Airtight RLS on all tables, secure definer helpers, search path protection
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS (Protected Search Path)
-- -----------------------------------------------------------------------------

-- Check if user is an admin
create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = check_user_id and role = 'admin'
  );
$$;

-- Check if user is a moderator or admin
create or replace function public.is_moderator(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = check_user_id and role in ('admin', 'moderator')
  );
$$;

-- Check if two users have a block relationship (either direction)
create or replace function public.is_blocked_mutually(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = user_a and blocked_id = user_b)
       or (blocker_id = user_b and blocked_id = user_a)
  );
$$;

-- Check if viewer can see a given post based on visibility, profile privacy, and blocks
create or replace function public.can_view_post(p_post_id uuid, p_viewer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_post record;
  v_author_is_private boolean;
begin
  select user_id, status, visibility into v_post
  from public.posts
  where id = p_post_id;

  if not found then
    return false;
  end if;

  -- Post author can always view their own posts
  if p_viewer_id is not null and v_post.user_id = p_viewer_id then
    return true;
  end if;

  -- Deleted or rejected posts are hidden from everyone except author or moderators
  if v_post.status <> 'published' then
    return public.is_moderator(p_viewer_id);
  end if;

  -- If blocked mutually, deny access immediately
  if p_viewer_id is not null and public.is_blocked_mutually(v_post.user_id, p_viewer_id) then
    return false;
  end if;

  -- Private visibility: only author can view (handled above)
  if v_post.visibility = 'private' then
    return false;
  end if;

  -- Check author profile privacy
  select is_private into v_author_is_private
  from public.profiles
  where id = v_post.user_id;

  -- If author profile is private or post visibility is 'followers':
  if v_author_is_private or v_post.visibility = 'followers' then
    if p_viewer_id is null then
      return false;
    end if;
    return exists (
      select 1 from public.follows
      where follower_id = p_viewer_id
        and following_id = v_post.user_id
        and status = 'accepted'
    );
  end if;

  -- Otherwise, public post from public profile
  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- -----------------------------------------------------------------------------
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_blocks enable row level security;
alter table public.follows enable row level security;
alter table public.farms enable row level security;
alter table public.user_farms enable row level security;
alter table public.farm_cycles enable row level security;
alter table public.farm_usage enable row level security;
alter table public.posts enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_cleanup_queue enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;
alter table public.aura_wallets enable row level security;
alter table public.aura_transactions enable row level security;
alter table public.aura_scores enable row level security;
alter table public.notifications enable row level security;
alter table public.content_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.admin_audit_logs enable row level security;

-- -----------------------------------------------------------------------------
-- 3. RLS POLICIES
-- -----------------------------------------------------------------------------

-- USER ROLES: Users can read their own role; only admins can assign/delete roles
create policy "Users read own role" on public.user_roles
    for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "Admins manage roles" on public.user_roles
    for all using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));

-- PROFILES: Public read (if not blocked), self-write only
create policy "Read profiles if not blocked" on public.profiles
    for select using (
        auth.uid() = id or (
            not public.is_blocked_mutually(auth.uid(), id)
        )
    );

create policy "Users insert own profile" on public.profiles
    for insert with check (auth.uid() = id);

create policy "Users update own profile" on public.profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id);

-- USER SETTINGS: Strictly owner only
create policy "Users manage own settings" on public.user_settings
    for all using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- USER BLOCKS: Strictly owner only
create policy "Users view own blocklist" on public.user_blocks
    for select using (auth.uid() = blocker_id);

create policy "Users add to blocklist" on public.user_blocks
    for insert with check (auth.uid() = blocker_id and blocker_id <> blocked_id);

create policy "Users remove from blocklist" on public.user_blocks
    for delete using (auth.uid() = blocker_id);

-- FOLLOWS: Viewable by anyone not blocked; caller manages their follow relations
create policy "Read follows if not blocked" on public.follows
    for select using (
        not public.is_blocked_mutually(auth.uid(), follower_id) and
        not public.is_blocked_mutually(auth.uid(), following_id)
    );

create policy "Users can follow others" on public.follows
    for insert with check (
        auth.uid() = follower_id and
        not public.is_blocked_mutually(auth.uid(), following_id)
    );

create policy "Users can update received follow requests" on public.follows
    for update using (auth.uid() = following_id);

create policy "Users can unfollow or remove followers" on public.follows
    for delete using (auth.uid() = follower_id or auth.uid() = following_id);

-- FARMS CATALOGUE: Read-only to all authenticated, write strictly admin
create policy "Anyone can read active farms" on public.farms
    for select using (is_active = true or public.is_admin(auth.uid()));

create policy "Admins manage farms catalogue" on public.farms
    for all using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));

-- USER FARMS & CYCLES: Read own; modifications exclusively through trusted server functions
create policy "Users read own farms" on public.user_farms
    for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "Users read own cycles" on public.farm_cycles
    for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "Users read own usage ledger" on public.farm_usage
    for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- POSTS: Read allowed via can_view_post, insert/update/delete only by owner (or mod hide)
create policy "Select visible posts" on public.posts
    for select using (public.can_view_post(id, auth.uid()));

create policy "Users insert own posts" on public.posts
    for insert with check (auth.uid() = user_id);

create policy "Users update own drafts or caption" on public.posts
    for update using (auth.uid() = user_id or public.is_moderator(auth.uid()))
    with check (auth.uid() = user_id or public.is_moderator(auth.uid()));

create policy "Users delete own posts" on public.posts
    for delete using (auth.uid() = user_id or public.is_moderator(auth.uid()));

-- MEDIA ASSETS: Accessible only if user can view parent post (or user owns uploaded media)
create policy "Select media assets" on public.media_assets
    for select using (
        auth.uid() = user_id or
        (post_id is not null and public.can_view_post(post_id, auth.uid()))
    );

create policy "Users insert own media" on public.media_assets
    for insert with check (auth.uid() = user_id);

create policy "Users update own media" on public.media_assets
    for update using (auth.uid() = user_id);

-- MEDIA CLEANUP QUEUE: Internal only (admins/moderators)
create policy "Staff view cleanup queue" on public.media_cleanup_queue
    for select using (public.is_moderator(auth.uid()));

-- LIKES: Authenticated users manage only their own
create policy "Read likes for visible posts" on public.likes
    for select using (public.can_view_post(post_id, auth.uid()));

create policy "Users like visible posts" on public.likes
    for insert with check (
        auth.uid() = user_id and
        public.can_view_post(post_id, auth.uid())
    );

create policy "Users unlike posts" on public.likes
    for delete using (auth.uid() = user_id);

-- COMMENTS: Authenticated users manage own comments on visible posts
create policy "Read comments on visible posts" on public.comments
    for select using (public.can_view_post(post_id, auth.uid()));

create policy "Users comment on visible posts" on public.comments
    for insert with check (
        auth.uid() = user_id and
        public.can_view_post(post_id, auth.uid())
    );

create policy "Users edit or delete own comments" on public.comments
    for update using (auth.uid() = user_id or public.is_moderator(auth.uid()))
    with check (auth.uid() = user_id or public.is_moderator(auth.uid()));

create policy "Users delete own comments" on public.comments
    for delete using (auth.uid() = user_id or public.is_moderator(auth.uid()));

-- RATINGS: One rating per user per post. No self-rating allowed!
create policy "Read ratings for visible posts" on public.ratings
    for select using (public.can_view_post(post_id, auth.uid()));

create policy "Users rate visible posts" on public.ratings
    for insert with check (
        auth.uid() = user_id and
        public.can_view_post(post_id, auth.uid()) and
        not exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
    );

create policy "Users update own rating" on public.ratings
    for update using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id and
        score between 1 and 5
    );

create policy "Users delete own rating" on public.ratings
    for delete using (auth.uid() = user_id);

-- ECONOMY: aura_wallets & aura_transactions are READ-ONLY to users!
create policy "Users read own wallet" on public.aura_wallets
    for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "Users read own transactions" on public.aura_transactions
    for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "Users read aura scores" on public.aura_scores
    for select using (true); -- Publicly viewable reputation leaderboard

-- NOTIFICATIONS: Strictly user only
create policy "Users view own notifications" on public.notifications
    for select using (auth.uid() = user_id);

create policy "Users update own notifications" on public.notifications
    for update using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- MODERATION: Content reports submitted by any user; reviewed by staff
create policy "Users submit reports" on public.content_reports
    for insert with check (auth.uid() = reporter_id);

create policy "Users view own reports" on public.content_reports
    for select using (auth.uid() = reporter_id or public.is_moderator(auth.uid()));

create policy "Moderators update reports" on public.content_reports
    for update using (public.is_moderator(auth.uid()))
    with check (public.is_moderator(auth.uid()));

create policy "Moderators view and add mod actions" on public.moderation_actions
    for all using (public.is_moderator(auth.uid()))
    with check (public.is_moderator(auth.uid()));

create policy "Admins view audit logs" on public.admin_audit_logs
    for select using (public.is_admin(auth.uid()));
-- ==============================================================================
-- AURA ZERO-BUDGET BETA: STORED PROCEDURES, QUOTA LEDGER & TRIGGERS
-- File: supabase/migrations/003_functions_and_triggers.sql
-- Description: Atomic quota reservation, safe publishing, AP fraud prevention
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. ATOMIC QUOTA RESERVATION (Prevents Concurrency Race Conditions)
-- -----------------------------------------------------------------------------
create or replace function public.fn_reserve_farm_quota(
    p_user_id uuid,
    p_bytes bigint,
    p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_total_storage_limit bigint := 0;
    v_committed_storage bigint := 0;
    v_reserved_storage bigint := 0;
    v_available_storage bigint := 0;
    v_active_cycle_id uuid;
    v_posts_limit integer := 0;
    v_posts_used integer := 0;
    v_posts_reserved integer := 0;
    v_existing_reservation record;
    v_reservation_id uuid;
    v_current_user_farm_id uuid;
begin
    -- 1. Check idempotency
    select id, status, storage_bytes_reserved into v_existing_reservation
    from public.farm_usage
    where idempotency_key = p_idempotency_key;

    if found then
        return jsonb_build_object(
            'status', 'already_reserved',
            'reservation_id', v_existing_reservation.id,
            'bytes_reserved', v_existing_reservation.storage_bytes_reserved
        );
    end if;

    -- 2. Lock active user farms to serialize concurrent requests for this user
    perform 1 from public.user_farms
    where user_id = p_user_id and is_active = true
    for update;

    -- Calculate total cumulative storage across all active farms
    select coalesce(sum(f.storage_limit_bytes), 0)
    into v_total_storage_limit
    from public.user_farms uf
    join public.farms f on uf.farm_id = f.id
    where uf.user_id = p_user_id and uf.is_active = true;

    if v_total_storage_limit <= 0 then
        raise exception 'No active farm found for user. Please claim a free farm first.';
    end if;

    -- Get currently committed storage bytes from ready media assets
    select coalesce(sum(size_bytes), 0)
    into v_committed_storage
    from public.media_assets
    where user_id = p_user_id and status in ('ready', 'uploaded', 'processing');

    -- Get currently reserved (unexpired) storage bytes from pending reservations
    select coalesce(sum(storage_bytes_reserved), 0)
    into v_reserved_storage
    from public.farm_usage
    where user_id = p_user_id
      and status = 'reserved'
      and expires_at > now();

    v_available_storage := v_total_storage_limit - (v_committed_storage + v_reserved_storage);

    if (v_available_storage < p_bytes) then
        raise exception 'Cumulative storage limit exceeded. Available: % bytes, requested: % bytes',
            v_available_storage, p_bytes;
    end if;

    -- 3. Check Monthly Post Allowance in active cycle
    select fc.id, fc.user_farm_id, fc.posts_limit, fc.posts_used
    into v_active_cycle_id, v_current_user_farm_id, v_posts_limit, v_posts_used
    from public.farm_cycles fc
    where fc.user_id = p_user_id
      and current_date between fc.period_start and fc.period_end
      and (fc.posts_limit - fc.posts_used) > 0
    order by fc.created_at asc
    limit 1
    for update;

    if not found then
        raise exception 'Monthly posting allowance exhausted for the current cycle.';
    end if;

    -- Count active post reservations
    select coalesce(sum(posts_reserved), 0)
    into v_posts_reserved
    from public.farm_usage
    where user_id = p_user_id
      and status = 'reserved'
      and expires_at > now();

    if (v_posts_used + v_posts_reserved >= v_posts_limit) then
        raise exception 'Monthly post allowance is currently fully reserved by concurrent uploads.';
    end if;

    -- 4. Record the atomic reservation
    insert into public.farm_usage (
        user_id,
        user_farm_id,
        operation_type,
        storage_bytes_reserved,
        storage_bytes_committed,
        posts_reserved,
        posts_committed,
        status,
        idempotency_key,
        expires_at
    ) values (
        p_user_id,
        v_current_user_farm_id,
        'upload_reservation',
        p_bytes,
        0,
        1,
        0,
        'reserved',
        p_idempotency_key,
        now() + interval '1 hour'
    )
    returning id into v_reservation_id;

    return jsonb_build_object(
        'status', 'success',
        'reservation_id', v_reservation_id,
        'bytes_reserved', p_bytes,
        'storage_remaining_bytes', v_available_storage - p_bytes,
        'posts_remaining', v_posts_limit - (v_posts_used + v_posts_reserved + 1)
    );
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. RELEASE RESERVED QUOTA (Error Handling / Compensation)
-- -----------------------------------------------------------------------------
create or replace function public.fn_release_farm_quota(
    p_reservation_id uuid,
    p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.farm_usage
    set status = 'released',
        storage_bytes_reserved = 0,
        posts_reserved = 0
    where id = p_reservation_id and status = 'reserved';

    return found;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. ATOMIC POST PUBLISH & USAGE COMMIT
-- -----------------------------------------------------------------------------
create or replace function public.fn_commit_post_publish(
    p_user_id uuid,
    p_post_id uuid,
    p_media_id uuid,
    p_reservation_id uuid,
    p_caption text,
    p_visibility text default 'public'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_reservation record;
    v_cycle_id uuid;
    v_reward_idempotency text;
begin
    -- 1. Validate reservation
    select * into v_reservation
    from public.farm_usage
    where id = p_reservation_id
      and user_id = p_user_id
      and status = 'reserved'
    for update;

    if not found then
        raise exception 'Valid quota reservation not found or already consumed.';
    end if;

    -- 2. Verify media asset ownership
    perform 1 from public.media_assets
    where id = p_media_id and user_id = p_user_id;

    if not found then
        raise exception 'Media asset not found or unauthorized.';
    end if;

    -- 3. Find and increment active farm cycle
    select id into v_cycle_id
    from public.farm_cycles
    where user_id = p_user_id
      and current_date between period_start and period_end
    order by created_at asc
    limit 1
    for update;

    if not found then
        raise exception 'No active farm billing cycle found.';
    end if;

    update public.farm_cycles
    set posts_used = posts_used + 1
    where id = v_cycle_id;

    -- 4. Commit farm usage
    update public.farm_usage
    set status = 'committed',
        operation_type = 'post_publish',
        post_id = p_post_id,
        media_id = p_media_id,
        storage_bytes_committed = v_reservation.storage_bytes_reserved,
        storage_bytes_reserved = 0,
        posts_committed = 1,
        posts_reserved = 0
    where id = p_reservation_id;

    -- 5. Attach media to post and mark ready
    update public.media_assets
    set post_id = p_post_id,
        status = 'ready'
    where id = p_media_id;

    -- 6. Publish post
    update public.posts
    set caption = coalesce(p_caption, caption),
        visibility = coalesce(p_visibility, 'public'),
        status = 'published',
        published_at = coalesce(published_at, now()),
        updated_at = now()
    where id = p_post_id and user_id = p_user_id;

    -- 7. Award Aura Points for publishing with idempotency
    v_reward_idempotency := 'reward_post_publish_' || p_post_id::text;
    perform public.fn_award_aura_points(
        p_user_id,
        25, -- 25 AP for publishing quality content
        'post_published',
        p_post_id,
        v_reward_idempotency,
        'Reward for publishing a new post'
    );

    -- 8. Recalculate Aura Score
    perform public.fn_calculate_aura_score(p_user_id);

    return jsonb_build_object(
        'status', 'published',
        'post_id', p_post_id,
        'published_at', now()
    );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. SAFE POST DELETION & STORAGE RELEASE
-- -----------------------------------------------------------------------------
create or replace function public.fn_delete_post_safe(
    p_user_id uuid,
    p_post_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_post record;
    v_media record;
    v_freed_bytes bigint := 0;
begin
    -- 1. Check ownership or moderation privileges
    select * into v_post
    from public.posts
    where id = p_post_id;

    if not found then
        raise exception 'Post not found.';
    end if;

    if v_post.user_id <> p_user_id and not public.is_moderator(p_user_id) then
        raise exception 'Unauthorized to delete this post.';
    end if;

    -- 2. Mark post deleted
    update public.posts
    set status = 'deleted',
        updated_at = now()
    where id = p_post_id;

    -- 3. Queue Drive media files for safe asynchronous deletion and record storage decrement
    for v_media in
        select id, drive_file_id, size_bytes
        from public.media_assets
        where post_id = p_post_id and status <> 'deleted'
    loop
        v_freed_bytes := v_freed_bytes + v_media.size_bytes;

        -- Update media asset
        update public.media_assets
        set status = 'deleted'
        where id = v_media.id;

        -- Add to cleanup queue
        insert into public.media_cleanup_queue (
            drive_file_id,
            media_asset_id,
            reason,
            status
        ) values (
            v_media.drive_file_id,
            v_media.id,
            'post_deleted',
            'pending'
        );
    end loop;

    -- 4. Insert storage decrement record in farm_usage ledger
    if v_freed_bytes > 0 then
        insert into public.farm_usage (
            user_id,
            post_id,
            operation_type,
            storage_bytes_reserved,
            storage_bytes_committed,
            status,
            idempotency_key
        ) values (
            v_post.user_id,
            p_post_id,
            'storage_decrement',
            0,
            -v_freed_bytes,
            'committed',
            'storage_free_' || p_post_id::text || '_' || extract(epoch from now())::text
        );
    end if;

    -- 5. Recalculate author reputation
    perform public.fn_calculate_aura_score(v_post.user_id);

    return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. FRAUD-PROOF AURA POINTS LEDGER
-- -----------------------------------------------------------------------------
create or replace function public.fn_award_aura_points(
    p_user_id uuid,
    p_amount bigint,
    p_type text,
    p_reference_id uuid default null,
    p_idempotency_key text default null,
    p_description text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_key text;
    v_daily_earnings bigint := 0;
    v_max_daily_cap bigint := 200; -- Max 200 AP per rolling 24 hours from engagement
    v_new_balance bigint;
begin
    v_key := coalesce(p_idempotency_key, gen_random_uuid()::text);

    -- Check if transaction already exists (idempotency check)
    if exists (select 1 from public.aura_transactions where idempotency_key = v_key) then
        select balance into v_new_balance from public.aura_wallets where user_id = p_user_id;
        return jsonb_build_object(
            'status', 'already_processed',
            'balance', v_new_balance
        );
    end if;

    -- Enforce anti-fraud daily cap on engagement rewards
    if p_type in ('rating_received', 'rating_given', 'like_received', 'comment_received') then
        select coalesce(sum(amount), 0)
        into v_daily_earnings
        from public.aura_transactions
        where user_id = p_user_id
          and transaction_type in ('rating_received', 'rating_given', 'like_received', 'comment_received')
          and created_at > (now() - interval '24 hours');

        if (v_daily_earnings + p_amount > v_max_daily_cap) then
            p_amount := greatest(0, v_max_daily_cap - v_daily_earnings);
            if p_amount = 0 then
                return jsonb_build_object('status', 'daily_cap_reached', 'balance', v_new_balance);
            end if;
        end if;
    end if;

    -- Ensure wallet exists
    insert into public.aura_wallets (user_id, balance, lifetime_earned)
    values (p_user_id, 0, 0)
    on conflict (user_id) do nothing;

    -- Record transaction
    insert into public.aura_transactions (
        user_id,
        amount,
        transaction_type,
        reference_id,
        idempotency_key,
        description
    ) values (
        p_user_id,
        p_amount,
        p_type,
        p_reference_id,
        v_key,
        p_description
    );

    -- Update wallet atomically
    update public.aura_wallets
    set balance = balance + p_amount,
        lifetime_earned = lifetime_earned + greatest(0, p_amount),
        updated_at = now()
    where user_id = p_user_id
    returning balance into v_new_balance;

    return jsonb_build_object(
        'status', 'success',
        'amount', p_amount,
        'balance', v_new_balance
    );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. REPUTATION ENGINE (AURA SCORE CALCULATION)
-- -----------------------------------------------------------------------------
create or replace function public.fn_calculate_aura_score(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_published_posts integer := 0;
    v_avg_rating numeric(3,2) := 0.0;
    v_total_ratings integer := 0;
    v_total_likes integer := 0;
    v_penalties integer := 0;
    v_calculated_score integer := 100;
    v_tier text := 'Novice';
begin
    -- 1. Count quality published posts
    select count(*) into v_published_posts
    from public.posts
    where user_id = p_user_id and status = 'published';

    -- 2. Average rating received on author's posts
    select coalesce(avg(r.score), 0), count(r.score)
    into v_avg_rating, v_total_ratings
    from public.ratings r
    join public.posts p on r.post_id = p.id
    where p.user_id = p_user_id and p.status = 'published';

    -- 3. Total likes received
    select count(*) into v_total_likes
    from public.likes l
    join public.posts p on l.post_id = p.id
    where p.user_id = p_user_id and p.status = 'published';

    -- 4. Moderation penalties
    select count(*) * 50 into v_penalties
    from public.moderation_actions
    where target_type = 'user' and target_id = p_user_id and action_type in ('suspend', 'warn');

    -- Compute score: Base(100) + Posts(x10) + RatingsWeighted + Likes(x2) - Penalties
    v_calculated_score := 100
        + (v_published_posts * 10)
        + round(v_avg_rating * least(v_total_ratings, 50) * 4)
        + (v_total_likes * 2)
        - v_penalties;

    if v_calculated_score < 0 then
        v_calculated_score := 0;
    end if;

    -- Determine Tier
    if v_calculated_score >= 2000 then
        v_tier := 'Legend';
    elsif v_calculated_score >= 1000 then
        v_tier := 'Aura Master';
    elsif v_calculated_score >= 500 then
        v_tier := 'Artisan';
    elsif v_calculated_score >= 250 then
        v_tier := 'Apprentice';
    else
        v_tier := 'Novice';
    end if;

    -- Store score snapshot
    insert into public.aura_scores (
        user_id,
        score,
        tier,
        posts_published_score,
        ratings_average_score,
        community_engagement_score,
        penalties_score,
        calculated_at
    ) values (
        p_user_id,
        v_calculated_score,
        v_tier,
        v_published_posts * 10,
        round(v_avg_rating * 100)::integer,
        v_total_likes * 2,
        v_penalties,
        now()
    );

    return v_calculated_score;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. SOCIAL ENGAGEMENT PROCESSOR WITH ANTI-FRAUD
-- -----------------------------------------------------------------------------
create or replace function public.fn_process_social_engagement(
    p_user_id uuid,
    p_post_id uuid,
    p_action text, -- 'like', 'unlike', 'rate', 'comment'
    p_rating_score smallint default null,
    p_comment_body text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_post record;
    v_comment_id uuid;
begin
    -- 1. Check viewing permissions
    if not public.can_view_post(p_post_id, p_user_id) then
        raise exception 'Post not found or access denied.';
    end if;

    select * into v_post from public.posts where id = p_post_id;

    -- 2. Handle Actions
    if p_action = 'like' then
        insert into public.likes (user_id, post_id)
        values (p_user_id, p_post_id)
        on conflict (user_id, post_id) do nothing;

        -- Update post stats
        update public.posts
        set likes_count = (select count(*) from public.likes where post_id = p_post_id)
        where id = p_post_id;

        -- Reward post owner (if not self-like)
        if v_post.user_id <> p_user_id then
            perform public.fn_award_aura_points(
                v_post.user_id,
                2,
                'like_received',
                p_post_id,
                'like_' || p_user_id::text || '_' || p_post_id::text,
                'Like received on post'
            );
        end if;

    elsif p_action = 'unlike' then
        delete from public.likes
        where user_id = p_user_id and post_id = p_post_id;

        update public.posts
        set likes_count = (select count(*) from public.likes where post_id = p_post_id)
        where id = p_post_id;

    elsif p_action = 'rate' then
        -- Anti-fraud: cannot rate own post
        if v_post.user_id = p_user_id then
            raise exception 'Authors cannot rate their own posts.';
        end if;

        if p_rating_score not between 1 and 5 then
            raise exception 'Rating score must be an integer between 1 and 5.';
        end if;

        insert into public.ratings (user_id, post_id, score, updated_at)
        values (p_user_id, p_post_id, p_rating_score, now())
        on conflict (user_id, post_id)
        do update set score = p_rating_score, updated_at = now();

        -- Update average and count
        update public.posts
        set ratings_count = (select count(*) from public.ratings where post_id = p_post_id),
            rating_average = (select coalesce(round(avg(score), 2), 0.00) from public.ratings where post_id = p_post_id)
        where id = p_post_id;

        -- Reward both participants with fraud cap
        perform public.fn_award_aura_points(
            v_post.user_id,
            p_rating_score * 2,
            'rating_received',
            p_post_id,
            'rating_recv_' || p_user_id::text || '_' || p_post_id::text || '_' || extract(epoch from now())::text,
            'Rating received on post'
        );

        perform public.fn_award_aura_points(
            p_user_id,
            2,
            'rating_given',
            p_post_id,
            'rating_given_' || p_user_id::text || '_' || p_post_id::text || '_' || extract(epoch from now())::text,
            'Rating contributed to post'
        );

    elsif p_action = 'comment' then
        if p_comment_body is null or char_length(trim(p_comment_body)) = 0 then
            raise exception 'Comment cannot be blank.';
        end if;

        insert into public.comments (user_id, post_id, body)
        values (p_user_id, p_post_id, trim(p_comment_body))
        returning id into v_comment_id;

        update public.posts
        set comments_count = (select count(*) from public.comments where post_id = p_post_id)
        where id = p_post_id;

        -- Reward post owner if someone else commented
        if v_post.user_id <> p_user_id then
            perform public.fn_award_aura_points(
                v_post.user_id,
                5,
                'comment_received',
                p_post_id,
                'comment_recv_' || v_comment_id::text,
                'Comment received on post'
            );
        end if;
    end if;

    -- Update author's score
    perform public.fn_calculate_aura_score(v_post.user_id);

    return jsonb_build_object(
        'status', 'success',
        'post_id', p_post_id,
        'action', p_action
    );
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. USER ONBOARDING TRIGGER (Free Farm + Wallet Provisioning)
-- -----------------------------------------------------------------------------
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_free_farm_id uuid;
    v_user_farm_id uuid;
    v_username text;
    v_clean_username text;
    v_first_day_of_month date;
    v_last_day_of_month date;
begin
    -- 1. Extract or generate valid unique username
    v_username := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
    v_clean_username := regexp_replace(v_username, '[^a-z0-9_]', '_', 'g');
    if char_length(v_clean_username) < 3 then
        v_clean_username := 'user_' || substr(new.id::text, 1, 8);
    end if;

    -- Insert profile
    insert into public.profiles (
        id,
        username,
        display_name,
        avatar_url,
        bio,
        is_private
    ) values (
        new.id,
        v_clean_username,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'display_name', initcap(split_part(v_clean_username, '_', 1))),
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        'AURA creator',
        false
    )
    on conflict (id) do update set
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
        display_name = coalesce(excluded.display_name, profiles.display_name);

    -- Assign default user role
    insert into public.user_roles (user_id, role)
    values (new.id, 'user')
    on conflict (user_id, role) do nothing;

    -- Provision wallet with 100 AP Welcome Bonus
    insert into public.aura_wallets (user_id, balance, lifetime_earned)
    values (new.id, 100, 100)
    on conflict (user_id) do nothing;

    insert into public.aura_transactions (
        user_id,
        amount,
        transaction_type,
        idempotency_key,
        description
    ) values (
        new.id,
        100,
        'welcome_bonus',
        'welcome_' || new.id::text,
        'Welcome to AURA Beta!'
    )
    on conflict (idempotency_key) do nothing;

    -- Provision initial Free Farm (3 posts, 250 MB)
    select id into v_free_farm_id from public.farms where is_free_tier = true limit 1;

    if v_free_farm_id is not null then
        insert into public.user_farms (user_id, farm_id, is_active)
        values (new.id, v_free_farm_id, true)
        returning id into v_user_farm_id;

        -- Create first month cycle
        v_first_day_of_month := date_trunc('month', current_date)::date;
        v_last_day_of_month := (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date;

        insert into public.farm_cycles (
            user_farm_id,
            user_id,
            period_start,
            period_end,
            posts_limit,
            posts_used
        ) values (
            v_user_farm_id,
            new.id,
            v_first_day_of_month,
            v_last_day_of_month,
            3,
            0
        )
        on conflict (user_farm_id, period_start) do nothing;
    end if;

    -- Initial Aura Score
    insert into public.aura_scores (user_id, score, tier)
    values (new.id, 100, 'Novice')
    on conflict (id) do nothing;

    return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.fn_handle_new_user();
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
-- ============================================================
-- Migration 005: Chat / Direct Messaging Schema
-- ============================================================

-- Conversations (DM threads between two users)
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

-- Participants in each conversation (many-to-many)
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- Messages within a conversation
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references auth.users(id) on delete cascade,
  body            text not null check (char_length(trim(body)) between 1 and 2000),
  created_at      timestamptz not null default now()
);

-- Indexes for fast lookups
create index if not exists idx_conv_participants_user on public.conversation_participants(user_id);
create index if not exists idx_messages_conv          on public.messages(conversation_id, created_at desc);
create index if not exists idx_messages_sender        on public.messages(sender_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.conversations           enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                enable row level security;

-- A user can see a conversation only if they are a participant
create policy "participants can view own conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  );

-- A user can view participant rows for their own conversations
create policy "participants can view participant rows"
  on public.conversation_participants for select
  using (user_id = auth.uid() or
    exists (
      select 1 from public.conversation_participants cp2
      where cp2.conversation_id = conversation_participants.conversation_id
        and cp2.user_id = auth.uid()
    )
  );

-- A user can join a conversation (insert themselves as participant)
create policy "users can create conversations"
  on public.conversations for insert
  with check (true);

create policy "users can add themselves as participant"
  on public.conversation_participants for insert
  with check (user_id = auth.uid());

-- Users can update their own last_read_at
create policy "users can mark conversations read"
  on public.conversation_participants for update
  using (user_id = auth.uid());

-- Users can read messages in their conversations
create policy "participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- Users can send messages to their own conversations
create policy "participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- ============================================================
-- Add gender column to profiles (if not yet added)
-- ============================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'gender'
  ) then
    alter table public.profiles
      add column gender text
        check (gender in ('male','female','other'))
        default 'other';
  end if;
end;
$$;
-- ==============================================================================
-- STORAGE BUCKET SETUP: MEDIA (POSTS & AVATARS)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public media access" on storage.objects;
drop policy if exists "Authenticated users can upload to media bucket" on storage.objects;
drop policy if exists "Authenticated users can update their uploads" on storage.objects;
drop policy if exists "Authenticated users can delete their uploads" on storage.objects;

create policy "Public media access"
on storage.objects for select
using ( bucket_id = 'media' );

create policy "Authenticated users can upload to media bucket"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'media' );

create policy "Authenticated users can update their uploads"
on storage.objects for update
to authenticated
using ( bucket_id = 'media' );

create policy "Authenticated users can delete their uploads"
on storage.objects for delete
to authenticated
using ( bucket_id = 'media' );
