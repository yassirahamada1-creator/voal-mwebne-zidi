#!/usr/bin/env node
/**
 * Exécute le SQL de migration (schéma + RLS + policies + seed) sur le
 * nouveau projet Supabase via une connexion Postgres directe.
 *
 * Usage :
 *   1. Récupère la connection string du nouveau projet :
 *      Dashboard → Project Settings → Database → Connection string → URI
 *      (utilise le "Session pooler" ou la connection directe ; choisis IPv4
 *      si ta machine n'est pas IPv6).
 *   2. Lance :
 *        DATABASE_URL="postgresql://postgres:<MOT_DE_PASSE>@..." \
 *          node scripts/migrate-new-project.mjs
 *
 *   3. Optionnel : passe un autre chemin SQL en argument
 *        node scripts/migrate-new-project.mjs ./autre.sql
 *
 * Le script est idempotent (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS,
 * INSERT … ON CONFLICT DO NOTHING) : tu peux le rejouer sans risque.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const sqlPath = resolve(
  process.argv[2] ?? "./migrate_to_new_project.sql",
);

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL manquant.");
  console.error(
    '   Exemple : DATABASE_URL="postgresql://postgres:PWD@db.gatpaniieoesfboixtco.supabase.co:5432/postgres" node scripts/migrate-new-project.mjs',
  );
  process.exit(1);
}

if (!existsSync(sqlPath)) {
  console.error(`❌ Fichier introuvable : ${sqlPath}`);
  console.error(
    "   Place migrate_to_new_project.sql à la racine du projet, ou passe le chemin en argument.",
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
console.log(`📄 SQL chargé : ${sqlPath} (${(sql.length / 1024).toFixed(1)} KB)`);

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const started = Date.now();

try {
  await client.connect();
  console.log("🔌 Connecté à la base.");

  // On exécute tout dans une seule transaction. Si quoi que ce soit échoue,
  // ROLLBACK total => la base reste dans son état précédent.
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");

  console.log(
    `✅ Migration appliquée avec succès en ${((Date.now() - started) / 1000).toFixed(1)}s.`,
  );

  // Petit récap des comptages pour vérifier le seed.
  const tables = ["modules", "contents", "gallery_items", "quiz_questions", "translations"];
  console.log("\n📊 Comptage des lignes :");
  for (const t of tables) {
    try {
      const { rows } = await client.query(`SELECT count(*)::int AS n FROM public.${t}`);
      console.log(`   ${t.padEnd(18)} ${rows[0].n}`);
    } catch (e) {
      console.log(`   ${t.padEnd(18)} (erreur: ${(e).message})`);
    }
  }
} catch (err) {
  try {
    await client.query("ROLLBACK");
  } catch {}
  console.error("\n❌ Migration échouée — ROLLBACK effectué.");
  console.error(err);
  process.exitCode = 1;
} finally {
  await client.end();
}
