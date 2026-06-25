-- Victory GamePlan V3 — Supabase Database Schema
-- Run this in the Supabase SQL Editor after creating your project

-- ─────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- USERS (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'bowler' check (role in ('bowler', 'coach', 'owner')),
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'academy', 'enterprise')),
  home_center text,
  usbc_number text,
  current_average numeric(5,2),
  coach_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────
-- BALL ARSENAL
-- ─────────────────────────────────────────────────────────
create table public.ball_arsenal (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  brand text not null,
  model text not null,
  weight numeric(4,1),
  coverstock_type text check (coverstock_type in ('Solid', 'Pearl', 'Hybrid', 'Urethane', 'Plastic', 'Other')),
  surface_grit text,
  layout text,
  purchase_date date,
  last_resurfaced date,
  drilled_by text default 'Victory Bowling Services',
  status text not null default 'active' check (status in ('active', 'retired', 'loaner')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ball_arsenal enable row level security;

create policy "Users can manage their own arsenal"
  on public.ball_arsenal for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- SESSIONS
-- ─────────────────────────────────────────────────────────
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  start_time time,
  bowling_center text,
  city text,
  state text,
  lane_pair text,
  session_type text check (session_type in ('Practice', 'League', 'Tournament', 'Open Bowling', 'Lesson / Coaching', 'Other')),
  oil_pattern text,
  pattern_length text,
  lane_condition text check (lane_condition in ('Fresh', 'Transition', 'Burn', 'Unknown')),
  overall_notes text,
  session_rating integer check (session_rating between 1 and 5),
  is_shared_with_coach boolean default false,
  tournament_name text,
  -- V2 migration support
  legacy_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.sessions for all using (auth.uid() = user_id);

create policy "Coaches can view shared sessions of linked bowlers"
  on public.sessions for select using (
    is_shared_with_coach = true
    and exists (
      select 1 from public.coach_links
      where coach_id = auth.uid()
      and bowler_id = sessions.user_id
      and status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────
-- GAMES
-- ─────────────────────────────────────────────────────────
create table public.games (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_number integer not null,
  score integer not null check (score between 0 and 300),
  ball_id uuid references public.ball_arsenal(id),
  ball_name text, -- fallback if ball not in arsenal
  starting_board text,
  target_board text,
  breakpoint text,
  miss_tendency text,
  spare_issues text,
  strike_count integer default 0,
  spare_count integer default 0,
  open_frame_count integer default 0,
  splits_faced integer default 0,
  splits_converted integer default 0,
  notes text,
  created_at timestamptz default now()
);

alter table public.games enable row level security;

create policy "Users can manage their own games"
  on public.games for all using (auth.uid() = user_id);

create policy "Coaches can view games of shared sessions"
  on public.games for select using (
    exists (
      select 1 from public.sessions s
      join public.coach_links cl on cl.bowler_id = s.user_id
      where s.id = games.session_id
      and s.is_shared_with_coach = true
      and cl.coach_id = auth.uid()
      and cl.status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────
-- COACH LINKS
-- ─────────────────────────────────────────────────────────
create table public.coach_links (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  bowler_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  linked_at timestamptz,
  created_at timestamptz default now(),
  unique(coach_id, bowler_id)
);

alter table public.coach_links enable row level security;

create policy "Coaches and bowlers can view their own links"
  on public.coach_links for select using (
    auth.uid() = coach_id or auth.uid() = bowler_id
  );

create policy "Bowlers can create link requests"
  on public.coach_links for insert with check (auth.uid() = bowler_id);

create policy "Coaches can update link status"
  on public.coach_links for update using (auth.uid() = coach_id);

-- ─────────────────────────────────────────────────────────
-- COACH SESSION NOTES
-- ─────────────────────────────────────────────────────────
create table public.coach_session_notes (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  note text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coach_session_notes enable row level security;

create policy "Coaches can manage their own notes"
  on public.coach_session_notes for all using (auth.uid() = coach_id);

create policy "Bowlers can view notes on their own sessions"
  on public.coach_session_notes for select using (
    exists (
      select 1 from public.sessions s
      where s.id = coach_session_notes.session_id
      and s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────
-- AI COACHING REVIEWS
-- ─────────────────────────────────────────────────────────
create table public.coaching_reviews (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  generated_by text not null default 'rule_based' check (generated_by in ('rule_based', 'ai')),
  review_text text,
  next_focus text,
  model_used text,
  created_at timestamptz default now()
);

alter table public.coaching_reviews enable row level security;

create policy "Users can view their own reviews"
  on public.coaching_reviews for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────
create index idx_sessions_user_date on public.sessions(user_id, date desc);
create index idx_games_session on public.games(session_id);
create index idx_games_user on public.games(user_id);
create index idx_ball_arsenal_user on public.ball_arsenal(user_id);
create index idx_coach_links_coach on public.coach_links(coach_id);
create index idx_coach_links_bowler on public.coach_links(bowler_id);

-- ─────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────
-- After running this script:
-- 1. Go to Authentication > Providers and enable Google OAuth
-- 2. Add your site URL to Authentication > URL Configuration
-- 3. Copy your project URL and anon key to your .env file
