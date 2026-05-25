DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'translations_key_key'
  ) THEN
    ALTER TABLE public.translations ADD CONSTRAINT translations_key_key UNIQUE (key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contents_module_slug_fkey'
  ) THEN
    ALTER TABLE public.contents
      ADD CONSTRAINT contents_module_slug_fkey
      FOREIGN KEY (module_slug)
      REFERENCES public.modules(slug)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contents_module_slug ON public.contents(module_slug);