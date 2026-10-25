# Compteur de pouces partagé (Supabase)

Chaque visiteur peut liker **autant de sorties qu'il veut** (un pouce par sortie, qu'il peut retirer en recliquant).

## Étapes

1. Compte gratuit sur https://supabase.com, puis **New project**.
2. Menu de gauche → **SQL Editor** → **New query**, collez le script ci-dessous, puis **Run**.
3. **Project Settings → API** : copiez
   - **Project URL** → dans `data.js`, `SUPABASE_URL`
   - **anon public** → dans `data.js`, `SUPABASE_KEY`
   (jamais la clé `service_role`).
4. Publiez le site (Vercel).

## Script SQL

```sql
create table if not exists thumbs (
  sortie_id text primary key,
  count integer not null default 0 check (count >= 0)
);

alter table thumbs enable row level security;
create policy "lecture publique" on thumbs for select using (true);

create or replace function toggle_thumb(p_id text, p_delta integer)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if p_delta not in (1, -1) or length(p_id) > 100 then raise exception 'invalide'; end if;
  insert into thumbs (sortie_id, count) values (p_id, greatest(p_delta, 0))
  on conflict (sortie_id) do update set count = greatest(thumbs.count + p_delta, 0)
  returning count into n;
  return n;
end $$;

grant execute on function toggle_thumb(text, integer) to anon;
```

## Publication automatique des modifications admin (2e script)

Dans **SQL Editor → New query**, collez ceci, **remplacez `MON_MOT_DE_PASSE`** par le mot de passe administrateur voulu (ligne `insert`), puis **Run** :

```sql
create extension if not exists pgcrypto with schema extensions;

create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table site_content enable row level security;
create policy "lecture publique" on site_content for select using (true);

-- mot de passe admin (haché) : aucune policy = illisible depuis le site
create table if not exists admin_secret (id int primary key default 1 check (id = 1), hash text not null);
alter table admin_secret enable row level security;
insert into admin_secret (hash) values (extensions.crypt('MON_MOT_DE_PASSE', extensions.gen_salt('bf')))
  on conflict (id) do update set hash = excluded.hash;

create or replace function check_admin(p_pass text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from admin_secret where hash = crypt(p_pass, hash));
$$;

create or replace function save_content(p_pass text, p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not check_admin(p_pass) then raise exception 'mot de passe incorrect'; end if;
  insert into site_content (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

create or replace function reset_content(p_pass text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not check_admin(p_pass) then raise exception 'mot de passe incorrect'; end if;
  delete from site_content where true;
end $$;

grant execute on function check_admin(text), save_content(text, text, jsonb), reset_content(text) to anon;
```

Pour changer le mot de passe plus tard : relancez uniquement la ligne `insert … on conflict` avec le nouveau.
