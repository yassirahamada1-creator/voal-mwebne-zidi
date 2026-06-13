ALTER TABLE public.modules REPLICA IDENTITY FULL;
ALTER TABLE public.contents REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.modules; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contents; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;