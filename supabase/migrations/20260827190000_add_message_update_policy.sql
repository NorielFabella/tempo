-- =====================================================
-- Allow users to update their own messages
-- =====================================================

create policy "Users can update their own messages"
on messages
for update
to authenticated
using (
    sender_id = auth.uid()
    and public.is_room_member(room_id)
)
with check (
    sender_id = auth.uid()
    and public.is_room_member(room_id)
);
