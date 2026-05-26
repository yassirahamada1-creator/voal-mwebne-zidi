
-- 1. Realtime: restrict messages subscription to authenticated users.
--    Data exposed via realtime (modules/contents/translations/gallery/quiz) is
--    already public-read, but we still scope subscriptions instead of leaving
--    realtime.messages without any RLS policy.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can subscribe to public content channels" ON realtime.messages;
CREATE POLICY "Public can subscribe to public content channels"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Revoke execute on internal trigger-only SECURITY DEFINER functions.
--    These are invoked by triggers, never by client API calls.
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;

-- 3. has_role is used inside RLS policies. Keep execute for authenticated
--    (needed when policies evaluate), revoke from anon/public to avoid
--    unauthenticated probing.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
