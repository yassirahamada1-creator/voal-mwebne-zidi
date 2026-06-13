// Crée (ou met à jour) le compte Supabase Auth de l'administrateur à partir
// des secrets ADMIN_EMAIL / ADMIN_PASSWORD, puis lui assigne le rôle 'admin'.
// À appeler une fois depuis n'importe quel client. Idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const email = Deno.env.get("ADMIN_EMAIL");
    const password = Deno.env.get("ADMIN_PASSWORD");
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!email || !password || !url || !serviceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Secrets manquants (ADMIN_EMAIL/ADMIN_PASSWORD)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Cherche un user existant avec cet email
    let userId: string | null = null;
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw listErr;
    const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Met à jour le mot de passe et confirme l'email
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (updErr) throw updErr;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      userId = created.user?.id ?? null;
    }

    if (!userId) throw new Error("Impossible d'obtenir l'identifiant utilisateur");

    // S'assure qu'il a bien le rôle admin
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw roleErr;

    return new Response(
      JSON.stringify({ ok: true, email, userId, created: !existing }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
