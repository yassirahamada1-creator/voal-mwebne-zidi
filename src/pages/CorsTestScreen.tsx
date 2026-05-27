import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  url: string;
  ok: boolean;
  status?: number;
  bytes?: number;
  corsHeader?: string | null;
  error?: string;
  ms: number;
};

const BUCKET = "voix-de-la-lune-media";

async function probe(url: string): Promise<Result> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    const corsHeader = res.headers.get("access-control-allow-origin");
    if (!res.ok) {
      return { url, ok: false, status: res.status, corsHeader, ms: Math.round(performance.now() - t0) };
    }
    const blob = await res.blob();
    return {
      url,
      ok: true,
      status: res.status,
      bytes: blob.size,
      corsHeader,
      ms: Math.round(performance.now() - t0),
    };
  } catch (e: any) {
    return { url, ok: false, error: e?.message ?? String(e), ms: Math.round(performance.now() - t0) };
  }
}

export default function CorsTestScreen() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const run = async () => {
    setLoading(true);
    setResults([]);

    // Collecte d'URLs candidates depuis la base
    const urls = new Set<string>();

    const [{ data: contents }, { data: gallery }, { data: modules }] = await Promise.all([
      supabase.from("contents").select("media_url, thumbnail_url").limit(10),
      supabase.from("gallery_items").select("image_url").limit(10),
      supabase.from("modules").select("cover_image_url").limit(10),
    ]);

    contents?.forEach((c) => {
      if (c.media_url) urls.add(c.media_url);
      if (c.thumbnail_url) urls.add(c.thumbnail_url);
    });
    gallery?.forEach((g) => g.image_url && urls.add(g.image_url));
    modules?.forEach((m) => m.cover_image_url && urls.add(m.cover_image_url));

    // Au moins une URL de test contre le bucket si rien trouvé
    if (urls.size === 0) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl("test.jpg");
      urls.add(data.publicUrl);
    }

    const list = Array.from(urls).filter((u) => u.includes("/storage/v1/object/"));
    const res = await Promise.all(list.map(probe));
    setResults(res);
    setLoading(false);
  };

  const ok = results.filter((r) => r.ok).length;
  const ko = results.length - ok;

  return (
    <main className="min-h-screen bg-background text-foreground p-4 pb-24">
      <h1 className="text-2xl font-bold mb-2">Test CORS — Bucket média</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Origine: <code>{origin}</code> · Bucket: <code>{BUCKET}</code>
      </p>

      <button
        onClick={run}
        disabled={loading}
        className="min-h-[44px] px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Test en cours…" : "Lancer le test CORS"}
      </button>

      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="text-sm">
            <span className="text-green-600 font-semibold">{ok} OK</span> ·{" "}
            <span className="text-red-600 font-semibold">{ko} KO</span> ·{" "}
            {results.length} URLs testées
          </div>

          <ul className="space-y-2">
            {results.map((r, i) => (
              <li
                key={i}
                className={`border rounded-md p-3 text-xs break-all ${
                  r.ok ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"
                }`}
              >
                <div className="font-mono">{r.url}</div>
                <div className="mt-1">
                  {r.ok ? "✅" : "❌"} status={r.status ?? "—"} · {r.ms}ms ·{" "}
                  {r.bytes != null && <>blob={(r.bytes / 1024).toFixed(1)} KB · </>}
                  ACAO=<code>{r.corsHeader ?? "absent"}</code>
                  {r.error && (
                    <div className="text-red-600 mt-1">Erreur: {r.error}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Sur APK Android (Capacitor), l'origine WebView est <code>https://localhost</code>. Si{" "}
        <code>access-control-allow-origin: *</code> est renvoyé et que le téléchargement blob
        réussit ici depuis le navigateur, il fonctionnera aussi dans l'APK.
      </p>
    </main>
  );
}
