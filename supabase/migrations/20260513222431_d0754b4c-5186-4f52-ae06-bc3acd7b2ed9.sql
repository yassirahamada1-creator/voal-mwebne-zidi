ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.translations;
ALTER TABLE public.gallery_items REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_questions REPLICA IDENTITY FULL;
ALTER TABLE public.translations REPLICA IDENTITY FULL;
ALTER TABLE public.modules REPLICA IDENTITY FULL;
ALTER TABLE public.contents REPLICA IDENTITY FULL;