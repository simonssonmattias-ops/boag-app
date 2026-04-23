-- ============================================================
-- BOAG Koncern – Supabase databasschema v2
-- Kör detta i Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Anställda (med PIN-kod)
create table if not exists employees (
  id text primary key,
  name text not null,
  role text not null default 'employee',
  pin text not null default '0000',
  created_at timestamptz default now()
);

-- Standardanställda (ändra PIN-koderna!)
insert into employees (id, name, role, pin) values
  ('mattias', 'Mattias Simonsson', 'admin', '1234'),
  ('martti', 'Martti Ollila', 'employee', '5678')
on conflict (id) do nothing;

-- Projekt (med bolag-koppling)
create table if not exists projects (
  id text primary key,
  company text not null,
  name text not null,
  client text,
  start_date text,
  status text default 'active',
  description text,
  assigned_to text[] default '{}',
  created_at text
);

-- Dagbok (med bolag-koppling)
create table if not exists dagbok (
  id text primary key,
  company text not null,
  project_id text references projects(id) on delete cascade,
  date text,
  employee text,
  text text,
  photos jsonb default '[]',
  created_at text
);

-- Tidrapporter (med bolag-koppling)
create table if not exists tid (
  id text primary key,
  company text not null,
  project_id text references projects(id) on delete cascade,
  date text,
  employee text,
  hours numeric default 0,
  description text,
  created_at text
);

-- ÄTA (med bolag-koppling)
create table if not exists ata (
  id text primary key,
  company text not null,
  project_id text references projects(id) on delete cascade,
  date text,
  employee text,
  description text,
  hours numeric default 0,
  material text,
  status text default 'pending',
  created_at text
);

-- Anslag (gemensamt för hela koncernen – inget bolag-fält)
create table if not exists announcements (
  id text primary key,
  title text not null,
  text text,
  priority text default 'normal',
  pinned boolean default false,
  author text,
  date text,
  created_at timestamptz default now()
);

-- Projektfiler (med bolag-koppling)
create table if not exists project_files (
  id text primary key,
  company text not null,
  project_id text references projects(id) on delete cascade,
  name text,
  type text,
  size integer,
  data text,
  uploaded_at text,
  uploaded_by text
);

-- ============================================================
-- Row Level Security – tillåt publik åtkomst
-- (appen hanterar behörigheter i klientkoden via PIN + roller)
-- ============================================================
alter table employees enable row level security;
alter table projects enable row level security;
alter table dagbok enable row level security;
alter table tid enable row level security;
alter table ata enable row level security;
alter table announcements enable row level security;
alter table project_files enable row level security;

create policy "Public read" on employees for select using (true);
create policy "Public write" on employees for all using (true);
create policy "Public read" on projects for select using (true);
create policy "Public write" on projects for all using (true);
create policy "Public read" on dagbok for select using (true);
create policy "Public write" on dagbok for all using (true);
create policy "Public read" on tid for select using (true);
create policy "Public write" on tid for all using (true);
create policy "Public read" on ata for select using (true);
create policy "Public write" on ata for all using (true);
create policy "Public read" on announcements for select using (true);
create policy "Public write" on announcements for all using (true);
create policy "Public read" on project_files for select using (true);
create policy "Public write" on project_files for all using (true);

-- ============================================================
-- Lägg till fler anställda så här:
-- INSERT INTO employees (id, name, role, pin) VALUES
--   ('erik', 'Erik Johansson', 'employee', '4321'),
--   ('anna', 'Anna Lindström', 'employee', '8765');
-- ============================================================
