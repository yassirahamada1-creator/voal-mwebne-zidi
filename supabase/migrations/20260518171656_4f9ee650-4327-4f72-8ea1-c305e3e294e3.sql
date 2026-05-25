
-- Nouveau module "Galerie" : photos uniquement, organisées par sujets.
-- Réutilise la table contents : un sujet = type 'gallery_subject', une photo = type 'image' avec parent_id = id du sujet.
INSERT INTO public.modules (slug, name_fr, name_shk, description_fr, description_shk, order_index, is_active)
VALUES (
  'galerie',
  'Galerie',
  'Galeri',
  'Photos par sujet',
  'Picha kwa mada',
  100,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_shk = EXCLUDED.name_shk,
  is_active = true;
