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
