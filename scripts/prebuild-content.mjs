#!/usr/bin/env node
/**
 * Pré-build : génère un snapshot statique du contenu Supabase
 * (modules, contenus, quiz, galerie, traductions, hommage) qui est
 * embarqué dans le bundle de l'application.
 *
 * Au premier lancement, l'app hydrate IndexedDB depuis ce snapshot, ce
 * qui rend tous les textes, photos et audios consultables IMMÉDIATEMENT
 * après installation, sans aucune requête réseau. Une resync silencieuse
 * en arrière-plan rapatrie ensuite les nouveautés si l'utilisateur est
 * en ligne.
 *
 * Hooké via "prebuild" dans package.json — exécuté automatiquement
 * avant chaque `npm run build` / `bun run build`.
 *
 * Échoue gracieusement : si Supabase est inaccessible (CI offline),
 * le snapshot existant est conservé, le build n'est pas bloqué.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputPath = join(projectRoot, "src", "data", "content-snapshot.json");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://gvzdxpczwdrkuqkeqtrr.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2emR4cGN6d2Rya3Vxa2VxdHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODY0NjIsImV4cCI6MjA5MzE2MjQ2Mn0.XjQZBq1DU0tSBlyPcCeEPfaKVjgyCV2JuFJAwhFnfc0";

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  console.log("[prebuild-content] Génération du snapshot…");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });

  try {
    const [
      { data: modules, error: eM },
      { data: contents, error: eC },
      { data: quiz, error: eQ },
      { data: gallery, error: eG },
      { data: translations, error: eT },
      { data: hommage, error: eH },
    ] = await Promise.all([
      supabase.from("modules").select("*").eq("is_active", true).order("order_index"),
      supabase.from("contents").select("*").eq("is_published", true).order("created_at", { ascending: false }),
      supabase.from("quiz_questions").select("*").eq("is_published", true).order("order_index"),
      supabase.from("gallery_items").select("*").eq("is_published", true).order("order_index"),
      supabase.from("translations").select("*").order("key"),
      supabase.from("hommage_content").select("*").limit(1),
    ]);

    const err = eM || eC || eQ || eG || eT || eH;
    if (err) throw err;

    const snapshot = {
      version: 1,
      generatedAt: new Date().toISOString(),
      modules: modules ?? [],
      contents: contents ?? [],
      quiz: quiz ?? [],
      gallery: gallery ?? [],
      translations: translations ?? [],
      hommage: (hommage ?? [])[0] ?? null,
    };

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(snapshot), "utf8");

    const sizeKb = Math.round(Buffer.byteLength(JSON.stringify(snapshot)) / 1024);
    console.log(
      `[prebuild-content] OK — ${snapshot.modules.length} modules, ${snapshot.contents.length} contenus, ${snapshot.gallery.length} photos, ${snapshot.quiz.length} quiz, ${snapshot.translations.length} traductions (${sizeKb} KB).`,
    );
  } catch (e) {
    console.warn("[prebuild-content] Échec de génération :", e?.message ?? e);
    if (await fileExists(outputPath)) {
      console.warn("[prebuild-content] Snapshot existant conservé.");
      return;
    }
    // Snapshot minimal pour ne pas casser le build
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      JSON.stringify({
        version: 1,
        generatedAt: new Date().toISOString(),
        modules: [],
        contents: [],
        quiz: [],
        gallery: [],
        translations: [],
        hommage: null,
      }),
      "utf8",
    );
    console.warn("[prebuild-content] Snapshot vide écrit comme fallback.");
  }
}

main();
