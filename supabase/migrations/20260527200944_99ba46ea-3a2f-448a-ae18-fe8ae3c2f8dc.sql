ALTER TABLE public.hommage_content REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hommage_content;