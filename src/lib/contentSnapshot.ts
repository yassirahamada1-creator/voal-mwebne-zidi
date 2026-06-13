/**
 * Snapshot statique du contenu embarqué dans l'application.
 *
 * Généré à chaque build par `scripts/prebuild-content.mjs` (hook
 * `prebuild` dans package.json). Au tout premier lancement de l'app,
 * `hydrateFromSnapshot()` peuple IndexedDB depuis ce JSON, ce qui
 * rend tous les textes / métadonnées consultables immédiatement,
 * sans aucune requête réseau. Une resync silencieuse rafraîchit
 * ensuite le cache si l'utilisateur est en ligne.
 */
import snapshot from "@/data/content-snapshot.json";
import { idbBulkPut, idbGetAll } from "@/lib/offlineStore";

type Snapshot = {
  version: number;
  generatedAt: string;
  modules: any[];
  contents: any[];
  quiz: any[];
  gallery: any[];
  translations: any[];
  hommage: any | null;
};

const SNAP = snapshot as Snapshot;

export const snapshotInfo = {
  generatedAt: SNAP.generatedAt,
  modulesCount: SNAP.modules.length,
  contentsCount: SNAP.contents.length,
  galleryCount: SNAP.gallery.length,
  quizCount: SNAP.quiz.length,
};

/**
 * Hydrate IndexedDB depuis le snapshot bundlé si elle est vide.
 * Idempotent et sûr à appeler à chaque lancement.
 * Retourne true si une hydratation a eu lieu.
 */
export async function hydrateFromSnapshot(): Promise<boolean> {
  try {
    const existing = await idbGetAll("contents");
    if (existing.length > 0) return false; // déjà hydraté

    await Promise.all([
      idbBulkPut("modules", SNAP.modules),
      idbBulkPut("contents", SNAP.contents),
      idbBulkPut("quiz", SNAP.quiz),
      idbBulkPut("gallery", SNAP.gallery),
      idbBulkPut(
        "translations",
        SNAP.translations.map((t: any) => ({ key: t.key, ...t })),
      ),
      SNAP.hommage
        ? idbBulkPut("meta", [{ k: "hommage", v: SNAP.hommage }])
        : Promise.resolve(),
      idbBulkPut("meta", [
        { k: "snapshotHydratedAt", v: Date.now() },
        { k: "snapshotGeneratedAt", v: SNAP.generatedAt },
      ]),
    ]);
    return true;
  } catch {
    return false;
  }
}
