INSERT INTO public.translations (key, value_fr, value_shk, screen)
VALUES (
  'appTagline',
  'Ce projet est soutenu par la Commission de l''océan Indien (COI) dans le cadre de son projet de développement des Industries Culturelles et Créatives (ICC) en Indianocéanie, financé par l''Agence française de développement (AFD)',
  'Mradi huu unaungwa mkono na Tume ya Bahari Hindi katika kipindi cha mradi wake wa maendeleo ya Viwanda vya Utamaduni na Ubunifu katika Indianocéanie, ukiwa na ufadhili wa Shirika la Maendeleo la Ufaransa',
  'splash'
)
ON CONFLICT (key) DO UPDATE SET screen = EXCLUDED.screen;

UPDATE public.translations SET screen = 'splash' WHERE key IN ('appTitle','appSubtitle');