// Stockage privé des vidéos téléchargées + expiration automatique.
//
// Règles (vidéos uniquement) :
//  • Natif (Capacitor) : Filesystem `Directory.Data` (sandbox app privé,
//    NON exposé à la galerie, NON scanné par MediaScanner). On dépose un
//    fichier `.nomedia` au premier write pour bloquer toute indexation
//    par certaines surcouches Android exotiques.
//  • Web : Blob stocké dans IndexedDB (existant).
//  • Métadonnées indexées dans le store IDB `videos` (clé = url) :
//      { url, savedAt, lastWatchedAt?, size, blob?, path? }
//  • Expire : 5 jours après téléchargement, OU 3 jours sans visionnage.
//  • Notification J-1 : toast in-app (pas de permission OS).
//
// Aucun prompt de permission : Directory.Data est privé par défaut sur
// Android moderne (scoped storage) ET iOS.

import { idbGet, idbBulkPut, idbDelete, idbGetAll } from "@/lib/offlineStore";
import { toast } from "sonner";

export const VIDEO_TTL_MS = 5 * 24 * 60 * 60 * 1000;     // 5 jours
export const VIDEO_IDLE_MS = 3 * 24 * 60 * 60 * 1000;    // 3 jours sans visionnage
export const VIDEO_WARN_MS = 1 * 24 * 60 * 60 * 1000;    // J-1

const VIDEO_DIR_SUBPATH = "videos";

export type VideoRecord = {
  url: string;
  savedAt: number;
  lastWatchedAt?: number;
  size?: number;
  /** Présent sur web : Blob complet en IDB. */
  blob?: Blob;
  /** Présent sur natif : chemin relatif dans Directory.Data. */
  path?: string;
};

// ─── Détection plateforme native ────────────────────────────────────────────

type NativeFs = {
  isNative: boolean;
  Filesystem: typeof import("@capacitor/filesystem").Filesystem | null;
  Directory: typeof import("@capacitor/filesystem").Directory | null;
  Capacitor: typeof import("@capacitor/core").Capacitor | null;
};

let nativeCache: NativeFs | null = null;
async function nativeFs(): Promise<NativeFs> {
  if (nativeCache) return nativeCache;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) {
      nativeCache = { isNative: false, Filesystem: null, Directory: null, Capacitor };
      return nativeCache;
    }
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    nativeCache = { isNative: true, Filesystem, Directory, Capacitor };
  } catch {
    nativeCache = { isNative: false, Filesystem: null, Directory: null, Capacitor: null };
  }
  return nativeCache;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Nom de fichier sûr et unique dérivé de l'URL (base64url tronqué). */
function fileNameFor(url: string): string {
  // base64url de l'URL → unicité garantie ; on garde l'extension d'origine.
  const ext = (url.match(/\.([a-z0-9]+)(?:\?|#|$)/i)?.[1] ?? "bin").toLowerCase();
  const safeExt = ext.length <= 5 ? ext : "bin";
  let b64: string;
  try {
    b64 = btoa(unescape(encodeURIComponent(url)));
  } catch {
    b64 = String(Math.abs(hashCode(url)));
  }
  b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64.slice(0, 120)}.${safeExt}`;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      const i = s.indexOf(",");
      res(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

let nomediaWritten = false;
async function ensureNomedia(fs: NativeFs) {
  if (nomediaWritten || !fs.isNative || !fs.Filesystem || !fs.Directory) return;
  try {
    await fs.Filesystem.mkdir({
      path: VIDEO_DIR_SUBPATH,
      directory: fs.Directory.Data,
      recursive: true,
    });
  } catch { /* déjà existant */ }
  try {
    await fs.Filesystem.writeFile({
      path: `${VIDEO_DIR_SUBPATH}/.nomedia`,
      data: "",
      directory: fs.Directory.Data,
    });
  } catch { /* ignore */ }
  nomediaWritten = true;
}

// ─── API publique ───────────────────────────────────────────────────────────

export async function saveVideo(url: string, blob: Blob): Promise<void> {
  const fs = await nativeFs();
  const now = Date.now();

  if (fs.isNative && fs.Filesystem && fs.Directory) {
    await ensureNomedia(fs);
    const name = fileNameFor(url);
    const path = `${VIDEO_DIR_SUBPATH}/${name}`;
    const data = await blobToBase64(blob);
    await fs.Filesystem.writeFile({
      path,
      data,
      directory: fs.Directory.Data,
      recursive: true,
    });
    await idbBulkPut("videos", [{
      url,
      path,
      size: blob.size,
      savedAt: now,
      lastWatchedAt: now,
    } satisfies VideoRecord]);
    return;
  }

  // Web : on garde le Blob complet dans IDB
  await idbBulkPut("videos", [{
    url,
    blob,
    size: blob.size,
    savedAt: now,
    lastWatchedAt: now,
  } satisfies VideoRecord]);
}

export async function hasVideo(url: string): Promise<boolean> {
  const row = await idbGet<VideoRecord>("videos", url);
  return !!row;
}

/** URL lisible par <video src=…>. Sur natif : `capacitor://...` via convertFileSrc. */
export async function getVideoPlayableUrl(url: string): Promise<string | null> {
  const row = await idbGet<VideoRecord>("videos", url);
  if (!row) return null;
  const fs = await nativeFs();

  if (fs.isNative && row.path && fs.Filesystem && fs.Directory && fs.Capacitor) {
    try {
      const { uri } = await fs.Filesystem.getUri({
        path: row.path,
        directory: fs.Directory.Data,
      });
      return fs.Capacitor.convertFileSrc(uri);
    } catch {
      return null;
    }
  }

  if (row.blob) {
    return URL.createObjectURL(row.blob);
  }
  return null;
}

export async function getVideoBlobCompat(url: string): Promise<Blob | null> {
  const row = await idbGet<VideoRecord>("videos", url);
  if (!row) return null;
  if (row.blob) return row.blob;
  // Sur natif, on évite de re-charger 100 Mo en mémoire si pas demandé.
  return null;
}

export async function deleteVideo(url: string): Promise<void> {
  const row = await idbGet<VideoRecord>("videos", url);
  if (!row) return;
  const fs = await nativeFs();
  if (fs.isNative && row.path && fs.Filesystem && fs.Directory) {
    try {
      await fs.Filesystem.deleteFile({
        path: row.path,
        directory: fs.Directory.Data,
      });
    } catch { /* déjà supprimé */ }
  }
  await idbDelete("videos", url);
}

/** À appeler quand l'utilisateur lance la lecture d'une vidéo locale. */
export async function markVideoWatched(url?: string | null): Promise<void> {
  if (!url) return;
  const row = await idbGet<VideoRecord>("videos", url);
  if (!row) return;
  row.lastWatchedAt = Date.now();
  await idbBulkPut("videos", [row]);
}

/** Date d'expiration calculée : min(savedAt+TTL, lastWatched+IDLE). */
export function videoExpiresAt(row: VideoRecord): number {
  const last = row.lastWatchedAt ?? row.savedAt;
  return Math.min(row.savedAt + VIDEO_TTL_MS, last + VIDEO_IDLE_MS);
}

const warnedThisSession = new Set<string>();

/**
 * Supprime les vidéos expirées et déclenche un toast pour celles qui
 * expirent dans moins de 24 h (une fois par session).
 * Retourne le nombre supprimé.
 */
export async function sweepExpiredVideos(): Promise<number> {
  let deleted = 0;
  try {
    const rows = await idbGetAll<VideoRecord>("videos");
    const now = Date.now();
    for (const row of rows) {
      if (!row?.url) continue;
      const exp = videoExpiresAt(row);
      if (exp <= now) {
        await deleteVideo(row.url);
        deleted++;
        continue;
      }
      const left = exp - now;
      if (left < VIDEO_WARN_MS && !warnedThisSession.has(row.url)) {
        warnedThisSession.add(row.url);
        const hours = Math.max(1, Math.round(left / (60 * 60 * 1000)));
        toast.warning(
          `Vidéo téléchargée bientôt supprimée • Video itasutwa karibu (~${hours}h)`,
        );
      }
    }
  } catch { /* ignore */ }
  return deleted;
}
