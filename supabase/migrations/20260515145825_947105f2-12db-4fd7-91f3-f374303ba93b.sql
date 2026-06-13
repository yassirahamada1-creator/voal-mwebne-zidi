
-- 1) Revoke EXECUTE on bootstrap_first_admin (trigger function, never called directly)
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;

-- 2) Prevent listing files in the public media bucket while keeping public file reads working
-- Drop broad SELECT on storage.objects for this bucket if any custom policy exists,
-- and create a no-op policy that disallows listing via the API. Public URLs still work via CDN.
DROP POLICY IF EXISTS "Public read voix-de-la-lune-media" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;

-- Allow only direct object reads by exact name (no listing) — admins can list/manage.
CREATE POLICY "Admins can manage media bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'voix-de-la-lune-media' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'voix-de-la-lune-media' AND has_role(auth.uid(), 'admin'));
