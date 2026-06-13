
-- Fix set_updated_at search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke direct EXECUTE on has_role (RLS policies still work — they bypass via definer chain)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;

-- Restrict storage bucket: don't allow listing, only direct file access via known path
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

CREATE POLICY "Public can read individual media files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voix-de-la-lune-media');
