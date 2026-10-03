-- Hardening for an EXISTING OutfitMe database. Export/review its schema first.
-- This migration intentionally aborts if the expected tables are missing.
begin;
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','prendas','outfits','outfit_prendas','historial_usos','viajes','viaje_prendas','looks_del_dia','wishlist'] loop
    if to_regclass('public.' || table_name) is null then
      raise exception 'Missing OutfitMe table: %. Export and reconcile the existing schema first.', table_name;
    end if;
  end loop;
  foreach table_name in array array['prendas','outfits','viajes','looks_del_dia','wishlist'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy outfitme_owner_guard on public.%I as restrictive for all to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy outfitme_owner_access on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy outfitme_profile_guard on public.profiles as restrictive for all to public
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy outfitme_profile_access on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

alter table public.outfit_prendas enable row level security;
create policy outfitme_outfit_link_guard on public.outfit_prendas as restrictive for all to public
  using (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid()))
    and exists (select 1 from public.prendas p where p.id = prenda_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid()))
    and exists (select 1 from public.prendas p where p.id = prenda_id and p.user_id = (select auth.uid())));
create policy outfitme_outfit_link_access on public.outfit_prendas for all to authenticated using (true) with check (true);

alter table public.viaje_prendas enable row level security;
create policy outfitme_trip_link_guard on public.viaje_prendas as restrictive for all to public
  using (exists (select 1 from public.viajes v where v.id = viaje_id and v.user_id = (select auth.uid()))
    and exists (select 1 from public.prendas p where p.id = prenda_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.viajes v where v.id = viaje_id and v.user_id = (select auth.uid()))
    and exists (select 1 from public.prendas p where p.id = prenda_id and p.user_id = (select auth.uid())));
create policy outfitme_trip_link_access on public.viaje_prendas for all to authenticated using (true) with check (true);

alter table public.historial_usos enable row level security;
create policy outfitme_history_guard on public.historial_usos as restrictive for all to public
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid())));
create policy outfitme_history_access on public.historial_usos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- URLs saved by previous versions are still understood by PrivateImage.
update storage.buckets set public = false where id in ('prendas-fotos','avatares');
create policy outfitme_storage_guard on storage.objects as restrictive for all to public
  using (bucket_id not in ('prendas-fotos','avatares') or split_part(name, '/', 1) = (select auth.uid())::text)
  with check (bucket_id not in ('prendas-fotos','avatares') or split_part(name, '/', 1) = (select auth.uid())::text);
create policy outfitme_storage_access on storage.objects for all to authenticated
  using (bucket_id in ('prendas-fotos','avatares') and split_part(name, '/', 1) = (select auth.uid())::text)
  with check (bucket_id in ('prendas-fotos','avatares') and split_part(name, '/', 1) = (select auth.uid())::text);

create table public.outfitme_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  hour timestamptz not null,
  requests integer not null default 1,
  primary key (user_id, action, hour)
);
alter table public.outfitme_ai_usage enable row level security;
revoke all on public.outfitme_ai_usage from anon, authenticated;
create function public.consume_ai_quota(action_name text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); used integer; max_requests integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  max_requests := case action_name when 'generar-outfit' then 30 when 'clasificar-prenda' then 60 when 'analizar-inspiracion' then 30 when 'obtener-clima' then 120 else 0 end;
  if max_requests = 0 then return false; end if;
  delete from public.outfitme_ai_usage where user_id = current_user_id and hour < now() - interval '24 hours';
  insert into public.outfitme_ai_usage (user_id, action, hour) values (current_user_id, action_name, date_trunc('hour', now()))
    on conflict (user_id, action, hour) do update set requests = public.outfitme_ai_usage.requests + 1
    returning requests into used;
  return used <= max_requests;
end $$;
revoke all on function public.consume_ai_quota(text) from public, anon;
grant execute on function public.consume_ai_quota(text) to authenticated;

-- Called with the USER token, after the Edge Function removes the user's photos.
create function public.delete_personal_records(dry_run boolean default true) returns void
language plpgsql security invoker set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if dry_run then return; end if;
  delete from public.historial_usos where user_id = current_user_id;
  delete from public.outfit_prendas where outfit_id in (select id from public.outfits where user_id = current_user_id);
  delete from public.viaje_prendas where viaje_id in (select id from public.viajes where user_id = current_user_id);
  delete from public.outfits where user_id = current_user_id;
  delete from public.viajes where user_id = current_user_id;
  delete from public.looks_del_dia where user_id = current_user_id;
  delete from public.wishlist where user_id = current_user_id;
  delete from public.prendas where user_id = current_user_id;
  delete from public.profiles where id = current_user_id;
end $$;
revoke all on function public.delete_personal_records(boolean) from public, anon;
grant execute on function public.delete_personal_records(boolean) to authenticated;
commit;
