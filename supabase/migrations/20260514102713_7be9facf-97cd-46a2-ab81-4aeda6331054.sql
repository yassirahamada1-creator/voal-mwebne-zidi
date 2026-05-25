ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.contents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contents_parent_id ON public.contents(parent_id);