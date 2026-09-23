-- SOMAR REPRESENTAÇÕES — BANCO E STORAGE
-- Execute no SQL Editor do seu projeto Supabase.
-- Depois crie um usuário de acesso em Authentication > Users.

create extension if not exists pgcrypto;

create table if not exists public.catalogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  category text not null,
  description text default '',
  pdf_path text not null,
  pdf_url text not null,
  cover_path text,
  cover_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalogs enable row level security;

drop policy if exists "Public can read published catalogs" on public.catalogs;
create policy "Public can read published catalogs"
on public.catalogs for select
to anon
using (published = true);

drop policy if exists "Authenticated can read catalogs" on public.catalogs;
create policy "Authenticated can read catalogs"
on public.catalogs for select
to authenticated
using (true);

drop policy if exists "Authenticated can insert catalogs" on public.catalogs;
create policy "Authenticated can insert catalogs"
on public.catalogs for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update catalogs" on public.catalogs;
create policy "Authenticated can update catalogs"
on public.catalogs for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can delete catalogs" on public.catalogs;
create policy "Authenticated can delete catalogs"
on public.catalogs for delete
to authenticated
using (true);

grant select on public.catalogs to anon;
grant select, insert, update, delete on public.catalogs to authenticated;

-- Bucket público para PDFs/capas dos catálogos.
insert into storage.buckets (id, name, public)
values ('catalogos', 'catalogos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read catalog files" on storage.objects;
create policy "Public can read catalog files"
on storage.objects for select
to public
using (bucket_id = 'catalogos');

drop policy if exists "Authenticated can upload catalog files" on storage.objects;
create policy "Authenticated can upload catalog files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'catalogos');

drop policy if exists "Authenticated can update catalog files" on storage.objects;
create policy "Authenticated can update catalog files"
on storage.objects for update
to authenticated
using (bucket_id = 'catalogos')
with check (bucket_id = 'catalogos');

drop policy if exists "Authenticated can delete catalog files" on storage.objects;
create policy "Authenticated can delete catalog files"
on storage.objects for delete
to authenticated
using (bucket_id = 'catalogos');
