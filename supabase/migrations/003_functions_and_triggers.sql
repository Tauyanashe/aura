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
