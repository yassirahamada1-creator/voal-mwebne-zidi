#!/usr/bin/env node
/**
 * Crée le compte admin via signUp (anon key).
 * Le trigger bootstrap_first_admin promeut le premier user en admin.
 *
 * Usage :
 *   node scripts/create-admin.mjs
 *
 * Pré-requis : auth "Email" activé dans le nouveau projet (par défaut).
 * Si "Confirm email" est activé côté projet, l'utilisateur devra cliquer
 * sur le lien reçu par email avant de pouvoir se connecter — sinon créé direct.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gatpaniieoesfboixtco.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhdHBhbmlpZW9lc2Zib2l4dGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjgwMDMsImV4cCI6MjA5NTQwNDAwM30.gos9BgVpNnMmihwNph_pBwyQJwEsqwK5rw4BOH5Uay0";

const EMAIL = "oussbyouss@gmail.com";
const PASSWORD = "ADMIN_OUSS_PASS";

const sb = createClient(SUPABASE_URL, ANON_KEY);

const { data, error } = await sb.auth.signUp({ email: EMAIL, password: PASSWORD });
if (error) {
  console.error("❌", error.message);
  process.exit(1);
}
console.log("✅ User créé :", data.user?.id);
console.log(
  data.session
    ? "   Session active immédiate (auto-confirm activé)."
    : "   Email de confirmation envoyé — clique sur le lien pour activer le compte.",
);
console.log(
  "\nLe trigger bootstrap_first_admin a normalement déjà attribué le rôle admin.",
);
