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

## Changement du mot de passe depuis le site (3e script)

```sql
create or replace function change_admin_password(p_old text, p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not check_admin(p_old) then raise exception 'mot de passe incorrect'; end if;
  if length(p_new) < 4 then raise exception 'mot de passe trop court'; end if;
  update admin_secret set hash = crypt(p_new, gen_salt('bf')) where id = 1;
end $$;

grant execute on function change_admin_password(text, text) to anon;
```

## Mot de passe oublié (4e script + e-mail)

SQL Editor :

```sql
alter table admin_secret add column if not exists last_reset timestamptz;

create or replace function forgot_check() returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if exists (select 1 from admin_secret where last_reset > now() - interval '10 minutes') then raise exception 'trop tôt'; end if;
end $$;

create or replace function forgot_reset(p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  update admin_secret set hash = crypt(p_new, gen_salt('bf')), last_reset = now() where id = 1;
end $$;

revoke execute on function forgot_check(), forgot_reset(text) from public, anon, authenticated;
grant execute on function forgot_check(), forgot_reset(text) to service_role;
```

E-mail : créez un compte gratuit sur https://resend.com **avec l'adresse qui doit recevoir le mot de passe**, puis **API Keys → Create API Key**.

Vercel → projet → **Settings → Environment Variables**, ajoutez :

| Nom | Valeur |
|---|---|
| `SUPABASE_URL` | `https://hnmlvvmnpmiektatkspu.supabase.co` |
| `SUPABASE_SERVICE_KEY` | la clé **secret** de Supabase (API Keys → Secret keys) – jamais dans le code |
| `RESEND_API_KEY` | la clé Resend |
| `ADMIN_EMAIL` | l'adresse qui reçoit le mot de passe |

Puis **Deployments → Redeploy**.

## (OBSOLÈTE – ne plus utiliser, remplacé par SECURITY.sql) Mot de passe oublié : envoi du mot de passe actuel (5e script)

Le mot de passe est stocké haché (illisible). Pour pouvoir l'envoyer, une copie en clair est gardée dans une colonne que seule la clé secrète (Vercel) peut lire.

```sql
alter table admin_secret add column if not exists clair text;

-- remplacez MON_MOT_DE_PASSE par votre mot de passe actuel
update admin_secret set clair = 'MON_MOT_DE_PASSE' where id = 1;

create or replace function forgot_get() returns text
language sql security definer set search_path = public, extensions as $$ select clair from admin_secret where id = 1; $$;

create or replace function forgot_mark() returns void
language sql security definer set search_path = public, extensions as $$ update admin_secret set last_reset = now() where id = 1; $$;

create or replace function change_admin_password(p_old text, p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not check_admin(p_old) then raise exception 'mot de passe incorrect'; end if;
  if length(p_new) < 4 then raise exception 'mot de passe trop court'; end if;
  update admin_secret set hash = crypt(p_new, gen_salt('bf')), clair = p_new where id = 1;
end $$;

revoke execute on function forgot_get(), forgot_mark() from public, anon, authenticated;
grant execute on function forgot_get(), forgot_mark() to service_role;
```

## Sécurité (6e script – à lancer en dernier)

Exécutez le contenu de `SECURITY.sql` (il supprime aussi la copie en clair du mot de passe : « mot de passe oublié » envoie maintenant un mot de passe temporaire) dans **SQL Editor** : blocage après 5 mots de passe faux en 15 minutes, clés de contenu limitées à la liste connue, taille maximale, 8 caractères minimum pour le mot de passe, limitation des pouces. Le site fonctionne avec ou sans ce script, mais le blocage anti force brute n'est actif qu'après son exécution.

## Photos dans le stockage de fichiers (7e script)

Sans cela, les photos ajoutées par l'administrateur sont gardées dans le navigateur (limite d'environ 5 Mo). Avec cela, elles sont envoyées dans Supabase Storage et le site ne garde que leur adresse.

**SQL Editor → New query**, collez, puis **Run** :

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png'];

drop policy if exists "photos : envoi" on storage.objects;
create policy "photos : envoi" on storage.objects for insert to anon with check (bucket_id = 'photos');
```

Les photos sont publiques en lecture. Aucune règle de modification ni de suppression n'existe : personne ne peut remplacer une photo existante depuis le site. Les fichiers inutilisés se suppriment à la main dans **Storage → photos**.
