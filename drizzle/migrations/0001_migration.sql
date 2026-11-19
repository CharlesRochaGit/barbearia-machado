revoke all on public.appointment_slots from anon;
grant select (slot_start, active) on public.appointment_slots to anon;
revoke all on public.appointments, public.customers, public.appointment_services, public.blocks, public.user_roles from anon;
revoke insert, update, delete on public.shop_settings, public.services from anon;