-- Récits (text), témoignages (audio) et photos (image) DOIVENT être rattachés à une vidéo parente.
-- Les vidéos ne peuvent pas avoir de parent.
ALTER TABLE public.contents
  ADD CONSTRAINT contents_parent_required
  CHECK (
    (type = 'video' AND parent_id IS NULL)
    OR (type IN ('image', 'text', 'audio') AND parent_id IS NOT NULL)
  );

-- Index pour accélérer la résolution parent → enfants
CREATE INDEX IF NOT EXISTS contents_parent_id_idx ON public.contents(parent_id);