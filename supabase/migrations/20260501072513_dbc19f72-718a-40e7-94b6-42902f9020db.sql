
-- Gallery items
CREATE TABLE public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption_fr TEXT,
  caption_shk TEXT,
  module_slug TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published gallery items"
  ON public.gallery_items FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can insert gallery items"
  ON public.gallery_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update gallery items"
  ON public.gallery_items FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete gallery items"
  ON public.gallery_items FOR DELETE
  USING (true);

CREATE TRIGGER gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_fr TEXT NOT NULL,
  question_shk TEXT NOT NULL,
  option_a_fr TEXT NOT NULL,
  option_a_shk TEXT NOT NULL,
  option_b_fr TEXT NOT NULL,
  option_b_shk TEXT NOT NULL,
  option_c_fr TEXT,
  option_c_shk TEXT,
  option_d_fr TEXT,
  option_d_shk TEXT,
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation_fr TEXT,
  explanation_shk TEXT,
  module_slug TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can insert quiz questions"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update quiz questions"
  ON public.quiz_questions FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete quiz questions"
  ON public.quiz_questions FOR DELETE
  USING (true);

CREATE TRIGGER quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Open admin access on existing tables (since user wants no login)
DROP POLICY IF EXISTS "Public can manage modules" ON public.modules;
CREATE POLICY "Public can manage modules"
  ON public.modules FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage contents" ON public.contents;
CREATE POLICY "Public can manage contents"
  ON public.contents FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage translations" ON public.translations;
CREATE POLICY "Public can manage translations"
  ON public.translations FOR ALL
  USING (true) WITH CHECK (true);

-- Storage policies for media bucket (open upload)
DROP POLICY IF EXISTS "Public can upload media" ON storage.objects;
CREATE POLICY "Public can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voix-de-la-lune-media');

DROP POLICY IF EXISTS "Public can update media" ON storage.objects;
CREATE POLICY "Public can update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'voix-de-la-lune-media');

DROP POLICY IF EXISTS "Public can delete media" ON storage.objects;
CREATE POLICY "Public can delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'voix-de-la-lune-media');
