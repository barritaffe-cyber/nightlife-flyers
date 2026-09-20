-- Billing values on profiles are trusted by the allowance function. The old
-- self-update policy allowed a customer to change their own plan/expiry.
-- All profile mutations in this app already go through authenticated server routes.
drop policy if exists "profiles_update_own" on public.profiles;
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select, insert, update, delete on public.profiles to service_role;

-- One purchase = one project, including both sizes. Only trusted server code
-- may grant credits or consume an allowance. Lock the owner to serialize races.
create table if not exists public.coco_flyer_credits (
  payment_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid,
  first_export_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists coco_flyer_credits_owner on public.coco_flyer_credits(user_id);
create table if not exists public.coco_flyer_exports (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null,
  cycle_end timestamptz not null,
  created_at timestamptz not null default now(),
  primary key(user_id, project_id)
);
create index if not exists coco_flyer_exports_cycle on public.coco_flyer_exports(user_id, cycle_end);
alter table public.coco_flyer_credits enable row level security;
alter table public.coco_flyer_exports enable row level security;
revoke all on public.coco_flyer_credits, public.coco_flyer_exports from anon, authenticated;

create or replace function public.coco_flyer_allowance(p_user_id uuid, p_action text default 'status', p_project_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p public.profiles%rowtype;
  subscribed boolean;
  limited boolean;
  available integer;
  used integer;
  reusable boolean;
  credit text;
  allowed boolean := false;
begin
  if p_action not in ('status','check','consume') then raise exception 'Invalid action'; end if;
  if p_action <> 'status' and p_project_id is null then raise exception 'Project required'; end if;
  select * into p from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profile missing'; end if;
  subscribed := coalesce(p.status in ('active','trial') and p.current_period_end > now(), false);
  limited := subscribed and p.plan in ('basic','full');
  select count(*) into available from public.coco_flyer_credits where user_id=p_user_id and project_id is null;
  select count(*) into used from public.coco_flyer_exports where user_id=p_user_id and cycle_end=p.current_period_end;
  select exists(select 1 from public.coco_flyer_credits where user_id=p_user_id and first_export_at + interval '7 days' > now()) into reusable;
  if p_action <> 'status' then
    -- A paid subscriber can download an already exported project again.
    if subscribed and exists(select 1 from public.coco_flyer_exports where user_id=p_user_id and project_id=p_project_id) then
      allowed := true;
    elsif exists(select 1 from public.coco_flyer_credits where user_id=p_user_id and project_id=p_project_id and first_export_at + interval '7 days' > now()) then
      allowed := true;
    elsif subscribed and not limited then
      allowed := true; -- preserve legacy subscriptions
    elsif p.status in ('night_pass','weekend_pass','day_pass','export_pass','ondemand','on_demand') and p.current_period_end > now() then
      allowed := true; -- preserve existing passes
    elsif limited and used < 20 then
      allowed := true;
      if p_action='consume' then
        insert into public.coco_flyer_exports(user_id,project_id,cycle_end) values(p_user_id,p_project_id,p.current_period_end);
        used := used + 1;
      end if;
    elsif available > 0 then
      allowed := true;
      if p_action='consume' then
        select payment_id into credit from public.coco_flyer_credits where user_id=p_user_id and project_id is null order by created_at limit 1;
        update public.coco_flyer_credits set project_id=p_project_id,first_export_at=now() where payment_id=credit;
        available := available - 1;
        reusable := true;
      end if;
    end if;
  end if;
  return jsonb_build_object('allowed',allowed,'monthly_limit',case when limited then 20 else null end,
    'monthly_used',case when limited then used else 0 end,'monthly_remaining',case when limited then greatest(0,20-used) else null end,
    'has_one_flyer_purchase',exists(select 1 from public.coco_flyer_credits where user_id=p_user_id),'credits',available,'one_flyer_access',available>0 or reusable,'cycle_end',p.current_period_end);
end $$;
revoke all on function public.coco_flyer_allowance(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.coco_flyer_allowance(uuid,text,uuid) to service_role;
grant all on public.coco_flyer_credits, public.coco_flyer_exports to service_role;
