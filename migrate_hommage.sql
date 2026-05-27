-- À exécuter sur le projet Supabase RUNTIME : gatpaniieoesfboixtco
-- (SQL Editor du dashboard, ou via scripts/migrate-new-project.mjs ./migrate_hommage.sql)

CREATE TABLE IF NOT EXISTS public.hommage_content (
  id text PRIMARY KEY DEFAULT 'main',
  title text NOT NULL DEFAULT 'Hommage à Naicha',
  subtitle text NOT NULL DEFAULT 'En mémoire d''une vie trop tôt éteinte',
  photo_url text,
  photo_caption text NOT NULL DEFAULT 'Naicha Mmadi Abdou',
  display_name text NOT NULL DEFAULT 'Naicha Mmadi Abdou',
  birth_date text NOT NULL DEFAULT '3 juillet 2002',
  parcours text NOT NULL DEFAULT '',
  engagement text NOT NULL DEFAULT '',
  talents text NOT NULL DEFAULT '',
  liens text NOT NULL DEFAULT '',
  derniers_mots text NOT NULL DEFAULT '',
  derniers_mots_note text NOT NULL DEFAULT '',
  famille_retient text NOT NULL DEFAULT '',
  hommage_global text NOT NULL DEFAULT '',
  invocation_ar text NOT NULL DEFAULT 'اللهم ارحمهن',
  invocation_translit text NOT NULL DEFAULT 'Allah ya rahamhunna',
  invocation_fr text NOT NULL DEFAULT 'Que Allah leur accorde Sa miséricorde',
  footer_note text NOT NULL DEFAULT 'Contre les violences faites aux femmes — N''oublions jamais.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hommage_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hommage_content TO authenticated;
GRANT ALL ON public.hommage_content TO service_role;

ALTER TABLE public.hommage_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view hommage content" ON public.hommage_content;
CREATE POLICY "Anyone can view hommage content"
  ON public.hommage_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage hommage content" ON public.hommage_content;
CREATE POLICY "Admins can manage hommage content"
  ON public.hommage_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER TABLE public.hommage_content REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hommage_content;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed du contenu
INSERT INTO public.hommage_content (id) VALUES ('main')
ON CONFLICT (id) DO NOTHING;

UPDATE public.hommage_content SET
  parcours = E'Après avoir obtenu son baccalauréat, Naicha a poursuivi ses études supérieures à l''ISPC — l''Institut Supérieur Polytechnique des Comores — où elle a suivi une formation de deux ans dans le domaine du tourisme, de 2020 à 2022. Elle s''y est distinguée par sa curiosité et sa soif d''apprendre.',
  engagement = E'Depuis 2024, Naicha exerçait en tant qu''assistante en ophtalmologie, un métier qu''elle assumait avec dévouement et humanité. Auparavant, elle avait effectué un stage à la Mairie de Foumbouni au service des archives, en janvier et février 2023, y laissant le souvenir d''une jeune femme sérieuse et appliquée.',
  talents = E'Au-delà de ses études et de son travail, Naicha possédait un talent précieux : la confection de kandou, ces pièces de textile traditionnel qui témoignent de la richesse du savoir-faire comorien transmis de génération en génération.',
  liens = E'Naicha entretenait des liens forts avec ses camarades de l''ISPC et faisait partie d''un chama à Toirab sous le nom d''ISPC, un groupe de solidarité où l''entraide et la fraternité étaient au cœur de chaque rencontre.',
  derniers_mots = E'« Elle a dit qu''elle allait récupérer son ordinateur à Dzahadjou Hambou. »',
  derniers_mots_note = E'Ces mots simples, prononcés avant son départ, restent gravés dans la mémoire de ses proches.',
  famille_retient = E'Sa gentillesse, son honnêteté et son grand cœur. Naicha laisse derrière elle l''image d''une jeune femme généreuse, droite et profondément humaine, dont la disparition brutale endeuille tous ceux qui l''ont connue.',
  hommage_global = E'À Naicha, et à toutes les femmes victimes de féminicide à travers le monde. Elles avaient des rêves, des sourires, des familles qui les aimaient. Elles méritaient de vivre. Leur mémoire ne sera jamais oubliée. Non à la violence faite aux femmes. Ensemble, brisons le silence.',
  updated_at = now()
WHERE id = 'main';
