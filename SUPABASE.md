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
