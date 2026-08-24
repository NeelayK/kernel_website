-- ============================================================
-- </KERNEL> — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (paste & Run),
-- or via `supabase db execute -f supabase/schema.sql`.
-- ============================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------
-- talks
-- ---------------------------------------------------------------
create table if not exists public.talks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  speaker      text,
  description  text,
  talk_date    timestamptz not null,
  image_url    text,
  link_url     text,          -- e.g. recording, slides, or a full write-up
  created_at   timestamptz not null default now()
);

create index if not exists talks_talk_date_idx on public.talks (talk_date desc);

alter table public.talks enable row level security;

create policy "public can read talks"
  on public.talks for select
  using (true);

-- ---------------------------------------------------------------
-- events
-- ---------------------------------------------------------------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  event_date   timestamptz not null,
  location     text,
  image_url    text,
  link_url     text,          -- e.g. registration form or recap post
  created_at   timestamptz not null default now()
);

create index if not exists events_event_date_idx on public.events (event_date desc);

alter table public.events enable row level security;

create policy "public can read events"
  on public.events for select
  using (true);

-- ---------------------------------------------------------------
-- newsletters
-- ---------------------------------------------------------------
create table if not exists public.newsletters (
  id                uuid primary key default gen_random_uuid(),
  issue_title       text not null,
  issue_number      int,
  cover_image_url   text,
  summary           text,
  pdf_url           text,      -- link to the PDF / Drive file / hosted issue
  published_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists newsletters_published_at_idx on public.newsletters (published_at desc);

alter table public.newsletters enable row level security;

create policy "public can read newsletters"
  on public.newsletters for select
  using (true);

-- ---------------------------------------------------------------
-- sections (groups on the About page — e.g. Faculty, Heads, Team Members)
-- "number" controls both the display order and is the key that
-- members are assigned to (members.section_number -> sections.number).
-- Add more rows any time to add more hierarchy levels later,
-- e.g. (4, 'Alumni'), (5, 'Volunteers') — no code changes needed.
-- ---------------------------------------------------------------
create table if not exists public.sections (
  id           uuid primary key default gen_random_uuid(),
  number       int not null unique,   -- display order + FK target for members
  title        text not null,         -- shown as the section heading
  created_at   timestamptz not null default now()
);

alter table public.sections enable row level security;

create policy "public can read sections"
  on public.sections for select
  using (true);

-- ---------------------------------------------------------------
-- members (people shown under each section on the About page)
-- ---------------------------------------------------------------
create table if not exists public.members (
  id             uuid primary key default gen_random_uuid(),
  section_number int not null references public.sections(number) on delete cascade,
  name           text not null,
  title          text,          -- role / position, e.g. "President", "Faculty Advisor"
  batch          text,          -- e.g. "2023"
  roll           text,          -- roll number
  description    text,
  image_url      text,          -- profile photo (pfp)
  sort_order     int default 0, -- lower first, within a section
  created_at     timestamptz not null default now()
);

create index if not exists members_section_number_idx on public.members (section_number);

alter table public.members enable row level security;

create policy "public can read members"
  on public.members for select
  using (true);

-- ============================================================
-- Notes
-- ============================================================
-- 1. These policies only grant SELECT. There is no public
--    INSERT/UPDATE/DELETE policy on any table — add or edit content
--    via the Supabase Table Editor, or build an authenticated admin
--    view later if you want in-app editing. This keeps the anon key
--    safe to ship in the frontend.
--
-- 2. image_url / cover_image_url / pdf_url can point anywhere public:
--    a Supabase Storage bucket, Google Drive, or any CDN link.
--    If you use Supabase Storage, create a public bucket (e.g. "media")
--    and paste the public object URL into these columns.
--
-- 3. To seed the About page hierarchy described in the site (Faculty,
--    Heads, Team Members), run:
--      insert into public.sections (number, title) values
--        (1, 'Faculty'), (2, 'Heads'), (3, 'Team Members');
--    then add rows to "members" with the matching section_number.
--    Add a 4th, 5th, etc. section any time — the About page renders
--    however many sections exist, in order of "number".
--
-- 4. If you previously ran an older version of this schema with a
--    "subscribers" table (from a newsletter signup form that has
--    since been removed from the site), it's safe to drop it:
--      drop table if exists public.subscribers cascade;
-- ============================================================
