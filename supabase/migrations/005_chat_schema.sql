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
