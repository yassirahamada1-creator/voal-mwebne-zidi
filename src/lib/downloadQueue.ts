// File d'attente globale des téléchargements hors-ligne.
// Singleton client : enqueue / pause / resume / cancel, traitement séquentiel.
// Émet l'événement `vdl-queue-changed` à chaque mutation.

import { cacheMediaUrls, removeMediaUrls } from "@/lib/offlineStore";

export type JobStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "done"
  | "error"
  | "cancelled";

export type DownloadJob = {
  id: string;
  titleFr: string;
  titleShi: string;
  /** Vignette (thumbnail ou image elle-même) pour identifier visuellement le contenu. */
  thumbnailUrl?: string;
  /** Liste totale d'URLs à télécharger. */
  urls: string[];
  /** URLs encore à traiter (décroît). */
  remaining: string[];
  total: number;
  done: number;
  failed: number;
  status: JobStatus;
};

export const QUEUE_CHANGED_EVENT = "vdl-queue-changed";

const jobs = new Map<string, DownloadJob>();
let current: { id: string; controller: AbortController } | null = null;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
  }
}

export function listJobs(): DownloadJob[] {
  return Array.from(jobs.values());
}

export function getJob(id: string): DownloadJob | null {
  return jobs.get(id) ?? null;
}

/** Ajoute un job à la file. Si l'id existe déjà et n'est pas terminé, ne rien faire. */
export function enqueueJob(input: {
  id: string;
  titleFr: string;
  titleShi: string;
  thumbnailUrl?: string;
  urls: (string | null | undefined)[];
}) {
  const list = (input.urls.filter(Boolean) as string[]).filter((u) =>
    /^https?:\/\//.test(u),
  );
  if (list.length === 0) return;

  const existing = jobs.get(input.id);
  if (existing && existing.status !== "done" && existing.status !== "cancelled" && existing.status !== "error") {
    return;
  }

  jobs.set(input.id, {
    id: input.id,
    titleFr: input.titleFr,
    titleShi: input.titleShi,
    thumbnailUrl: input.thumbnailUrl,
    urls: list,
    remaining: [...list],
    total: list.length,
    done: 0,
    failed: 0,
    status: "queued",
  });
  emit();
  void tick();
}

export function pauseJob(id: string) {
  const job = jobs.get(id);
  if (!job) return;
  if (job.status === "downloading") {
    job.status = "paused";
    if (current?.id === id) {
      current.controller.abort();
      current = null;
    }
    emit();
    // tick to start next queued job
    void tick();
  } else if (job.status === "queued") {
    job.status = "paused";
    emit();
  }
}

export function resumeJob(id: string) {
  const job = jobs.get(id);
  if (!job) return;
  if (job.status === "paused") {
    job.status = "queued";
    emit();
    void tick();
  }
}

/** Annule un job : arrête, marque "cancelled", supprime du cache les URLs déjà téléchargées.
 *  Le job reste affiché (statut "cancelled") jusqu'à clearJob (bouton Supprimer). */
export async function cancelJob(id: string) {
  const job = jobs.get(id);
  if (!job) return;
  const wasCurrent = current?.id === id;
  if (wasCurrent) {
    current!.controller.abort();
    current = null;
  }
  const downloadedSoFar = job.urls.filter((u) => !job.remaining.includes(u));
  job.status = "cancelled";
  job.remaining = [];
  emit();
  if (downloadedSoFar.length > 0) {
    try { await removeMediaUrls(downloadedSoFar); } catch { /* ignore */ }
  }
  if (wasCurrent) void tick();
}

/** Met en pause tous les jobs actifs (downloading + queued). */
export function pauseAll() {
  for (const j of Array.from(jobs.values())) {
    if (j.status === "downloading" || j.status === "queued") {
      pauseJob(j.id);
    }
  }
}

/** Reprend tous les jobs en pause. */
export function resumeAll() {
  for (const j of Array.from(jobs.values())) {
    if (j.status === "paused") {
      resumeJob(j.id);
    }
  }
}

/** Annule tous les jobs non terminés. */
export async function cancelAll() {
  const toCancel = Array.from(jobs.values()).filter(
    (j) => j.status !== "done" && j.status !== "error" && j.status !== "cancelled",
  );
  await Promise.all(toCancel.map((j) => cancelJob(j.id)));
}

/** Retire un job terminé/annulé/en erreur de la liste affichée. */
export function clearJob(id: string) {
  const job = jobs.get(id);
  if (!job) return;
  if (job.status === "done" || job.status === "error" || job.status === "cancelled") {
    jobs.delete(id);
    emit();
  }
}

let ticking = false;
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    while (true) {
      if (current) return;
      const next = listJobs().find((j) => j.status === "queued");
      if (!next) return;

      const controller = new AbortController();
      current = { id: next.id, controller };
      next.status = "downloading";
      emit();

      // Traite séquentiellement les URLs restantes pour pouvoir s'arrêter à tout moment.
      while (next.remaining.length > 0) {
        if (controller.signal.aborted) break;
        const url = next.remaining[0];
        const r = await cacheMediaUrls([url], { signal: controller.signal });
        if (controller.signal.aborted) break;
        // Si abort survient pendant fetch, on ne décale pas remaining.
        if (r.ok > 0) {
          next.done += 1;
        } else {
          next.failed += 1;
        }
        next.remaining.shift();
        emit();
      }

      // Si on a été aborté → la pause/cancel a déjà mis le bon statut et current=null.
      if (jobs.get(next.id) === next) {
        if (next.remaining.length === 0) {
          next.status = next.failed > 0 && next.done === 0 ? "error" : "done";
          if (current?.id === next.id) current = null;
          emit();
        }
      }
    }
  } finally {
    ticking = false;
  }
}

/** True si une URL fait partie d'un job en cours ou en pause. */
export function isUrlInActiveJob(url: string): boolean {
  for (const j of jobs.values()) {
    if ((j.status === "downloading" || j.status === "queued" || j.status === "paused") && j.urls.includes(url)) {
      return true;
    }
  }
  return false;
}
