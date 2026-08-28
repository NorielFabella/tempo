create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_id uuid not null references public.profiles(id),
    actor_id uuid null references public.profiles(id),
    type text not null check (type in ('new_message', 'added_to_group')),
    room_id uuid null references public.rooms(id) on delete set null,
    message_id uuid null references public.messages(id) on delete set null,
    created_at timestamptz not null default now(),
    read_at timestamptz null
);

create index notifications_recipient_created_at_idx
    on public.notifications (recipient_id, created_at desc);

create index notifications_recipient_read_at_created_at_idx
    on public.notifications (recipient_id, read_at, created_at desc);

create unique index notifications_new_message_dedupe_idx
    on public.notifications (recipient_id, message_id)
    where type = 'new_message' and message_id is not null;

create unique index notifications_added_to_group_dedupe_idx
    on public.notifications (recipient_id, room_id)
    where type = 'added_to_group' and room_id is not null;

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
    on public.notifications
    for select
    to authenticated
    using (recipient_id = auth.uid());

create policy "Users can update their own notifications"
    on public.notifications
    for update
    to authenticated
    using (recipient_id = auth.uid())
    with check (recipient_id = auth.uid());

create or replace function public.create_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.notifications (
        recipient_id,
        actor_id,
        type,
        room_id,
        message_id
    )
    select distinct
        room_member.user_id,
        new.sender_id,
        'new_message',
        new.room_id,
        new.id
    from public.room_members as room_member
    where room_member.room_id = new.room_id
      and room_member.user_id <> new.sender_id
    on conflict do nothing;

    return new;
end;
$$;

create trigger messages_create_notification
    after insert on public.messages
    for each row
    execute function public.create_message_notification();

create or replace function public.create_group_membership_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    room_is_group boolean;
    room_creator_id uuid;
    actor_id uuid;
begin
    select room.is_group, room.created_by
    into room_is_group, room_creator_id
    from public.rooms as room
    where room.id = new.room_id;

    if not coalesce(room_is_group, false) then
        return new;
    end if;

    actor_id := auth.uid();

    if new.user_id = room_creator_id or new.user_id = actor_id then
        return new;
    end if;

    insert into public.notifications (
        recipient_id,
        actor_id,
        type,
        room_id,
        message_id
    )
    values (
        new.user_id,
        actor_id,
        'added_to_group',
        new.room_id,
        null
    )
    on conflict do nothing;

    return new;
end;
$$;

create trigger room_members_create_group_notification
    after insert on public.room_members
    for each row
    execute function public.create_group_membership_notification();

alter publication supabase_realtime add table public.notifications;
