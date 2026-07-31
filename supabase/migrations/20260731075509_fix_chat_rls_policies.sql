-- =====================================================
-- Helper Functions
-- =====================================================

create or replace function public.is_room_member(room_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from room_members
        where room_id = room_uuid
          and user_id = auth.uid()
    );
$$;

grant execute on function public.is_room_member(uuid) to authenticated;

-- =====================================================
-- Drop Existing Policies
-- =====================================================

drop policy if exists "Users can view their rooms" on rooms;
drop policy if exists "Authenticated users can create rooms" on rooms;

drop policy if exists "Users can view members of their rooms" on room_members;
drop policy if exists "Room creators can add members" on room_members;

drop policy if exists "Users can view messages in their rooms" on messages;
drop policy if exists "Users can send messages to their rooms" on messages;

-- =====================================================
-- Rooms
-- =====================================================

create policy "Users can view their rooms"
on rooms
for select
to authenticated
using (
    public.is_room_member(id)
);

create policy "Authenticated users can create rooms"
on rooms
for insert
to authenticated
with check (
    auth.uid() = created_by
);

-- =====================================================
-- Room Members
-- =====================================================

create policy "Users can view room members"
on room_members
for select
to authenticated
using (
    public.is_room_member(room_id)
);

create policy "Room creators can add members"
on room_members
for insert
to authenticated
with check (
    exists (
        select 1
        from rooms
        where rooms.id = room_members.room_id
          and rooms.created_by = auth.uid()
    )
);

-- =====================================================
-- Messages
-- =====================================================

create policy "Users can view messages"
on messages
for select
to authenticated
using (
    public.is_room_member(room_id)
);

create policy "Users can send messages"
on messages
for insert
to authenticated
with check (
    sender_id = auth.uid()
    and public.is_room_member(room_id)
);
