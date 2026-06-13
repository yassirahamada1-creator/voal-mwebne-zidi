REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

DROP POLICY IF EXISTS "Anyone can view active modules" ON public.modules;
CREATE POLICY "Anyone can view active modules"
ON public.modules
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view published contents" ON public.contents;
CREATE POLICY "Anyone can view published contents"
ON public.contents
FOR SELECT
TO anon, authenticated
USING (is_published = true);