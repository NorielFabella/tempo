-- =====================================================
-- Add group room avatar metadata
-- =====================================================

alter table public.rooms
  add column avatar_url text null,
  add column avatar_path text null;
