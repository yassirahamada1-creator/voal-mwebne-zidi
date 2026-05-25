-- Supprime les policies trop permissives qui laissaient tout le public écrire
DROP POLICY IF EXISTS "Public can manage modules" ON public.modules;
DROP POLICY IF EXISTS "Public can manage contents" ON public.contents;
DROP POLICY IF EXISTS "Public can manage translations" ON public.translations;

DROP POLICY IF EXISTS "Public can insert gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Public can update gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Public can delete gallery items" ON public.gallery_items;

DROP POLICY IF EXISTS "Public can insert quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Public can update quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Public can delete quiz questions" ON public.quiz_questions;

-- Pour gallery_items et quiz_questions il manquait la policy "Admins can manage" complète : on l'ajoute
CREATE POLICY "Admins can manage gallery items"
ON public.gallery_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Le trigger bootstrap_first_admin n'est pas attaché à auth.users : on le crée
CREATE OR REPLACE TRIGGER on_auth_user_created_bootstrap_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();