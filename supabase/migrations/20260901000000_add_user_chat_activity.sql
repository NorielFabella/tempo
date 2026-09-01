create table public.user_chat_activity (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_chat_active boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_chat_activity enable row level security;


create policy "Users can view their own chat activity"
on public.user_chat_activity
for select
to authenticated
using (user_id = auth.uid());


create policy "Users can insert their own chat activity"
on public.user_chat_activity
for insert
to authenticated
with check (user_id = auth.uid());


create policy "Users can update their own chat activity"
on public.user_chat_activity
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
