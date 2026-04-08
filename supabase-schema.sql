-- Patterns table
create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- Tags table
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Decisions table
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status text not null default 'under_review' check (status in ('approved', 'under_review')),
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Junction table for decisions <-> patterns (multi-select)
create table if not exists decision_patterns (
  decision_id uuid references decisions(id) on delete cascade,
  pattern_id uuid references patterns(id) on delete cascade,
  primary key (decision_id, pattern_id)
);

-- Junction table for decisions <-> tags
create table if not exists decision_tags (
  decision_id uuid references decisions(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (decision_id, tag_id)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger decisions_updated_at
  before update on decisions
  for each row execute function update_updated_at();

-- RLS: enable and allow authenticated users full access
alter table patterns enable row level security;
alter table tags enable row level security;
alter table decisions enable row level security;
alter table decision_patterns enable row level security;
alter table decision_tags enable row level security;

create policy "Authenticated users can read patterns" on patterns for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert patterns" on patterns for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update patterns" on patterns for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete patterns" on patterns for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read tags" on tags for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert tags" on tags for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update tags" on tags for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete tags" on tags for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read decisions" on decisions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert decisions" on decisions for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update decisions" on decisions for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete decisions" on decisions for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read decision_patterns" on decision_patterns for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert decision_patterns" on decision_patterns for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete decision_patterns" on decision_patterns for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read decision_tags" on decision_tags for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert decision_tags" on decision_tags for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete decision_tags" on decision_tags for delete using (auth.role() = 'authenticated');
