const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    const expectedEmail = Deno.env.get("ADMIN_EMAIL");
    const expectedPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!expectedEmail || !expectedPassword) {
      return new Response(
        JSON.stringify({ ok: false, error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const emailOk =
      typeof email === "string" &&
      email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
    const passwordOk = typeof password === "string" && password === expectedPassword;

    if (!emailOk || !passwordOk) {
      return new Response(
        JSON.stringify({ ok: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Bad request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
