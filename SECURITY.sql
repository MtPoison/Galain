-- Galian MCP – durcissement Supabase (à exécuter UNE fois : SQL Editor → New query → coller → Run)
-- À lancer après les scripts de SUPABASE.md. Peut être relancé sans danger.

-- 1. Anti force brute sur le mot de passe administrateur ------------------------------------------
create table if not exists admin_attempts (ip text not null, at timestamptz not null default now());
create index if not exists admin_attempts_idx on admin_attempts (ip, at);
alter table admin_attempts enable row level security;            -- aucune policy : illisible depuis le site
revoke all on admin_attempts from anon, authenticated;

-- adresse du visiteur (Cloudflare la pose et un visiteur ne peut pas la falsifier)
create or replace function client_ip() returns text language sql stable as $$
  select coalesce(
    nullif(trim(coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json ->> 'cf-connecting-ip'), ''),
    nullif(trim(split_part(coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json ->> 'x-forwarded-for', ',', 1)), ''),
    'unknown');
$$;

-- 5 échecs en 15 minutes depuis une même adresse (ou 60 au total) : les essais suivants sont refusés
create or replace function check_admin(p_pass text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare v_ip text := client_ip(); v_ok boolean;
begin
  delete from admin_attempts where at < now() - interval '1 day';
  if (select count(*) from admin_attempts where ip = v_ip and at > now() - interval '15 minutes') >= 5
     or (select count(*) from admin_attempts where at > now() - interval '15 minutes') >= 60 then
    return false;
  end if;
  if p_pass is null or length(p_pass) > 200 then return false; end if;
  select exists (select 1 from admin_secret where hash = crypt(p_pass, hash)) into v_ok;
  if v_ok then delete from admin_attempts where ip = v_ip; else insert into admin_attempts (ip) values (v_ip); end if;
  return v_ok;
end $$;

-- 2. Fonctions d'écriture : renvoient false (au lieu de lever une erreur) pour que l'échec soit bien compté,
--    n'acceptent que les clés connues et une taille raisonnable ----------------------------------------
drop function if exists save_content(text, text, jsonb);
create function save_content(p_pass text, p_key text, p_value jsonb) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not check_admin(p_pass) then return false; end if;
  if p_key not in ('histoire', 'members', 'sorties', 'years', 'events', 'allies', 'galerie', 'order', 'likes') then raise exception 'clé invalide'; end if;
  if pg_column_size(p_value) > 8000000 then raise exception 'contenu trop volumineux'; end if;
  insert into site_content (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return true;
end $$;

drop function if exists reset_content(text);
create function reset_content(p_pass text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not check_admin(p_pass) then return false; end if;
  delete from site_content where true;
  return true;
end $$;

drop function if exists change_admin_password(text, text);
create function change_admin_password(p_old text, p_new text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not check_admin(p_old) then return false; end if;
  if p_new is null or length(p_new) < 8 or length(p_new) > 200 then raise exception 'mot de passe trop court (8 caractères minimum)'; end if;
  update admin_secret set hash = crypt(p_new, gen_salt('bf')) where id = 1;
  return true;
end $$;

revoke execute on function save_content(text, text, jsonb), reset_content(text), change_admin_password(text, text), check_admin(text) from public;
grant execute on function save_content(text, text, jsonb), reset_content(text), change_admin_password(text, text), check_admin(text) to anon;

-- 3. Pouces : identifiant valide, pas de création illimitée de lignes, 30 pouces par minute et par visiteur -------
create table if not exists thumb_log (ip text not null, at timestamptz not null default now());
create index if not exists thumb_log_idx on thumb_log (ip, at);
alter table thumb_log enable row level security;
revoke all on thumb_log from anon, authenticated;

create or replace function toggle_thumb(p_id text, p_delta integer)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer; v_ip text := client_ip();
begin
  if p_delta not in (1, -1) or p_id is null or p_id !~ '^[a-z0-9-]{1,100}$' then raise exception 'invalide'; end if;
  delete from thumb_log where at < now() - interval '1 hour';
  if (select count(*) from thumb_log where ip = v_ip and at > now() - interval '1 minute') >= 30 then raise exception 'trop de requêtes'; end if;
  if not exists (select 1 from thumbs where sortie_id = p_id) and (select count(*) from thumbs) >= 2000 then raise exception 'limite atteinte'; end if;
  insert into thumb_log (ip) values (v_ip);
  insert into thumbs (sortie_id, count) values (p_id, greatest(p_delta, 0))
  on conflict (sortie_id) do update set count = greatest(thumbs.count + p_delta, 0)
  returning count into n;
  return n;
end $$;
grant execute on function toggle_thumb(text, integer) to anon;

-- 4. « Mot de passe oublié » : plus aucun mot de passe en clair ---------------------------------------------
-- (le site envoie désormais un mot de passe temporaire aléatoire ; l'ancienne copie en clair est supprimée)
drop function if exists forgot_get();
drop function if exists forgot_mark();
alter table admin_secret drop column if exists clair;

-- 3. Délai d'attente : la ligne « sorties » contient toutes les photos (et vidéos) en base64, elle peut être lourde.
--    Le délai par défaut du rôle anon (quelques secondes) la faisait échouer : « canceling statement due to statement timeout ».
alter role anon set statement_timeout = '30s';
notify pgrst, 'reload config';
