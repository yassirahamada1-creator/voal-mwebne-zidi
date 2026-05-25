import { Pause, Play, X, Loader2, Check, AlertTriangle, CheckCircle2, Download as DownloadIcon, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDownloadQueue } from "@/hooks/useDownloadQueue";
import {
  cancelJob,
  cancelAll,
  clearJob,
  pauseJob,
  pauseAll,
  resumeJob,
  resumeAll,
} from "@/lib/downloadQueue";
import { useI18n } from "@/contexts/I18nContext";
import OfflineImage from "@/components/OfflineImage";

/**
 * File d'attente des téléchargements (en cours / pause / terminés / erreurs).
 * UI : carte unifiée avec en-tête synthétique + progression globale + lignes par job.
 */
const DownloadQueue = () => {
  const { lang } = useI18n();
  const jobs = useDownloadQueue();

  // Auto-nettoyage des jobs terminés avec succès. On garde une trace des
  // ids déjà programmés pour ne pas re-déclencher de toast/timer à chaque
  // re-render — et surtout pour fonctionner même si l'écran est ouvert
  // APRÈS la fin du téléchargement (cas où prevStatuses est vide).
  const scheduledClear = useRef<Set<string>>(new Set());
  const prevStatuses = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    for (const j of jobs) {
      const prev = prevStatuses.current.get(j.id);
      const fullySucceeded = j.status === "done" && j.failed === 0 && j.done === j.total;
      if (fullySucceeded && !scheduledClear.current.has(j.id)) {
        scheduledClear.current.add(j.id);
        // Toast uniquement lors d'une transition observée.
        if (prev && prev !== j.status) {
          const title = (lang === "fr" ? j.titleFr : j.titleShi) || "";
          toast.success(
            lang === "fr"
              ? title ? `Téléchargement terminé — ${title}` : "Téléchargement terminé"
              : title ? `Upakuaji umekamilika — ${title}` : "Upakuaji umekamilika",
          );
        }
        setTimeout(() => {
          clearJob(j.id);
          scheduledClear.current.delete(j.id);
        }, 4000);
      }
      prevStatuses.current.set(j.id, j.status);
    }
  }, [jobs, lang]);

  if (jobs.length === 0) return null;

  // Agrégats globaux
  const totalFiles = jobs.reduce((n, j) => n + j.total, 0);
  const doneFiles = jobs.reduce((n, j) => n + j.done, 0);
  const failedFiles = jobs.reduce((n, j) => n + j.failed, 0);
  const globalPct = totalFiles ? Math.round((doneFiles / totalFiles) * 100) : 0;

  const activeCount = jobs.filter((j) => j.status === "downloading" || j.status === "queued").length;
  const pausedCount = jobs.filter((j) => j.status === "paused").length;
  const allComplete = jobs.every(
    (j) => (j.status === "done" || j.status === "error" || j.status === "cancelled"),
  );
  const allSucceeded = allComplete && failedFiles === 0 && doneFiles === totalFiles && totalFiles > 0;

  // Synthèse de l'état global
  const headline = allSucceeded
    ? lang === "fr" ? "Tous les fichiers sont téléchargés" : "Faili zote zimepakuliwa"
    : activeCount > 0
      ? lang === "fr" ? "Téléchargement en cours…" : "Inapakua…"
      : pausedCount > 0
        ? lang === "fr" ? "Téléchargement en pause" : "Upakuaji umesimama"
        : failedFiles > 0
          ? lang === "fr" ? "Terminé avec des échecs" : "Kumekamilika na hitilafu"
          : lang === "fr" ? "Téléchargements" : "Upakuaji";

  return (
    <section
      aria-label={lang === "fr" ? "File de téléchargement" : "Foleni ya upakuaji"}
      className="card-cultural"
    >
      {/* Actions globales — Pause/Reprendre tout · Annuler tout */}
      {!allComplete && (activeCount > 0 || pausedCount > 0) && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2 sm:px-4">
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={pauseAll}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pause className="h-3.5 w-3.5" />
              {lang === "fr" ? "Pauser tout" : "Simamisha yote"}
            </button>
          ) : (
            <button
              type="button"
              onClick={resumeAll}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-secondary/40 bg-secondary/10 px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Play className="h-3.5 w-3.5" />
              {lang === "fr" ? "Reprendre tout" : "Endelea yote"}
            </button>
          )}
          <button
            type="button"
            onClick={() => { void cancelAll(); }}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 text-xs font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <X className="h-3.5 w-3.5" />
            {lang === "fr" ? "Annuler tout" : "Ghairi yote"}
          </button>
        </div>
      )}

      {/* Détail par job */}
      <ul className="divide-y divide-border">
        {jobs.map((j) => {
          const title = (lang === "fr" ? j.titleFr : j.titleShi) || j.id;
          const jobPct = j.total ? Math.round((j.done / j.total) * 100) : 0;
          const fullSuccess = j.status === "done" && j.failed === 0 && j.done === j.total;

          const statusLabel =
            j.status === "downloading"
              ? lang === "fr" ? "Téléchargement…" : "Inapakua…"
              : j.status === "queued"
              ? lang === "fr" ? "En attente" : "Inasubiri"
              : j.status === "paused"
              ? lang === "fr" ? "En pause" : "Imesimama"
              : j.status === "done"
              ? fullSuccess
                ? lang === "fr" ? "Terminé" : "Imekamilika"
                : lang === "fr" ? `Terminé (${j.failed} échec${j.failed > 1 ? "s" : ""})` : `Imekamilika (${j.failed})`
              : j.status === "error"
              ? lang === "fr" ? "Erreur" : "Hitilafu"
              : lang === "fr" ? "Annulé" : "Imeghairiwa";

          const isActive = j.status === "downloading" || j.status === "queued";
          const isPaused = j.status === "paused";
          const isFinished = j.status === "done" || j.status === "error" || j.status === "cancelled";

          return (
            <li key={j.id} className="px-3 py-3 sm:px-4">
              <div className="flex items-start gap-3">
                {/* Vignette du contenu */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                  {j.thumbnailUrl ? (
                    <OfflineImage
                      src={j.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <DownloadIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Titre + sous-titre + méta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight text-foreground sm:text-[15px]">
                    {title}
                  </p>
                  {(lang === "fr" ? j.titleShi : j.titleFr) && (
                    <p className="truncate text-[11px] leading-tight text-muted-foreground/90 mt-0.5">
                      {lang === "fr" ? j.titleShi : j.titleFr}
                    </p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-tight text-muted-foreground">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        fullSuccess
                          ? "text-success"
                          : j.status === "error"
                            ? "text-destructive"
                            : isPaused
                              ? "text-warning"
                              : j.status === "cancelled"
                                ? "text-muted-foreground"
                                : "text-secondary"
                      }`}
                    >
                      {j.status === "downloading" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
                      {fullSuccess && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                      {j.status === "error" && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                      {isPaused && <Pause className="h-3 w-3" aria-hidden="true" />}
                      {statusLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {j.done}/{j.total} {lang === "fr" ? (j.total > 1 ? "fichiers" : "fichier") : "faili"}
                    </span>
                    {j.failed > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-destructive tabular-nums">
                          {j.failed} {lang === "fr" ? (j.failed > 1 ? "échecs" : "échec") : "hitilafu"}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-semibold">{jobPct}%</span>
                  </p>
                </div>

                {/* Actions : Pause↔Play (caché si annulé/terminé) · Annuler→Supprimer */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => pauseJob(j.id)}
                      aria-label={lang === "fr" ? "Mettre en pause" : "Simamisha"}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  {isPaused && (
                    <button
                      type="button"
                      onClick={() => resumeJob(j.id)}
                      aria-label={lang === "fr" ? "Reprendre" : "Endelea"}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-secondary transition hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}

                  {!isFinished ? (
                    <button
                      type="button"
                      onClick={() => cancelJob(j.id)}
                      aria-label={lang === "fr" ? "Annuler" : "Ghairi"}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-destructive/80 transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => clearJob(j.id)}
                      aria-label={lang === "fr" ? "Supprimer" : "Futa"}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Barre de progression du job (en bas) */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={jobPct}
                aria-label={`${title} — ${jobPct}%`}
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    fullSuccess
                      ? "bg-success"
                      : j.status === "error"
                        ? "bg-destructive"
                        : j.status === "cancelled"
                          ? "bg-muted-foreground/40"
                          : isPaused
                            ? "bg-warning"
                            : "bg-gradient-to-r from-secondary to-secondary/80"
                  }`}
                  style={{ width: `${jobPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default DownloadQueue;
