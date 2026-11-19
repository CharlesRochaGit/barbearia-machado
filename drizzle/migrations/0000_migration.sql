
create type public.app_role as enum ('admin');
create type public.appointment_status as enum ('pendente','confirmado','concluido','cancelado','nao_compareceu');
create type public.appointment_origin as enum ('site','whatsapp');

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first created user becomes admin (public signup is disabled)
create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.assign_first_admin();

-- settings
create table public.shop_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'Barbearia Machado',
  barber_name text not null default 'Pablo',
  whatsapp text not null default '5548984365051',
  address text not null default '',
  closed_weekdays int[] not null default '{1}',
  shifts jsonb not null default '[{"start":"09:00","end":"10:00"},{"start":"15:00","end":"21:00"}]',
  slot_minutes int not null default 45 check (slot_minutes between 5 and 240),
  updated_at timestamptz not null default now()
);
grant select on public.shop_settings to anon, authenticated;
grant update on public.shop_settings to authenticated;
grant all on public.shop_settings to service_role;
alter table public.shop_settings enable row level security;
create policy "public read settings" on public.shop_settings for select to anon, authenticated using (true);
create policy "admin update settings" on public.shop_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.shop_settings (id, address) values (1, 'Endereço a definir');

-- services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  duration_min int not null default 45 check (duration_min > 0),
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.services to anon;
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "public read active services" on public.services for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin insert services" on public.services for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update services" on public.services for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete services" on public.services for delete to authenticated using (public.has_role(auth.uid(),'admin'));
insert into public.services (category, name, duration_min, price, sort_order) values
 ('Cabelo','Corte navalhado',45,40,1),
 ('Cabelo','Corte simples',45,30,2),
 ('Cabelo','Corte desfaçado',45,35,3),
 ('Combos','Corte com barba',45,60,4),
 ('Química','Corte com luzes',45,135,5),
 ('Química','Corte platinado',45,145,6),
 ('Acabamento','Pezinho',45,10,7),
 ('Barba','Barba',45,30,8),
 ('Acabamento','Sobrancelha',45,10,9);

-- customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  is_client boolean not null default false,
  visits int not null default 0,
  last_visit timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "admin all customers" on public.customers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- appointments
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_min int not null,
  total_price numeric(10,2) not null,
  status appointment_status not null default 'pendente',
  reminder_sent boolean not null default false,
  origin appointment_origin not null default 'site',
  created_at timestamptz not null default now()
);
create index on public.appointments (start_at);
grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create policy "admin all appointments" on public.appointments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  duration_min int not null
);
grant select, insert, update, delete on public.appointment_services to authenticated;
grant all on public.appointment_services to service_role;
alter table public.appointment_services enable row level security;
create policy "admin all appointment_services" on public.appointment_services for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- occupied slots (no personal data)
create table public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  slot_start timestamptz not null,
  active boolean not null default true
);
create unique index appointment_slots_active_unique on public.appointment_slots (slot_start) where active;
grant select (slot_start, active) on public.appointment_slots to anon;
grant select, insert, update, delete on public.appointment_slots to authenticated;
grant all on public.appointment_slots to service_role;
alter table public.appointment_slots enable row level security;
create policy "public read active slots" on public.appointment_slots for select to anon using (active);
create policy "admin all slots" on public.appointment_slots for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- blocks
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
grant select, insert, update, delete on public.blocks to authenticated;
grant all on public.blocks to service_role;
alter table public.blocks enable row level security;
create policy "admin all blocks" on public.blocks for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- status side-effects
create or replace function public.on_appointment_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('cancelado','nao_compareceu') then
      update public.appointment_slots set active = false where appointment_id = new.id;
    elsif old.status in ('cancelado','nao_compareceu') then
      update public.appointment_slots set active = true where appointment_id = new.id;
    end if;
    if new.status in ('confirmado','concluido') and new.customer_id is not null then
      update public.customers set is_client = true where id = new.customer_id;
    end if;
    if new.status = 'concluido' and new.customer_id is not null then
      update public.customers set visits = visits + 1,
        last_visit = greatest(coalesce(last_visit, new.start_at), new.start_at)
      where id = new.customer_id;
    elsif old.status = 'concluido' and new.customer_id is not null then
      update public.customers set visits = greatest(visits - 1, 0) where id = new.customer_id;
    end if;
  end if;
  return new;
end $$;
create trigger appointments_status_change after update of status on public.appointments
for each row execute function public.on_appointment_status();

-- central booking logic
create or replace function public.create_appointment(
  p_name text, p_phone text, p_start timestamptz, p_service_ids uuid[], p_origin appointment_origin default 'site'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  s public.shop_settings;
  v_total_dur int; v_price numeric; v_count int;
  v_dur int; v_end timestamptz;
  v_local timestamp; v_dow int; v_ok boolean := false;
  sh jsonb; sh_start time; sh_end time; v_t time;
  v_customer uuid; v_appt uuid; i int;
begin
  select * into s from public.shop_settings where id = 1;
  if p_name is null or length(trim(p_name)) < 3 or length(p_name) > 100 then
    raise exception 'Informe seu nome completo.' using errcode = 'P0001';
  end if;
  if p_phone !~ '^55[1-9][0-9]9[0-9]{8}$' then
    raise exception 'Número de WhatsApp inválido.' using errcode = 'P0001';
  end if;
  if p_service_ids is null or array_length(p_service_ids,1) is null then
    raise exception 'Escolha pelo menos um serviço.' using errcode = 'P0001';
  end if;
  select count(*), sum(duration_min), sum(price) into v_count, v_total_dur, v_price
    from public.services where id = any(p_service_ids) and active;
  if v_count <> (select count(distinct x) from unnest(p_service_ids) x) then
    raise exception 'Algum serviço escolhido não está disponível.' using errcode = 'P0001';
  end if;
  v_dur := ceil(v_total_dur::numeric / s.slot_minutes)::int * s.slot_minutes;
  v_end := p_start + make_interval(mins => v_dur);
  if p_start <= now() then
    raise exception 'Esse horário já passou. Escolha outro.' using errcode = 'P0001';
  end if;
  if p_start > now() + interval '15 days' then
    raise exception 'Agendamentos só para os próximos 14 dias.' using errcode = 'P0001';
  end if;
  v_local := p_start at time zone 'America/Sao_Paulo';
  v_dow := extract(dow from v_local)::int;
  if v_dow = any(s.closed_weekdays) then
    raise exception 'A barbearia não abre nesse dia.' using errcode = 'P0001';
  end if;
  v_t := v_local::time;
  for sh in select * from jsonb_array_elements(s.shifts) loop
    sh_start := (sh->>'start')::time; sh_end := (sh->>'end')::time;
    if v_t >= sh_start and v_t + make_interval(mins => v_dur) <= sh_end
       and (extract(epoch from (v_t - sh_start))::int / 60) % s.slot_minutes = 0
       and v_t + make_interval(mins => v_dur) > v_t then
      v_ok := true;
    end if;
  end loop;
  if not v_ok then
    raise exception 'Esse horário não está disponível para a duração escolhida.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.blocks b where b.starts_at < v_end and b.ends_at > p_start) then
    raise exception 'Esse horário está bloqueado pelo barbeiro. Escolha outro.' using errcode = 'P0001';
  end if;

  insert into public.customers (name, phone) values (trim(p_name), p_phone)
    on conflict (phone) do update set name = excluded.name
    returning id into v_customer;

  insert into public.appointments (customer_id, customer_name, phone, start_at, end_at, duration_min, total_price, origin)
    values (v_customer, trim(p_name), p_phone, p_start, v_end, v_dur, v_price, p_origin)
    returning id into v_appt;

  insert into public.appointment_services (appointment_id, service_id, name, price, duration_min)
    select v_appt, id, name, price, duration_min from public.services where id = any(p_service_ids);

  begin
    for i in 0 .. (v_dur / s.slot_minutes) - 1 loop
      insert into public.appointment_slots (appointment_id, slot_start)
        values (v_appt, p_start + make_interval(mins => i * s.slot_minutes));
    end loop;
  exception when unique_violation then
    raise exception 'Ops! Alguém acabou de reservar esse horário. Escolha outro.' using errcode = 'P0001';
  end;
  return v_appt;
end $$;
revoke all on function public.create_appointment(text,text,timestamptz,uuid[],appointment_origin) from public, anon, authenticated;
grant execute on function public.create_appointment(text,text,timestamptz,uuid[],appointment_origin) to service_role;
