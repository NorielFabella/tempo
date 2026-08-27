-- =====================================================
-- Add deleted_at to room_members for per-user DM deletion
-- =====================================================

alter table public.room_members
add column if not exists deleted_at timestamptz default null;


-- =====================================================
-- Hide a direct-message conversation for the caller
-- =====================================================

create or replace function public.hide_direct_room(target_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Only allow hiding direct-message rooms where the caller
    -- is actually a member of the room.
    update room_members
    set deleted_at = now()
    where room_id = target_room_id
      and user_id = auth.uid()
      and exists (
          select 1
          from rooms
          where rooms.id = target_room_id
            and rooms.is_group = false
      );
end;
$$;

grant execute on function public.hide_direct_room(uuid) to authenticated;


-- =====================================================
-- Update get_or_create_direct_room to restore visibility
-- =====================================================

create or replace function public.get_or_create_direct_room(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    existing_room_id uuid;
    new_room_id uuid;
begin
    -- Check for an existing direct room between both users
    select r.id into existing_room_id
    from rooms r
    join room_members rm1
        on rm1.room_id = r.id
       and rm1.user_id = auth.uid()
    join room_members rm2
        on rm2.room_id = r.id
       and rm2.user_id = other_user_id
    where r.is_group = false
    limit 1;

    if existing_room_id is not null then
        -- Restore visibility for the calling user if previously hidden
        update room_members
        set deleted_at = null
        where room_id = existing_room_id
          and user_id = auth.uid();

        return existing_room_id;
    end if;

    -- Create new direct message room
    insert into rooms (created_by, is_group)
    values (auth.uid(), false)
    returning id into new_room_id;

    insert into room_members (room_id, user_id)
    values
        (new_room_id, auth.uid()),
        (new_room_id, other_user_id);

    return new_room_id;
end;
$$;

grant execute on function public.get_or_create_direct_room(uuid) to authenticated;
