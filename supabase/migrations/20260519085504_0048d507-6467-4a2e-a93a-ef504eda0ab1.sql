ALTER TABLE public.contents DROP CONSTRAINT IF EXISTS contents_type_check;
ALTER TABLE public.contents ADD CONSTRAINT contents_type_check
  CHECK (type = ANY (ARRAY['video','audio','text','image','illustration','gallery_subject']));

ALTER TABLE public.contents DROP CONSTRAINT IF EXISTS contents_parent_required;
ALTER TABLE public.contents ADD CONSTRAINT contents_parent_required
  CHECK (
    (type = 'video' AND parent_id IS NULL)
    OR (type = 'gallery_subject' AND parent_id IS NULL)
    OR (type IN ('image','text','audio','illustration'))
  );