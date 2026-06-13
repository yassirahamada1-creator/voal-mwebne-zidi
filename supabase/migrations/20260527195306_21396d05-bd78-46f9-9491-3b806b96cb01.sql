
CREATE TABLE public.hommage_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  title TEXT NOT NULL DEFAULT 'Hommage à Naicha',
  subtitle TEXT NOT NULL DEFAULT 'En mémoire d''une vie trop tôt éteinte',
  photo_url TEXT,
  photo_caption TEXT NOT NULL DEFAULT 'Naicha Mmadi Abdou',
  display_name TEXT NOT NULL DEFAULT 'Naicha Mmadi Abdou',
  birth_date TEXT NOT NULL DEFAULT '3 juillet 2002',
  parcours TEXT NOT NULL DEFAULT '',
  engagement TEXT NOT NULL DEFAULT '',
  talents TEXT NOT NULL DEFAULT '',
  liens TEXT NOT NULL DEFAULT '',
  derniers_mots TEXT NOT NULL DEFAULT '',
  derniers_mots_note TEXT NOT NULL DEFAULT '',
  famille_retient TEXT NOT NULL DEFAULT '',
  hommage_global TEXT NOT NULL DEFAULT '',
  invocation_ar TEXT NOT NULL DEFAULT 'اللهم ارحمهن',
  invocation_translit TEXT NOT NULL DEFAULT 'Allah ya rahamhunna',
  invocation_fr TEXT NOT NULL DEFAULT 'Que Allah leur accorde Sa miséricorde',
  footer_note TEXT NOT NULL DEFAULT 'Contre les violences faites aux femmes — N''oublions jamais.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 'main')
);

GRANT SELECT ON public.hommage_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hommage_content TO authenticated;
GRANT ALL ON public.hommage_content TO service_role;

ALTER TABLE public.hommage_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hommage content"
  ON public.hommage_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage hommage content"
  ON public.hommage_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.hommage_content (id, parcours, engagement, talents, liens, derniers_mots, derniers_mots_note, famille_retient, hommage_global)
VALUES (
  'main',
  'Après avoir obtenu son baccalauréat, Naicha a poursuivi ses études supérieures à l''ISPC — l''Institut Supérieur Polytechnique des Comores — où elle a suivi une formation de deux ans dans le domaine du tourisme, de 2020 à 2022. Elle s''y est distinguée par sa curiosité et sa soif d''apprendre.',
  'Depuis 2024, Naicha exerçait en tant qu''assistante en ophtalmologie, un métier qu''elle assumait avec dévouement et humanité. Auparavant, elle avait effectué un stage à la Mairie de Foumbouni au service des archives, en janvier et février 2023, y laissant le souvenir d''une jeune femme sérieuse et appliquée.',
  'Au-delà de ses études et de son travail, Naicha possédait un talent précieux : la confection de kandou, ces pièces de textile traditionnel qui témoignent de la richesse du savoir-faire comorien transmis de génération en génération.',
  'Naicha entretenait des liens forts avec ses camarades de l''ISPC et faisait partie d''un chama à Toirab sous le nom d''ISPC, un groupe de solidarité où l''entraide et la fraternité étaient au cœur de chaque rencontre.',
  '« Elle a dit qu''elle allait récupérer son ordinateur à Dzahadjou Hambou. »',
  'Ces mots simples, prononcés avant son départ, restent gravés dans la mémoire de ses proches.',
  'Sa gentillesse, son honnêteté et son grand cœur. Naicha laisse derrière elle l''image d''une jeune femme généreuse, droite et profondément humaine, dont la disparition brutale endeuille tous ceux qui l''ont connue.',
  'À Naicha, et à toutes les femmes victimes de féminicide à travers le monde. Elles avaient des rêves, des sourires, des familles qui les aimaient. Elles méritaient de vivre. Leur mémoire ne sera jamais oubliée. Non à la violence faite aux femmes. Ensemble, brisons le silence.'
)
ON CONFLICT (id) DO NOTHING;
