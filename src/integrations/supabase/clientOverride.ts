// Override manuel : pointe le client Supabase vers le NOUVEAU projet
// (gatpaniieoesfboixtco). Lovable Cloud reste connecté au projet d'origine
// pour les outils internes (migrations, secrets, edge functions), mais
// l'application runtime utilise ce client.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://gatpaniieoesfboixtco.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhdHBhbmlpZW9lc2Zib2l4dGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjgwMDMsImV4cCI6MjA5NTQwNDAwM30.gos9BgVpNnMmihwNph_pBwyQJwEsqwK5rw4BOH5Uay0";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
